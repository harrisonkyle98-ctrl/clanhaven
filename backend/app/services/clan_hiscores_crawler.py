"""Clan Discovery Seeder — discovers clan names from RS3 Clan HiScores pages.

Parses the HTML-based Clan HiScores ranking pages to extract clan names,
then passes each discovered name through the existing fetch_and_index_clan()
flow which calls members_lite.ws and populates indexed_clans + indexed_clan_members.

Rate-limited and polite. Admin-only trigger.
"""

import asyncio
import logging
import re
from html import unescape

import httpx

from app.services.clan_indexer import fetch_and_index_clan

logger = logging.getLogger(__name__)

CLAN_RANKING_URL = "https://secure.runescape.com/m=clan-hiscores/ranking"
PAGE_DELAY = 1.5  # seconds between hiscore page fetches
INDEX_DELAY = 2.0  # seconds between clan index calls (members_lite.ws)


def _extract_clan_names(html: str) -> list[str]:
    """Extract clan names from an RS3 Clan HiScores ranking HTML page.

    Each clan row has:
      <td class="col2">
        <a href="...">
          <img ... alt="ClanName" ... />
          ClanName
        </a>
      </td>

    We pull the clan name from the img alt attribute.
    """
    pattern = re.compile(
        r'<td\s+class="col2">\s*<a[^>]*>\s*<img[^>]*alt="([^"]+)"',
        re.DOTALL,
    )
    names = []
    for match in pattern.finditer(html):
        raw = unescape(match.group(1)).replace("\xa0", " ").strip()
        if raw:
            names.append(raw)
    return names


async def _fetch_ranking_page(client: httpx.AsyncClient, page: int) -> str:
    resp = await client.get(
        CLAN_RANKING_URL,
        params={"tableType": 0, "page": page},
    )
    resp.raise_for_status()
    return resp.text


async def seed_clans_from_hiscores(
    start_page: int = 1,
    max_pages: int = 10,
) -> dict:
    """Discover clan names from RS3 Clan HiScores and index each via members_lite.ws.

    Returns a summary with discovery/indexing counts and any errors.
    """
    names_discovered: list[str] = []
    clans_indexed = 0
    index_errors: list[str] = []
    pages_fetched = 0

    # Phase 1: Discover clan names from HiScores ranking pages
    async with httpx.AsyncClient(
        timeout=20.0,
        follow_redirects=True,
        headers={"User-Agent": "ClanHaven/1.0 (clan discovery)"},
    ) as client:
        page = start_page
        while pages_fetched < max_pages:
            try:
                html = await _fetch_ranking_page(client, page)
                names = _extract_clan_names(html)

                if not names:
                    logger.info("No clan names found on page %d — stopping.", page)
                    break

                names_discovered.extend(names)
                pages_fetched += 1
                logger.info(
                    "Discovered %d clan names on page %d (%d total)",
                    len(names), page, len(names_discovered),
                )

                page += 1
                await asyncio.sleep(PAGE_DELAY)

            except httpx.HTTPStatusError as e:
                msg = f"HTTP {e.response.status_code} on page {page}"
                logger.warning(msg)
                index_errors.append(msg)
                break
            except Exception as e:
                msg = f"Page {page} fetch error: {e}"
                logger.warning(msg)
                index_errors.append(msg)
                break

    # Phase 2: Index each discovered clan via existing members_lite.ws flow
    for clan_name in names_discovered:
        try:
            result = await fetch_and_index_clan(clan_name)
            if result.get("error"):
                index_errors.append(f"{clan_name}: {result['error']}")
            else:
                clans_indexed += 1
                logger.info(
                    "Indexed clan '%s' — %d members",
                    clan_name, result.get("member_count", 0),
                )
        except Exception as e:
            msg = f"{clan_name}: {e}"
            logger.warning("Failed to index clan: %s", msg)
            index_errors.append(msg)

        await asyncio.sleep(INDEX_DELAY)

    return {
        "pagesScanned": pages_fetched,
        "namesDiscovered": len(names_discovered),
        "clansIndexed": clans_indexed,
        "errors": index_errors[:50],  # cap error list
        "startPage": start_page,
    }
