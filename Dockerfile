# ─── Stage 1: Build frontend ───
FROM node:22-slim AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ─── Stage 2: Python backend ───
FROM python:3.12-slim AS production
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends libatomic1 && \
    rm -rf /var/lib/apt/lists/* && \
    pip install --no-cache-dir poetry && \
    poetry config virtualenvs.create false

COPY backend/pyproject.toml backend/poetry.lock ./
RUN poetry install --only main --no-root --no-interaction

COPY backend/app ./app
COPY backend/prisma ./prisma

# Generate Prisma client
RUN python -m prisma generate

# Copy built frontend into static dir for SPA serving
COPY --from=frontend-build /app/frontend/dist ./static

EXPOSE 8000
CMD ["sh", "-c", "python -m prisma db push --skip-generate --accept-data-loss || echo 'db push skipped'; uvicorn app.main:app --host 0.0.0.0 --port 8000"]
