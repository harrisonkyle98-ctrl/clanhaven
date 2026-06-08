"""Public news, slider, and highlight endpoints."""

from fastapi import APIRouter

from app.core.database import db

router = APIRouter()


@router.get("/slider-images")
async def list_active_slider_images():
    """List active slider slots for the homepage. Public endpoint."""
    images = await db.sliderimage.find_many(
        where={"active": True},
        order={"slotNumber": "asc"},
    )
    return [
        {
            "id": s.id,
            "slotNumber": s.slotNumber,
            "imageUrl": s.imageUrl,
            "title": s.title,
            "description": s.description,
            "meta": s.meta,
            "cta": s.cta,
            "ctaLink": s.ctaLink,
            "imageGradient": s.imageGradient,
        }
        for s in images
    ]


@router.get("/highlights")
async def list_active_highlights():
    """List active highlight slots for the homepage. Public endpoint."""
    highlights = await db.highlight.find_many(
        where={"active": True},
        order={"slotNumber": "asc"},
    )
    return [
        {
            "id": h.id,
            "slotNumber": h.slotNumber,
            "imageUrl": h.imageUrl,
            "imagePosition": h.imagePosition,
            "title": h.title,
            "description": h.description,
            "buttonText": h.buttonText,
            "buttonLink": h.buttonLink,
        }
        for h in highlights
    ]


@router.get("")
async def list_published_news():
    """List published news posts, newest first. Public endpoint."""
    posts = await db.newspost.find_many(
        where={"published": True},
        order={"publishedAt": "desc"},
    )
    return [
        {
            "id": p.id,
            "title": p.title,
            "content": p.content,
            "excerpt": p.excerpt,
            "category": p.category,
            "bannerUrl": p.bannerUrl,
            "thumbnailUrl": p.thumbnailUrl,
            "publishedAt": p.publishedAt.isoformat() if p.publishedAt else None,
            "createdAt": p.createdAt.isoformat(),
        }
        for p in posts
    ]
