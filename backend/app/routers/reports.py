from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.pagination import LimitQuery, OffsetQuery
from app.core.security import require_tutor
from app.models import User
from app.schemas.common import DeletedResponse
from app.schemas.reports import PeriodReportCreate, ReportResponse, ReportUpdate
from app.services.reports import (
    create_lesson_report,
    create_period_report,
    list_student_reports,
    report_or_404,
    serialize_report,
)

router = APIRouter()


@router.post("/api/reports/lessons/{lesson_id}/", response_model=ReportResponse)
def create_report_for_lesson(
    lesson_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_tutor),
) -> dict[str, Any]:
    return serialize_report(create_lesson_report(db, lesson_id, tutor_id=current_user.id))


@router.post("/api/reports/students/{student_id}/period/", response_model=ReportResponse)
def create_report_for_period(
    student_id: int,
    payload: PeriodReportCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_tutor),
) -> dict[str, Any]:
    return serialize_report(create_period_report(db, student_id, payload.period_from, payload.period_to, tutor_id=current_user.id))


@router.get("/api/reports/students/{student_id}/", response_model=list[ReportResponse])
def get_student_reports(
    student_id: int,
    report_type: str | None = None,
    limit: LimitQuery = 100,
    offset: OffsetQuery = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_tutor),
) -> list[dict[str, Any]]:
    items = list_student_reports(db, student_id, report_type, tutor_id=current_user.id)
    return [serialize_report(item) for item in items[offset:offset + limit]]


@router.get("/api/reports/{report_id}/", response_model=ReportResponse)
def get_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_tutor),
) -> dict[str, Any]:
    return serialize_report(report_or_404(db, report_id, tutor_id=current_user.id))


@router.patch("/api/reports/{report_id}/", response_model=ReportResponse)
def update_report(
    report_id: int,
    payload: ReportUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_tutor),
) -> dict[str, Any]:
    item = report_or_404(db, report_id, tutor_id=current_user.id)
    if payload.title is not None:
        item.title = payload.title.strip()
    if payload.content is not None:
        item.content = payload.content.strip()
    db.commit()
    db.refresh(item)
    return serialize_report(item)


@router.delete("/api/reports/{report_id}/", response_model=DeletedResponse)
def delete_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_tutor),
) -> dict[str, Any]:
    item = report_or_404(db, report_id, tutor_id=current_user.id)
    db.delete(item)
    db.commit()
    return {"deleted": True, "id": report_id}
