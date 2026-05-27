from prisma import Prisma

db = Prisma()


async def connect_db() -> None:
    """Connect to the database."""
    await db.connect()


async def disconnect_db() -> None:
    """Disconnect from the database."""
    if db.is_connected():
        await db.disconnect()
