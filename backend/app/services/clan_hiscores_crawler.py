"""Clan Discovery Seeder — crawls RS3 Clan HiScores ranking pages to
discover clan names and metadata, then indexes each clan via the
members_lite.ws API flow.

Phase 1: Fetch official Clan HiScores ranking pages (HTML) to extract
  clan names, rank, member_count, motif_url.
Phase 2: For each discovered clan, call fetch_and_index_clan() which
  hits members_lite.ws and populates indexed_clans, indexed_clan_members,
  rs3_players, and clan_snapshots.

Supports configurable concurrency (1–5 workers). Each worker fully
indexes one clan before moving to the next. Rate-limited with automatic
backoff on 429/502 errors. Admin-only trigger.
"""

import asyncio
import logging
import re
from collections import deque
from datetime import datetime, timezone

import httpx

from app.core.database import db
from app.services.clan_indexer import fetch_and_index_clan

logger = logging.getLogger(__name__)

CLAN_HISCORES_URL = "https://secure.runescape.com/m=clan-hiscores/ranking"
PAGE_FETCH_DELAY = 1.5   # seconds between HiScores page fetches
INDEX_DELAY = 1.0         # seconds between clan index starts per worker
CLAN_INDEX_TIMEOUT = 120  # max seconds per individual clan indexing
BACKOFF_BASE = 5.0        # base backoff on rate-limit/server errors
BACKOFF_MAX = 60.0        # max backoff seconds


def _extract_clans_with_metadata(html: str) -> list[dict]:
    """Extract clan names + metadata from an RS3 Clan HiScores ranking HTML page."""
    row_pattern = re.compile(
        r'<tr[^>]*>\s*'
        r'<td\s+class="col1[^"]*">\s*<a[^>]*>(\d+)</a>\s*</td>\s*'
        r'<td\s+class="col2">\s*<a[^>]*>\s*'
        r'<img\s+src="([^"]*)"[^>]*alt="([^"]+)"[^>]*/?\s*>'
        r'.*?</td>\s*'
        r'<td\s+class="col3[^"]*">\s*<a[^>]*>(\d+)</a>\s*</td>\s*'
        r'<td\s+class="col4[^"]*">\s*<a[^>]*>([\d,]+)</a>\s*</td>',
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


async def _fetch_hiscores_page(client: httpx.AsyncClient, page: int) -> tuple[str | None, bool]:
    """Fetch a single Clan HiScores ranking page.

    Returns (html_or_none, should_backoff).
    """
    try:
        resp = await client.get(CLAN_HISCORES_URL, params={"page": page})
        if resp.status_code == 200:
            return resp.text, False
        if resp.status_code in (429, 502, 503):
            logger.warning("Clan HiScores page %d rate-limited/error: %d", page, resp.status_code)
            return None, True
        logger.warning("Clan HiScores page %d returned status %d", page, resp.status_code)
        return None, False
    except Exception as e:
        logger.warning("Failed to fetch Clan HiScores page %d: %s", page, e)
        return None, False


class _JobProgress:
    """Thread-safe progress tracker for concurrent seed job."""

    def __init__(self, job_id: str):
        self.job_id = job_id
        self._lock = asyncio.Lock()
        self.indexed = 0
        self.failed = 0
        self.last_error: str | None = None
        self._active_clans: set[str] = set()

    async def start_clan(self, clan_name: str) -> None:
        async with self._lock:
            self._active_clans.add(clan_name)
            await self._update_db()

    async def finish_clan(self, clan_name: str, success: bool, error: str | None = None) -> None:
        async with self._lock:
            self._active_clans.discard(clan_name)
            if success:
                self.indexed += 1
            else:
                self.failed += 1
                if error:
                    self.last_error = error[:500]
            await self._update_db()

    async def _update_db(self) -> None:
        current_display = ", ".join(sorted(self._active_clans)[:3]) or None
        try:
            data: dict = {
                "clansIndexed": self.indexed,
                "clansFailed": self.failed,
                "currentClan": current_display,
            }
            if self.last_error:
                data["lastError"] = self.last_error
            await db.seedjob.update(where={"id": self.job_id}, data=data)
        except Exception as ue:
            logger.warning("Failed to update seed job progress: %s", ue)


async def _index_worker(
    worker_id: int,
    queue: deque[dict],
    queue_lock: asyncio.Lock,
    progress: _JobProgress,
    rate_sem: asyncio.Semaphore,
) -> None:
    """Worker that pulls clans from the queue and indexes them one at a time."""
    while True:
        async with queue_lock:
            if not queue:
                return
            clan_data = queue.popleft()

        clan_name = clan_data["name"]

        # Rate-limit: only one clan starts indexing at a time
        async with rate_sem:
            await progress.start_clan(clan_name)
            await asyncio.sleep(INDEX_DELAY)

        try:
            result = await asyncio.wait_for(
                fetch_and_index_clan(
                    clan_name,
                    seed_rank=clan_data.get("rank"),
                    seed_motif_url=clan_data.get("motif_url"),
                ),
                timeout=CLAN_INDEX_TIMEOUT,
            )

            if result.get("error"):
                error_msg = f"{clan_name}: {result['error']}"
                logger.info("Worker %d: failed to index '%s': %s", worker_id, clan_name, result["error"])
                await progress.finish_clan(clan_name, success=False, error=error_msg)
            else:
                logger.info(
                    "Worker %d: indexed '%s' — %d members",
                    worker_id, clan_name, result.get("member_count", 0),
                )
                await progress.finish_clan(clan_name, success=True)

        except asyncio.TimeoutError:
            error_msg = f"{clan_name}: timed out after {CLAN_INDEX_TIMEOUT}s"
            logger.warning("Worker %d: %s", worker_id, error_msg)
            await progress.finish_clan(clan_name, success=False, error=error_msg)

        except asyncio.CancelledError:
            await progress.finish_clan(clan_name, success=False, error=f"{clan_name}: cancelled")
            raise

        except Exception as e:
            error_msg = f"{clan_name}: {e}"
            logger.exception("Worker %d: index error for '%s'", worker_id, clan_name)
            await progress.finish_clan(clan_name, success=False, error=error_msg)


async def run_seed_job(job_id: str) -> None:
    """Background task: crawl Clan HiScores pages, discover clans, index with concurrency."""
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
        concurrency = min(max(job.concurrency, 1), 5)

        # Phase 1: Discover clan names from HiScores pages
        all_clans: list[dict] = []
        pages_processed = 0
        backoff = 0.0

        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
            for page_num in range(start_page, start_page + page_count):
                try:
                    await db.seedjob.update(
                        where={"id": job_id},
                        data={"currentPage": page_num, "currentClan": None},
                    )
                except Exception:
                    pass

                # Backoff if previous page triggered rate-limit
                if backoff > 0:
                    logger.info("Backing off %.1fs before page %d", backoff, page_num)
                    await asyncio.sleep(backoff)

                html, should_backoff = await _fetch_hiscores_page(client, page_num)

                if should_backoff:
                    backoff = min(backoff * 2 + BACKOFF_BASE, BACKOFF_MAX)
                    pages_processed += 1
                    continue
                else:
                    backoff = 0.0

                if html is None:
                    pages_processed += 1
                    continue

                page_clans = _extract_clans_with_metadata(html)
                if page_clans:
                    all_clans.extend(page_clans)
                else:
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

        logger.info(
            "Seed job %s: discovered %d clans, starting indexing with concurrency=%d",
            job_id, len(all_clans), concurrency,
        )

        # Phase 2: Index clans with controlled concurrency
        progress = _JobProgress(job_id)
        clan_queue: deque[dict] = deque(all_clans)
        queue_lock = asyncio.Lock()
        # Rate semaphore ensures only one clan starts at a time (staggered starts)
        rate_sem = asyncio.Semaphore(1)

        workers = [
            asyncio.create_task(
                _index_worker(i, clan_queue, queue_lock, progress, rate_sem)
            )
            for i in range(concurrency)
        ]

        await asyncio.gather(*workers, return_exceptions=True)

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
            "Seed job %s completed: %d indexed, %d failed (concurrency=%d)",
            job_id, progress.indexed, progress.failed, concurrency,
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
