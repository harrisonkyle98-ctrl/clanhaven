import logging
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query

from app.core.auth import get_current_user, get_optional_user
from app.core.database import db

logger = logging.getLogger(__name__)

router = APIRouter()

# Rank hierarchy — ranks that grant clan management authority
MANAGER_RANKS = {"Owner", "Deputy Owner"}

# Rank sort order for roster display
RANK_ORDER = {
    "Owner": 0,
    "Deputy Owner": 1,
    "Overseer": 2,
    "Coordinator": 3,
    "Organiser": 4,
    "Admin": 5,
    "General": 6,
    "Captain": 7,
    "Lieutenant": 8,
    "Sergeant": 9,
    "Corporal": 10,
    "Recruit": 11,
}


def _rank_sort_key(rank: str | None) -> int:
    """Return sort order for a clan rank. Unknown ranks sort last."""
    if rank is None:
        return 99
    return RANK_ORDER.get(rank, 98)


async def _get_user_authority(user_id: str, clan_id: str) -> dict:
    """Check if a platform user has management authority over a clan.

    Authority is determined by matching the user's linked RSN(s) against
    the clan's indexed roster. Owner / Deputy Owner = manager.
    """
    user = await db.user.find_unique(where={"id": user_id})
    if not user:
        return {"isManager": False, "rank": None, "matchedRsn": None}

    # Use only the active identity's RSN — not all RSNs at once
    active_rsn: str | None = None
    if user.activeRsn:
        active_rsn = user.activeRsn.replace("\xa0", " ").strip().lower()
    elif user.rsn:
        active_rsn = user.rsn.replace("\xa0", " ").strip().lower()

    if not active_rsn:
        return {"isManager": False, "rank": None, "matchedRsn": None}

    membership = await db.indexedclanmember.find_first(
        where={
            "clanId": clan_id,
            "rsnLower": active_rsn,
            "isCurrent": True,
        },
    )

    if not membership:
        return {"isManager": False, "rank": None, "matchedRsn": None}

    rank_normalized = (membership.clanRank or "").strip().lower()
    is_manager = rank_normalized in {r.lower() for r in MANAGER_RANKS}
    return {
        "isManager": is_manager,
        "rank": membership.clanRank,
        "matchedRsn": membership.rsn,
    }


# ─── Clan Discovery (directory listing) ───


@router.get("/discovery")
async def clan_discovery(
    page: int = Query(1, ge=1),
    pageSize: int = Query(24, ge=1, le=100),
    search: Optional[str] = Query(None),
    sort: str = Query("rank"),
):
    """Public paginated clan directory from indexed RS3 Clan HiScores."""
    where: dict = {}
    if search and search.strip():
        where["nameLower"] = {"contains": search.strip().lower()}

    order: dict
    if sort == "members":
        order = {"memberCount": "desc"}
    elif sort == "xp":
        order = {"totalXp": "desc"}
    elif sort == "name":
        order = {"nameLower": "asc"}
    elif sort == "recent":
        order = {"lastIndexedAt": "desc"}
    else:
        order = {"rank": "asc"}

    total = await db.indexedclan.count(where=where)

    clans = await db.indexedclan.find_many(
        where=where,
        order=order,
        skip=(page - 1) * pageSize,
        take=pageSize,
    )

    return {
        "clans": [
            {
                "id": c.id,
                "name": c.name,
                "slug": c.slug,
                "gameType": c.gameType,
                "memberCount": c.memberCount,
                "rank": c.rank,
                "totalXp": c.totalXp,
                "motifUrl": c.motifUrl,
                "primaryColor": c.primaryColor,
                "secondaryColor": c.secondaryColor,
                "accentColor": c.accentColor,
                "source": c.source,
                "isVerified": c.isVerified,
                "lastIndexedAt": c.lastIndexedAt.isoformat() if c.lastIndexedAt else None,
            }
            for c in clans
        ],
        "total": total,
        "page": page,
        "pageSize": pageSize,
        "totalPages": (total + pageSize - 1) // pageSize if total > 0 else 0,
    }


# ─── Clan Page (public profile + roster + authority) ───


@router.get("/page/{slug}")
async def get_clan_page(
    slug: str,
    user: dict | None = Depends(get_optional_user),
):
    """Get a clan's full page data by slug. Includes roster and authority info."""
    clan = await db.indexedclan.find_unique(where={"slug": slug})
    if not clan:
        raise HTTPException(status_code=404, detail="Clan not found")

    # Fetch current members sorted by rank hierarchy
    members = await db.indexedclanmember.find_many(
        where={"clanId": clan.id, "isCurrent": True},
    )
    members.sort(key=lambda m: (_rank_sort_key(m.clanRank), (m.rsn or "").lower()))

    # Get player account types for ironman icons
    player_ids = [m.playerId for m in members if m.playerId]
    player_types: dict[str, str] = {}
    if player_ids:
        players = await db.rs3player.find_many(
            where={"id": {"in": player_ids}},
        )
        player_types = {p.id: p.accountType for p in players if p.accountType and p.accountType != "normal"}

    roster = [
        {
            "id": m.id,
            "rsn": m.rsn,
            "clanRank": m.clanRank,
            "clanXp": m.clanXp,
            "kills": m.kills,
            "accountType": player_types.get(m.playerId, None) if m.playerId else None,
        }
        for m in members
    ]

    # Check authority for the requesting user
    authority = {"isManager": False, "rank": None, "matchedRsn": None}
    if user:
        logger.warning("[clan-page] Authenticated user sub=%s requesting slug=%s clan_id=%s", user.get("sub"), slug, clan.id)
        authority = await _get_user_authority(user["sub"], clan.id)
    else:
        logger.warning("[clan-page] No auth token for slug=%s", slug)

    return {
        "clan": {
            "id": clan.id,
            "name": clan.name,
            "slug": clan.slug,
            "gameType": clan.gameType,
            "memberCount": clan.memberCount,
            "rank": clan.rank,
            "totalXp": clan.totalXp,
            "motifUrl": clan.motifUrl,
            "primaryColor": clan.primaryColor,
            "secondaryColor": clan.secondaryColor,
            "accentColor": clan.accentColor,
            "isVerified": clan.isVerified,
            "verifiedAt": clan.verifiedAt.isoformat() if clan.verifiedAt else None,
            "hasPublishedSite": clan.hasPublishedSite,
            "lastIndexedAt": clan.lastIndexedAt.isoformat() if clan.lastIndexedAt else None,
            "createdAt": clan.createdAt.isoformat(),
        },
        "roster": roster,
        "authority": authority,
    }


# ─── Clan Verification ───


@router.post("/page/{slug}/verify")
async def verify_clan(
    slug: str,
    current_user: dict = Depends(get_current_user),
):
    """Verify a clan. Only Owner or Deputy Owner can verify."""
    clan = await db.indexedclan.find_unique(where={"slug": slug})
    if not clan:
        raise HTTPException(status_code=404, detail="Clan not found")

    if clan.isVerified:
        raise HTTPException(status_code=400, detail="Clan is already verified")

    authority = await _get_user_authority(current_user["sub"], clan.id)
    if not authority["isManager"]:
        raise HTTPException(
            status_code=403,
            detail="Only clan Owner or Deputy Owner can verify",
        )

    await db.indexedclan.update(
        where={"id": clan.id},
        data={
            "isVerified": True,
            "verifiedAt": datetime.now(timezone.utc),
            "verifiedByUserId": current_user["sub"],
        },
    )

    return {"status": "verified", "clanId": clan.id, "verifiedBy": authority["matchedRsn"]}


# ─── Legacy multi-tenant clan endpoints ───


@router.get("/")
async def list_clans(user: dict | None = Depends(get_optional_user)):
    """List all public clans."""
    clans = await db.clan.find_many(
        where={"isPublic": True},
        order={"name": "asc"},
    )

    result = []
    for clan in clans:
        entry = {
            "id": clan.id,
            "name": clan.name,
            "slug": clan.slug,
            "gameType": clan.gameType,
            "description": clan.description,
            "memberCount": clan.memberCount,
        }
        result.append(entry)

    return {"clans": result}
