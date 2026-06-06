from __future__ import annotations

import os
from typing import Any

from sqlalchemy import MetaData, create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.core.config import settings


class AlembicOnlyMetaData(MetaData):
    def create_all(self, *args: Any, **kwargs: Any) -> None:  # type: ignore[override]
        if os.getenv("ALLOW_METADATA_CREATE_ALL") == "1":
            return super().create_all(*args, **kwargs)
        raise RuntimeError(
            "Base.metadata.create_all() is disabled for this project. "
            "Use Alembic migrations instead, or set ALLOW_METADATA_CREATE_ALL=1 only in isolated tests."
        )


engine = create_engine(settings.database_url, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


class Base(DeclarativeBase):
    metadata = AlembicOnlyMetaData()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
