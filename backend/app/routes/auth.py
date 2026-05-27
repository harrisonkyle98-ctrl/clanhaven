from urllib.parse import urlencode

import httpx
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import RedirectResponse

from app.core.auth import create_access_token
from app.core.config import settings
from app.core.database import db

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


@router.get("/callback/discord")
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

    # Upsert user in database
    user = await db.user.upsert(
        where={"discordId": discord_id},
        create={
            "discordId": discord_id,
            "username": username,
            "avatar": avatar,
            "email": email,
        },
        update={
            "username": username,
            "avatar": avatar,
            "email": email,
        },
    )

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

    return {
        "id": user.id,
        "discordId": user.discordId,
        "username": user.username,
        "avatar": user.avatar,
        "email": user.email,
        "roles": user.roles,
        "createdAt": user.createdAt.isoformat(),
    }


async def _extract_credentials(request: Request):
    """Extract bearer credentials from request."""
    from fastapi.security import HTTPAuthorizationCredentials

    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        return HTTPAuthorizationCredentials(scheme="Bearer", credentials=auth_header[7:])
    return None
