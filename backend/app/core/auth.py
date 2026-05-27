from datetime import datetime, timedelta, timezone

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.config import settings

security = HTTPBearer(auto_error=False)

TOKEN_EXPIRY_DAYS = 30


def create_access_token(data: dict) -> str:
    """Create a JWT access token."""
    payload = data.copy()
    payload["exp"] = datetime.now(timezone.utc) + timedelta(days=TOKEN_EXPIRY_DAYS)
    payload["iat"] = datetime.now(timezone.utc)
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm="HS256")


def decode_access_token(token: str) -> dict:
    """Decode and validate a JWT access token."""
    try:
        return jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
) -> dict:
    """Dependency: extract and validate the current user from JWT."""
    if not credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    return decode_access_token(credentials.credentials)


async def get_optional_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
) -> dict | None:
    """Dependency: extract user from JWT if present, otherwise None."""
    if not credentials:
        return None
    try:
        return decode_access_token(credentials.credentials)
    except HTTPException:
        return None
