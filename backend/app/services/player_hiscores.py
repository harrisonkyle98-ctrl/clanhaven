"""RS3 Hiscores player data refresh service.

Fetches current skill levels and XP from the official RS3 Hiscores API
and updates the Rs3Player record.

Hiscores lite format: rank,level,xp (one line per skill/activity)
Line 0: Overall (total_level, total_xp)
Lines 1-29: Individual skills in RS3 order
"""

import asyncio
import logging
from datetime import datetime, timezone
from typing import Any

import httpx

from app.core.database import db

logger = logging.getLogger(__name__)

# ─── In-memory job state for background hiscores refresh ───
_hiscores_job: dict[str, Any] = {
    "status": "idle",
    "total_target": 0,
    "processed": 0,
    "updated": 0,
    "errors": 0,
    "skipped": 0,
    "clans_processed": 0,
    "clans_removed": 0,
    "current_clan": None,
    "current_rsn": None,
    "started_at": None,
    "completed_at": None,
    "concurrency": 0,
    "only_missing": False,
}
_hiscores_task: asyncio.Task | None = None
_hiscores_cancel = False

HISCORES_URL = "https://secure.runescape.com/m=hiscore/index_lite.ws?player={}"
HISCORES_IRONMAN_URL = "https://secure.runescape.com/m=hiscore_ironman/index_lite.ws?player={}"
HISCORES_HARDCORE_URL = "https://secure.runescape.com/m=hiscore_hardcore_ironman/index_lite.ws?player={}"

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


async def refresh_player_hiscores(
    player_id: str,
    rsn: str,
    client: httpx.AsyncClient | None = None,
) -> dict:
    """Fetch current skill data from RS3 Hiscores and update Rs3Player.

    Tries regular hiscores first, then falls back to ironman and
    hardcore ironman endpoints for players not on the main hiscores.
    Accepts an optional shared httpx client for connection pooling.
    """
    encoded_rsn = rsn.replace(" ", "+")
    own_client = client is None

    if own_client:
        client = httpx.AsyncClient(timeout=15.0, follow_redirects=True)

    try:
        # Try regular → hardcore ironman → ironman hiscores
        resp = None
        detected_type: str | None = None
        endpoints = [
            (HISCORES_URL.format(encoded_rsn), None),
            (HISCORES_HARDCORE_URL.format(encoded_rsn), "hardcore_ironman"),
            (HISCORES_IRONMAN_URL.format(encoded_rsn), "ironman"),
        ]

        for url, acct_type in endpoints:
            try:
                resp = await client.get(url)
            except httpx.RequestError as e:
                return {"player_id": player_id, "rsn": rsn, "error": f"Request failed: {e}"}
            if resp.status_code == 200:
                detected_type = acct_type
                break

        if resp is None or resp.status_code == 404:
            return {"player_id": player_id, "rsn": rsn, "error": "Player not found on any hiscores"}
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
            line_idx = i + 1
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

        combat_level = min(int(
            (defence_lv + constitution_lv + (prayer_lv // 2) + (summoning_lv // 2)) * 0.25
            + max(attack_lv + strength_lv, magic_lv * 2, ranged_lv * 2) * 0.325
        ), 152)

        update_data["combatLevel"] = combat_level
        update_data["lastHiscoresRefreshAt"] = datetime.now(timezone.utc)

        if detected_type:
            update_data["accountType"] = detected_type
            update_data["accountTypeSource"] = "hiscores"
            update_data["accountTypeVerifiedAt"] = datetime.now(timezone.utc)

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
    finally:
        if own_client:
            await client.aclose()


async def refresh_all_player_hiscores(
    batch_size: int = 500,
    concurrency: int = 25,
    limit: int | None = None,
    only_missing: bool = False,
) -> dict:
    """Refresh hiscores data for all indexed players.

    Uses a shared HTTP client with connection pooling and concurrent requests.

    Args:
        batch_size: Number of players to fetch per DB query.
        concurrency: Max concurrent HTTP requests.
        limit: Optional max number of players to process.
        only_missing: If True, only refresh players with totalXp = 0.
    """
    total_players = 0
    updated = 0
    errors = 0
    offset = 0
    semaphore = asyncio.Semaphore(concurrency)

    where_filter = {"totalXp": 0} if only_missing else None

    async with httpx.AsyncClient(
        timeout=15.0,
        follow_redirects=True,
        limits=httpx.Limits(
            max_connections=concurrency + 5,
            max_keepalive_connections=concurrency,
        ),
    ) as client:

        async def _refresh_one(pid: str, rsn: str):
            nonlocal updated, errors
            async with semaphore:
                result = await refresh_player_hiscores(pid, rsn, client=client)
                if "error" in result:
                    errors += 1
                    if errors <= 20:
                        logger.warning("Hiscores refresh error for '%s': %s", rsn, result["error"])
                else:
                    updated += 1
                await asyncio.sleep(0.05)

        while True:
            players = await db.rs3player.find_many(
                take=batch_size,
                skip=offset,
                where=where_filter,
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


# ─── Background job management ───


def get_hiscores_job_status() -> dict[str, Any]:
    """Return current hiscores refresh job state."""
    return dict(_hiscores_job)


async def start_hiscores_job(
    concurrency: int = 25,
    only_missing: bool = True,
) -> dict[str, Any]:
    """Start a background hiscores refresh job. Returns job state.

    Processes players clan-by-clan ordered by clan rank (1 to 11,061).
    After each clan, if 100% of its members returned 404, the clan and
    its members are removed from the database.
    """
    global _hiscores_task, _hiscores_cancel

    if _hiscores_job["status"] == "running":
        return {"error": "A hiscores refresh job is already running"}

    _hiscores_cancel = False

    # Count target players
    where_filter: dict | None = {"totalXp": 0} if only_missing else None
    total_target = await db.rs3player.count(where=where_filter)

    _hiscores_job.update({
        "status": "running",
        "total_target": total_target,
        "processed": 0,
        "updated": 0,
        "errors": 0,
        "skipped": 0,
        "clans_processed": 0,
        "clans_removed": 0,
        "current_clan": None,
        "current_rsn": None,
        "started_at": datetime.now(timezone.utc).isoformat(),
        "completed_at": None,
        "concurrency": concurrency,
        "only_missing": only_missing,
    })

    _hiscores_task = asyncio.create_task(
        _run_hiscores_job(concurrency=concurrency, only_missing=only_missing)
    )
    return get_hiscores_job_status()


def stop_hiscores_job() -> dict[str, Any]:
    """Signal the running hiscores job to stop."""
    global _hiscores_cancel
    if _hiscores_job["status"] != "running":
        return {"error": "No job is running"}
    _hiscores_cancel = True
    return {"status": "stopping"}


async def _run_hiscores_job(
    concurrency: int = 25,
    only_missing: bool = True,
) -> None:
    """Background task that refreshes hiscores per-clan ordered by rank.

    Processes clans from rank 1 to 11,061. For each clan, fetches all
    members' stats concurrently. If 100% of a clan's members return 404,
    the clan and its members are removed from the database.

    Skips players that already have hiscores data (lastHiscoresRefreshAt set)
    when only_missing is True.
    """
    global _hiscores_cancel
    semaphore = asyncio.Semaphore(concurrency)

    try:
        async with httpx.AsyncClient(
            timeout=15.0,
            follow_redirects=True,
            limits=httpx.Limits(
                max_connections=concurrency + 10,
                max_keepalive_connections=concurrency,
            ),
        ) as client:

            # Fetch all clans ordered by rank
            clans = await db.indexedclan.find_many(
                order=[{"rank": "asc"}],
                where={"rank": {"not": None}},
            )
            # Also get clans without a rank (append at end)
            clans_no_rank = await db.indexedclan.find_many(
                where={"rank": None},
                order={"id": "asc"},
            )
            clans = clans + clans_no_rank

            for clan in clans:
                if _hiscores_cancel:
                    break

                _hiscores_job["current_clan"] = clan.name

                # Get all members of this clan with linked player IDs
                members = await db.indexedclanmember.find_many(
                    where={"clanId": clan.id, "isCurrent": True, "playerId": {"not": None}},
                )

                if not members:
                    _hiscores_job["clans_processed"] += 1
                    continue

                # Get player records for these members
                player_ids = [m.playerId for m in members if m.playerId]
                if not player_ids:
                    _hiscores_job["clans_processed"] += 1
                    continue

                players = await db.rs3player.find_many(
                    where={"id": {"in": player_ids}},
                )

                # Filter: skip already-refreshed if only_missing
                if only_missing:
                    players = [p for p in players if p.totalXp == 0]

                if not players:
                    _hiscores_job["clans_processed"] += 1
                    continue

                # Track per-clan results for cleanup logic
                clan_errors = 0
                clan_updated = 0
                clan_total = len(players)

                async def _refresh_one(pid: str, rsn: str) -> bool:
                    """Returns True if player was found, False if 404."""
                    nonlocal clan_errors, clan_updated
                    async with semaphore:
                        if _hiscores_cancel:
                            return True  # Don't count as 404
                        _hiscores_job["current_rsn"] = rsn
                        result = await refresh_player_hiscores(pid, rsn, client=client)
                        _hiscores_job["processed"] += 1
                        if "error" in result:
                            _hiscores_job["errors"] += 1
                            clan_errors += 1
                            return False
                        else:
                            _hiscores_job["updated"] += 1
                            clan_updated += 1
                            return True

                # Process all players in this clan concurrently
                tasks = []
                for player in players:
                    if _hiscores_cancel:
                        break
                    tasks.append(_refresh_one(player.id, player.rsn))

                await asyncio.gather(*tasks)

                _hiscores_job["clans_processed"] += 1

                # Clan cleanup: ONLY remove if we checked ALL members (not just
                # the only_missing subset) and ALL returned 404.
                # This prevents deleting active clans where only a few
                # unlooked-up members are renamed/inactive.
                if (
                    not only_missing
                    and clan_total > 0
                    and clan_errors == clan_total
                    and clan_updated == 0
                    and not _hiscores_cancel
                ):
                    # Double check: count ALL members of this clan, not just
                    # the ones we processed. If there are members we didn't
                    # process (e.g. already had data), don't delete.
                    total_members = await db.indexedclanmember.count(
                        where={"clanId": clan.id, "isCurrent": True},
                    )
                    total_players_with_data = await db.rs3player.count(
                        where={
                            "id": {"in": [m.playerId for m in members if m.playerId]},
                            "totalXp": {"gt": 0},
                        },
                    )
                    if total_players_with_data == 0 and clan_total >= total_members:
                        try:
                            await db.indexedclanmember.delete_many(
                                where={"clanId": clan.id},
                            )
                            await db.indexedclan.delete(
                                where={"id": clan.id},
                            )
                            _hiscores_job["clans_removed"] += 1
                            logger.info(
                                "Removed clan '%s' (rank %s) — 100%% 404s (%d members)",
                                clan.name, clan.rank, clan_total,
                            )
                        except Exception as e:
                            logger.warning("Failed to remove clan '%s': %s", clan.name, e)

                if _hiscores_job["clans_processed"] % 50 == 0:
                    logger.info(
                        "Hiscores job: %d clans processed, %d removed, %d players updated, %d errors",
                        _hiscores_job["clans_processed"],
                        _hiscores_job["clans_removed"],
                        _hiscores_job["updated"],
                        _hiscores_job["errors"],
                    )

        _hiscores_job["status"] = "stopped" if _hiscores_cancel else "completed"
    except Exception as e:
        logger.exception("Hiscores job failed: %s", e)
        _hiscores_job["status"] = "failed"
    finally:
        _hiscores_job["current_clan"] = None
        _hiscores_job["current_rsn"] = None
        _hiscores_job["completed_at"] = datetime.now(timezone.utc).isoformat()
        _hiscores_cancel = False
