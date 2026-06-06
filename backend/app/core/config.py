from __future__ import annotations

from pydantic import Field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "postgresql+psycopg://coachspace:coachspace@localhost:5433/coachspace"
    frontend_url: str = "http://localhost:3100"
    secret_key: str = "dev-change-me-tutortrack-secret"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 30

    auth_cookie_name: str = "access_token"
    refresh_cookie_name: str = "refresh_token"
    auth_cookie_secure: bool = False
    auth_cookie_samesite: str = Field(default="lax", pattern="^(lax|strict|none)$")

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    @field_validator("frontend_url")
    @classmethod
    def normalize_frontend_url(cls, value: str) -> str:
        return value.rstrip("/")

    @field_validator("auth_cookie_samesite", mode="before")
    @classmethod
    def normalize_cookie_samesite(cls, value: str) -> str:
        return value.lower()

    @model_validator(mode="after")
    def force_secure_cookie_for_https_frontend(self):
        if self.frontend_url.startswith("https://") or self.auth_cookie_samesite == "none":
            self.auth_cookie_secure = True
        return self


settings = Settings()
