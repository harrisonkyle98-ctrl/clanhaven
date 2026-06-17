"""RS3 Hiscores player data refresh service.

Fetches current skill levels and XP from the official RS3 Hiscores API
and updates the Rs3Player record.

Hiscores lite format: rank,level,xp (one line per skill/activity)
Line 0: Overall (total_level, total_xp)
Lines 1-29: Individual skills in RS3 order
"""

import asyncio
import logging

import httpx

from app.core.database import db

logger = logging.getLogger(__name__)

HISCORES_URL = "https://secure.runescape.com/m=hiscore/index_lite.ws?player={}"

# RS3 Hiscores skill order (lines 1-29 after the Overall line)
HISCORES_SKILL_ORDER = [
    "attack",
    "defence",
    "strength",
    "constitution",
    "ranged",
    "prayer",
    "magic",
    "cooking",
    "woodcutting",
    "fletching",
    "fishing",
    "firemaking",
    "crafting",
    "smithing",
    "mining",
    "herblore",
    "agility",
    "thieving",
    "slayer",
    "farming",
    "runecrafting",
    "hunter",
    "construction",
    "summoning",
    "dungeoneering",
    "divination",
    "invention",
    "archaeology",
    "necromancy",
]


async def refresh_player_hiscores(player_id: str, rsn: str) -> dict:
    """Fetch current skill data from RS3 Hiscores and update Rs3Player.

    Returns a summary dict with the update results.
    """
    url = HISCORES_URL.format(rsn.replace(" ", "+"))

    async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
        try:
            resp = await client.get(url)
        except httpx.RequestError as e:
            return {"player_id": player_id, "rsn": rsn, "error": f"Request failed: {e}"}

    if resp.status_code == 404:
        return {"player_id": player_id, "rsn": rsn, "error": "Player not found on hiscores"}
    if resp.status_code != 200:
        return {"player_id": player_id, "rsn": rsn, "error": f"Hiscores returned {resp.status_code}"}

    lines = resp.text.strip().split("\n")
    if len(lines) < 30:
        return {"player_id": player_id, "rsn": rsn, "error": f"Unexpected response: only {len(lines)} lines"}

    # Parse Overall (line 0): rank, total_level, total_xp
    overall_parts = lines[0].split(",")
    if len(overall_parts) < 3:
        return {"player_id": player_id, "rsn": rsn, "error": "Failed to parse overall stats"}

    try:
        total_level = int(overall_parts[1])
        total_xp = int(overall_parts[2])
    except ValueError:
        return {"player_id": player_id, "rsn": rsn, "error": "Failed to parse overall numbers"}

    # Parse individual skills (lines 1-29)
    update_data: dict = {
        "totalLevel": total_level,
        "totalXp": total_xp,
    }

    for i, skill_name in enumerate(HISCORES_SKILL_ORDER):
        line_idx = i + 1  # Skip overall line
        if line_idx >= len(lines):
            break

        parts = lines[line_idx].split(",")
        if len(parts) < 3:
            continue

        try:
            level = int(parts[1])
            xp = int(parts[2])
        except ValueError:
            continue

        # Skip unranked skills (rank = -1 means not on hiscores)
        if level < 0:
            level = 0
        if xp < 0:
            xp = 0

        update_data[f"{skill_name}Level"] = level
        update_data[f"{skill_name}Xp"] = xp

    # Calculate combat level from component skills
    attack_lv = update_data.get("attackLevel", 0)
    strength_lv = update_data.get("strengthLevel", 0)
    defence_lv = update_data.get("defenceLevel", 0)
    constitution_lv = update_data.get("constitutionLevel", 0)
    ranged_lv = update_data.get("rangedLevel", 0)
    prayer_lv = update_data.get("prayerLevel", 0)
    magic_lv = update_data.get("magicLevel", 0)
    summoning_lv = update_data.get("summoningLevel", 0)

    # RS3 combat level approximation
    combat_level = min(int((defence_lv + constitution_lv + (prayer_lv // 2) + (summoning_lv // 2)) * 0.25
                        + max(attack_lv + strength_lv, magic_lv * 2, ranged_lv * 2) * 0.325), 152)

    update_data["combatLevel"] = combat_level

    # Add refresh timestamp
    from datetime import datetime, timezone
    update_data["lastHiscoresRefreshAt"] = datetime.now(timezone.utc)

    # Update the player record
    try:
        await db.rs3player.update(
            where={"id": player_id},
            data=update_data,
        )
    except Exception as e:
        return {"player_id": player_id, "rsn": rsn, "error": f"DB update failed: {e}"}

    return {
        "player_id": player_id,
        "rsn": rsn,
        "total_level": total_level,
        "total_xp": total_xp,
        "combat_level": combat_level,
        "skills_updated": len(HISCORES_SKILL_ORDER),
    }


async def refresh_all_player_hiscores(
    batch_size: int = 100,
    concurrency: int = 5,
    limit: int | None = None,
) -> dict:
    """Refresh hiscores data for all indexed players.

    Uses concurrent requests with rate limiting to avoid hammering the API.
    Returns summary dict.
    """
    total_players = 0
    updated = 0
    errors = 0
    offset = 0
    semaphore = asyncio.Semaphore(concurrency)

    async def _refresh_one(pid: str, rsn: str):
        nonlocal updated, errors
        async with semaphore:
            result = await refresh_player_hiscores(pid, rsn)
            if "error" in result:
                errors += 1
                if errors <= 10:
                    logger.warning("Hiscores refresh error for '%s': %s", rsn, result["error"])
            else:
                updated += 1
            # Rate limit: small delay between requests
            await asyncio.sleep(0.2)

    while True:
        players = await db.rs3player.find_many(
            take=batch_size,
            skip=offset,
            order={"id": "asc"},
        )

        if not players:
            break

        if limit and total_players >= limit:
            break

        tasks = []
        for player in players:
            if limit and total_players >= limit:
                break
            total_players += 1
            tasks.append(_refresh_one(player.id, player.rsn))

        await asyncio.gather(*tasks)
        offset += batch_size

        logger.info(
            "Hiscores refresh progress: %d processed, %d updated, %d errors",
            total_players, updated, errors,
        )

    logger.info(
        "Hiscores refresh complete: %d total, %d updated, %d errors",
        total_players, updated, errors,
    )
    return {
        "total_players": total_players,
        "updated": updated,
        "errors": errors,
    }
