"""One-off script to backfill clan colors from motif images.

Usage:
  python backfill_colors.py [WORKERS] [BATCH_SIZE]

  WORKERS    - number of concurrent tasks (default: 10)
  BATCH_SIZE - number of clans to process (default: 500)
"""
import asyncio
import sys
import time

sys.path.insert(0, "/app")

import httpx

from app.core.database import db
from app.services.color_detector import detect_clan_colors_with_client

WORKERS = int(sys.argv[1]) if len(sys.argv) > 1 else 10
BATCH_SIZE = int(sys.argv[2]) if len(sys.argv) > 2 else 500


async def process_clan(semaphore, client, clan, results):
    async with semaphore:
        if not clan.motifUrl:
            return
        r = await detect_clan_colors_with_client(client, clan.id, clan.motifUrl)
        if r["status"] == "success":
            results["ok"] += 1
            p = r.get("primaryColor", "?")
            s = r.get("secondaryColor", "?")
            print(f"  OK: {clan.name}: {p} / {s}")
        else:
            results["fail"] += 1
            err = r.get("error", "?")
            print(f"  FAIL: {clan.name}: {err}")


async def main():
    await db.connect()
    clans = await db.indexedclan.find_many(
        where={"motifUrl": {"not": None}},
        take=BATCH_SIZE,
        order={"rank": "asc"},
    )
    print(f"Processing {len(clans)} clans with {WORKERS} workers")
    start = time.time()

    semaphore = asyncio.Semaphore(WORKERS)
    results = {"ok": 0, "fail": 0}

    async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
        tasks = [process_clan(semaphore, client, c, results) for c in clans]
        await asyncio.gather(*tasks)

    elapsed = time.time() - start
    print(f"Done: {results['ok']} ok, {results['fail']} fail in {elapsed:.1f}s")
    await db.disconnect()


asyncio.run(main())
