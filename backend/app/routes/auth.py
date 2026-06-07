from urllib.parse import urlencode

import httpx
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import RedirectResponse

from app.core.auth import create_access_token
from app.core.config import settings
from app.core.database import db
from app.services.clan_indexer import lookup_clan_for_rsn

router = APIRouter()

DISCORD_API = "https://discord.com/api/v10"
DISCORD_OAUTH_SCOPES = "identify email"


@router.get("/discord")
async def discord_login():
    """Return the Discord OAuth authorization URL."""
    params = {
        "client_id": settings.DISCORD_CLIENT_ID,
        "redirect_uri": settings.DISCORD_REDIRECT_URI,
        "response_type": "code",
        "scope": DISCORD_OAUTH_SCOPES,
    }
    return {"auth_url": f"https://discord.com/api/oauth2/authorize?{urlencode(params)}"}


@router.get("/callback")
async def discord_callback(request: Request, code: str | None = None):
    """Handle Discord OAuth callback."""
    if not code:
        return RedirectResponse(url=f"{settings.FRONTEND_URL}/?error=missing_code", status_code=302)

    # Exchange code for access token
    async with httpx.AsyncClient(timeout=10.0) as client:
        token_resp = await client.post(
            f"{DISCORD_API}/oauth2/token",
            data={
                "client_id": settings.DISCORD_CLIENT_ID,
                "client_secret": settings.DISCORD_CLIENT_SECRET,
                "grant_type": "authorization_code",
                "code": code,
                "redirect_uri": settings.DISCORD_REDIRECT_URI,
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )

        if token_resp.status_code != 200:
            return RedirectResponse(url=f"{settings.FRONTEND_URL}/?error=token_exchange_failed", status_code=302)

        token_data = token_resp.json()
        discord_token = token_data["access_token"]

        # Fetch Discord user info
        user_resp = await client.get(
            f"{DISCORD_API}/users/@me",
            headers={"Authorization": f"Bearer {discord_token}"},
        )

        if user_resp.status_code != 200:
            return RedirectResponse(url=f"{settings.FRONTEND_URL}/?error=user_fetch_failed", status_code=302)

        discord_user = user_resp.json()

    discord_id = discord_user["id"]
    username = discord_user.get("global_name") or discord_user["username"]
    avatar = discord_user.get("avatar")
    email = discord_user.get("email")

    # Extract IP and user agent for login tracking
    ip_address = (
        request.headers.get("fly-client-ip")
        or request.headers.get("x-forwarded-for", "").split(",")[0].strip()
        or (request.client.host if request.client else "unknown")
    )
    user_agent = request.headers.get("user-agent", "")

    # Check IP ban before allowing login
    ip_ban = await db.ipban.find_first(where={"ipAddress": ip_address, "active": True})
    if ip_ban:
        return RedirectResponse(
            url=f"{settings.FRONTEND_URL}/?error=ip_banned",
            status_code=302,
        )

    # Upsert user in database
    user = await db.user.upsert(
        where={"discordId": discord_id},
        data={
            "create": {
                "discordId": discord_id,
                "username": username,
                "avatar": avatar,
                "email": email,
            },
            "update": {
                "username": username,
                "avatar": avatar,
                "email": email,
            },
        },
    )

    # Check if user is banned
    if user.isBanned:
        return RedirectResponse(
            url=f"{settings.FRONTEND_URL}/?error=account_banned",
            status_code=302,
        )

    # Record login history
    try:
        await db.userloginhistory.create(
            data={
                "userId": user.id,
                "ipAddress": ip_address,
                "userAgent": user_agent[:500],
            }
        )
    except Exception:
        pass

    # Issue JWT
    jwt_token = create_access_token({"sub": user.id, "discord_id": discord_id, "username": username})

    return RedirectResponse(
        url=f"{settings.FRONTEND_URL}/?token={jwt_token}",
        status_code=302,
    )


@router.get("/me")
async def get_current_user_info(request: Request):
    """Get info about the currently authenticated user. Requires Authorization header."""
    from app.core.auth import get_current_user

    token_data = await get_current_user(
        credentials=await _extract_credentials(request)
    )

    user = await db.user.find_unique(where={"id": token_data["sub"]})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.isBanned:
        raise HTTPException(status_code=403, detail="Your account has been banned")

    # If user has RSN but no cached clan name, try indexed lookup and cache it
    rsn_clan_name = user.rsnClanName
    if user.rsn and not rsn_clan_name and user.gameType == "RS3":
        rsn_clan_name = await lookup_clan_for_rsn(user.rsn)
        if rsn_clan_name:
            await db.user.update(
                where={"id": user.id},
                data={"rsnClanName": rsn_clan_name},
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
        "lastOnline": user.lastOnline.isoformat() if user.lastOnline else None,
        "createdAt": user.createdAt.isoformat(),
    }


async def _extract_credentials(request: Request):
    """Extract bearer credentials from request."""
    from fastapi.security import HTTPAuthorizationCredentials

    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        return HTTPAuthorizationCredentials(scheme="Bearer", credentials=auth_header[7:])
    return None
