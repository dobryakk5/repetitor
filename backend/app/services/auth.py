from __future__ import annotations

from datetime import timedelta
from typing import Any

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import create_access_token, create_refresh_token_value, hash_password, hash_refresh_token, verify_password
from app.core.time import utc_now
from app.models.auth import RefreshSession, User
from app.schemas.auth import LoginRequest, RegisterRequest


def normalize_email(email: str) -> str:
    return email.strip().lower()


def serialize_user(item: User) -> dict[str, Any]:
    return {
        "id": item.id,
        "email": item.email,
        "fullName": item.full_name,
        "role": item.role,
        "isActive": item.is_active,
    }


def register_user(db: Session, payload: RegisterRequest) -> User:
    email = normalize_email(payload.email)
    existing = db.scalar(select(User).where(func.lower(User.email) == email))
    if existing is not None:
        raise HTTPException(status_code=409, detail="User with this email already exists")
    item = User(
        email=email,
        password_hash=hash_password(payload.password),
        full_name=payload.full_name.strip(),
        role="tutor",
        is_active=True,
    )
    db.add(item)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="User with this email already exists") from exc
    db.refresh(item)
    return item


def authenticate_user(db: Session, payload: LoginRequest) -> User:
    email = normalize_email(payload.email)
    item = db.scalar(select(User).where(func.lower(User.email) == email))
    if item is None or not verify_password(payload.password, item.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not item.is_active:
        raise HTTPException(status_code=403, detail="User is inactive")
    return item


def create_refresh_session(db: Session, user: User) -> tuple[RefreshSession, str]:
    raw_token = create_refresh_token_value()
    item = RefreshSession(
        user_id=user.id,
        token_hash=hash_refresh_token(raw_token),
        expires_at=utc_now() + timedelta(days=settings.refresh_token_expire_days),
    )
    db.add(item)
    db.flush()
    return item, raw_token


def revoke_refresh_session(db: Session, raw_token: str | None) -> None:
    if not raw_token:
        return
    item = db.scalar(select(RefreshSession).where(RefreshSession.token_hash == hash_refresh_token(raw_token)))
    if item is not None and item.revoked_at is None:
        item.revoked_at = utc_now()
        db.flush()


def rotate_refresh_session(db: Session, raw_token: str | None) -> tuple[User, str]:
    if not raw_token:
        raise HTTPException(status_code=401, detail="Refresh token is missing")

    now = utc_now()
    item = db.scalar(
        select(RefreshSession)
        .where(RefreshSession.token_hash == hash_refresh_token(raw_token))
        .with_for_update()
    )
    if item is None or item.revoked_at is not None or item.expires_at <= now:
        raise HTTPException(status_code=401, detail="Refresh token is invalid")

    user = db.get(User, item.user_id)
    if user is None or not user.is_active:
        raise HTTPException(status_code=401, detail="User is inactive or not found")

    item.revoked_at = now
    new_session, new_raw_token = create_refresh_session(db, user)
    item.replaced_by_id = new_session.id
    db.flush()
    return user, new_raw_token


def make_token_response(user: User) -> dict[str, Any]:
    return {
        "access_token": create_access_token(user.id),
        "token_type": "bearer",
        "user": serialize_user(user),
    }
