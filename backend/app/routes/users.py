import logging
from datetime import datetime, timezone

import httpx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.core.auth import get_current_user
from app.core.database import db
from app.services.clan_indexer import lookup_clan_for_rsn

logger = logging.getLogger(__name__)

router = APIRouter()

HISCORES_URLS = {
    "RS3": "https://secure.runescape.com/m=hiscore/index_lite.ws?player=",
    "OSRS": "https://secure.runescape.com/m=hiscore_oldschool/index_lite.ws?player=",
}

RUNEMETRICS_PROFILE_URL = "https://apps.runescape.com/runemetrics/profile/profile?user={}&activities=0"


class LinkRsnRequest(BaseModel):
    rsn: str
    gameType: str


async def _fetch_rs3_clan(rsn: str) -> str | None:
    """Attempt to fetch clan name from RuneMetrics for RS3 users. Returns None on any failure."""
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(RUNEMETRICS_PROFILE_URL.format(rsn))
            if resp.status_code != 200:
                return None
            data = resp.json()
            if data.get("error"):
                return None
            clan = data.get("clan")
            if clan and isinstance(clan, str) and clan.strip():
                return clan.strip()
    except Exception:
        logger.info("RuneMetrics clan lookup failed for %s", rsn)
    return None


@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    """Get the current authenticated user's profile."""
    user = await db.user.find_unique(where={"id": current_user["sub"]})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # If user has RSN but no cached clan name, try indexed lookup and cache it
    rsn_clan_name = user.rsnClanName
    if user.rsn and not rsn_clan_name and user.gameType == "RS3":
        rsn_clan_name = await lookup_clan_for_rsn(user.rsn)
        if rsn_clan_name:
            await db.user.update(
                where={"id": user.id},
                data={"rsnClanName": rsn_clan_name},
            )

    # Get clan memberships
    memberships = await db.clanmember.find_many(
        where={"userId": user.id},
        include={"clanRef": True},
    )

    return {
        "id": user.id,
        "discordId": user.discordId,
        "username": user.username,
        "avatar": user.avatar,
        "email": user.email,
        "rsn": user.rsn,
        "gameType": user.gameType,
        "rsnClanName": rsn_clan_name,
        "rsnLinkedAt": user.rsnLinkedAt.isoformat() if user.rsnLinkedAt else None,
        "privileges": user.privileges,
        "roles": user.roles,
        "createdAt": user.createdAt.isoformat(),
        "clans": [
            {
                "clanId": m.clanId,
                "clanName": m.clanRef.name if m.clanRef else None,
                "rsn": m.rsn,
                "clanRole": m.clanRole,
                "gameType": m.clanRef.gameType if m.clanRef else None,
            }
            for m in memberships
        ],
    }


@router.post("/me/link-rsn")
async def link_rsn(body: LinkRsnRequest, current_user: dict = Depends(get_current_user)):
    """Link a RuneScape account to the current user via Hiscores validation."""
    rsn = body.rsn.strip()
    game_type = body.gameType.upper()

    if not rsn or len(rsn) > 12:
        raise HTTPException(status_code=400, detail="RuneScape name must be 1-12 characters")

    if game_type not in HISCORES_URLS:
        raise HTTPException(status_code=400, detail="gameType must be RS3 or OSRS")

    # Validate RSN exists via Jagex Hiscores
    hiscores_url = HISCORES_URLS[game_type] + rsn
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            resp = await client.get(hiscores_url)
        except httpx.RequestError:
            raise HTTPException(status_code=502, detail="Unable to reach Hiscores. Please try again.")

    if resp.status_code != 200:
        raise HTTPException(
            status_code=404,
            detail=f"'{rsn}' was not found on the {game_type} Hiscores. Please check the spelling and game type.",
        )

    # Look up clan from indexed data first, then fall back to RuneMetrics for RS3
    clan_name: str | None = None
    if game_type == "RS3":
        clan_name = await lookup_clan_for_rsn(rsn)
        if not clan_name:
            clan_name = await _fetch_rs3_clan(rsn)

    # Save linked RSN to user
    user = await db.user.update(
        where={"id": current_user["sub"]},
        data={
            "rsn": rsn,
            "gameType": game_type,
            "rsnClanName": clan_name,
            "rsnLinkedAt": datetime.now(timezone.utc),
        },
    )

    return {
        "rsn": user.rsn,
        "gameType": user.gameType,
        "rsnClanName": user.rsnClanName,
        "rsnLinkedAt": user.rsnLinkedAt.isoformat() if user.rsnLinkedAt else None,
    }
