"""Activity detection infrastructure.

Compares current player/clan state with their previous snapshot to detect
meaningful changes. Records events in the activity_events table.

Event types:
  Player: xp_gained, level_gained, clan_changed
  Clan: member_joined, member_left, rank_changed
"""

import logging
from datetime import datetime, timezone

from app.core.database import db

logger = logging.getLogger(__name__)

# Minimum XP gain threshold to record as an event (avoids noise)
MIN_XP_GAIN_THRESHOLD = 1000


async def detect_player_activity(player_id: str) -> list[dict]:
    """Compare current player state with last snapshot and detect changes.

    Returns list of activity events created.
    """
    player = await db.rs3player.find_unique(where={"id": player_id})
    if not player:
        return []

    # Get the two most recent snapshots to compare
    snapshots = await db.rs3playerskillsnapshot.find_many(
        where={"playerId": player_id},
        order={"snapshotAt": "desc"},
        take=2,
    )

    if len(snapshots) < 2:
        return []  # Need at least 2 snapshots to detect changes

    current = snapshots[0]
    previous = snapshots[1]
    now = datetime.now(timezone.utc)
    events: list[dict] = []

    # Detect total XP gained
    xp_gained = current.totalXp - previous.totalXp
    if xp_gained >= MIN_XP_GAIN_THRESHOLD:
        event_data = {
            "eventType": "xp_gained",
            "entityType": "player",
            "entityId": player_id,
            "playerId": player_id,
            "metadata": {
                "xp_gained": xp_gained,
                "total_xp": current.totalXp,
                "previous_xp": previous.totalXp,
                "rsn": player.rsn,
            },
            "occurredAt": now,
        }
        try:
            await db.activityevent.create(data=event_data)
            events.append(event_data)
        except Exception as e:
            logger.warning("Failed to create xp_gained event for player %s: %s", player_id, e)

    # Detect level gains (total level increase)
    if current.totalLevel > previous.totalLevel:
        levels_gained = current.totalLevel - previous.totalLevel
        event_data = {
            "eventType": "level_gained",
            "entityType": "player",
            "entityId": player_id,
            "playerId": player_id,
            "metadata": {
                "levels_gained": levels_gained,
                "total_level": current.totalLevel,
                "previous_total_level": previous.totalLevel,
                "rsn": player.rsn,
            },
            "occurredAt": now,
        }
        try:
            await db.activityevent.create(data=event_data)
            events.append(event_data)
        except Exception as e:
            logger.warning("Failed to create level_gained event for player %s: %s", player_id, e)

    # Detect individual skill level-ups
    skill_names = [
        "attack", "strength", "defence", "constitution", "ranged", "prayer",
        "magic", "cooking", "woodcutting", "fletching", "fishing", "firemaking",
        "crafting", "smithing", "mining", "herblore", "agility", "thieving",
        "slayer", "farming", "runecrafting", "hunter", "construction",
        "summoning", "dungeoneering", "divination", "invention", "archaeology",
        "necromancy",
    ]

    for skill in skill_names:
        curr_level = getattr(current, f"{skill}Level", 0)
        prev_level = getattr(previous, f"{skill}Level", 0)
        if curr_level > prev_level:
            event_data = {
                "eventType": "level_gained",
                "entityType": "player",
                "entityId": player_id,
                "playerId": player_id,
                "metadata": {
                    "skill": skill,
                    "new_level": curr_level,
                    "previous_level": prev_level,
                    "rsn": player.rsn,
                },
                "occurredAt": now,
            }
            try:
                await db.activityevent.create(data=event_data)
                events.append(event_data)
            except Exception as e:
                logger.warning("Failed to create skill level event for %s/%s: %s", player_id, skill, e)

    return events


async def detect_clan_membership_changes(clan_id: str, joined_rsns: set, left_rsns: set) -> list[dict]:
    """Record clan membership change events.

    Called during clan indexing when we detect joins/leaves.
    """
    now = datetime.now(timezone.utc)
    events: list[dict] = []

    for rsn in joined_rsns:
        event_data = {
            "eventType": "member_joined",
            "entityType": "clan",
            "entityId": clan_id,
            "clanId": clan_id,
            "metadata": {"rsn": rsn},
            "occurredAt": now,
        }
        try:
            await db.activityevent.create(data=event_data)
            events.append(event_data)
        except Exception as e:
            logger.warning("Failed to create member_joined event: %s", e)

    for rsn in left_rsns:
        event_data = {
            "eventType": "member_left",
            "entityType": "clan",
            "entityId": clan_id,
            "clanId": clan_id,
            "metadata": {"rsn": rsn},
            "occurredAt": now,
        }
        try:
            await db.activityevent.create(data=event_data)
            events.append(event_data)
        except Exception as e:
            logger.warning("Failed to create member_left event: %s", e)

    return events


async def detect_clan_rank_change(clan_id: str) -> list[dict]:
    """Detect clan rank changes by comparing current rank with last snapshot.

    Returns list of events created.
    """
    clan = await db.indexedclan.find_unique(where={"id": clan_id})
    if not clan or clan.rank is None:
        return []

    # Get previous snapshot
    previous = await db.clansnapshot.find_first(
        where={"clanId": clan_id},
        order={"snapshotAt": "desc"},
        skip=1,  # Skip the current one
    )

    if not previous or previous.clanRank is None:
        return []

    if clan.rank != previous.clanRank:
        now = datetime.now(timezone.utc)
        event_data = {
            "eventType": "rank_changed",
            "entityType": "clan",
            "entityId": clan_id,
            "clanId": clan_id,
            "metadata": {
                "new_rank": clan.rank,
                "previous_rank": previous.clanRank,
                "clan_name": clan.name,
            },
            "occurredAt": now,
        }
        try:
            await db.activityevent.create(data=event_data)
            return [event_data]
        except Exception as e:
            logger.warning("Failed to create rank_changed event for clan %s: %s", clan_id, e)

    return []
