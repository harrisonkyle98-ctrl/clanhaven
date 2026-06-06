"""Public news and slider endpoints."""

from fastapi import APIRouter

from app.core.database import db

router = APIRouter()


@router.get("/slider-images")
async def list_active_slider_images():
    """List active slider images for the homepage. Public endpoint."""
    images = await db.sliderimage.find_many(
        where={"active": True},
        order=[{"displayOrder": "asc"}, {"createdAt": "desc"}],
    )
    return [
        {
            "id": s.id,
            "imageUrl": s.imageUrl,
            "title": s.title,
            "description": s.description,
            "meta": s.meta,
            "cta": s.cta,
            "imageGradient": s.imageGradient,
            "displayOrder": s.displayOrder,
        }
        for s in images
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
