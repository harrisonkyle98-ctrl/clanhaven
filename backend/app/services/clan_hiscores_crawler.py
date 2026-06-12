"""Clan Discovery Seeder — background job that re-indexes discovered clans
via the members_lite.ws API flow.

Clans are discovered organically through:
  - User RSN linking (playerDetails.ws → clan name)
  - Alt account requests
  - Manual admin indexing

This seeder re-indexes existing discovered clans to refresh their data,
populating indexed_clans, indexed_clan_members, rs3_players, and
clan_snapshots.

Rate-limited, sequential, admin-only trigger.
"""

import asyncio
import logging
from datetime import datetime, timezone

from app.core.database import db
from app.services.clan_indexer import fetch_and_index_clan

logger = logging.getLogger(__name__)

INDEX_DELAY = 2.0  # seconds between clan index calls
CLAN_INDEX_TIMEOUT = 120  # max seconds per individual clan indexing


async def run_seed_job(job_id: str) -> None:
    """Background task: re-index discovered clans, updating progress in DB."""
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

        # Fetch clans from the database that need re-indexing
        # Order by last_indexed_at ascending so stale clans get refreshed first
        clans = await db.indexedclan.find_many(
            order={"lastIndexedAt": "asc"},
            take=job.pageCount * 25,  # rough batch sizing
        )

        all_clan_names = [c.name for c in clans]

        await db.seedjob.update(
            where={"id": job_id},
            data={
                "pagesProcessed": 1,
                "clansDiscovered": len(all_clan_names),
            },
        )

        logger.info("Seed job %s: re-indexing %d discovered clans", job_id, len(all_clan_names))

        # Index each clan sequentially
        indexed = 0
        failed = 0

        for clan_name in all_clan_names:
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
            "Seed job %s completed: %d re-indexed, %d failed",
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
