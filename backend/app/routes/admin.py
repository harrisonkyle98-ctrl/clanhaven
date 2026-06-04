"""Admin routes for clan indexing, user management, and news. Internal use only for now."""

from datetime import datetime, timezone
from typing import Optional

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


# ─── News CRUD ───


def _serialize_post(p):
    return {
        "id": p.id,
        "title": p.title,
        "content": p.content,
        "excerpt": p.excerpt,
        "published": p.published,
        "authorId": p.authorId,
        "publishedAt": p.publishedAt.isoformat() if p.publishedAt else None,
        "createdAt": p.createdAt.isoformat(),
        "updatedAt": p.updatedAt.isoformat(),
    }


class NewsPostCreate(BaseModel):
    title: str
    content: str
    excerpt: Optional[str] = None
    published: bool = False


class NewsPostUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    excerpt: Optional[str] = None
    published: Optional[bool] = None


@router.get("/news")
async def list_news_admin(_admin: dict = Depends(require_admin)):
    """List all news posts (admin view, includes unpublished)."""
    posts = await db.newspost.find_many(order={"createdAt": "desc"})
    return [_serialize_post(p) for p in posts]


@router.post("/news")
async def create_news(body: NewsPostCreate, admin: dict = Depends(require_admin)):
    """Create a new news post."""
    data: dict = {
        "title": body.title.strip(),
        "content": body.content.strip(),
        "excerpt": body.excerpt.strip() if body.excerpt else None,
        "published": body.published,
        "authorId": admin["sub"],
    }
    if body.published:
        data["publishedAt"] = datetime.now(timezone.utc)
    post = await db.newspost.create(data=data)
    return _serialize_post(post)


@router.put("/news/{post_id}")
async def update_news(post_id: str, body: NewsPostUpdate, _admin: dict = Depends(require_admin)):
    """Update an existing news post."""
    existing = await db.newspost.find_unique(where={"id": post_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Post not found")

    data: dict = {}
    if body.title is not None:
        data["title"] = body.title.strip()
    if body.content is not None:
        data["content"] = body.content.strip()
    if body.excerpt is not None:
        data["excerpt"] = body.excerpt.strip() if body.excerpt else None
    if body.published is not None:
        data["published"] = body.published
        if body.published and not existing.publishedAt:
            data["publishedAt"] = datetime.now(timezone.utc)

    if not data:
        return _serialize_post(existing)

    post = await db.newspost.update(where={"id": post_id}, data=data)
    return _serialize_post(post)


@router.delete("/news/{post_id}")
async def delete_news(post_id: str, _admin: dict = Depends(require_admin)):
    """Delete a news post."""
    existing = await db.newspost.find_unique(where={"id": post_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Post not found")
    await db.newspost.delete(where={"id": post_id})
    return {"ok": True}
