from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.database import connect_db, disconnect_db, db
from app.routes import admin, auth, clans, health, members, mod, players, users


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown lifecycle."""
    await connect_db()
    # Migrate existing admins (privilege 1) to new admin level (privilege 2)
    try:
        old_admins = await db.user.find_many(where={"privileges": 1})
        for u in old_admins:
            await db.user.update(where={"id": u.id}, data={"privileges": 2})
    except Exception:
        pass
    # Assign site admin privileges to lm Kyle (always privilege 2)
    try:
        admin_user = await db.user.find_first(where={"rsn": "lm Kyle"})
        if admin_user and admin_user.privileges != 2:
            await db.user.update(where={"id": admin_user.id}, data={"privileges": 2})
    except Exception:
        pass
    # Seed 4 slider slots if they don't exist
    try:
        for slot in range(1, 5):
            existing = await db.sliderimage.find_first(where={"slotNumber": slot})
            if not existing:
                await db.sliderimage.create(data={"slotNumber": slot, "active": False})
    except Exception:
        pass
    # Seed 4 highlight slots if they don't exist
    try:
        for slot in range(1, 5):
            existing = await db.highlight.find_first(where={"slotNumber": slot})
            if not existing:
                await db.highlight.create(data={"slotNumber": slot, "active": False})
    except Exception:
        pass
    # Seed example news posts if none exist
    try:
        from datetime import datetime, timezone
        count = await db.newspost.count()
        if count == 0:
            seeds = [
                {
                    "title": "Welcome to Clan Haven",
                    "content": "Clan Haven is now live! This platform is built for RuneScape clans to manage members, track progress, and build community. Stay tuned for more features.",
                    "excerpt": "Clan Haven is now live! Built for RuneScape clans to manage members and build community.",
                    "published": True,
                    "publishedAt": datetime.now(timezone.utc),
                },
                {
                    "title": "RS3 Clan Indexing Active",
                    "content": "RS3 clan indexing is now functional. When you link your RuneScape account, Clan Haven automatically detects your clan membership using official RS3 Clan Hiscores data.",
                    "excerpt": "RS3 clan detection is live — link your account and your clan is automatically identified.",
                    "published": True,
                    "publishedAt": datetime.now(timezone.utc),
                },
                {
                    "title": "Admin Panel Now Available",
                    "content": "Site administrators can now access the Admin Panel to manage users, publish news, and monitor site activity. More admin tools are coming soon.",
                    "excerpt": "The Admin Panel is live with user management and news publishing tools.",
                    "published": True,
                    "publishedAt": datetime.now(timezone.utc),
                },
            ]
            for seed in seeds:
                await db.newspost.create(data=seed)
    except Exception:
        pass
    # Re-normalize rsnLower on alt account requests (spaces + underscores stripped)
    try:
        from app.routes.users import _normalize_rsn
        all_alts = await db.altaccountrequest.find_many()
        for alt in all_alts:
            correct_lower = _normalize_rsn(alt.rsn)
            if alt.rsnLower != correct_lower:
                await db.altaccountrequest.update(
                    where={"id": alt.id},
                    data={"rsnLower": correct_lower},
                )
    except Exception:
        pass
    # Clean up stale seed jobs left in "running" state after restart/deploy
    try:
        from datetime import datetime, timezone
        stale = await db.seedjob.find_many(where={"status": {"in": ["running", "pending"]}})
        for j in stale:
            await db.seedjob.update(
                where={"id": j.id},
                data={
                    "status": "failed",
                    "lastError": "Job interrupted by server restart",
                    "completedAt": datetime.now(timezone.utc),
                },
            )
    except Exception:
        pass
    # Backfill: generate slugs for indexed_clans that don't have one
    try:
        import re as _re
        clans_no_slug = await db.indexedclan.find_many(where={"slug": None}, take=500)
        for c in clans_no_slug:
            slug = c.nameLower.replace("\xa0", " ").strip()
            slug = _re.sub(r"[^a-z0-9\s-]", "", slug)
            slug = _re.sub(r"[\s-]+", "-", slug).strip("-")
            try:
                await db.indexedclan.update(where={"id": c.id}, data={"slug": slug})
            except Exception:
                pass
    except Exception:
        pass
    # Backfill: rs3_players + player_id linking runs as a background task
    # (too many rows to block startup)
    import asyncio as _asyncio

    async def _backfill_players():
        try:
            batch_size = 200
            offset = 0
            while True:
                unlinked = await db.indexedclanmember.find_many(
                    where={"playerId": None},
                    include={"clan": True},
                    take=batch_size,
                    skip=offset,
                )
                if not unlinked:
                    break
                for m in unlinked:
                    try:
                        player = await db.rs3player.upsert(
                            where={"normalizedRsn": m.rsnLower},
                            data={
                                "create": {
                                    "rsn": m.rsn,
                                    "normalizedRsn": m.rsnLower,
                                    "currentClanId": m.clanId,
                                    "currentClanName": m.clan.name if m.clan else None,
                                },
                                "update": {},
                            },
                        )
                        await db.indexedclanmember.update(
                            where={"id": m.id},
                            data={"playerId": player.id},
                        )
                    except Exception:
                        offset += 1
                await _asyncio.sleep(0.1)
        except Exception:
            pass

    _asyncio.create_task(_backfill_players())
    yield
    await disconnect_db()


app = FastAPI(
    title="Clan Haven API",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS — restrict in production
origins = ["*"] if not settings.is_production else [settings.FRONTEND_URL]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API routes
app.include_router(health.router, tags=["health"])
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(clans.router, prefix="/api/clans", tags=["clans"])
app.include_router(members.router, prefix="/api/members", tags=["members"])
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])
app.include_router(mod.router, prefix="/api/mod", tags=["mod"])
app.include_router(players.router, prefix="/api/players", tags=["players"])

from app.routes import news
app.include_router(news.router, prefix="/api/news", tags=["news"])

# Serve built frontend in production
static_dir = Path(__file__).parent.parent / "static"
if static_dir.exists():
    app.mount("/assets", StaticFiles(directory=static_dir / "assets"), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        """Serve the SPA for any non-API route."""
        file_path = static_dir / full_path
        if file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(static_dir / "index.html")
