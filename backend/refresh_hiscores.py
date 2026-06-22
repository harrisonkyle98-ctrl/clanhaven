"""Standalone script to refresh hiscores for all players missing stats.

Run on Fly machine: fly ssh console -C "nohup python refresh_hiscores.py > /tmp/hiscores.log 2>&1 &"
Check progress: fly ssh console -C "tail -50 /tmp/hiscores.log"
"""

import asyncio
import logging
import sys

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
    stream=sys.stdout,
)

from app.core.database import db
from app.services.player_hiscores import refresh_all_player_hiscores


async def main():
    await db.connect()
    logging.info("Starting hiscores refresh for all players with missing stats...")

    result = await refresh_all_player_hiscores(
        batch_size=500,
        concurrency=25,
        only_missing=True,
    )

    logging.info("FINAL RESULT: %s", result)
    await db.disconnect()


if __name__ == "__main__":
    asyncio.run(main())
