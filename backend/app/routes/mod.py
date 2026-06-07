"""Mod panel routes. Accessible by moderators (privilege >= 1) and admins."""

from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.core.database import db
from app.routes.admin import require_mod

router = APIRouter()


@router.get("/status")
async def mod_status(_mod: dict = Depends(require_mod)):
    """Mod panel status check — confirms the user has moderator access."""
    user = await db.user.find_unique(where={"id": _mod["sub"]})
    role = "Administrator" if user and user.privileges >= 2 else "Moderator"
    pending_count = await db.altaccountrequest.count(where={"status": "pending"})
    return {
        "access": True,
        "role": role,
        "privileges": user.privileges if user else 0,
        "pendingAltRequests": pending_count,
    }


@router.get("/alt-requests")
async def list_alt_requests(_mod: dict = Depends(require_mod)):
    """List all alt account requests for moderation review."""
    requests = await db.altaccountrequest.find_many(
        order={"createdAt": "desc"},
        include={"user": True},
        take=100,
    )
    return [
        {
            "id": r.id,
            "userId": r.userId,
            "rsn": r.rsn,
            "gameType": r.gameType,
            "accountType": r.accountType,
            "status": r.status,
            "reviewedById": r.reviewedById,
            "reviewedAt": r.reviewedAt.isoformat() if r.reviewedAt else None,
            "reviewNote": r.reviewNote,
            "createdAt": r.createdAt.isoformat(),
            "requesterUsername": r.user.username if r.user else None,
            "requesterRsn": r.user.rsn if r.user else None,
            "requesterAvatar": r.user.avatar if r.user else None,
            "requesterDiscordId": r.user.discordId if r.user else None,
        }
        for r in requests
    ]


class ReviewAltRequest(BaseModel):
    note: Optional[str] = None


@router.post("/alt-requests/{request_id}/approve")
async def approve_alt_request(request_id: str, body: ReviewAltRequest, _mod: dict = Depends(require_mod)):
    """Approve an alt account request."""
    req = await db.altaccountrequest.find_unique(where={"id": request_id})
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    if req.status != "pending":
        raise HTTPException(status_code=400, detail=f"Request is already {req.status}")

    # Verify RSN isn't claimed since request was submitted
    from app.routes.users import _normalize_rsn
    rsn_lower = _normalize_rsn(req.rsn)

    # Check main accounts
    all_users = await db.user.find_many(where={"rsn": {"not": None}})
    for u in all_users:
        if u.rsn and _normalize_rsn(u.rsn) == rsn_lower and u.id != req.userId:
            raise HTTPException(status_code=400, detail="This RSN has been claimed by another user since the request was made")

    # Check other approved alts
    other_approved = await db.altaccountrequest.find_first(
        where={
            "rsnLower": rsn_lower,
            "status": "approved",
            "userId": {"not": req.userId},
        },
    )
    if other_approved:
        raise HTTPException(status_code=400, detail="This RSN is already approved as another user's alt")

    updated = await db.altaccountrequest.update(
        where={"id": request_id},
        data={
            "status": "approved",
            "reviewedById": _mod["sub"],
            "reviewedAt": datetime.now(timezone.utc),
            "reviewNote": body.note or None,
        },
    )
    return {"success": True, "status": updated.status}


@router.post("/alt-requests/{request_id}/deny")
async def deny_alt_request(request_id: str, body: ReviewAltRequest, _mod: dict = Depends(require_mod)):
    """Deny an alt account request."""
    req = await db.altaccountrequest.find_unique(where={"id": request_id})
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    if req.status != "pending":
        raise HTTPException(status_code=400, detail=f"Request is already {req.status}")

    updated = await db.altaccountrequest.update(
        where={"id": request_id},
        data={
            "status": "denied",
            "reviewedById": _mod["sub"],
            "reviewedAt": datetime.now(timezone.utc),
            "reviewNote": body.note or None,
        },
    )
    return {"success": True, "status": updated.status}
