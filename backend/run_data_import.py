"""One-time data import script.

Runs on the Fly.io machine via:
  fly ssh console -C "cd /app && python run_data_import.py"

Steps:
1. Refresh RS3 Hiscores data for all indexed players (current skill levels)
2. Import RuneMetrics historical data for all players
3. Generate first daily snapshot for all players and clans

This populates player profiles with real data.
"""

import asyncio
import logging
import sys

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    stream=sys.stdout,
)
logger = logging.getLogger(__name__)


async def main():
    from app.core.database import connect_db, disconnect_db

    logger.info("Connecting to database...")
    await connect_db()

    # Step 1: Refresh RS3 Hiscores for all players
    logger.info("=" * 60)
    logger.info("STEP 1: Refreshing RS3 Hiscores data for all players")
    logger.info("=" * 60)

    from app.services.player_hiscores import refresh_all_player_hiscores
    hiscores_result = await refresh_all_player_hiscores(concurrency=5, limit=5000)
    logger.info("Hiscores refresh result: %s", hiscores_result)

    # Step 2: Import RuneMetrics historical data
    logger.info("=" * 60)
    logger.info("STEP 2: Importing RuneMetrics historical data")
    logger.info("=" * 60)

    from app.core.database import db
    from app.services.runemetrics import import_runemetrics_history

    players = await db.rs3player.find_many(take=5000, order={"totalXp": "desc"})
    backfill_results = {"attempted": 0, "created": 0, "errors": 0}

    for i, player in enumerate(players):
        # Only backfill players who don't have RuneMetrics data yet
        existing = await db.rs3playerskillsnapshot.count(
            where={"playerId": player.id, "source": "runemetrics_backfill"}
        )
        if existing > 0:
            continue

        result = await import_runemetrics_history(player.id, player.rsn)
        backfill_results["attempted"] += 1
        if result.get("snapshots_created", 0) > 0:
            backfill_results["created"] += result["snapshots_created"]
        if result.get("error"):
            backfill_results["errors"] += 1

        if (i + 1) % 50 == 0:
            logger.info("RuneMetrics progress: %d/%d processed", i + 1, len(players))
            await asyncio.sleep(1)  # Rate limit

        # Small delay between requests
        await asyncio.sleep(0.3)

    logger.info("RuneMetrics backfill result: %s", backfill_results)

    # Step 3: Generate daily snapshots
    logger.info("=" * 60)
    logger.info("STEP 3: Generating daily snapshots")
    logger.info("=" * 60)

    from app.services.snapshot_scheduler import run_daily_snapshots
    snapshot_result = await run_daily_snapshots()
    logger.info("Snapshot generation result: %s", snapshot_result)

    # Summary
    logger.info("=" * 60)
    logger.info("DATA IMPORT COMPLETE")
    logger.info("=" * 60)
    logger.info("Hiscores refreshed: %d players", hiscores_result.get("updated", 0))
    logger.info("RuneMetrics backfilled: %d snapshots", backfill_results["created"])
    logger.info("Daily snapshots: %d player, %d clan",
                snapshot_result.get("player_snapshots", {}).get("snapshots_created", 0),
                snapshot_result.get("clan_snapshots", {}).get("snapshots_created", 0))

    await disconnect_db()


if __name__ == "__main__":
    asyncio.run(main())
