"""Crawler for RS3 Clan HiScores ranking pages.

Parses the HTML-based Clan HiScores to discover clans with rank, member count,
and total XP.  Rate-limited and polite — designed for initial bulk import and
periodic refresh.
"""

import asyncio
import logging
import re
from datetime import datetime, timezone
from html import unescape

import httpx

from app.core.database import db

logger = logging.getLogger(__name__)

CLAN_RANKING_URL = "https://secure.runescape.com/m=clan-hiscores/ranking"
CLANS_PER_PAGE = 25
REQUEST_DELAY = 1.5  # seconds between requests


def _parse_xp(text: str) -> int:
    """Parse a formatted XP string like '1,354,617,102,855' into an int."""
    return int(text.replace(",", "").strip())


def _parse_ranking_page(html: str) -> list[dict]:
    """Extract clan data from an RS3 Clan HiScores ranking HTML page."""
    clans = []
    # Match table rows: each clan has 4 columns (rank, name, clanmates, xp)
    row_pattern = re.compile(
        r'<tr[^>]*>\s*'
        r'<td class="col1[^"]*">[^<]*<a[^>]*>(\d+)</a></td>\s*'  # rank
        r'<td class="col2">\s*<a[^>]*>\s*'
        r'<img[^>]*alt="([^"]*)"[^>]*/>\s*'  # clan name from img alt
        r'</a>\s*</td>\s*'
        r'<td class="col3[^"]*">[^<]*<a[^>]*>([\d,]+)</a></td>\s*'  # clanmates
        r'<td class="col4[^"]*">[^<]*<a[^>]*>([\d,]+)</a></td>',  # xp
        re.DOTALL,
    )

    for match in row_pattern.finditer(html):
        rank = int(match.group(1))
        clan_name = unescape(match.group(2)).replace("\xa0", " ").strip()
        member_count = int(match.group(3).replace(",", ""))
        total_xp = _parse_xp(match.group(4))

        clans.append({
            "rank": rank,
            "name": clan_name,
            "memberCount": member_count,
            "totalXp": total_xp,
        })

    return clans


async def _fetch_page(client: httpx.AsyncClient, page: int) -> str:
    """Fetch a single ranking page."""
    resp = await client.get(
        CLAN_RANKING_URL,
        params={"tableType": 0, "page": page},
    )
    resp.raise_for_status()
    return resp.text


async def crawl_clan_hiscores(
    start_page: int = 1,
    max_pages: int = 100,
) -> dict:
    """Crawl RS3 Clan HiScores and upsert clans into indexed_clans.

    Returns a summary with total clans indexed and any errors.
    """
    now = datetime.now(timezone.utc)
    total_indexed = 0
    errors: list[str] = []
    pages_fetched = 0

    async with httpx.AsyncClient(
        timeout=20.0,
        follow_redirects=True,
        headers={"User-Agent": "ClanHaven/1.0 (clan indexing)"},
    ) as client:
        page = start_page
        while pages_fetched < max_pages:
            try:
                html = await _fetch_page(client, page)
                clans = _parse_ranking_page(html)

                if not clans:
                    logger.info("No clans found on page %d — stopping.", page)
                    break

                for clan in clans:
                    clan_name_lower = clan["name"].strip().lower()
                    await db.indexedclan.upsert(
                        where={"nameLower": clan_name_lower},
                        data={
                            "create": {
                                "name": clan["name"],
                                "nameLower": clan_name_lower,
                                "gameType": "RS3",
                                "memberCount": clan["memberCount"],
                                "rank": clan["rank"],
                                "totalXp": clan["totalXp"],
                                "source": "clan_hiscores",
                                "lastIndexedAt": now,
                            },
                            "update": {
                                "memberCount": clan["memberCount"],
                                "rank": clan["rank"],
                                "totalXp": clan["totalXp"],
                                "source": "clan_hiscores",
                                "lastIndexedAt": now,
                            },
                        },
                    )
                    total_indexed += 1

                pages_fetched += 1
                logger.info(
                    "Indexed page %d (%d clans, %d total so far)",
                    page, len(clans), total_indexed,
                )

                page += 1
                await asyncio.sleep(REQUEST_DELAY)

            except httpx.HTTPStatusError as e:
                msg = f"HTTP {e.response.status_code} on page {page}"
                logger.warning(msg)
                errors.append(msg)
                break
            except Exception as e:
                msg = f"Error on page {page}: {e}"
                logger.warning(msg)
                errors.append(msg)
                break

    return {
        "pagesIndexed": pages_fetched,
        "clansIndexed": total_indexed,
        "startPage": start_page,
        "errors": errors,
    }
