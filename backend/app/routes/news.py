"""Public news endpoints."""

from fastapi import APIRouter

from app.core.database import db

router = APIRouter()


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
            "publishedAt": p.publishedAt.isoformat() if p.publishedAt else None,
            "createdAt": p.createdAt.isoformat(),
        }
        for p in posts
    ]
