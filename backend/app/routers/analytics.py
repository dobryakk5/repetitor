from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.pagination import LimitQuery, OffsetQuery, apply_pagination
from app.core.security import require_tutor
from app.models import Recommendation, StudentSkillHistory, StudentSkillState, User
from app.schemas.analytics import (
    AnalyticsOverviewResponse,
    AnalyticsSummaryResponse,
    MistakeSummaryResponse,
    RecommendationResponse,
    RecommendationUpdate,
    SkillHistoryResponse,
    SkillStateResponse,
)
from app.services.analytics import (
    analytics_overview,
    analytics_summary,
    mistake_summary,
    serialize_recommendation,
    serialize_skill_history,
    serialize_skill_state,
)
from app.services.tutor import validate_student, validate_topic

router = APIRouter()


def owned_student_or_404(db: Session, student_id: int, current_user: User):
    return validate_student(db, student_id, tutor_id=current_user.id)


@router.get("/api/analytics/students/{student_id}/overview/", response_model=AnalyticsOverviewResponse)
def get_student_analytics_overview(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_tutor),
) -> dict[str, Any]:
    owned_student_or_404(db, student_id, current_user)
    return analytics_overview(db, student_id)


@router.get("/api/analytics/students/{student_id}/summary/", response_model=AnalyticsSummaryResponse)
def get_student_analytics_summary(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_tutor),
) -> dict[str, Any]:
    owned_student_or_404(db, student_id, current_user)
    return analytics_summary(db, student_id)


@router.get("/api/analytics/students/{student_id}/topics/", response_model=list[SkillStateResponse])
def get_student_topic_states(
    student_id: int,
    limit: LimitQuery = 100,
    offset: OffsetQuery = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_tutor),
) -> list[dict[str, Any]]:
    owned_student_or_404(db, student_id, current_user)
    query = (
        select(StudentSkillState)
        .where(StudentSkillState.student_id == student_id)
        .order_by(StudentSkillState.risk_level.desc(), StudentSkillState.current_progress_score.asc())
    )
    items = db.scalars(apply_pagination(query, limit, offset))
    return [serialize_skill_state(item) for item in items]


@router.get("/api/analytics/students/{student_id}/topics/{topic_id}/history/", response_model=list[SkillHistoryResponse])
def get_student_topic_history(
    student_id: int,
    topic_id: int,
    limit: LimitQuery = 200,
    offset: OffsetQuery = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_tutor),
) -> list[dict[str, Any]]:
    owned_student_or_404(db, student_id, current_user)
    validate_topic(db, topic_id, tutor_id=current_user.id)
    query = (
        select(StudentSkillHistory)
        .where(StudentSkillHistory.student_id == student_id, StudentSkillHistory.topic_id == topic_id)
        .order_by(StudentSkillHistory.created_at.asc(), StudentSkillHistory.id.asc())
    )
    items = db.scalars(apply_pagination(query, limit, offset))
    return [serialize_skill_history(item) for item in items]


@router.get("/api/analytics/students/{student_id}/progress/", response_model=list[SkillHistoryResponse])
def get_student_progress_history(
    student_id: int,
    limit: LimitQuery = 200,
    offset: OffsetQuery = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_tutor),
) -> list[dict[str, Any]]:
    owned_student_or_404(db, student_id, current_user)
    query = (
        select(StudentSkillHistory)
        .where(StudentSkillHistory.student_id == student_id)
        .order_by(StudentSkillHistory.created_at.asc(), StudentSkillHistory.id.asc())
    )
    items = db.scalars(apply_pagination(query, limit, offset))
    return [serialize_skill_history(item) for item in items]


@router.get("/api/analytics/students/{student_id}/mistakes/", response_model=list[MistakeSummaryResponse])
def get_student_mistakes(
    student_id: int,
    limit: LimitQuery = 100,
    offset: OffsetQuery = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_tutor),
) -> list[dict[str, Any]]:
    owned_student_or_404(db, student_id, current_user)
    items = mistake_summary(db, student_id)
    return items[offset:offset + limit]


@router.get("/api/analytics/students/{student_id}/recommendations/", response_model=list[RecommendationResponse])
def get_student_recommendations(
    student_id: int,
    is_done: bool | None = False,
    limit: LimitQuery = 100,
    offset: OffsetQuery = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_tutor),
) -> list[dict[str, Any]]:
    owned_student_or_404(db, student_id, current_user)
    filters = [Recommendation.student_id == student_id, Recommendation.tutor_id == current_user.id]
    if is_done is not None:
        filters.append(Recommendation.is_done == is_done)
    query = select(Recommendation).where(*filters).order_by(Recommendation.created_at.desc(), Recommendation.id.desc())
    items = db.scalars(apply_pagination(query, limit, offset))
    return [serialize_recommendation(item) for item in items]


@router.patch("/api/analytics/recommendations/{recommendation_id}/", response_model=RecommendationResponse)
def update_recommendation(
    recommendation_id: int,
    payload: RecommendationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_tutor),
) -> dict[str, Any]:
    item = db.get(Recommendation, recommendation_id)
    if item is None or item.tutor_id != current_user.id:
        raise HTTPException(status_code=404, detail="Recommendation not found")
    if payload.is_done is not None:
        item.is_done = payload.is_done
    if payload.priority is not None:
        item.priority = payload.priority
    if payload.text is not None:
        item.text = payload.text
    db.commit()
    db.refresh(item)
    return serialize_recommendation(item)
