from __future__ import annotations

from fastapi import APIRouter, Cookie, Depends, Response, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.security import clear_auth_cookies, get_current_user, set_auth_cookie, set_refresh_cookie
from app.models.auth import User
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, UserPublic
from app.services.auth import (
    authenticate_user,
    create_refresh_session,
    make_token_response,
    register_user,
    revoke_refresh_session,
    rotate_refresh_session,
    serialize_user,
)

router = APIRouter()


def _issue_auth_response(db: Session, user: User, response: Response) -> dict:
    token_response = make_token_response(user)
    _, refresh_token = create_refresh_session(db, user)
    db.commit()
    set_auth_cookie(response, token_response["access_token"])
    set_refresh_cookie(response, refresh_token)
    return token_response


@router.post("/api/auth/register/", response_model=TokenResponse)
def register(payload: RegisterRequest, response: Response, db: Session = Depends(get_db)):
    user = register_user(db, payload)
    return _issue_auth_response(db, user, response)


@router.post("/api/auth/login/", response_model=TokenResponse)
def login(payload: LoginRequest, response: Response, db: Session = Depends(get_db)):
    user = authenticate_user(db, payload)
    return _issue_auth_response(db, user, response)


@router.post("/api/auth/refresh/", response_model=TokenResponse)
def refresh(
    response: Response,
    refresh_token: str | None = Cookie(default=None, alias=settings.refresh_cookie_name),
    db: Session = Depends(get_db),
):
    user, new_refresh_token = rotate_refresh_session(db, refresh_token)
    token_response = make_token_response(user)
    db.commit()
    set_auth_cookie(response, token_response["access_token"])
    set_refresh_cookie(response, new_refresh_token)
    return token_response


@router.post("/api/auth/logout/", response_model=None)
def logout(
    response: Response,
    refresh_token: str | None = Cookie(default=None, alias=settings.refresh_cookie_name),
    db: Session = Depends(get_db),
) -> None:
    revoke_refresh_session(db, refresh_token)
    db.commit()
    clear_auth_cookies(response)
    response.status_code = status.HTTP_204_NO_CONTENT


@router.get("/api/auth/me/", response_model=UserPublic)
def me(current_user: User = Depends(get_current_user)):
    return serialize_user(current_user)
