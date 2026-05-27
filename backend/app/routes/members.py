from fastapi import APIRouter, Depends, HTTPException, Query

from app.core.auth import get_optional_user
from app.core.database import db

router = APIRouter()


@router.get("/{clan_slug}")
async def list_clan_members(
    clan_slug: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    user: dict | None = Depends(get_optional_user),
):
    """List members of a clan with pagination."""
    clan = await db.clan.find_unique(where={"slug": clan_slug})
    if not clan:
        raise HTTPException(status_code=404, detail="Clan not found")

    total = await db.clanmember.count(where={"clanId": clan.id, "active": True})

    members = await db.clanmember.find_many(
        where={"clanId": clan.id, "active": True},
        order={"rsn": "asc"},
        skip=(page - 1) * page_size,
        take=page_size,
    )

    return {
        "clan": {"id": clan.id, "name": clan.name, "slug": clan.slug},
        "members": [
            {
                "id": m.id,
                "rsn": m.rsn,
                "clanRank": m.clanRank,
                "clanRole": m.clanRole,
                "totalXp": m.totalXp,
                "combatLevel": m.combatLevel,
                "joinedAt": m.joinedAt.isoformat() if m.joinedAt else None,
            }
            for m in members
        ],
        "total": total,
        "page": page,
        "pageSize": page_size,
    }
