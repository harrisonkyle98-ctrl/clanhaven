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
from app.services.clan_hiscores_crawler import run_seed_job

# ─── Moderation request models ───

class BanUserRequest(BaseModel):
    reason: str = ""

class IpBanRequest(BaseModel):
    ipAddress: str
    reason: str = ""

router = APIRouter()


async def require_admin(current_user: dict = Depends(get_current_user)) -> dict:
    """Dependency: require privileges >= 2 (site admin)."""
    user = await db.user.find_unique(where={"id": current_user["sub"]})
    if not user or user.privileges < 2:
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


async def require_mod(current_user: dict = Depends(get_current_user)) -> dict:
    """Dependency: require privileges >= 1 (moderator or admin)."""
    user = await db.user.find_unique(where={"id": current_user["sub"]})
    if not user or user.privileges < 1:
        raise HTTPException(status_code=403, detail="Moderator access required")
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


class SeedClansRequest(BaseModel):
    startPage: int = 1
    pageCount: int = 5


@router.post("/seed-clans")
async def admin_seed_clans(
    body: SeedClansRequest,
    _admin: dict = Depends(require_admin),
):
    """Start a background clan discovery seed job. Admin only."""
    if body.pageCount > 50:
        raise HTTPException(status_code=400, detail="pageCount cannot exceed 50 per batch")

    # Check for already running jobs
    running = await db.seedjob.find_first(where={"status": "running"})
    if running:
        raise HTTPException(status_code=409, detail="A seed job is already running")

    import asyncio

    job = await db.seedjob.create(
        data={
            "status": "pending",
            "startPage": body.startPage,
            "pageCount": body.pageCount,
            "createdByUserId": _admin["sub"],
        }
    )

    # Fire off background task
    asyncio.create_task(run_seed_job(job.id))

    return {"jobId": job.id, "status": "pending"}


@router.get("/seed-jobs/latest")
async def admin_get_latest_seed_job(
    _admin: dict = Depends(require_admin),
):
    """Get the most recent seed job status."""
    job = await db.seedjob.find_first(order={"createdAt": "desc"})
    if not job:
        return {"job": None}
    return {
        "job": {
            "id": job.id,
            "status": job.status,
            "startPage": job.startPage,
            "pageCount": job.pageCount,
            "pagesProcessed": job.pagesProcessed,
            "clansDiscovered": job.clansDiscovered,
            "clansIndexed": job.clansIndexed,
            "clansFailed": job.clansFailed,
            "currentPage": job.currentPage,
            "currentClan": job.currentClan,
            "lastError": job.lastError,
            "startedAt": job.startedAt.isoformat() if job.startedAt else None,
            "completedAt": job.completedAt.isoformat() if job.completedAt else None,
            "createdAt": job.createdAt.isoformat(),
        }
    }


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
            "isBanned": u.isBanned,
            "bannedAt": u.bannedAt.isoformat() if u.bannedAt else None,
            "banReason": u.banReason,
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


# ─── Slider Management ───


def _serialize_slider(s) -> dict:
    return {
        "id": s.id,
        "slotNumber": s.slotNumber,
        "imageUrl": s.imageUrl,
        "title": s.title,
        "description": s.description,
        "meta": s.meta,
        "cta": s.cta,
        "ctaLink": s.ctaLink,
        "imageGradient": s.imageGradient,
        "active": s.active,
        "createdAt": s.createdAt.isoformat(),
        "updatedAt": s.updatedAt.isoformat(),
    }


@router.get("/slider-images")
async def list_slider_slots(_admin: dict = Depends(require_admin)):
    """List all 4 slider slots (admin view). Ordered by slot number."""
    slots = await db.sliderimage.find_many(order={"slotNumber": "asc"})
    return [_serialize_slider(s) for s in slots]


class SliderSlotUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    meta: Optional[str] = None
    cta: Optional[str] = None
    ctaLink: Optional[str] = None
    imageGradient: Optional[str] = None
    active: Optional[bool] = None


@router.post("/slider-images/{slot_number}/upload")
async def upload_slider_slot_image(
    slot_number: int,
    file: UploadFile = File(...),
    _admin: dict = Depends(require_admin),
):
    """Upload/replace image for a specific slider slot (1-4)."""
    if slot_number < 1 or slot_number > 4:
        raise HTTPException(status_code=400, detail="Slot number must be between 1 and 4")

    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="Only JPEG, PNG, WebP and GIF images are allowed")

    contents = await file.read()
    if len(contents) > MAX_SIZE:
        raise HTTPException(status_code=400, detail="Image must be under 5 MB")

    uid = uuid4().hex
    ext = file.filename.rsplit(".", 1)[-1] if file.filename and "." in file.filename else "jpg"
    path = f"slider/{uid}.{ext}"

    image_url = await _upload_to_supabase(path, contents, file.content_type or "application/octet-stream")

    slot = await db.sliderimage.find_first(where={"slotNumber": slot_number})
    if not slot:
        raise HTTPException(status_code=404, detail="Slider slot not found")

    record = await db.sliderimage.update(
        where={"id": slot.id},
        data={"imageUrl": image_url},
    )

    return _serialize_slider(record)


@router.put("/slider-images/{slot_number}")
async def update_slider_slot(slot_number: int, body: SliderSlotUpdate, _admin: dict = Depends(require_admin)):
    """Update a slider slot's content fields or active status."""
    if slot_number < 1 or slot_number > 4:
        raise HTTPException(status_code=400, detail="Slot number must be between 1 and 4")

    slot = await db.sliderimage.find_first(where={"slotNumber": slot_number})
    if not slot:
        raise HTTPException(status_code=404, detail="Slider slot not found")

    data: dict = {}
    if body.title is not None:
        data["title"] = body.title.strip()
    if body.description is not None:
        data["description"] = body.description.strip()
    if body.meta is not None:
        data["meta"] = body.meta.strip()
    if body.cta is not None:
        data["cta"] = body.cta.strip()
    if body.ctaLink is not None:
        data["ctaLink"] = body.ctaLink.strip()
    if body.imageGradient is not None:
        data["imageGradient"] = body.imageGradient.strip()
    if body.active is not None:
        data["active"] = body.active

    if not data:
        return _serialize_slider(slot)

    record = await db.sliderimage.update(where={"id": slot.id}, data=data)
    return _serialize_slider(record)


@router.delete("/slider-images/{slot_number}/image")
async def remove_slider_slot_image(slot_number: int, _admin: dict = Depends(require_admin)):
    """Remove the image from a slider slot (keeps the slot, clears the image URL)."""
    if slot_number < 1 or slot_number > 4:
        raise HTTPException(status_code=400, detail="Slot number must be between 1 and 4")

    slot = await db.sliderimage.find_first(where={"slotNumber": slot_number})
    if not slot:
        raise HTTPException(status_code=404, detail="Slider slot not found")

    record = await db.sliderimage.update(
        where={"id": slot.id},
        data={"imageUrl": ""},
    )
    return _serialize_slider(record)


# ─── Highlight Management ───


def _serialize_highlight(h) -> dict:
    return {
        "id": h.id,
        "slotNumber": h.slotNumber,
        "imageUrl": h.imageUrl,
        "imagePosition": h.imagePosition,
        "title": h.title,
        "description": h.description,
        "buttonText": h.buttonText,
        "buttonLink": h.buttonLink,
        "active": h.active,
        "createdAt": h.createdAt.isoformat(),
        "updatedAt": h.updatedAt.isoformat(),
    }


@router.get("/highlights")
async def list_highlight_slots(_admin: dict = Depends(require_admin)):
    """List all 4 highlight slots (admin view). Ordered by slot number."""
    slots = await db.highlight.find_many(order={"slotNumber": "asc"})
    return [_serialize_highlight(s) for s in slots]


class HighlightSlotUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    buttonText: Optional[str] = None
    buttonLink: Optional[str] = None
    imagePosition: Optional[str] = None
    active: Optional[bool] = None


@router.post("/highlights/{slot_number}/upload")
async def upload_highlight_image(
    slot_number: int,
    file: UploadFile = File(...),
    _admin: dict = Depends(require_admin),
):
    """Upload/replace image for a specific highlight slot (1-4)."""
    if slot_number < 1 or slot_number > 4:
        raise HTTPException(status_code=400, detail="Slot number must be between 1 and 4")

    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="Only JPEG, PNG, WebP and GIF images are allowed")

    contents = await file.read()
    if len(contents) > MAX_SIZE:
        raise HTTPException(status_code=400, detail="Image must be under 5 MB")

    uid = uuid4().hex
    ext = file.filename.rsplit(".", 1)[-1] if file.filename and "." in file.filename else "jpg"
    path = f"highlights/{uid}.{ext}"

    image_url = await _upload_to_supabase(path, contents, file.content_type or "application/octet-stream")

    slot = await db.highlight.find_first(where={"slotNumber": slot_number})
    if not slot:
        raise HTTPException(status_code=404, detail="Highlight slot not found")

    record = await db.highlight.update(
        where={"id": slot.id},
        data={"imageUrl": image_url},
    )

    return _serialize_highlight(record)


@router.put("/highlights/{slot_number}")
async def update_highlight_slot(slot_number: int, body: HighlightSlotUpdate, _admin: dict = Depends(require_admin)):
    """Update a highlight slot's content fields or active status."""
    if slot_number < 1 or slot_number > 4:
        raise HTTPException(status_code=400, detail="Slot number must be between 1 and 4")

    slot = await db.highlight.find_first(where={"slotNumber": slot_number})
    if not slot:
        raise HTTPException(status_code=404, detail="Highlight slot not found")

    data: dict = {}
    if body.title is not None:
        data["title"] = body.title.strip()
    if body.description is not None:
        data["description"] = body.description.strip()
    if body.buttonText is not None:
        data["buttonText"] = body.buttonText.strip()
    if body.buttonLink is not None:
        data["buttonLink"] = body.buttonLink.strip()
    if body.imagePosition is not None:
        data["imagePosition"] = body.imagePosition.strip()
    if body.active is not None:
        data["active"] = body.active

    if not data:
        return _serialize_highlight(slot)

    record = await db.highlight.update(where={"id": slot.id}, data=data)
    return _serialize_highlight(record)


@router.delete("/highlights/{slot_number}/image")
async def remove_highlight_image(slot_number: int, _admin: dict = Depends(require_admin)):
    """Remove the image from a highlight slot (keeps the slot, clears the image URL)."""
    if slot_number < 1 or slot_number > 4:
        raise HTTPException(status_code=400, detail="Slot number must be between 1 and 4")

    slot = await db.highlight.find_first(where={"slotNumber": slot_number})
    if not slot:
        raise HTTPException(status_code=404, detail="Highlight slot not found")

    record = await db.highlight.update(
        where={"id": slot.id},
        data={"imageUrl": ""},
    )
    return _serialize_highlight(record)


# ═══════════════════════════════════════════════════════════
#  MODERATION / SECURITY ENDPOINTS (admin only)
# ═══════════════════════════════════════════════════════════


@router.post("/users/{user_id}/unlink-rsn")
async def unlink_user_rsn(user_id: str, _admin: dict = Depends(require_admin)):
    """Unlink RSN from a user account, forcing them to re-link."""
    user = await db.user.find_unique(where={"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    await db.user.update(
        where={"id": user_id},
        data={
            "rsn": None,
            "gameType": None,
            "accountType": None,
            "rsnClanName": None,
            "rsnLinkedAt": None,
        },
    )
    return {"success": True}


@router.get("/users/{user_id}/logins")
async def get_user_login_history(user_id: str, _admin: dict = Depends(require_admin)):
    """Get login history for a user (admin only)."""
    user = await db.user.find_unique(where={"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    logins = await db.userloginhistory.find_many(
        where={"userId": user_id},
        order={"createdAt": "desc"},
        take=50,
    )
    return [
        {
            "id": l.id,
            "ipAddress": l.ipAddress,
            "userAgent": l.userAgent,
            "createdAt": l.createdAt.isoformat(),
        }
        for l in logins
    ]


@router.post("/users/{user_id}/ban")
async def ban_user(user_id: str, body: BanUserRequest, _admin: dict = Depends(require_admin)):
    """Ban a user account (admin only)."""
    user = await db.user.find_unique(where={"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.privileges >= 2:
        raise HTTPException(status_code=400, detail="Cannot ban an administrator")

    updated = await db.user.update(
        where={"id": user_id},
        data={
            "isBanned": True,
            "bannedAt": datetime.now(timezone.utc),
            "bannedByUserId": _admin["sub"],
            "banReason": body.reason,
        },
    )
    return {"success": True, "isBanned": updated.isBanned}


@router.post("/users/{user_id}/unban")
async def unban_user(user_id: str, _admin: dict = Depends(require_admin)):
    """Unban a user account (admin only)."""
    user = await db.user.find_unique(where={"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    updated = await db.user.update(
        where={"id": user_id},
        data={
            "isBanned": False,
            "bannedAt": None,
            "bannedByUserId": None,
            "banReason": None,
        },
    )
    return {"success": True, "isBanned": updated.isBanned}


@router.get("/ip-bans")
async def list_ip_bans(_admin: dict = Depends(require_admin)):
    """List all IP bans (admin only)."""
    bans = await db.ipban.find_many(order={"createdAt": "desc"}, take=100)
    return [
        {
            "id": b.id,
            "ipAddress": b.ipAddress,
            "reason": b.reason,
            "active": b.active,
            "createdByUserId": b.createdByUserId,
            "createdAt": b.createdAt.isoformat(),
        }
        for b in bans
    ]


@router.post("/ip-bans")
async def create_ip_ban(body: IpBanRequest, _admin: dict = Depends(require_admin)):
    """Create an IP ban (admin only)."""
    if not body.ipAddress.strip():
        raise HTTPException(status_code=400, detail="IP address is required")

    ban = await db.ipban.create(
        data={
            "ipAddress": body.ipAddress.strip(),
            "reason": body.reason,
            "active": True,
            "createdByUserId": _admin["sub"],
        }
    )
    return {
        "id": ban.id,
        "ipAddress": ban.ipAddress,
        "reason": ban.reason,
        "active": ban.active,
        "createdAt": ban.createdAt.isoformat(),
    }


@router.delete("/ip-bans/{ban_id}")
async def remove_ip_ban(ban_id: str, _admin: dict = Depends(require_admin)):
    """Deactivate an IP ban (admin only)."""
    ban = await db.ipban.find_unique(where={"id": ban_id})
    if not ban:
        raise HTTPException(status_code=404, detail="IP ban not found")

    updated = await db.ipban.update(
        where={"id": ban_id},
        data={"active": False},
    )
    return {"success": True, "active": updated.active}
