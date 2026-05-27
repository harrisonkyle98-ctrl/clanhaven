# Clan Haven

A multi-tenant RuneScape clan platform. Track XP, host competitions, and manage your clan — all in one place.

## Tech Stack

- **Frontend**: React + Vite + TypeScript + Tailwind CSS
- **Backend**: FastAPI (Python 3.12)
- **Database**: Supabase PostgreSQL + Prisma ORM
- **Auth**: Discord OAuth2
- **Deployment**: Fly.io

## Project Structure

```
clanhaven/
├── backend/
│   ├── app/
│   │   ├── core/         # Config, database, auth utilities
│   │   ├── middleware/    # Custom middleware
│   │   ├── models/       # Pydantic models / schemas
│   │   ├── routes/       # API route modules
│   │   ├── services/     # Business logic
│   │   └── main.py       # FastAPI app entry point
│   ├── prisma/
│   │   └── schema.prisma # Database schema
│   ├── tests/
│   ├── pyproject.toml
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/   # Shared UI components
│   │   ├── contexts/     # React contexts (auth, etc.)
│   │   ├── hooks/        # Custom hooks
│   │   ├── lib/          # Utilities (api client, cn helper)
│   │   └── pages/        # Route pages
│   ├── package.json
│   └── .env.example
├── Dockerfile            # Multi-stage production build
├── fly.toml              # Fly.io deployment config
└── README.md
```

## Local Development

### Prerequisites

- Python 3.12+
- Node.js 22+
- [Poetry](https://python-poetry.org/docs/#installation)

### Backend Setup

```bash
cd backend

# Copy env template and fill in your values
cp .env.example .env

# Install dependencies
poetry install --no-root

# Generate Prisma client
poetry run prisma generate

# Run database migrations (after configuring DATABASE_URL)
poetry run prisma db push

# Start dev server
poetry run uvicorn app.main:app --reload --port 8000
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start dev server (proxies /api to backend on :8000)
npm run dev
```

### Environment Variables

All secrets are managed via `.env` files locally and `fly secrets` in production. See `.env.example` files in `backend/` and `frontend/` for required variables.

**Never commit `.env` files or expose secrets in code.**

### Deployment

Production deploys to [Fly.io](https://fly.io):

```bash
# Set secrets (one-time)
fly secrets set DATABASE_URL="..." DISCORD_CLIENT_ID="..." DISCORD_CLIENT_SECRET="..." JWT_SECRET_KEY="..." DISCORD_REDIRECT_URI="..." FRONTEND_URL="..."

# Deploy
fly deploy
```

## Architecture Decisions

- **Multi-tenant from day one**: Every data model includes `clan_id`. No single-clan assumptions.
- **Game-type agnostic**: Supports RS3 and OSRS via `GameType` enum.
- **Modular backend**: Routes, services, and models are separated into distinct modules — no monolithic files.
- **Public-first frontend**: Landing page is public. Auth-gated routes are clearly separated.
- **No secrets in source**: All configuration flows through environment variables.
