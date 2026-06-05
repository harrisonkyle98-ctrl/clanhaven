from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.database import connect_db, disconnect_db, db
from app.routes import admin, auth, clans, health, members, users


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown lifecycle."""
    await connect_db()
    # Assign site admin privileges to lm Kyle
    try:
        admin_user = await db.user.find_first(where={"rsn": "lm Kyle"})
        if admin_user and admin_user.privileges != 1:
            await db.user.update(where={"id": admin_user.id}, data={"privileges": 1})
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
