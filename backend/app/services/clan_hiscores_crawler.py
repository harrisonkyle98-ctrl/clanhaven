"""Clan Discovery Seeder — background job that discovers clan names from RS3 Clan
HiScores pages and indexes each via the existing members_lite.ws flow.

Flow:
  1. Fetch RS3 Clan HiScores ranking pages → extract clan names
  2. For each discovered name, call fetch_and_index_clan() which hits
     members_lite.ws and populates indexed_clans + indexed_clan_members
  3. Update SeedJob record with progress after each step

Rate-limited, sequential, admin-only trigger.
"""

import asyncio
import logging
import re
from datetime import datetime, timezone
from html import unescape

import httpx

from app.core.database import db
from app.services.clan_indexer import fetch_and_index_clan

logger = logging.getLogger(__name__)

CLAN_RANKING_URL = "https://secure.runescape.com/m=clan-hiscores/ranking"
PAGE_DELAY = 1.5  # seconds between hiscore page fetches
INDEX_DELAY = 2.0  # seconds between clan index calls
CLAN_INDEX_TIMEOUT = 120  # max seconds per individual clan indexing


def _extract_clan_names(html: str) -> list[str]:
    """Extract clan names from an RS3 Clan HiScores ranking HTML page."""
    pattern = re.compile(
        r'<td\s+class="col2">\s*<a[^>]*>\s*<img[^>]*alt="([^"]+)"',
        re.DOTALL,
    )
    names = []
    for match in pattern.finditer(html):
        raw = unescape(match.group(1)).replace("\xa0", " ").strip()
        if raw:
            names.append(raw)
    return names


async def run_seed_job(job_id: str) -> None:
    """Background task: run a seed job to completion, updating progress in DB."""
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
        all_names: list[str] = []

        # Phase 1: Discover clan names from HiScores ranking pages
        async with httpx.AsyncClient(
            timeout=20.0,
            follow_redirects=True,
            headers={"User-Agent": "ClanHaven/1.0 (clan discovery)"},
        ) as client:
            for i in range(page_count):
                page_num = start_page + i
                try:
                    await db.seedjob.update(
                        where={"id": job_id},
                        data={"currentPage": page_num, "currentClan": None},
                    )

                    resp = await client.get(
                        CLAN_RANKING_URL,
                        params={"tableType": 0, "page": page_num},
                    )
                    resp.raise_for_status()
                    names = _extract_clan_names(resp.text)

                    if not names:
                        logger.info("No clans on page %d — stopping discovery.", page_num)
                        break

                    all_names.extend(names)

                    await db.seedjob.update(
                        where={"id": job_id},
                        data={
                            "pagesProcessed": i + 1,
                            "clansDiscovered": len(all_names),
                        },
                    )

                    logger.info("Page %d: discovered %d names (%d total)", page_num, len(names), len(all_names))
                    await asyncio.sleep(PAGE_DELAY)

                except Exception as e:
                    error_msg = f"Page {page_num}: {e}"
                    logger.warning("Seed job page error: %s", error_msg)
                    await db.seedjob.update(
                        where={"id": job_id},
                        data={"lastError": error_msg[:500]},
                    )
                    break

        # Phase 2: Index each discovered clan sequentially
        indexed = 0
        failed = 0

        for clan_name in all_names:
            try:
                try:
                    await db.seedjob.update(
                        where={"id": job_id},
                        data={"currentClan": clan_name, "currentPage": None},
                    )
                except Exception:
                    pass

                result = await asyncio.wait_for(
                    fetch_and_index_clan(clan_name),
                    timeout=CLAN_INDEX_TIMEOUT,
                )

                if result.get("error"):
                    failed += 1
                    error_msg = f"{clan_name}: {result['error']}"[:500]
                    logger.info("Failed to index '%s': %s", clan_name, result["error"])
                else:
                    indexed += 1
                    logger.info("Indexed '%s' — %d members", clan_name, result.get("member_count", 0))
                    error_msg = None

            except asyncio.TimeoutError:
                failed += 1
                error_msg = f"{clan_name}: timed out after {CLAN_INDEX_TIMEOUT}s"
                logger.warning("Seed job timeout: %s", error_msg)

            except Exception as e:
                failed += 1
                error_msg = f"{clan_name}: {e}"
                logger.exception("Seed job index error for '%s'", clan_name)

            # Update progress — wrapped in its own try/except so a DB error
            # here doesn't kill the entire job
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
            "Seed job %s completed: %d discovered, %d indexed, %d failed",
            job_id, len(all_names), indexed, failed,
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
