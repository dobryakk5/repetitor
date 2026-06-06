from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.pagination import LimitQuery, OffsetQuery, apply_pagination
from app.core.security import require_tutor
from app.models import Homework, Lesson, LessonMistake, LessonTopicResult, User
from app.schemas.common import DeletedResponse
from app.schemas.tutor import (
    HomeworkCreate,
    HomeworkResponse,
    HomeworkUpdate,
    LessonCreate,
    LessonFullCreate,
    LessonMistakeCreate,
    LessonMistakeResponse,
    LessonMistakeUpdate,
    LessonResponse,
    LessonTopicResultCreate,
    LessonTopicResultResponse,
    LessonTopicResultUpdate,
    LessonUpdate,
)
from app.services.analytics import recalculate_lesson_analytics
from app.services.tutor import (
    apply_calculated_fields,
    create_homework_for_lesson,
    create_topic_result_for_lesson,
    homework_or_404,
    lesson_mistake_or_404,
    lesson_or_404,
    lesson_topic_result_or_404,
    parse_date_filter,
    parse_lesson_datetime,
    parse_optional_date,
    serialize_homework,
    serialize_lesson,
    serialize_lesson_mistake,
    serialize_lesson_topic_result,
    upsert_lesson_observation,
    validate_mistake_type,
    validate_skill,
    validate_student,
    validate_subject,
    validate_topic,
)

router = APIRouter()


@router.get("/api/lessons/", response_model=list[LessonResponse])
def list_lessons(
    student_id: int | None = None,
    subject_id: int | None = None,
    status: str | None = None,
    date_from: str | None = None,
    date_to: str | None = None,
    limit: LimitQuery = 100,
    offset: OffsetQuery = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_tutor),
) -> list[dict[str, Any]]:
    filters = [Lesson.tutor_id == current_user.id]
    if student_id is not None:
        validate_student(db, student_id, tutor_id=current_user.id)
        filters.append(Lesson.student_id == student_id)
    if subject_id is not None:
        validate_subject(db, subject_id)
        filters.append(Lesson.subject_id == subject_id)
    if status:
        filters.append(Lesson.status == status)
    parsed_from = parse_date_filter(date_from)
    parsed_to = parse_date_filter(date_to, end=True)
    if parsed_from is not None:
        filters.append(Lesson.lesson_date >= parsed_from)
    if parsed_to is not None:
        filters.append(Lesson.lesson_date <= parsed_to)
    query = select(Lesson).where(*filters).order_by(Lesson.lesson_date.desc(), Lesson.id.desc())
    items = db.scalars(apply_pagination(query, limit, offset))
    return [serialize_lesson(db, item) for item in items]


@router.post("/api/lessons/", response_model=LessonResponse)
def create_lesson(payload: LessonCreate, db: Session = Depends(get_db), current_user: User = Depends(require_tutor)) -> dict[str, Any]:
    validate_student(db, payload.student_id, tutor_id=current_user.id)
    validate_subject(db, payload.subject_id)
    item = Lesson(
        tutor_id=current_user.id,
        student_id=payload.student_id,
        subject_id=payload.subject_id,
        lesson_date=parse_lesson_datetime(payload.lesson_date),
        duration_minutes=payload.duration_minutes,
        lesson_type=payload.lesson_type,
        status=payload.status,
        general_comment=payload.general_comment,
        tutor_comment=payload.tutor_comment,
        next_lesson_plan=payload.next_lesson_plan,
    )
    db.add(item)
    db.flush()
    if payload.observation is not None:
        upsert_lesson_observation(db, lesson=item, payload=payload.observation)
    db.commit()
    db.refresh(item)
    return serialize_lesson(db, item, include_details=True)


@router.post("/api/lessons/full/", response_model=LessonResponse)
def create_full_lesson(payload: LessonFullCreate, db: Session = Depends(get_db), current_user: User = Depends(require_tutor)) -> dict[str, Any]:
    validate_student(db, payload.student_id, tutor_id=current_user.id)
    validate_subject(db, payload.subject_id)
    lesson = Lesson(
        tutor_id=current_user.id,
        student_id=payload.student_id,
        subject_id=payload.subject_id,
        lesson_date=parse_lesson_datetime(payload.lesson_date),
        duration_minutes=payload.duration_minutes,
        lesson_type=payload.lesson_type,
        status=payload.status,
        general_comment=payload.general_comment,
        tutor_comment=payload.tutor_comment,
        next_lesson_plan=payload.next_lesson_plan,
    )
    db.add(lesson)
    db.flush()

    if payload.observation is not None:
        upsert_lesson_observation(db, lesson=lesson, payload=payload.observation)

    for topic_result_payload in payload.topic_results:
        create_topic_result_for_lesson(db, lesson=lesson, payload=topic_result_payload)

    for homework_payload in payload.homeworks:
        create_homework_for_lesson(db, lesson=lesson, payload=homework_payload, tutor_id=current_user.id)

    db.flush()
    recalculate_lesson_analytics(db, lesson.id)
    db.commit()
    db.refresh(lesson)
    return {
        **serialize_lesson(db, lesson, include_details=True),
        "topicResultsCount": len(payload.topic_results),
        "homeworksCount": len(payload.homeworks),
        "message": "Lesson created",
    }


@router.get("/api/lessons/{lesson_id}/", response_model=LessonResponse)
def get_lesson(lesson_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_tutor)) -> dict[str, Any]:
    return serialize_lesson(db, lesson_or_404(db, lesson_id, tutor_id=current_user.id), include_details=True)


@router.patch("/api/lessons/{lesson_id}/", response_model=LessonResponse)
def update_lesson(lesson_id: int, payload: LessonUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_tutor)) -> dict[str, Any]:
    item = lesson_or_404(db, lesson_id, tutor_id=current_user.id)
    if payload.student_id is not None:
        validate_student(db, payload.student_id, tutor_id=current_user.id)
        item.student_id = payload.student_id
    if payload.subject_id is not None:
        validate_subject(db, payload.subject_id)
        item.subject_id = payload.subject_id
    if payload.lesson_date is not None:
        item.lesson_date = parse_lesson_datetime(payload.lesson_date)
    if payload.duration_minutes is not None:
        item.duration_minutes = payload.duration_minutes
    if payload.lesson_type is not None:
        item.lesson_type = payload.lesson_type
    if payload.status is not None:
        item.status = payload.status
    if payload.general_comment is not None:
        item.general_comment = payload.general_comment
    if payload.tutor_comment is not None:
        item.tutor_comment = payload.tutor_comment
    if payload.next_lesson_plan is not None:
        item.next_lesson_plan = payload.next_lesson_plan
    if payload.observation is not None:
        upsert_lesson_observation(db, lesson=item, payload=payload.observation)
    db.flush()
    recalculate_lesson_analytics(db, item.id)
    db.commit()
    db.refresh(item)
    return serialize_lesson(db, item, include_details=True)


@router.delete("/api/lessons/{lesson_id}/", response_model=DeletedResponse)
def delete_lesson(lesson_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_tutor)) -> dict[str, Any]:
    item = lesson_or_404(db, lesson_id, tutor_id=current_user.id)
    db.delete(item)
    db.commit()
    return {"deleted": True, "id": lesson_id}


@router.post("/api/lessons/{lesson_id}/topic-results/", response_model=LessonTopicResultResponse)
def create_lesson_topic_result(
    lesson_id: int,
    payload: LessonTopicResultCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_tutor),
) -> dict[str, Any]:
    lesson = lesson_or_404(db, lesson_id, tutor_id=current_user.id)
    item = create_topic_result_for_lesson(db, lesson=lesson, payload=payload)
    db.flush()
    recalculate_lesson_analytics(db, lesson.id)
    db.commit()
    db.refresh(item)
    return serialize_lesson_topic_result(db, item)


@router.patch("/api/lesson-topic-results/{result_id}/", response_model=LessonTopicResultResponse)
def update_lesson_topic_result(
    result_id: int,
    payload: LessonTopicResultUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_tutor),
) -> dict[str, Any]:
    item = lesson_topic_result_or_404(db, result_id)
    lesson = lesson_or_404(db, item.lesson_id, tutor_id=current_user.id)
    target_topic_id = payload.topic_id if payload.topic_id is not None else item.topic_id

    if payload.topic_id is not None:
        validate_topic(db, payload.topic_id, subject_id=lesson.subject_id, tutor_id=current_user.id)
        item.topic_id = payload.topic_id
    if payload.skill_id is not None:
        validate_skill(db, payload.skill_id, topic_id=target_topic_id, tutor_id=current_user.id)
        item.skill_id = payload.skill_id
    elif "skill_id" in payload.model_fields_set:
        item.skill_id = None
    if payload.understanding_score is not None:
        item.understanding_score = payload.understanding_score
    if payload.independence_score is not None:
        item.independence_score = payload.independence_score
    if payload.attention_score is not None:
        item.attention_score = payload.attention_score
    if payload.speed_score is not None or "speed_score" in payload.model_fields_set:
        item.speed_score = payload.speed_score
    if payload.total_tasks is not None or "total_tasks" in payload.model_fields_set:
        item.total_tasks = payload.total_tasks
    if payload.correct_tasks is not None or "correct_tasks" in payload.model_fields_set:
        item.correct_tasks = payload.correct_tasks
    if payload.accuracy_percent is not None or "accuracy_percent" in payload.model_fields_set:
        item.accuracy_percent = payload.accuracy_percent
    if payload.hint_count is not None or "hint_count" in payload.model_fields_set:
        item.hint_count = payload.hint_count
    if payload.needs_repeat is not None:
        item.needs_repeat = payload.needs_repeat
    if payload.comment is not None:
        item.comment = payload.comment

    db.flush()
    recalculate_lesson_analytics(db, lesson.id)
    db.commit()
    db.refresh(item)
    return serialize_lesson_topic_result(db, item)


@router.delete("/api/lesson-topic-results/{result_id}/", response_model=DeletedResponse)
def delete_lesson_topic_result(result_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_tutor)) -> dict[str, Any]:
    item = lesson_topic_result_or_404(db, result_id)
    lesson = lesson_or_404(db, item.lesson_id, tutor_id=current_user.id)
    lesson_id = lesson.id
    db.delete(item)
    db.flush()
    recalculate_lesson_analytics(db, lesson_id)
    db.commit()
    return {"deleted": True, "id": result_id}


@router.post("/api/lesson-topic-results/{result_id}/mistakes/", response_model=LessonMistakeResponse)
def create_lesson_mistake(
    result_id: int,
    payload: LessonMistakeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_tutor),
) -> dict[str, Any]:
    result = lesson_topic_result_or_404(db, result_id)
    lesson = lesson_or_404(db, result.lesson_id, tutor_id=current_user.id)
    validate_mistake_type(db, payload.mistake_type_id, subject_id=lesson.subject_id, tutor_id=current_user.id)
    item = LessonMistake(
        lesson_topic_result_id=result_id,
        mistake_type_id=payload.mistake_type_id,
        count=payload.count,
        severity=payload.severity,
        comment=payload.comment,
    )
    db.add(item)
    db.flush()
    recalculate_lesson_analytics(db, lesson.id)
    db.commit()
    db.refresh(item)
    return serialize_lesson_mistake(item)


@router.patch("/api/lesson-mistakes/{mistake_id}/", response_model=LessonMistakeResponse)
def update_lesson_mistake(
    mistake_id: int,
    payload: LessonMistakeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_tutor),
) -> dict[str, Any]:
    item = lesson_mistake_or_404(db, mistake_id)
    result = lesson_topic_result_or_404(db, item.lesson_topic_result_id)
    lesson = lesson_or_404(db, result.lesson_id, tutor_id=current_user.id)
    if payload.mistake_type_id is not None:
        validate_mistake_type(db, payload.mistake_type_id, subject_id=lesson.subject_id, tutor_id=current_user.id)
        item.mistake_type_id = payload.mistake_type_id
    if payload.count is not None:
        item.count = payload.count
    if payload.severity is not None:
        item.severity = payload.severity
    if payload.comment is not None:
        item.comment = payload.comment
    db.flush()
    recalculate_lesson_analytics(db, lesson.id)
    db.commit()
    db.refresh(item)
    return serialize_lesson_mistake(item)


@router.delete("/api/lesson-mistakes/{mistake_id}/", response_model=DeletedResponse)
def delete_lesson_mistake(mistake_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_tutor)) -> dict[str, Any]:
    item = lesson_mistake_or_404(db, mistake_id)
    result = lesson_topic_result_or_404(db, item.lesson_topic_result_id)
    lesson = lesson_or_404(db, result.lesson_id, tutor_id=current_user.id)
    lesson_id = lesson.id
    db.delete(item)
    db.flush()
    recalculate_lesson_analytics(db, lesson_id)
    db.commit()
    return {"deleted": True, "id": mistake_id}


@router.get("/api/homeworks/", response_model=list[HomeworkResponse])
def list_homeworks(
    student_id: int | None = None,
    lesson_id: int | None = None,
    status: str | None = None,
    subject_id: int | None = None,
    topic_id: int | None = None,
    limit: LimitQuery = 100,
    offset: OffsetQuery = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_tutor),
) -> list[dict[str, Any]]:
    filters = [Homework.tutor_id == current_user.id]
    if student_id is not None:
        validate_student(db, student_id, tutor_id=current_user.id)
        filters.append(Homework.student_id == student_id)
    if lesson_id is not None:
        lesson_or_404(db, lesson_id, tutor_id=current_user.id)
        filters.append(Homework.lesson_id == lesson_id)
    if status:
        filters.append(Homework.status == status)
    if subject_id is not None:
        validate_subject(db, subject_id)
        filters.append(Homework.subject_id == subject_id)
    if topic_id is not None:
        validate_topic(db, topic_id, tutor_id=current_user.id)
        filters.append(Homework.topic_id == topic_id)
    query = select(Homework).where(*filters).order_by(Homework.due_date.asc().nulls_last(), Homework.id.desc())
    items = db.scalars(apply_pagination(query, limit, offset))
    return [serialize_homework(item) for item in items]


@router.post("/api/homeworks/", response_model=HomeworkResponse)
def create_homework(payload: HomeworkCreate, db: Session = Depends(get_db), current_user: User = Depends(require_tutor)) -> dict[str, Any]:
    lesson = lesson_or_404(db, payload.lesson_id, tutor_id=current_user.id) if payload.lesson_id is not None else None
    item = create_homework_for_lesson(db, lesson=lesson, payload=payload, tutor_id=current_user.id)
    db.commit()
    db.refresh(item)
    return serialize_homework(item)


@router.get("/api/homeworks/{homework_id}/", response_model=HomeworkResponse)
def get_homework(homework_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_tutor)) -> dict[str, Any]:
    return serialize_homework(homework_or_404(db, homework_id, tutor_id=current_user.id))


@router.patch("/api/homeworks/{homework_id}/", response_model=HomeworkResponse)
def update_homework(homework_id: int, payload: HomeworkUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_tutor)) -> dict[str, Any]:
    item = homework_or_404(db, homework_id, tutor_id=current_user.id)
    if payload.lesson_id is not None:
        lesson = lesson_or_404(db, payload.lesson_id, tutor_id=current_user.id)
        item.lesson_id = lesson.id
        if "student_id" not in payload.model_fields_set:
            item.student_id = lesson.student_id
        if "subject_id" not in payload.model_fields_set:
            item.subject_id = lesson.subject_id
    elif "lesson_id" in payload.model_fields_set:
        item.lesson_id = None
    if payload.student_id is not None:
        validate_student(db, payload.student_id, tutor_id=current_user.id)
        item.student_id = payload.student_id
    if payload.subject_id is not None:
        validate_subject(db, payload.subject_id)
        item.subject_id = payload.subject_id
    elif "subject_id" in payload.model_fields_set:
        item.subject_id = None
    if payload.topic_id is not None:
        topic = validate_topic(db, payload.topic_id, subject_id=item.subject_id, tutor_id=current_user.id)
        item.topic_id = topic.id
        if item.subject_id is None:
            item.subject_id = topic.subject_id
    elif "topic_id" in payload.model_fields_set:
        item.topic_id = None
    if payload.skill_id is not None:
        skill = validate_skill(db, payload.skill_id, tutor_id=current_user.id)
        if item.topic_id is None:
            item.topic_id = skill.topic_id
            topic = validate_topic(db, item.topic_id, subject_id=item.subject_id, tutor_id=current_user.id)
            if item.subject_id is None:
                item.subject_id = topic.subject_id
        validate_skill(db, payload.skill_id, topic_id=item.topic_id, tutor_id=current_user.id)
        item.skill_id = payload.skill_id
    elif "skill_id" in payload.model_fields_set:
        item.skill_id = None
    if payload.text is not None:
        item.text = payload.text.strip()
    if payload.status is not None:
        item.status = payload.status
    if payload.due_date is not None or "due_date" in payload.model_fields_set:
        item.due_date = parse_optional_date(payload.due_date)
    if payload.completion_percent is not None or "completion_percent" in payload.model_fields_set:
        item.completion_percent = payload.completion_percent
    if payload.accuracy_percent is not None or "accuracy_percent" in payload.model_fields_set:
        item.accuracy_percent = payload.accuracy_percent
    if payload.teacher_comment is not None:
        item.teacher_comment = payload.teacher_comment
    db.commit()
    db.refresh(item)
    return serialize_homework(item)


@router.delete("/api/homeworks/{homework_id}/", response_model=DeletedResponse)
def delete_homework(homework_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_tutor)) -> dict[str, Any]:
    item = homework_or_404(db, homework_id, tutor_id=current_user.id)
    db.delete(item)
    db.commit()
    return {"deleted": True, "id": homework_id}
