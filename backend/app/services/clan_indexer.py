"""Service to fetch and index RS3 clan members from the Jagex Clan Hiscores."""

import logging
from datetime import datetime, timezone

import httpx

from app.core.database import db

logger = logging.getLogger(__name__)

CLAN_MEMBERS_URL = "http://services.runescape.com/m=clan-hiscores/members_lite.ws?clanName={}"


def _normalize_rsn(name: str) -> str:
    """Normalize RSN for matching: lowercase and replace non-breaking spaces."""
    return name.replace("\xa0", " ").strip().lower()


async def fetch_and_index_clan(clan_name: str) -> dict:
    """Fetch clan members from RS3 Clan Hiscores and store them in the database.

    Returns a summary dict with member_count and any errors.
    """
    url = CLAN_MEMBERS_URL.format(clan_name)

    async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
        resp = await client.get(url)

    if resp.status_code != 200:
        logger.warning("Clan Hiscores returned %s for clan '%s'", resp.status_code, clan_name)
        return {"error": f"Clan Hiscores returned status {resp.status_code}", "member_count": 0}

    # Clan Hiscores uses \xa0 (non-breaking space) in names; decode as latin-1
    # to preserve it, since httpx's default UTF-8 decoding replaces it with \ufffd
    text = resp.content.decode("latin-1").strip()
    lines = text.split("\n")

    if len(lines) < 2:
        return {"error": "No member data returned", "member_count": 0}

    # Skip header: "Clanmate, Clan Rank, Total XP, Kills"
    members = []
    for line in lines[1:]:
        parts = line.strip().split(",")
        if len(parts) < 4:
            continue
        rsn_raw = parts[0].replace("\xa0", " ").strip()
        rank = parts[1].strip()
        try:
            clan_xp = int(parts[2].strip())
        except ValueError:
            clan_xp = 0
        try:
            kills = int(parts[3].strip())
        except ValueError:
            kills = 0

        members.append({
            "rsn": rsn_raw,
            "rsnLower": _normalize_rsn(rsn_raw),
            "clanRank": rank,
            "clanXp": clan_xp,
            "kills": kills,
        })

    if not members:
        return {"error": "No members parsed from response", "member_count": 0}

    now = datetime.now(timezone.utc)
    clan_name_clean = members[0]["rsn"]  # Use the actual name casing from the data
    # But keep the original clan_name for the clan record
    clan_name_lower = clan_name.strip().lower()

    # Upsert the indexed clan
    indexed_clan = await db.indexedclan.upsert(
        where={"nameLower": clan_name_lower},
        data={
            "create": {
                "name": clan_name,
                "nameLower": clan_name_lower,
                "gameType": "RS3",
                "memberCount": len(members),
                "lastIndexedAt": now,
            },
            "update": {
                "memberCount": len(members),
                "lastIndexedAt": now,
            },
        },
    )

    # Upsert each member
    for m in members:
        await db.indexedclanmember.upsert(
            where={
                "clanId_rsnLower": {
                    "clanId": indexed_clan.id,
                    "rsnLower": m["rsnLower"],
                }
            },
            data={
                "create": {
                    "clanId": indexed_clan.id,
                    "rsn": m["rsn"],
                    "rsnLower": m["rsnLower"],
                    "clanRank": m["clanRank"],
                    "clanXp": m["clanXp"],
                    "kills": m["kills"],
                    "lastSeenAt": now,
                },
                "update": {
                    "rsn": m["rsn"],
                    "clanRank": m["clanRank"],
                    "clanXp": m["clanXp"],
                    "kills": m["kills"],
                    "lastSeenAt": now,
                },
            },
        )

    logger.info("Indexed %d members for clan '%s'", len(members), clan_name)
    return {"clan_name": clan_name, "member_count": len(members), "clan_id": indexed_clan.id}


async def lookup_clan_for_rsn(rsn: str) -> str | None:
    """Look up which indexed clan an RSN belongs to. Returns clan name or None."""
    rsn_lower = _normalize_rsn(rsn)
    member = await db.indexedclanmember.find_first(
        where={"rsnLower": rsn_lower},
        include={"clan": True},
    )
    if member and member.clan:
        return member.clan.name
    return None
