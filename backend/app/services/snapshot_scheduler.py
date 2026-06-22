"""Snapshot scheduling service.

Provides the daily snapshot generation workflow that runs:
1. Player snapshots for all indexed players
2. Clan snapshots for all indexed clans
3. Activity detection for players with new snapshots

Designed to be triggered by a cron job, admin endpoint, or Fly.io machine schedule.
"""

import logging
from datetime import date, datetime, timezone

from app.services.activity_detection import detect_clan_rank_change, detect_player_activity
from app.services.clan_snapshots import generate_all_clan_snapshots
from app.services.player_snapshots import generate_all_player_snapshots

logger = logging.getLogger(__name__)


async def run_daily_snapshots() -> dict:
    """Execute the full daily snapshot workflow.

    Order:
    1. Generate player snapshots (captures current state)
    2. Generate clan snapshots (calculates total XP from members)
    3. Run activity detection on players with new snapshots

    Returns summary of all operations.
    """
    start_time = datetime.now(timezone.utc)
    logger.info("Starting daily snapshot generation at %s", start_time.isoformat())

    # Step 1: Player snapshots
    logger.info("Step 1/3: Generating player snapshots...")
    player_result = await generate_all_player_snapshots()

    # Step 2: Clan snapshots
    logger.info("Step 2/3: Generating clan snapshots...")
    clan_result = await generate_all_clan_snapshots()

    # Step 3: Activity detection for players who got new snapshots
    logger.info("Step 3/3: Running activity detection...")
    activity_events_created = 0

    if player_result["snapshots_created"] > 0:
        from app.core.database import db

        today = date.today()
        snapshot_date = datetime(today.year, today.month, today.day, tzinfo=timezone.utc)

        recent_snapshots = await db.rs3playerskillsnapshot.find_many(
            where={"snapshotDate": snapshot_date},
            take=500,  # Process in reasonable batches
        )

        player_ids_processed = set()
        for snapshot in recent_snapshots:
            if snapshot.playerId in player_ids_processed:
                continue
            player_ids_processed.add(snapshot.playerId)
            try:
                events = await detect_player_activity(snapshot.playerId)
                activity_events_created += len(events)
            except Exception as e:
                logger.warning("Activity detection failed for player %s: %s", snapshot.playerId, e)

    # Clan rank change detection
    if clan_result["snapshots_created"] > 0:
        from app.core.database import db

        clans = await db.indexedclan.find_many(take=500)
        for clan in clans:
            try:
                events = await detect_clan_rank_change(clan.id)
                activity_events_created += len(events)
            except Exception as e:
                logger.warning("Clan rank detection failed for %s: %s", clan.id, e)

    end_time = datetime.now(timezone.utc)
    duration = (end_time - start_time).total_seconds()

    summary = {
        "started_at": start_time.isoformat(),
        "completed_at": end_time.isoformat(),
        "duration_seconds": duration,
        "player_snapshots": player_result,
        "clan_snapshots": clan_result,
        "activity_events_created": activity_events_created,
    }

    logger.info(
        "Daily snapshot generation complete in %.1fs — players: %d, clans: %d, events: %d",
        duration,
        player_result["snapshots_created"],
        clan_result["snapshots_created"],
        activity_events_created,
    )

    return summary
