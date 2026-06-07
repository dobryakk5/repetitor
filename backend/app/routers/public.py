from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.services.share import public_student_progress

router = APIRouter()


@router.get("/api/public/student-progress/{token}/")
def get_public_student_progress(token: str, db: Session = Depends(get_db)) -> dict[str, Any]:
    return public_student_progress(db, token)
