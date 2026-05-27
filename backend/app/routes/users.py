from fastapi import APIRouter, Depends

from app.core.auth import get_current_user
from app.core.database import db

router = APIRouter()


@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    """Get the current authenticated user's profile."""
    user = await db.user.find_unique(where={"id": current_user["sub"]})
    if not user:
        return {"error": "User not found"}

    # Get clan memberships
    memberships = await db.clanmember.find_many(
        where={"userId": user.id},
        include={"clan": True},
    )

    return {
        "id": user.id,
        "discordId": user.discordId,
        "username": user.username,
        "avatar": user.avatar,
        "email": user.email,
        "roles": user.roles,
        "createdAt": user.createdAt.isoformat(),
        "clans": [
            {
                "clanId": m.clanId,
                "clanName": m.clan.name if m.clan else None,
                "rsn": m.rsn,
                "clanRole": m.clanRole,
                "gameType": m.clan.gameType if m.clan else None,
            }
            for m in memberships
        ],
    }
