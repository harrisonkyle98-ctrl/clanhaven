"""Mod panel routes. Accessible by moderators (privilege >= 1) and admins."""

from fastapi import APIRouter, Depends

from app.core.database import db
from app.routes.admin import require_mod

router = APIRouter()


@router.get("/status")
async def mod_status(_mod: dict = Depends(require_mod)):
    """Mod panel status check — confirms the user has moderator access."""
    user = await db.user.find_unique(where={"id": _mod["sub"]})
    role = "Administrator" if user and user.privileges >= 2 else "Moderator"
    return {
        "access": True,
        "role": role,
        "privileges": user.privileges if user else 0,
    }
