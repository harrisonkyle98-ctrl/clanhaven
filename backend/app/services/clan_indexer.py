"""Service to fetch and index RS3 clan members from the Jagex Clan Hiscores.

Flow:
  1. Fetch clan roster from members_lite.ws
  2. Upsert indexed_clans with clan metadata + slug
  3. Upsert each member into rs3_players (player profile)
  4. Update indexed_clan_members with player_id links + membership tracking
  5. Create a clan_snapshot for historical tracking
"""

import logging
import re
from datetime import datetime, timezone

import httpx

from app.core.database import db

logger = logging.getLogger(__name__)

CLAN_MEMBERS_URL = "http://services.runescape.com/m=clan-hiscores/members_lite.ws?clanName={}"


def _normalize_rsn(name: str) -> str:
    """Normalize RSN for matching: lowercase and replace non-breaking spaces."""
    return name.replace("\xa0", " ").strip().lower()


def _slugify(name: str) -> str:
    """Generate a URL-safe slug from a clan name."""
    slug = name.replace("\xa0", " ").strip().lower()
    slug = re.sub(r"[^a-z0-9\s-]", "", slug)
    slug = re.sub(r"[\s-]+", "-", slug).strip("-")
    return slug


async def fetch_and_index_clan(
    clan_name: str,
    *,
    seed_rank: int | None = None,
    seed_motif_url: str | None = None,
) -> dict:
    """Fetch clan members from RS3 Clan Hiscores and store them.

    Upserts indexed_clans, rs3_players, indexed_clan_members, and creates
    a clan_snapshot. Returns a summary dict.

    Total clan XP is always calculated from the members_lite.ws roster
    (sum of all member clan_xp).

    Optional seed_* params allow the caller (e.g. the HiScores seeder) to
    pass additional clan metadata obtained from the ranking page.
    """
    url = CLAN_MEMBERS_URL.format(clan_name)

    async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
        resp = await client.get(url)

    if resp.status_code != 200:
        logger.warning("Clan Hiscores returned %s for clan '%s'", resp.status_code, clan_name)
        return {"error": f"Clan Hiscores returned status {resp.status_code}", "member_count": 0}

    text = resp.content.decode("latin-1").strip()
    lines = text.split("\n")

    if len(lines) < 2:
        return {"error": "No member data returned", "member_count": 0}

    # Parse CSV: "Clanmate, Clan Rank, Total XP, Kills"
    members: list[dict] = []
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

    # Deduplicate by normalized RSN
    seen_rsns: set[str] = set()
    unique_members: list[dict] = []
    for m in members:
        if m["rsnLower"] not in seen_rsns:
            seen_rsns.add(m["rsnLower"])
            unique_members.append(m)

    now = datetime.now(timezone.utc)
    clan_name_lower = clan_name.strip().lower()
    slug = _slugify(clan_name)

    # ── Step 1: Upsert indexed_clans ──
    create_data: dict = {
        "name": clan_name,
        "nameLower": clan_name_lower,
        "slug": slug,
        "gameType": "RS3",
        "memberCount": len(unique_members),
        "lastIndexedAt": now,
    }
    update_data: dict = {
        "memberCount": len(unique_members),
        "lastIndexedAt": now,
    }

    if seed_rank is not None:
        create_data["rank"] = seed_rank
        update_data["rank"] = seed_rank
    if seed_motif_url:
        create_data["motifUrl"] = seed_motif_url
        update_data["motifUrl"] = seed_motif_url

    # Total clan XP from member roster (sum of all member clan_xp)
    roster_total_xp = sum(m["clanXp"] for m in unique_members)
    if roster_total_xp > 0:
        create_data["totalXp"] = roster_total_xp
        update_data["totalXp"] = roster_total_xp

    # Set slug on create; don't overwrite if already set
    if "slug" not in update_data:
        update_data["slug"] = slug

    indexed_clan = await db.indexedclan.upsert(
        where={"nameLower": clan_name_lower},
        data={
            "create": create_data,
            "update": update_data,
        },
    )

    # ── Step 2: Upsert each member into rs3_players ──
    player_id_map: dict[str, str] = {}  # rsnLower -> player_id
    for m in unique_members:
        player = await db.rs3player.upsert(
            where={"normalizedRsn": m["rsnLower"]},
            data={
                "create": {
                    "rsn": m["rsn"],
                    "normalizedRsn": m["rsnLower"],
                    "currentClanId": indexed_clan.id,
                    "currentClanName": clan_name,
                },
                "update": {
                    "rsn": m["rsn"],
                    "currentClanId": indexed_clan.id,
                    "currentClanName": clan_name,
                },
            },
        )
        player_id_map[m["rsnLower"]] = player.id

    # ── Step 3: Get previous members for membership tracking ──
    previous_members = await db.indexedclanmember.find_many(
        where={"clanId": indexed_clan.id, "isCurrent": True},
    )
    previous_rsns = {pm.rsnLower for pm in previous_members}
    current_rsns = {m["rsnLower"] for m in unique_members}

    joined_rsns = current_rsns - previous_rsns
    left_rsns = previous_rsns - current_rsns

    # Mark members who left as not current
    if left_rsns:
        await db.indexedclanmember.update_many(
            where={
                "clanId": indexed_clan.id,
                "rsnLower": {"in": list(left_rsns)},
                "isCurrent": True,
            },
            data={
                "isCurrent": False,
                "leftSeenAt": now,
            },
        )

    # ── Step 4: Delete current members and re-create (batch) ──
    await db.indexedclanmember.delete_many(
        where={"clanId": indexed_clan.id, "isCurrent": True},
    )
    await db.indexedclanmember.create_many(
        data=[
            {
                "clanId": indexed_clan.id,
                "playerId": player_id_map.get(m["rsnLower"]),
                "rsn": m["rsn"],
                "rsnLower": m["rsnLower"],
                "clanRank": m["clanRank"],
                "clanXp": m["clanXp"],
                "kills": m["kills"],
                "isCurrent": True,
                "firstSeenAt": now,
                "lastSeenAt": now,
            }
            for m in unique_members
        ],
        skip_duplicates=True,
    )

    # ── Step 5: Create a clan snapshot ──
    await db.clansnapshot.create(
        data={
            "clanId": indexed_clan.id,
            "clanRank": indexed_clan.rank,
            "memberCount": len(unique_members),
            "totalXp": indexed_clan.totalXp,
            "membersJoinedSinceLast": len(joined_rsns),
            "membersLeftSinceLast": len(left_rsns),
            "snapshotAt": now,
        }
    )

    logger.info(
        "Indexed %d members for clan '%s' (joined=%d, left=%d)",
        len(unique_members), clan_name, len(joined_rsns), len(left_rsns),
    )
    return {
        "clan_name": clan_name,
        "member_count": len(unique_members),
        "clan_id": indexed_clan.id,
        "players_upserted": len(player_id_map),
        "members_joined": len(joined_rsns),
        "members_left": len(left_rsns),
    }


async def lookup_clan_for_rsn(rsn: str) -> str | None:
    """Look up which indexed clan an RSN belongs to. Returns clan name or None."""
    rsn_lower = _normalize_rsn(rsn)
    member = await db.indexedclanmember.find_first(
        where={"rsnLower": rsn_lower, "isCurrent": True},
        include={"clan": True},
    )
    if member and member.clan:
        return member.clan.name
    return None
