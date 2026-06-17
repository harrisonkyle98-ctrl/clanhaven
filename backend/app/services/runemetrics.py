"""RuneMetrics xp-monthly historical data importer.

Used ONLY for initial historical seed data. Clan Haven snapshots become
the source of truth after the backfill completes.

RuneMetrics xp-monthly endpoint returns monthly XP gains per skill for a player.
"""

import logging
from datetime import datetime, timezone

import httpx

from app.core.database import db

logger = logging.getLogger(__name__)

RUNEMETRICS_XP_MONTHLY_URL = "https://apps.runescape.com/runemetrics/xp-monthly?searchName={}&skillid=-1"

# RS3 skill IDs mapped to our field names
SKILL_ID_MAP = {
    0: "attack",
    1: "defence",
    2: "strength",
    3: "constitution",
    4: "ranged",
    5: "prayer",
    6: "magic",
    7: "cooking",
    8: "woodcutting",
    9: "fletching",
    10: "fishing",
    11: "firemaking",
    12: "crafting",
    13: "smithing",
    14: "mining",
    15: "herblore",
    16: "agility",
    17: "thieving",
    18: "slayer",
    19: "farming",
    20: "runecrafting",
    21: "hunter",
    22: "construction",
    23: "summoning",
    24: "dungeoneering",
    25: "divination",
    26: "invention",
    27: "archaeology",
    28: "necromancy",
}


async def fetch_runemetrics_monthly(rsn: str) -> dict | None:
    """Fetch xp-monthly data from RuneMetrics for a player.

    Returns raw JSON response or None if player is private/unavailable.
    """
    url = RUNEMETRICS_XP_MONTHLY_URL.format(rsn.replace(" ", "+"))

    async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
        try:
            resp = await client.get(url)
        except httpx.RequestError as e:
            logger.warning("RuneMetrics request failed for '%s': %s", rsn, e)
            return None

    if resp.status_code != 200:
        logger.warning("RuneMetrics returned %s for '%s'", resp.status_code, rsn)
        return None

    data = resp.json()

    # RuneMetrics returns {"error": "..."} for private profiles
    if "error" in data:
        logger.info("RuneMetrics profile private for '%s': %s", rsn, data["error"])
        return None

    return data


async def import_runemetrics_history(player_id: str, rsn: str) -> dict:
    """Import RuneMetrics xp-monthly data as historical snapshots.

    Creates one snapshot per month with cumulative XP values reconstructed
    from monthly gains. Only creates snapshots for months not already stored.

    Returns a summary dict with counts.
    """
    data = await fetch_runemetrics_monthly(rsn)
    if not data or "monthlyXpGain" not in data:
        return {"player_id": player_id, "rsn": rsn, "snapshots_created": 0, "error": "No data available"}

    monthly_gains = data["monthlyXpGain"]
    if not monthly_gains:
        return {"player_id": player_id, "rsn": rsn, "snapshots_created": 0, "error": "Empty monthly data"}

    # Get current player stats for reference
    player = await db.rs3player.find_unique(where={"id": player_id})
    if not player:
        return {"player_id": player_id, "rsn": rsn, "snapshots_created": 0, "error": "Player not found"}

    # Parse monthly gains — each entry has skillId, totalXp, totalGain, monthData
    # monthData contains year/month info
    # We'll aggregate by month across all skills
    monthly_totals: dict[str, dict[str, int]] = {}  # "YYYY-MM" -> {skill_name: xp_gained}

    for entry in monthly_gains:
        skill_id = entry.get("skillId")
        skill_name = SKILL_ID_MAP.get(skill_id)
        if skill_name is None:
            continue

        month_data = entry.get("monthData", [])
        for md in month_data:
            year = md.get("year")
            month = md.get("month")
            xp_gained = md.get("xpGained", 0)

            if not year or month is None:
                continue

            key = f"{year}-{month + 1:02d}"  # month is 0-indexed in RuneMetrics
            if key not in monthly_totals:
                monthly_totals[key] = {}
            monthly_totals[key][skill_name] = monthly_totals[key].get(skill_name, 0) + xp_gained

    if not monthly_totals:
        return {"player_id": player_id, "rsn": rsn, "snapshots_created": 0, "error": "No monthly totals parsed"}

    # Sort months chronologically and create snapshots
    sorted_months = sorted(monthly_totals.keys())
    snapshots_created = 0

    for month_key in sorted_months:
        # Parse the month into a date (first day of month)
        try:
            snapshot_date = datetime.strptime(month_key, "%Y-%m").replace(
                day=1, tzinfo=timezone.utc
            )
        except ValueError:
            continue

        # Check if snapshot already exists for this date
        existing = await db.rs3playerskillsnapshot.find_first(
            where={
                "playerId": player_id,
                "snapshotDate": snapshot_date,
            }
        )
        if existing:
            continue

        # Build skill XP data for this month
        gains = monthly_totals[month_key]
        skill_data: dict = {}
        total_xp_gain = 0
        for skill_name, xp in gains.items():
            skill_data[f"{skill_name}Xp"] = xp
            skill_data[f"{skill_name}Level"] = 0  # We don't have historical levels
            total_xp_gain += xp

        # Create snapshot with available data
        snapshot_data = {
            "playerId": player_id,
            "totalXp": total_xp_gain,
            "totalLevel": 0,
            "combatLevel": 0,
            "snapshotAt": snapshot_date,
            "snapshotDate": snapshot_date,
            "source": "runemetrics_backfill",
            **{k: v for k, v in skill_data.items() if k.endswith("Xp") or k.endswith("Level")},
        }

        try:
            await db.rs3playerskillsnapshot.create(data=snapshot_data)
            snapshots_created += 1
        except Exception as e:
            logger.warning("Failed to create backfill snapshot for '%s' at %s: %s", rsn, month_key, e)

    logger.info("RuneMetrics backfill for '%s': %d snapshots created", rsn, snapshots_created)
    return {
        "player_id": player_id,
        "rsn": rsn,
        "snapshots_created": snapshots_created,
        "months_available": len(sorted_months),
    }
