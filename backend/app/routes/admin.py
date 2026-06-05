"""Admin routes for clan indexing, user management, and news. Internal use only for now."""

from datetime import datetime, timezone
from typing import Optional
from uuid import uuid4

import httpx
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from pydantic import BaseModel

from app.core.auth import get_current_user
from app.core.config import settings
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
            "accountType": u.accountType,
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
        "category": p.category,
        "bannerUrl": p.bannerUrl,
        "thumbnailUrl": p.thumbnailUrl,
        "published": p.published,
        "authorId": p.authorId,
        "publishedAt": p.publishedAt.isoformat() if p.publishedAt else None,
        "createdAt": p.createdAt.isoformat(),
        "updatedAt": p.updatedAt.isoformat(),
    }


VALID_CATEGORIES = {"News", "Update", "Maintenance", "Event", "Competition"}


class NewsPostCreate(BaseModel):
    title: str
    content: str
    excerpt: Optional[str] = None
    category: str = "Update"
    bannerUrl: Optional[str] = None
    thumbnailUrl: Optional[str] = None
    published: bool = False


class NewsPostUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    excerpt: Optional[str] = None
    category: Optional[str] = None
    bannerUrl: Optional[str] = None
    thumbnailUrl: Optional[str] = None
    published: Optional[bool] = None


@router.get("/news")
async def list_news_admin(_admin: dict = Depends(require_admin)):
    """List all news posts (admin view, includes unpublished)."""
    posts = await db.newspost.find_many(order={"createdAt": "desc"})
    return [_serialize_post(p) for p in posts]


@router.post("/news")
async def create_news(body: NewsPostCreate, admin: dict = Depends(require_admin)):
    """Create a new news post."""
    if body.category not in VALID_CATEGORIES:
        raise HTTPException(status_code=400, detail=f"Invalid category. Must be one of: {', '.join(sorted(VALID_CATEGORIES))}")
    data: dict = {
        "title": body.title.strip(),
        "content": body.content.strip(),
        "excerpt": body.excerpt.strip() if body.excerpt else None,
        "category": body.category,
        "bannerUrl": body.bannerUrl,
        "thumbnailUrl": body.thumbnailUrl,
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
    if body.category is not None:
        if body.category not in VALID_CATEGORIES:
            raise HTTPException(status_code=400, detail=f"Invalid category. Must be one of: {', '.join(sorted(VALID_CATEGORIES))}")
        data["category"] = body.category
    if body.bannerUrl is not None:
        data["bannerUrl"] = body.bannerUrl or None
    if body.thumbnailUrl is not None:
        data["thumbnailUrl"] = body.thumbnailUrl or None
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


ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_SIZE = 5 * 1024 * 1024  # 5 MB
THUMB_SIZE = 256


async def _upload_to_supabase(path: str, content: bytes, content_type: str) -> str:
    """Upload bytes to Supabase Storage and return the public URL."""
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{settings.SUPABASE_URL}/storage/v1/object/news-images/{path}",
            headers={
                "Authorization": f"Bearer {settings.SUPABASE_SERVICE_KEY}",
                "apikey": settings.SUPABASE_SERVICE_KEY,
                "Content-Type": content_type,
            },
            content=content,
        )
        if resp.status_code not in (200, 201):
            raise HTTPException(status_code=502, detail=f"Storage upload failed: {resp.text}")
    return f"{settings.SUPABASE_URL}/storage/v1/object/public/news-images/{path}"


def _make_thumbnail(image_bytes: bytes) -> bytes:
    """Create a square center-cropped thumbnail from image bytes."""
    import io

    from PIL import Image

    img = Image.open(io.BytesIO(image_bytes))
    img = img.convert("RGB")
    w, h = img.size
    side = min(w, h)
    left = (w - side) // 2
    top = (h - side) // 2
    cropped = img.crop((left, top, left + side, top + side))
    cropped = cropped.resize((THUMB_SIZE, THUMB_SIZE), Image.LANCZOS)
    buf = io.BytesIO()
    cropped.save(buf, format="JPEG", quality=85)
    return buf.getvalue()


@router.post("/upload-image")
async def upload_image(
    file: UploadFile = File(...),
    _admin: dict = Depends(require_admin),
):
    """Upload a banner image + auto-generated thumbnail to Supabase Storage."""
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="Only JPEG, PNG, WebP and GIF images are allowed")

    contents = await file.read()
    if len(contents) > MAX_SIZE:
        raise HTTPException(status_code=400, detail="Image must be under 5 MB")

    uid = uuid4().hex
    ext = file.filename.rsplit(".", 1)[-1] if file.filename and "." in file.filename else "jpg"
    banner_path = f"news/{uid}.{ext}"
    thumb_path = f"news/{uid}_thumb.jpg"

    banner_url = await _upload_to_supabase(banner_path, contents, file.content_type or "application/octet-stream")
    thumb_bytes = _make_thumbnail(contents)
    thumbnail_url = await _upload_to_supabase(thumb_path, thumb_bytes, "image/jpeg")

    return {"bannerUrl": banner_url, "thumbnailUrl": thumbnail_url}
