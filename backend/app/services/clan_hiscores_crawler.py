"""Clan Discovery Seeder — crawls RS3 Clan HiScores ranking pages to
discover clan names and metadata, then indexes each clan via the
members_lite.ws API flow.

Phase 1: Fetch official Clan HiScores ranking pages (HTML) to extract
  clan names, rank, total_xp, member_count, motif_url.
Phase 2: For each discovered clan, call fetch_and_index_clan() which
  hits members_lite.ws and populates indexed_clans, indexed_clan_members,
  rs3_players, and clan_snapshots.

Rate-limited, sequential, admin-only trigger.
"""

import asyncio
import logging
import re
from datetime import datetime, timezone

import httpx

from app.core.database import db
from app.services.clan_indexer import fetch_and_index_clan

logger = logging.getLogger(__name__)

CLAN_HISCORES_URL = "https://secure.runescape.com/m=clan-hiscores/ranking"
PAGE_FETCH_DELAY = 1.5  # seconds between HiScores page fetches
INDEX_DELAY = 2.0       # seconds between clan index calls
CLAN_INDEX_TIMEOUT = 120  # max seconds per individual clan indexing


def _extract_clans_with_metadata(html: str) -> list[dict]:
    """Extract clan names + metadata from an RS3 Clan HiScores ranking HTML page.

    Returns a list of dicts with keys: name, rank, member_count, total_xp, motif_url.
    """
    # The HTML table rows contain: rank, motif img + clan name, member_count, total_xp
    # Clan name appears in the <img alt="ClanName"> attribute
    row_pattern = re.compile(
        r'<tr[^>]*>\s*'
        r'<td\s+class="col1[^"]*">\s*<a[^>]*>(\d+)</a>\s*</td>\s*'       # rank
        r'<td\s+class="col2">\s*<a[^>]*>\s*'
        r'<img\s+src="([^"]*)"[^>]*alt="([^"]+)"[^>]*/?\s*>'             # motif_url, name
        r'.*?</td>\s*'
        r'<td\s+class="col3[^"]*">\s*<a[^>]*>(\d+)</a>\s*</td>\s*'        # member_count
        r'<td\s+class="col4[^"]*">\s*<a[^>]*>([\d,]+)</a>\s*</td>',       # total_xp
        re.DOTALL,
    )

    results: list[dict] = []
    for m in row_pattern.finditer(html):
        rank_str, motif_url, name, member_count_str, total_xp_str = m.groups()
        results.append({
            "name": name.strip(),
            "rank": int(rank_str),
            "member_count": int(member_count_str),
            "total_xp": int(total_xp_str.replace(",", "")),
            "motif_url": motif_url.strip() if motif_url else None,
        })

    return results


def _extract_clan_names_fallback(html: str) -> list[str]:
    """Fallback: extract just clan names from <img alt="..."> tags in the table."""
    return re.findall(r'<img\s+src="[^"]*"[^>]*alt="([^"]+)"', html)


async def _fetch_hiscores_page(client: httpx.AsyncClient, page: int) -> str | None:
    """Fetch a single Clan HiScores ranking page. Returns HTML or None."""
    try:
        resp = await client.get(CLAN_HISCORES_URL, params={"page": page})
        if resp.status_code == 200:
            return resp.text
        logger.warning("Clan HiScores page %d returned status %d", page, resp.status_code)
        return None
    except Exception as e:
        logger.warning("Failed to fetch Clan HiScores page %d: %s", page, e)
        return None


async def run_seed_job(job_id: str) -> None:
    """Background task: crawl Clan HiScores pages, discover clans, index each."""
    try:
        await db.seedjob.update(
            where={"id": job_id},
            data={
                "status": "running",
                "startedAt": datetime.now(timezone.utc),
            },
        )

        job = await db.seedjob.find_unique(where={"id": job_id})
        if not job:
            return

        start_page = job.startPage
        page_count = job.pageCount

        # Phase 1: Discover clan names from HiScores pages
        all_clans: list[dict] = []
        pages_processed = 0

        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
            for page_num in range(start_page, start_page + page_count):
                try:
                    await db.seedjob.update(
                        where={"id": job_id},
                        data={"currentPage": page_num, "currentClan": None},
                    )
                except Exception:
                    pass

                html = await _fetch_hiscores_page(client, page_num)
                if html is None:
                    pages_processed += 1
                    continue

                # Try full metadata extraction first
                page_clans = _extract_clans_with_metadata(html)
                if page_clans:
                    all_clans.extend(page_clans)
                else:
                    # Fallback: name-only extraction
                    names = _extract_clan_names_fallback(html)
                    for name in names:
                        all_clans.append({
                            "name": name,
                            "rank": None,
                            "member_count": None,
                            "total_xp": None,
                            "motif_url": None,
                        })

                pages_processed += 1

                try:
                    await db.seedjob.update(
                        where={"id": job_id},
                        data={
                            "pagesProcessed": pages_processed,
                            "clansDiscovered": len(all_clans),
                        },
                    )
                except Exception:
                    pass

                logger.info(
                    "Seed job page %d: discovered %d clans (total %d)",
                    page_num, len(page_clans) if page_clans else 0, len(all_clans),
                )

                await asyncio.sleep(PAGE_FETCH_DELAY)

        if not all_clans:
            await db.seedjob.update(
                where={"id": job_id},
                data={
                    "status": "completed",
                    "completedAt": datetime.now(timezone.utc),
                    "lastError": "No clans discovered from HiScores pages",
                },
            )
            return

        logger.info("Seed job %s: discovered %d clans, starting indexing", job_id, len(all_clans))

        # Phase 2: Index each clan sequentially
        indexed = 0
        failed = 0

        for clan_data in all_clans:
            clan_name = clan_data["name"]
            error_msg = None
            try:
                try:
                    await db.seedjob.update(
                        where={"id": job_id},
                        data={"currentClan": clan_name, "currentPage": None},
                    )
                except Exception:
                    pass

                result = await asyncio.wait_for(
                    fetch_and_index_clan(
                        clan_name,
                        seed_rank=clan_data.get("rank"),
                        seed_motif_url=clan_data.get("motif_url"),
                        # total_xp comes from clan API (members_lite.ws roster sum),
                        # not from the HiScores page metadata
                    ),
                    timeout=CLAN_INDEX_TIMEOUT,
                )

                if result.get("error"):
                    failed += 1
                    error_msg = f"{clan_name}: {result['error']}"[:500]
                    logger.info("Failed to index '%s': %s", clan_name, result["error"])
                else:
                    indexed += 1
                    logger.info("Indexed '%s' — %d members", clan_name, result.get("member_count", 0))

            except asyncio.TimeoutError:
                failed += 1
                error_msg = f"{clan_name}: timed out after {CLAN_INDEX_TIMEOUT}s"
                logger.warning("Seed job timeout: %s", error_msg)

            except Exception as e:
                failed += 1
                error_msg = f"{clan_name}: {e}"
                logger.exception("Seed job index error for '%s'", clan_name)

            try:
                update_data: dict = {
                    "clansIndexed": indexed,
                    "clansFailed": failed,
                }
                if error_msg:
                    update_data["lastError"] = error_msg[:500]
                await db.seedjob.update(where={"id": job_id}, data=update_data)
            except Exception as ue:
                logger.warning("Failed to update seed job progress: %s", ue)

            await asyncio.sleep(INDEX_DELAY)

        # Mark job complete
        await db.seedjob.update(
            where={"id": job_id},
            data={
                "status": "completed",
                "completedAt": datetime.now(timezone.utc),
                "currentClan": None,
                "currentPage": None,
            },
        )
        logger.info(
            "Seed job %s completed: %d indexed, %d failed",
            job_id, indexed, failed,
        )

    except Exception as e:
        logger.exception("Seed job %s crashed: %s", job_id, e)
        try:
            await db.seedjob.update(
                where={"id": job_id},
                data={
                    "status": "failed",
                    "lastError": str(e)[:500],
                    "completedAt": datetime.now(timezone.utc),
                },
            )
        except Exception:
            pass
