"""Player profile API endpoints.

Provides:
- Player profile lookup by RSN
- Player snapshot history
- Player activity events
- RuneMetrics backfill trigger (admin)
- Manual snapshot trigger (admin)
"""

import logging

from fastapi import APIRouter, Depends, HTTPException, Query

from app.core.auth import get_current_user
from app.core.database import db

logger = logging.getLogger(__name__)

router = APIRouter()

# RS3 skill list for structured response
RS3_SKILLS = [
    "attack", "strength", "defence", "constitution", "ranged", "prayer",
    "magic", "cooking", "woodcutting", "fletching", "fishing", "firemaking",
    "crafting", "smithing", "mining", "herblore", "agility", "thieving",
    "slayer", "farming", "runecrafting", "hunter", "construction",
    "summoning", "dungeoneering", "divination", "invention", "archaeology",
    "necromancy",
]


def _normalize_rsn(rsn: str) -> str:
    """Normalize RSN for lookup: lowercase, trim, replace non-breaking spaces."""
    return rsn.replace("\xa0", " ").replace("_", " ").strip().lower()


def _rsn_from_slug(slug: str) -> str:
    """Convert URL slug back to normalized RSN for lookup."""
    # URL slugs use hyphens for spaces
    return slug.replace("-", " ").strip().lower()


# ─── Player Profile ───


@router.get("/profile/{rsn_slug:path}")
async def get_player_profile(rsn_slug: str):
    """Get a player's full profile by RSN (URL-safe slug).

    URL pattern: /api/players/profile/lm-kyle
    """
    normalized = _rsn_from_slug(rsn_slug)

    player = await db.rs3player.find_first(
        where={"normalizedRsn": normalized},
    )

    if not player:
        raise HTTPException(status_code=404, detail="Player not found")

    # Get current clan membership
    clan_membership = await db.indexedclanmember.find_first(
        where={"playerId": player.id, "isCurrent": True},
        include={"clan": True},
    )

    # Build skills list
    skills = []
    for skill in RS3_SKILLS:
        level = getattr(player, f"{skill}Level", 0)
        xp = getattr(player, f"{skill}Xp", 0)
        skills.append({
            "name": skill,
            "level": level,
            "xp": xp,
        })

    # Get snapshot count for history availability indicator
    snapshot_count = await db.rs3playerskillsnapshot.count(
        where={"playerId": player.id}
    )

    # hasStats = True if player has been successfully looked up on hiscores
    has_stats = player.totalXp > 0

    return {
        "player": {
            "id": player.id,
            "rsn": player.rsn,
            "normalizedRsn": player.normalizedRsn,
            "accountType": player.accountType,
            "totalLevel": player.totalLevel,
            "totalXp": player.totalXp,
            "combatLevel": player.combatLevel,
            "currentClanId": player.currentClanId,
            "currentClanName": player.currentClanName,
        },
        "clan": {
            "id": clan_membership.clan.id,
            "name": clan_membership.clan.name,
            "slug": clan_membership.clan.slug,
            "rank": clan_membership.clanRank,
        } if clan_membership and clan_membership.clan else None,
        "skills": skills,
        "snapshotCount": snapshot_count,
        "hasHistory": snapshot_count > 0,
        "hasStats": has_stats,
    }


# ─── Player Snapshot History ───


@router.get("/profile/{rsn_slug:path}/snapshots")
async def get_player_snapshots(
    rsn_slug: str,
    limit: int = Query(30, ge=1, le=365),
    offset: int = Query(0, ge=0),
):
    """Get player's historical snapshots (most recent first)."""
    normalized = _rsn_from_slug(rsn_slug)

    player = await db.rs3player.find_first(
        where={"normalizedRsn": normalized},
    )
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")

    snapshots = await db.rs3playerskillsnapshot.find_many(
        where={"playerId": player.id},
        order={"snapshotAt": "desc"},
        take=limit,
        skip=offset,
    )

    total = await db.rs3playerskillsnapshot.count(
        where={"playerId": player.id}
    )

    return {
        "snapshots": [
            {
                "id": s.id,
                "snapshotAt": s.snapshotAt.isoformat(),
                "source": s.source,
                "totalLevel": s.totalLevel,
                "totalXp": s.totalXp,
                "combatLevel": s.combatLevel,
                "skills": {
                    skill: {
                        "level": getattr(s, f"{skill}Level", 0),
                        "xp": getattr(s, f"{skill}Xp", 0),
                    }
                    for skill in RS3_SKILLS
                },
            }
            for s in snapshots
        ],
        "total": total,
        "limit": limit,
        "offset": offset,
    }


# ─── Player Activity Events ───


@router.get("/profile/{rsn_slug:path}/activity")
async def get_player_activity(
    rsn_slug: str,
    limit: int = Query(20, ge=1, le=100),
):
    """Get recent activity events for a player."""
    normalized = _rsn_from_slug(rsn_slug)

    player = await db.rs3player.find_first(
        where={"normalizedRsn": normalized},
    )
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")

    events = await db.activityevent.find_many(
        where={"playerId": player.id},
        order={"occurredAt": "desc"},
        take=limit,
    )

    return {
        "events": [
            {
                "id": e.id,
                "eventType": e.eventType,
                "metadata": e.metadata,
                "occurredAt": e.occurredAt.isoformat(),
            }
            for e in events
        ],
    }


# ─── Player Gains (calculated from snapshots) ───


@router.get("/profile/{rsn_slug:path}/gains")
async def get_player_gains(rsn_slug: str):
    """Calculate daily/weekly/monthly XP gains from snapshots."""
    normalized = _rsn_from_slug(rsn_slug)

    player = await db.rs3player.find_first(
        where={"normalizedRsn": normalized},
    )
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")

    # Get recent snapshots to calculate gains
    snapshots = await db.rs3playerskillsnapshot.find_many(
        where={"playerId": player.id},
        order={"snapshotAt": "desc"},
        take=31,  # Up to 31 days for monthly calculation
    )

    if len(snapshots) < 2:
        return {
            "daily": None,
            "weekly": None,
            "monthly": None,
            "message": "Not enough snapshot data yet",
        }

    latest = snapshots[0]
    gains = {}

    # Daily gain (most recent vs previous)
    if len(snapshots) >= 2:
        prev = snapshots[1]
        gains["daily"] = {
            "totalXp": latest.totalXp - prev.totalXp,
            "totalLevel": latest.totalLevel - prev.totalLevel,
            "period": f"{prev.snapshotAt.isoformat()} to {latest.snapshotAt.isoformat()}",
        }

    # Weekly gain (most recent vs ~7 days ago)
    if len(snapshots) >= 7:
        week_ago = snapshots[6]
        gains["weekly"] = {
            "totalXp": latest.totalXp - week_ago.totalXp,
            "totalLevel": latest.totalLevel - week_ago.totalLevel,
            "period": f"{week_ago.snapshotAt.isoformat()} to {latest.snapshotAt.isoformat()}",
        }
    else:
        gains["weekly"] = None

    # Monthly gain (most recent vs ~30 days ago)
    if len(snapshots) >= 30:
        month_ago = snapshots[29]
        gains["monthly"] = {
            "totalXp": latest.totalXp - month_ago.totalXp,
            "totalLevel": latest.totalLevel - month_ago.totalLevel,
            "period": f"{month_ago.snapshotAt.isoformat()} to {latest.snapshotAt.isoformat()}",
        }
    else:
        gains["monthly"] = None

    return gains


# ─── Admin: RuneMetrics Backfill ───


@router.post("/admin/backfill/{rsn_slug:path}")
async def trigger_runemetrics_backfill(
    rsn_slug: str,
    current_user: dict = Depends(get_current_user),
):
    """Trigger RuneMetrics historical backfill for a player. Admin only."""
    # Check admin privileges
    user = await db.user.find_unique(where={"id": current_user["sub"]})
    if not user or user.privileges < 2:
        raise HTTPException(status_code=403, detail="Admin access required")

    normalized = _rsn_from_slug(rsn_slug)
    player = await db.rs3player.find_first(
        where={"normalizedRsn": normalized},
    )
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")

    from app.services.runemetrics import import_runemetrics_history
    result = await import_runemetrics_history(player.id, player.rsn)
    return result


# ─── Admin: Trigger Daily Snapshots ───


@router.post("/admin/snapshots/generate")
async def trigger_snapshot_generation(
    current_user: dict = Depends(get_current_user),
):
    """Manually trigger daily snapshot generation. Admin only."""
    user = await db.user.find_unique(where={"id": current_user["sub"]})
    if not user or user.privileges < 2:
        raise HTTPException(status_code=403, detail="Admin access required")

    from app.services.snapshot_scheduler import run_daily_snapshots
    result = await run_daily_snapshots()
    return result


# ─── Admin: Batch RuneMetrics Backfill ───


@router.post("/admin/backfill-all")
async def trigger_batch_backfill(
    current_user: dict = Depends(get_current_user),
    limit: int = Query(50, ge=1, le=500),
):
    """Trigger RuneMetrics backfill for multiple players. Admin only.

    Processes players that don't have any snapshots yet.
    """
    user = await db.user.find_unique(where={"id": current_user["sub"]})
    if not user or user.privileges < 2:
        raise HTTPException(status_code=403, detail="Admin access required")

    from app.services.runemetrics import import_runemetrics_history

    # Find players with no snapshots
    # We'll use a raw approach: get players and check snapshot count
    players = await db.rs3player.find_many(
        take=limit,
        order={"updatedAt": "desc"},
    )

    results = []
    for player in players:
        count = await db.rs3playerskillsnapshot.count(
            where={"playerId": player.id}
        )
        if count == 0:
            result = await import_runemetrics_history(player.id, player.rsn)
            results.append(result)

    return {
        "players_checked": len(players),
        "backfills_attempted": len(results),
        "results": results,
    }


# ─── Admin: Hiscores Refresh ───


@router.post("/admin/hiscores/refresh-all")
async def trigger_hiscores_refresh(
    current_user: dict = Depends(get_current_user),
    limit: int = Query(0, ge=0, le=10000000),
    concurrency: int = Query(25, ge=1, le=50),
    only_missing: bool = Query(False),
):
    """Refresh RS3 Hiscores data for all indexed players. Admin only.

    Fetches current skill levels and XP from the official RS3 Hiscores API.
    Set limit=0 for no limit. Set only_missing=true to skip already-refreshed players.
    """
    user = await db.user.find_unique(where={"id": current_user["sub"]})
    if not user or user.privileges < 2:
        raise HTTPException(status_code=403, detail="Admin access required")

    from app.services.player_hiscores import refresh_all_player_hiscores
    result = await refresh_all_player_hiscores(
        limit=limit if limit > 0 else None,
        concurrency=concurrency,
        only_missing=only_missing,
    )
    return result


# ─── Admin: Hiscores Background Job ───


@router.post("/admin/hiscores/start-job")
async def start_hiscores_job_endpoint(
    current_user: dict = Depends(get_current_user),
    concurrency: int = Query(25, ge=1, le=200),
    only_missing: bool = Query(True),
    start_rank: int = Query(1, ge=1),
):
    """Start a background hiscores refresh job with progress tracking."""
    user = await db.user.find_unique(where={"id": current_user["sub"]})
    if not user or user.privileges < 2:
        raise HTTPException(status_code=403, detail="Admin access required")

    from app.services.player_hiscores import start_hiscores_job
    result = await start_hiscores_job(concurrency=concurrency, only_missing=only_missing, start_rank=start_rank)
    if "error" in result:
        raise HTTPException(status_code=409, detail=result["error"])
    return result


@router.get("/admin/hiscores/job-status")
async def get_hiscores_job_status_endpoint(
    current_user: dict = Depends(get_current_user),
):
    """Get the current hiscores refresh job progress."""
    user = await db.user.find_unique(where={"id": current_user["sub"]})
    if not user or user.privileges < 2:
        raise HTTPException(status_code=403, detail="Admin access required")

    from app.services.player_hiscores import get_hiscores_job_status
    return get_hiscores_job_status()


@router.post("/admin/hiscores/stop-job")
async def stop_hiscores_job_endpoint(
    current_user: dict = Depends(get_current_user),
):
    """Stop the running hiscores refresh job."""
    user = await db.user.find_unique(where={"id": current_user["sub"]})
    if not user or user.privileges < 2:
        raise HTTPException(status_code=403, detail="Admin access required")

    from app.services.player_hiscores import stop_hiscores_job
    result = stop_hiscores_job()
    if "error" in result:
        raise HTTPException(status_code=409, detail=result["error"])
    return result


@router.post("/admin/hiscores/refresh/{rsn_slug:path}")
async def trigger_single_hiscores_refresh(
    rsn_slug: str,
    current_user: dict = Depends(get_current_user),
):
    """Refresh RS3 Hiscores data for a single player. Admin only."""
    user = await db.user.find_unique(where={"id": current_user["sub"]})
    if not user or user.privileges < 2:
        raise HTTPException(status_code=403, detail="Admin access required")

    normalized = _rsn_from_slug(rsn_slug)
    player = await db.rs3player.find_first(
        where={"normalizedRsn": normalized},
    )
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")

    from app.services.player_hiscores import refresh_player_hiscores
    result = await refresh_player_hiscores(player.id, player.rsn)
    return result
