import asyncio
import sys
import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s", stream=sys.stdout)
logger = logging.getLogger(__name__)

sys.path.insert(0, "/app")


async def main():
    from app.core.database import connect_db, disconnect_db, db
    await connect_db()

    count = await db.rs3player.count()
    logger.info("Total indexed players: %d", count)

    # Step 1: Refresh RS3 Hiscores
    logger.info("STEP 1: Refreshing RS3 Hiscores data...")
    from app.services.player_hiscores import refresh_all_player_hiscores
    hiscores_result = await refresh_all_player_hiscores(concurrency=5, limit=5000)
    logger.info("Hiscores result: %s", hiscores_result)

    # Step 2: RuneMetrics backfill
    logger.info("STEP 2: Importing RuneMetrics historical data...")
    from app.services.runemetrics import import_runemetrics_history
    players = await db.rs3player.find_many(take=5000, order={"totalXp": "desc"})
    backfill_stats = {"attempted": 0, "created": 0, "errors": 0}

    for i, player in enumerate(players):
        existing = await db.rs3playerskillsnapshot.count(
            where={"playerId": player.id, "source": "runemetrics_backfill"}
        )
        if existing > 0:
            continue

        result = await import_runemetrics_history(player.id, player.rsn)
        backfill_stats["attempted"] += 1
        if result.get("snapshots_created", 0) > 0:
            backfill_stats["created"] += result["snapshots_created"]
        if result.get("error"):
            backfill_stats["errors"] += 1

        if (i + 1) % 50 == 0:
            logger.info("RuneMetrics progress: %d/%d", i + 1, len(players))
            await asyncio.sleep(1)
        await asyncio.sleep(0.3)

    logger.info("RuneMetrics result: %s", backfill_stats)

    # Step 3: Daily snapshots
    logger.info("STEP 3: Generating daily snapshots...")
    from app.services.snapshot_scheduler import run_daily_snapshots
    snapshot_result = await run_daily_snapshots()
    logger.info("Snapshot result: %s", snapshot_result)

    logger.info("DONE!")
    await disconnect_db()


if __name__ == "__main__":
    asyncio.run(main())
