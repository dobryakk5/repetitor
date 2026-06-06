from __future__ import annotations

from pydantic import BaseModel, Field


class UserPublic(BaseModel):
    id: int
    email: str
    full_name: str = Field(alias="fullName")
    role: str
    is_active: bool = Field(alias="isActive")

    model_config = {"populate_by_name": True}


class RegisterRequest(BaseModel):
    email: str
    password: str = Field(min_length=8, max_length=128)
    full_name: str = Field(default="", alias="fullName", max_length=255)

    model_config = {"populate_by_name": True}


class LoginRequest(BaseModel):
    email: str
    password: str = Field(min_length=1, max_length=128)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserPublic
