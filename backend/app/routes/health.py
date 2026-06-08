from fastapi import APIRouter

from app.core.database import db

router = APIRouter()


@router.get("/healthz")
async def healthz():
    """Health check endpoint with database status."""
    db_status = "connected" if db.is_connected() else "disconnected"
    return {"status": "ok", "database": db_status}
