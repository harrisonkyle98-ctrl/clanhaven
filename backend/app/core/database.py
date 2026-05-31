import logging

from prisma import Prisma

from app.core.config import settings

logger = logging.getLogger(__name__)

db = Prisma()


async def connect_db() -> None:
    """Connect to the database if DATABASE_URL is configured."""
    if not settings.DATABASE_URL:
        logger.warning("DATABASE_URL not set — skipping database connection")
        return
    try:
        await db.connect()
        logger.info("Database connected successfully")
    except Exception as e:
        logger.error("Failed to connect to database: %s", e)


async def disconnect_db() -> None:
    """Disconnect from the database."""
    if db.is_connected():
        await db.disconnect()
