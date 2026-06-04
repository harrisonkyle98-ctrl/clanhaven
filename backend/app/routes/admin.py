"""Admin routes for clan indexing. Internal use only for now."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.clan_indexer import fetch_and_index_clan, lookup_clan_for_rsn

router = APIRouter()


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
