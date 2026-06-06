from __future__ import annotations

import base64
import hashlib
import hmac
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any

from fastapi import Cookie, Depends, HTTPException, Response, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.models.auth import User

bearer_scheme = HTTPBearer(auto_error=False)
JWT_ALGORITHM = "HS256"


def _b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def _b64url_decode(data: str) -> bytes:
    padding = "=" * (-len(data) % 4)
    return base64.urlsafe_b64decode((data + padding).encode("ascii"))


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    iterations = 260_000
    derived = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, iterations)
    return f"pbkdf2_sha256${iterations}${_b64url_encode(salt)}${_b64url_encode(derived)}"


def verify_password(password: str, password_hash: str) -> bool:
    try:
        algorithm, iterations_raw, salt_raw, derived_raw = password_hash.split("$", 3)
        if algorithm != "pbkdf2_sha256":
            return False
        iterations = int(iterations_raw)
        salt = _b64url_decode(salt_raw)
        expected = _b64url_decode(derived_raw)
        actual = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, iterations)
        return hmac.compare_digest(actual, expected)
    except Exception:
        return False


def _create_jwt(subject: str | int, *, expires_delta: timedelta, token_type: str) -> str:
    now = datetime.now(timezone.utc)
    expires = now + expires_delta
    payload: dict[str, Any] = {
        "sub": str(subject),
        "typ": token_type,
        "iat": int(now.timestamp()),
        "exp": int(expires.timestamp()),
    }
    return jwt.encode(payload, settings.secret_key, algorithm=JWT_ALGORITHM)


def create_access_token(subject: str | int, *, expires_delta: timedelta | None = None) -> str:
    return _create_jwt(
        subject,
        expires_delta=expires_delta or timedelta(minutes=settings.access_token_expire_minutes),
        token_type="access",
    )


def decode_access_token(token: str) -> dict[str, Any]:
    try:
        payload = dict(jwt.decode(token, settings.secret_key, algorithms=[JWT_ALGORITHM]))
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc
    if payload.get("typ", "access") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return payload


def create_refresh_token_value() -> str:
    return secrets.token_urlsafe(48)


def hash_refresh_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def set_auth_cookie(response: Response, token: str) -> None:
    max_age = settings.access_token_expire_minutes * 60
    response.set_cookie(
        key=settings.auth_cookie_name,
        value=token,
        max_age=max_age,
        httponly=True,
        secure=settings.auth_cookie_secure,
        samesite=settings.auth_cookie_samesite,
        path="/",
    )


def set_refresh_cookie(response: Response, token: str) -> None:
    max_age = settings.refresh_token_expire_days * 24 * 60 * 60
    response.set_cookie(
        key=settings.refresh_cookie_name,
        value=token,
        max_age=max_age,
        httponly=True,
        secure=settings.auth_cookie_secure,
        samesite=settings.auth_cookie_samesite,
        path="/api/auth/",
    )


def clear_auth_cookie(response: Response) -> None:
    response.delete_cookie(
        key=settings.auth_cookie_name,
        httponly=True,
        secure=settings.auth_cookie_secure,
        samesite=settings.auth_cookie_samesite,
        path="/",
    )


def clear_refresh_cookie(response: Response) -> None:
    response.delete_cookie(
        key=settings.refresh_cookie_name,
        httponly=True,
        secure=settings.auth_cookie_secure,
        samesite=settings.auth_cookie_samesite,
        path="/api/auth/",
    )


def clear_auth_cookies(response: Response) -> None:
    clear_auth_cookie(response)
    clear_refresh_cookie(response)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    cookie_token: str | None = Cookie(default=None, alias=settings.auth_cookie_name),
    db: Session = Depends(get_db),
) -> User:
    token = None
    if credentials is not None and credentials.scheme.lower() == "bearer":
        token = credentials.credentials
    elif cookie_token:
        token = cookie_token

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_access_token(token)
    raw_sub = payload.get("sub")
    try:
        user_id = int(raw_sub)
    except (TypeError, ValueError) as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authentication credentials") from exc
    user = db.get(User, user_id)
    if user is None or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User is inactive or not found")
    return user


def require_tutor(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role not in {"tutor", "admin"}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Tutor role required")
    return current_user


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin role required")
    return current_user
