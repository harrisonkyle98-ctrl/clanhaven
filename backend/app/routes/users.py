import logging
from datetime import datetime, timezone

import httpx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.core.auth import get_current_user
from app.core.database import db
from app.services.clan_indexer import fetch_and_index_clan, lookup_clan_for_rsn

logger = logging.getLogger(__name__)

router = APIRouter()

HISCORES_URLS = {
    "RS3": "https://secure.runescape.com/m=hiscore/index_lite.ws?player=",
    "OSRS": "https://secure.runescape.com/m=hiscore_oldschool/index_lite.ws?player=",
}

RS3_HISCORES_HARDCORE = "https://secure.runescape.com/m=hiscore_hardcore_ironman/index_lite.ws?player="
RS3_HISCORES_IRONMAN = "https://secure.runescape.com/m=hiscore_ironman/index_lite.ws?player="

RUNEMETRICS_PROFILE_URL = "https://apps.runescape.com/runemetrics/profile/profile?user={}&activities=0"


class LinkRsnRequest(BaseModel):
    rsn: str
    gameType: str


async def _detect_rs3_account_type(rsn: str) -> str:
    """Detect RS3 account type by checking Hardcore Ironman and Ironman hiscores."""
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(RS3_HISCORES_HARDCORE + rsn)
            if resp.status_code == 200:
                return "hardcore_ironman"
            resp = await client.get(RS3_HISCORES_IRONMAN + rsn)
            if resp.status_code == 200:
                return "ironman"
    except Exception:
        logger.info("RS3 account type detection failed for %s", rsn)
    return "normal"


async def _fetch_rs3_clan(rsn: str) -> str | None:
    """Attempt to fetch clan name from RuneMetrics for RS3 users. Returns None on any failure."""
    try:
        url = RUNEMETRICS_PROFILE_URL.format(rsn)
        logger.info("[clan-discovery] RuneMetrics request for RSN '%s': %s", rsn, url)
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(url)
            logger.info("[clan-discovery] RuneMetrics status=%s for RSN '%s'", resp.status_code, rsn)
            if resp.status_code != 200:
                return None
            data = resp.json()
            if data.get("error"):
                logger.info("[clan-discovery] RuneMetrics error for RSN '%s': %s", rsn, data.get("error"))
                return None
            clan = data.get("clan")
            logger.info("[clan-discovery] RuneMetrics clan field for RSN '%s': %r (present=%s)", rsn, clan, "clan" in data)
            if clan and isinstance(clan, str) and clan.strip():
                return clan.strip()
    except Exception as exc:
        logger.warning("[clan-discovery] RuneMetrics exception for RSN '%s': %s", rsn, exc)
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
        "accountType": user.accountType,
        "rsnClanName": rsn_clan_name,
        "rsnLinkedAt": user.rsnLinkedAt.isoformat() if user.rsnLinkedAt else None,
        "privileges": user.privileges,
        "lastOnline": user.lastOnline.isoformat() if user.lastOnline else None,
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


@router.post("/me/heartbeat")
async def heartbeat(current_user: dict = Depends(get_current_user)):
    """Update the user's last_online timestamp."""
    await db.user.update(
        where={"id": current_user["sub"]},
        data={"lastOnline": datetime.now(timezone.utc)},
    )
    return {"ok": True}


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
    account_type: str | None = None
    if game_type == "RS3":
        logger.info("[clan-discovery] Starting clan discovery for RSN '%s'", rsn)
        clan_name = await lookup_clan_for_rsn(rsn)
        logger.info("[clan-discovery] Indexed lookup result for RSN '%s': %r", rsn, clan_name)
        if not clan_name:
            logger.info("[clan-discovery] Falling back to RuneMetrics for RSN '%s'", rsn)
            clan_name = await _fetch_rs3_clan(rsn)
            logger.info("[clan-discovery] RuneMetrics fallback result for RSN '%s': %r", rsn, clan_name)
        # Auto-index the clan if discovered
        if clan_name:
            logger.info("[clan-discovery] Triggering fetch_and_index_clan('%s') for RSN '%s'", clan_name, rsn)
            try:
                result = await fetch_and_index_clan(clan_name)
                logger.info("[clan-discovery] Indexing result for clan '%s': %s", clan_name, result)
            except Exception as exc:
                logger.warning("[clan-discovery] Indexing failed for clan '%s' RSN '%s': %s", clan_name, rsn, exc)
        else:
            logger.warning("[clan-discovery] No clan discovered for RSN '%s' — both indexed lookup and RuneMetrics returned None", rsn)
        account_type = await _detect_rs3_account_type(rsn)

    # Save linked RSN to user
    user = await db.user.update(
        where={"id": current_user["sub"]},
        data={
            "rsn": rsn,
            "gameType": game_type,
            "accountType": account_type,
            "rsnClanName": clan_name,
            "rsnLinkedAt": datetime.now(timezone.utc),
        },
    )

    return {
        "rsn": user.rsn,
        "gameType": user.gameType,
        "accountType": user.accountType,
        "rsnClanName": user.rsnClanName,
        "rsnLinkedAt": user.rsnLinkedAt.isoformat() if user.rsnLinkedAt else None,
    }
