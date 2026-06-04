"""Admin routes for clan indexing and user management. Internal use only for now."""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.core.auth import get_current_user
from app.core.database import db
from app.services.clan_indexer import fetch_and_index_clan, lookup_clan_for_rsn

router = APIRouter()


async def require_admin(current_user: dict = Depends(get_current_user)) -> dict:
    """Dependency: require privileges=1 (site admin)."""
    user = await db.user.find_unique(where={"id": current_user["sub"]})
    if not user or user.privileges != 1:
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


class IndexClanRequest(BaseModel):
    clanName: str


@router.post("/index-clan")
async def index_clan(body: IndexClanRequest):
    """Fetch and index a clan's member list from RS3 Clan Hiscores."""
    clan_name = body.clanName.strip()
    if not clan_name:
        raise HTTPException(status_code=400, detail="clanName is required")

    result = await fetch_and_index_clan(clan_name)
    if result.get("error"):
        raise HTTPException(status_code=502, detail=result["error"])

    return result


@router.get("/lookup-clan")
async def admin_lookup_clan(rsn: str):
    """Look up which indexed clan an RSN belongs to."""
    if not rsn.strip():
        raise HTTPException(status_code=400, detail="rsn query parameter is required")

    clan_name = await lookup_clan_for_rsn(rsn)
    return {"rsn": rsn, "clan": clan_name}


@router.get("/users")
async def list_users(_admin: dict = Depends(require_admin)):
    """List all registered users. Admin only."""
    users = await db.user.find_many(order={"createdAt": "desc"})
    return [
        {
            "id": u.id,
            "discordId": u.discordId,
            "username": u.username,
            "avatar": u.avatar,
            "rsn": u.rsn,
            "gameType": u.gameType,
            "rsnClanName": u.rsnClanName,
            "rsnLinkedAt": u.rsnLinkedAt.isoformat() if u.rsnLinkedAt else None,
            "privileges": u.privileges,
            "lastOnline": u.lastOnline.isoformat() if u.lastOnline else None,
            "createdAt": u.createdAt.isoformat(),
            "updatedAt": u.updatedAt.isoformat(),
        }
        for u in users
    ]
