from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query

from app.core.auth import get_current_user, get_optional_user
from app.core.database import db

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

    # Collect all RSNs the user might be known by
    rsns: list[str] = []
    if user.rsn:
        rsns.append(user.rsn.replace("\xa0", " ").strip().lower())
    if user.activeRsn:
        rsns.append(user.activeRsn.replace("\xa0", " ").strip().lower())

    # Also check approved alt accounts
    alts = await db.altaccountrequest.find_many(
        where={"userId": user_id, "status": "approved"},
    )
    for alt in alts:
        rsns.append(alt.rsnLower)

    if not rsns:
        return {"isManager": False, "rank": None, "matchedRsn": None}

    # Find a current membership in the clan for any of the user's RSNs
    membership = await db.indexedclanmember.find_first(
        where={
            "clanId": clan_id,
            "rsnLower": {"in": rsns},
            "isCurrent": True,
        },
    )

    if not membership:
        return {"isManager": False, "rank": None, "matchedRsn": None}

    is_manager = membership.clanRank in MANAGER_RANKS
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

    roster = [
        {
            "id": m.id,
            "rsn": m.rsn,
            "clanRank": m.clanRank,
            "clanXp": m.clanXp,
            "kills": m.kills,
        }
        for m in members
    ]

    # Check authority for the requesting user
    authority = {"isManager": False, "rank": None, "matchedRsn": None}
    if user:
        authority = await _get_user_authority(user["sub"], clan.id)

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
