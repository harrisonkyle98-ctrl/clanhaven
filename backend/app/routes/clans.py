from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query

from app.core.auth import get_optional_user
from app.core.database import db

router = APIRouter()


@router.get("/discovery")
async def clan_discovery(
    page: int = Query(1, ge=1),
    pageSize: int = Query(24, ge=1, le=100),
    search: Optional[str] = Query(None),
    sort: str = Query("rank"),
):
    """Public paginated clan discovery from indexed RS3 Clan HiScores."""
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
                "lastIndexedAt": c.lastIndexedAt.isoformat() if c.lastIndexedAt else None,
            }
            for c in clans
        ],
        "total": total,
        "page": page,
        "pageSize": pageSize,
        "totalPages": (total + pageSize - 1) // pageSize if total > 0 else 0,
    }


@router.get("/")
async def list_clans(user: dict | None = Depends(get_optional_user)):
    """List all public clans. Authenticated users see their membership status."""
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


@router.get("/{slug}")
async def get_clan(slug: str):
    """Get a clan's public profile by slug."""
    clan = await db.clan.find_unique(where={"slug": slug})
    if not clan:
        raise HTTPException(status_code=404, detail="Clan not found")

    return {
        "id": clan.id,
        "name": clan.name,
        "slug": clan.slug,
        "gameType": clan.gameType,
        "description": clan.description,
        "memberCount": clan.memberCount,
        "isPublic": clan.isPublic,
        "createdAt": clan.createdAt.isoformat(),
    }
