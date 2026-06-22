"""Clan snapshot generation service.

Creates daily snapshots of indexed clan state.
Clan total XP is always calculated from indexed_clan_members.clan_xp (NOT metadata).
Snapshots are deduplicated by (clan_id, snapshot_date).
"""

import logging
from datetime import date, datetime, timezone

from app.core.database import db

logger = logging.getLogger(__name__)


async def generate_clan_snapshot(clan_id: str) -> dict | None:
    """Generate a single clan snapshot for today.

    Total XP is calculated from the sum of indexed_clan_members.clan_xp.
    Returns the snapshot data dict if created, None if already exists for today.
    """
    today = date.today()
    snapshot_date = datetime(today.year, today.month, today.day, tzinfo=timezone.utc)

    # Check for existing snapshot today (dedup)
    existing = await db.clansnapshot.find_first(
        where={
            "clanId": clan_id,
            "snapshotDate": snapshot_date,
        }
    )
    if existing:
        return None  # Already snapshotted today

    # Fetch clan data
    clan = await db.indexedclan.find_unique(where={"id": clan_id})
    if not clan:
        return None

    # Calculate total XP from indexed_clan_members.clan_xp (NOT from metadata)
    members = await db.indexedclanmember.find_many(
        where={"clanId": clan_id, "isCurrent": True},
    )
    calculated_total_xp = sum(m.clanXp for m in members)
    member_count = len(members)

    # Get previous snapshot to calculate joined/left counts
    previous_snapshot = await db.clansnapshot.find_first(
        where={"clanId": clan_id},
        order={"snapshotAt": "desc"},
    )

    # Calculate members joined/left since last snapshot
    members_joined = 0
    members_left = 0
    if previous_snapshot:
        # Count members who joined since last snapshot
        joined = await db.indexedclanmember.count(
            where={
                "clanId": clan_id,
                "isCurrent": True,
                "firstSeenAt": {"gt": previous_snapshot.snapshotAt},
            }
        )
        members_joined = joined

        # Count members who left since last snapshot
        left = await db.indexedclanmember.count(
            where={
                "clanId": clan_id,
                "isCurrent": False,
                "leftSeenAt": {"gt": previous_snapshot.snapshotAt},
            }
        )
        members_left = left

    now = datetime.now(timezone.utc)

    snapshot_data = {
        "clanId": clan_id,
        "clanRank": clan.rank,
        "memberCount": member_count,
        "totalXp": calculated_total_xp,
        "membersJoinedSinceLast": members_joined,
        "membersLeftSinceLast": members_left,
        "snapshotAt": now,
        "snapshotDate": snapshot_date,
    }

    try:
        await db.clansnapshot.create(data=snapshot_data)
        return snapshot_data
    except Exception as e:
        # Unique constraint violation = already exists (race condition)
        logger.debug("Snapshot already exists for clan %s on %s: %s", clan_id, today, e)
        return None


async def generate_all_clan_snapshots(batch_size: int = 100) -> dict:
    """Generate daily snapshots for all indexed clans.

    Processes in batches. Returns summary dict.
    """
    today = date.today()
    total_clans = 0
    snapshots_created = 0
    skipped = 0
    offset = 0

    while True:
        clans = await db.indexedclan.find_many(
            take=batch_size,
            skip=offset,
            order={"id": "asc"},
        )

        if not clans:
            break

        for clan in clans:
            total_clans += 1
            result = await generate_clan_snapshot(clan.id)
            if result:
                snapshots_created += 1
            else:
                skipped += 1

        offset += batch_size
        logger.info(
            "Clan snapshots progress: %d processed, %d created, %d skipped",
            total_clans, snapshots_created, skipped,
        )

    logger.info(
        "Clan snapshot generation complete: %d total, %d created, %d skipped (already existed)",
        total_clans, snapshots_created, skipped,
    )
    return {
        "date": today.isoformat(),
        "total_clans": total_clans,
        "snapshots_created": snapshots_created,
        "skipped": skipped,
    }
