"""Player snapshot generation service.

Creates daily snapshots of all indexed RS3 player skill data.
Snapshots are deduplicated by (player_id, snapshot_date).
"""

import logging
from datetime import date, datetime, timezone

from app.core.database import db

logger = logging.getLogger(__name__)


async def generate_player_snapshot(player_id: str) -> dict | None:
    """Generate a single player skill snapshot for today.

    Returns the snapshot data dict if created, None if already exists for today.
    """
    today = date.today()
    snapshot_date = datetime(today.year, today.month, today.day, tzinfo=timezone.utc)

    # Check for existing snapshot today (dedup)
    existing = await db.rs3playerskillsnapshot.find_first(
        where={
            "playerId": player_id,
            "snapshotDate": snapshot_date,
        }
    )
    if existing:
        return None  # Already snapshotted today

    # Fetch current player data
    player = await db.rs3player.find_unique(where={"id": player_id})
    if not player:
        return None

    now = datetime.now(timezone.utc)

    snapshot_data = {
        "playerId": player_id,
        "totalLevel": player.totalLevel,
        "totalXp": player.totalXp,
        "combatLevel": player.combatLevel,
        "attackLevel": player.attackLevel,
        "attackXp": player.attackXp,
        "strengthLevel": player.strengthLevel,
        "strengthXp": player.strengthXp,
        "defenceLevel": player.defenceLevel,
        "defenceXp": player.defenceXp,
        "constitutionLevel": player.constitutionLevel,
        "constitutionXp": player.constitutionXp,
        "rangedLevel": player.rangedLevel,
        "rangedXp": player.rangedXp,
        "prayerLevel": player.prayerLevel,
        "prayerXp": player.prayerXp,
        "magicLevel": player.magicLevel,
        "magicXp": player.magicXp,
        "cookingLevel": player.cookingLevel,
        "cookingXp": player.cookingXp,
        "woodcuttingLevel": player.woodcuttingLevel,
        "woodcuttingXp": player.woodcuttingXp,
        "fletchingLevel": player.fletchingLevel,
        "fletchingXp": player.fletchingXp,
        "fishingLevel": player.fishingLevel,
        "fishingXp": player.fishingXp,
        "firemakingLevel": player.firemakingLevel,
        "firemakingXp": player.firemakingXp,
        "craftingLevel": player.craftingLevel,
        "craftingXp": player.craftingXp,
        "smithingLevel": player.smithingLevel,
        "smithingXp": player.smithingXp,
        "miningLevel": player.miningLevel,
        "miningXp": player.miningXp,
        "herbloreLevel": player.herbloreLevel,
        "herbloreXp": player.herbloreXp,
        "agilityLevel": player.agilityLevel,
        "agilityXp": player.agilityXp,
        "thievingLevel": player.thievingLevel,
        "thievingXp": player.thievingXp,
        "slayerLevel": player.slayerLevel,
        "slayerXp": player.slayerXp,
        "farmingLevel": player.farmingLevel,
        "farmingXp": player.farmingXp,
        "runecraftingLevel": player.runecraftingLevel,
        "runecraftingXp": player.runecraftingXp,
        "hunterLevel": player.hunterLevel,
        "hunterXp": player.hunterXp,
        "constructionLevel": player.constructionLevel,
        "constructionXp": player.constructionXp,
        "summoningLevel": player.summoningLevel,
        "summoningXp": player.summoningXp,
        "dungeoneeringLevel": player.dungeoneeringLevel,
        "dungeoneeringXp": player.dungeoneeringXp,
        "divinationLevel": player.divinationLevel,
        "divinationXp": player.divinationXp,
        "inventionLevel": player.inventionLevel,
        "inventionXp": player.inventionXp,
        "archaeologyLevel": player.archaeologyLevel,
        "archaeologyXp": player.archaeologyXp,
        "necromancyLevel": player.necromancyLevel,
        "necromancyXp": player.necromancyXp,
        "snapshotAt": now,
        "snapshotDate": snapshot_date,
        "source": "daily",
    }

    try:
        await db.rs3playerskillsnapshot.create(data=snapshot_data)
        return snapshot_data
    except Exception as e:
        # Unique constraint violation = already exists (race condition)
        logger.debug("Snapshot already exists for player %s on %s: %s", player_id, today, e)
        return None


async def generate_all_player_snapshots(batch_size: int = 200) -> dict:
    """Generate daily snapshots for all indexed players.

    Processes in batches to avoid memory issues with large player counts.
    Returns summary dict.
    """
    total_players = 0
    snapshots_created = 0
    skipped = 0
    offset = 0

    while True:
        players = await db.rs3player.find_many(
            take=batch_size,
            skip=offset,
            order={"id": "asc"},
        )

        if not players:
            break

        for player in players:
            total_players += 1
            result = await generate_player_snapshot(player.id)
            if result:
                snapshots_created += 1
            else:
                skipped += 1

        offset += batch_size
        logger.info(
            "Player snapshots progress: %d processed, %d created, %d skipped",
            total_players, snapshots_created, skipped,
        )

    logger.info(
        "Player snapshot generation complete: %d total, %d created, %d skipped (already existed)",
        total_players, snapshots_created, skipped,
    )
    return {
        "date": date.today().isoformat(),
        "total_players": total_players,
        "snapshots_created": snapshots_created,
        "skipped": skipped,
    }
