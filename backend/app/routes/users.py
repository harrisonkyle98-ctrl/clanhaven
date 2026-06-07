import json
import logging
from datetime import datetime, timezone
from typing import Optional

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

PLAYER_DETAILS_URL = "https://secure.runescape.com/m=website-data/playerDetails.ws"
PLAYER_DETAILS_CALLBACK = "jQuery111111111111111_1111111111"


class LinkRsnRequest(BaseModel):
    rsn: str
    gameType: str
    clanName: Optional[str] = None


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
    """Fetch clan name via playerDetails.ws JSONP endpoint. Returns None if clan not found."""
    try:
        params = {
            "names": json.dumps([rsn]),
            "callback": PLAYER_DETAILS_CALLBACK,
        }
        logger.info("[clan-discovery] playerDetails.ws request for RSN '%s'", rsn)
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(PLAYER_DETAILS_URL, params=params)
            logger.info("[clan-discovery] playerDetails.ws status=%s for RSN '%s'", resp.status_code, rsn)
            if resp.status_code != 200:
                return None
            body = resp.text
            json_str = body[body.index("(") + 1 : body.rindex(")")]
            data = json.loads(json_str)
            if not data:
                logger.info("[clan-discovery] playerDetails.ws returned empty array for RSN '%s'", rsn)
                return None
            player = data[0]
            clan = player.get("clan")
            logger.info("[clan-discovery] playerDetails.ws clan for RSN '%s': %r", rsn, clan)
            if clan and isinstance(clan, str) and clan.strip():
                return clan.strip()
    except Exception as exc:
        logger.warning("[clan-discovery] playerDetails.ws exception for RSN '%s': %s", rsn, exc)
    return None


@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    """Get the current authenticated user's profile."""
    user = await db.user.find_unique(where={"id": current_user["sub"]})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # If user has RSN but no cached clan name, try playerDetails.ws then indexed lookup
    rsn_clan_name = user.rsnClanName
    if user.rsn and not rsn_clan_name and user.gameType == "RS3":
        rsn_clan_name = await _fetch_rs3_clan(user.rsn)
        if not rsn_clan_name:
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

    # Determine display RSN (active identity)
    display_rsn = user.activeRsn if user.activeRsn else user.rsn

    # If active identity is an alt, fetch alt-specific RS data
    active_game_type = user.gameType
    active_account_type = user.accountType
    active_clan_name = rsn_clan_name
    if user.activeRsn:
        alt_req = await db.altaccountrequest.find_first(
            where={
                "userId": user.id,
                "rsnLower": user.activeRsn.strip().lower(),
                "status": "approved",
            },
        )
        if alt_req:
            active_game_type = alt_req.gameType
            active_account_type = alt_req.accountType
            active_clan_name = alt_req.clanName
            # If no stored clan, try live lookup and cache it
            if not active_clan_name and alt_req.gameType == "RS3":
                active_clan_name = await _fetch_rs3_clan(alt_req.rsn)
                if not active_clan_name:
                    active_clan_name = await lookup_clan_for_rsn(alt_req.rsn)
                if active_clan_name:
                    await db.altaccountrequest.update(
                        where={"id": alt_req.id},
                        data={"clanName": active_clan_name},
                    )

    return {
        "id": user.id,
        "discordId": user.discordId,
        "username": user.username,
        "avatar": user.avatar,
        "email": user.email,
        "rsn": user.rsn,
        "activeRsn": user.activeRsn,
        "displayRsn": display_rsn,
        "gameType": user.gameType,
        "accountType": user.accountType,
        "rsnClanName": rsn_clan_name,
        "activeGameType": active_game_type,
        "activeAccountType": active_account_type,
        "activeClanName": active_clan_name,
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

    # Validate RSN exists via RuneScape Hiscores
    hiscores_url = HISCORES_URLS[game_type] + rsn
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            resp = await client.get(hiscores_url)
        except httpx.RequestError:
            raise HTTPException(status_code=502, detail="Unable to reach RuneScape Hiscores. Please try again.")

    if resp.status_code != 200:
        raise HTTPException(
            status_code=404,
            detail=f"'{rsn}' was not found on the {game_type} Hiscores. Please check the spelling and game type.",
        )

    # Determine clan: playerDetails.ws first, then user-provided fallback, then indexed lookup
    clan_name: str | None = None
    account_type: str | None = None
    user_provided_clan = body.clanName.strip() if body.clanName else None

    if game_type == "RS3":
        logger.info("[clan-discovery] Starting clan discovery for RSN '%s' (user_provided=%r)", rsn, user_provided_clan)

        # Step 1: Try playerDetails.ws (automatic, no user input needed)
        clan_name = await _fetch_rs3_clan(rsn)
        logger.info("[clan-discovery] playerDetails.ws result for RSN '%s': %r", rsn, clan_name)

        # Step 2: Fall back to user-provided clan name
        if not clan_name and user_provided_clan:
            logger.info("[clan-discovery] Using user-provided clan '%s' for RSN '%s'", user_provided_clan, rsn)
            try:
                index_result = await fetch_and_index_clan(user_provided_clan)
                if index_result.get("error"):
                    logger.warning("[clan-discovery] Clan '%s' not found on Clan Hiscores: %s", user_provided_clan, index_result["error"])
                else:
                    verified_clan = await lookup_clan_for_rsn(rsn)
                    if verified_clan:
                        clan_name = verified_clan
                        logger.info("[clan-discovery] Verified RSN '%s' is in clan '%s'", rsn, clan_name)
                    else:
                        logger.warning("[clan-discovery] RSN '%s' not found in clan '%s' member list", rsn, user_provided_clan)
            except Exception as exc:
                logger.warning("[clan-discovery] Failed to verify clan '%s' for RSN '%s': %s", user_provided_clan, rsn, exc)

        # Step 3: Fall back to indexed lookup (if clan was previously indexed)
        if not clan_name:
            indexed_clan = await lookup_clan_for_rsn(rsn)
            if indexed_clan:
                clan_name = indexed_clan
                logger.info("[clan-discovery] Indexed lookup found RSN '%s' in clan '%s'", rsn, clan_name)

        # Index the discovered clan if we found one
        if clan_name:
            try:
                await fetch_and_index_clan(clan_name)
                logger.info("[clan-discovery] Indexed clan '%s' for RSN '%s'", clan_name, rsn)
            except Exception as exc:
                logger.warning("[clan-discovery] Indexing failed for clan '%s' RSN '%s': %s", clan_name, rsn, exc)
        else:
            logger.info("[clan-discovery] No clan resolved for RSN '%s'", rsn)

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


@router.post("/me/unlink-rsn")
async def unlink_own_rsn(current_user: dict = Depends(get_current_user)):
    """Allow a logged-in user to unlink their own RSN."""
    await db.user.update(
        where={"id": current_user["sub"]},
        data={
            "rsn": None,
            "gameType": None,
            "accountType": None,
            "rsnClanName": None,
            "rsnLinkedAt": None,
            "activeRsn": None,
        },
    )
    return {"success": True}


# ─── Alt Account Management ───


def _normalize_rsn(rsn: str) -> str:
    """Normalize RSN for canonical comparison (lowercase, strip spaces)."""
    return rsn.strip().lower().replace(" ", " ")


class AltRequestBody(BaseModel):
    rsn: str
    gameType: str


@router.get("/me/alt-accounts")
async def get_my_alt_accounts(current_user: dict = Depends(get_current_user)):
    """Get the current user's alt account requests (all statuses)."""
    requests = await db.altaccountrequest.find_many(
        where={"userId": current_user["sub"]},
        order={"createdAt": "desc"},
    )
    return [
        {
            "id": r.id,
            "rsn": r.rsn,
            "gameType": r.gameType,
            "accountType": r.accountType,
            "clanName": r.clanName,
            "status": r.status,
            "reviewNote": r.reviewNote,
            "createdAt": r.createdAt.isoformat(),
            "reviewedAt": r.reviewedAt.isoformat() if r.reviewedAt else None,
        }
        for r in requests
    ]


@router.post("/me/alt-accounts")
async def request_alt_account(body: AltRequestBody, current_user: dict = Depends(get_current_user)):
    """Submit an alt account link request."""
    rsn = body.rsn.strip()
    game_type = body.gameType.upper()

    if not rsn or len(rsn) > 12:
        raise HTTPException(status_code=400, detail="RSN must be 1-12 characters")
    if game_type not in ("RS3", "OSRS"):
        raise HTTPException(status_code=400, detail="gameType must be RS3 or OSRS")

    rsn_lower = _normalize_rsn(rsn)

    # Check if RSN is already someone's main account (case-insensitive)
    all_users_with_rsn = await db.user.find_many(
        where={"rsn": {"not": None}},
    )
    for u in all_users_with_rsn:
        if u.rsn and _normalize_rsn(u.rsn) == rsn_lower:
            if u.id == current_user["sub"]:
                raise HTTPException(status_code=400, detail="This is already your main account")
            raise HTTPException(status_code=400, detail="This RSN is already linked to another user's account")

    # Check if RSN is already an approved alt for another user
    existing_alt = await db.altaccountrequest.find_first(
        where={
            "rsnLower": rsn_lower,
            "status": "approved",
            "userId": {"not": current_user["sub"]},
        },
    )
    if existing_alt:
        raise HTTPException(status_code=400, detail="This RSN is already linked as another user's alt account")

    # Check if user already has a pending request for this RSN
    existing_pending = await db.altaccountrequest.find_first(
        where={
            "userId": current_user["sub"],
            "rsnLower": rsn_lower,
            "status": "pending",
        },
    )
    if existing_pending:
        raise HTTPException(status_code=400, detail="You already have a pending request for this RSN")

    # Check if user already has an approved alt for this RSN
    existing_approved = await db.altaccountrequest.find_first(
        where={
            "userId": current_user["sub"],
            "rsnLower": rsn_lower,
            "status": "approved",
        },
    )
    if existing_approved:
        raise HTTPException(status_code=400, detail="This RSN is already an approved alt on your account")

    # Validate RSN exists on hiscores
    hiscores_url = HISCORES_URLS.get(game_type, HISCORES_URLS["RS3"]) + rsn
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            resp = await client.get(hiscores_url)
        except httpx.RequestError:
            raise HTTPException(status_code=502, detail="Unable to reach RuneScape Hiscores")
    if resp.status_code != 200:
        raise HTTPException(status_code=404, detail=f"'{rsn}' was not found on {game_type} Hiscores")

    # Detect account type for RS3
    account_type = None
    clan_name = None
    if game_type == "RS3":
        account_type = await _detect_rs3_account_type(rsn)
        clan_name = await _fetch_rs3_clan(rsn)
        if not clan_name:
            clan_name = await lookup_clan_for_rsn(rsn)

    request = await db.altaccountrequest.create(
        data={
            "userId": current_user["sub"],
            "rsn": rsn,
            "rsnLower": rsn_lower,
            "gameType": game_type,
            "accountType": account_type,
            "clanName": clan_name,
            "status": "pending",
        }
    )
    return {
        "id": request.id,
        "rsn": request.rsn,
        "gameType": request.gameType,
        "accountType": request.accountType,
        "clanName": request.clanName,
        "status": request.status,
        "createdAt": request.createdAt.isoformat(),
    }


class SwitchIdentityBody(BaseModel):
    rsn: Optional[str] = None


@router.post("/me/active-identity")
async def switch_active_identity(body: SwitchIdentityBody, current_user: dict = Depends(get_current_user)):
    """Switch active site identity between main account and approved alts."""
    user = await db.user.find_unique(where={"id": current_user["sub"]})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if body.rsn is None:
        # Switch back to main account
        await db.user.update(
            where={"id": current_user["sub"]},
            data={"activeRsn": None},
        )
        return {"success": True, "activeRsn": None}

    target_rsn = body.rsn.strip()
    target_lower = _normalize_rsn(target_rsn)

    # Check if it's the main account
    if user.rsn and _normalize_rsn(user.rsn) == target_lower:
        await db.user.update(
            where={"id": current_user["sub"]},
            data={"activeRsn": None},
        )
        return {"success": True, "activeRsn": None}

    # Check if it's an approved alt
    approved_alt = await db.altaccountrequest.find_first(
        where={
            "userId": current_user["sub"],
            "rsnLower": target_lower,
            "status": "approved",
        },
    )
    if not approved_alt:
        raise HTTPException(status_code=400, detail="This RSN is not an approved alt on your account")

    await db.user.update(
        where={"id": current_user["sub"]},
        data={"activeRsn": approved_alt.rsn},
    )
    return {"success": True, "activeRsn": approved_alt.rsn}
