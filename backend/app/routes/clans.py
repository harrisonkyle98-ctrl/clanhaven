from fastapi import APIRouter, Depends, HTTPException

from app.core.auth import get_optional_user
from app.core.database import db

router = APIRouter()


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
