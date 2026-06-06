from __future__ import annotations

from datetime import date, datetime, time, timezone
from typing import Any

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Homework, Lesson, LessonMistake, LessonObservation, LessonTopicResult, MistakeType, Skill, Student, Subject, Topic
from app.schemas.tutor import HomeworkCreate, LessonObservationCreate, LessonObservationUpdate, LessonTopicResultCreate


def parse_lesson_datetime(value: str | None) -> datetime:
    if not value:
        return datetime.now(timezone.utc)
    cleaned = value.strip().replace("Z", "+00:00")
    try:
        parsed = datetime.fromisoformat(cleaned)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid lesson_date format") from exc
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed


def parse_optional_date(value: str | None) -> date | None:
    if not value:
        return None
    try:
        return date.fromisoformat(value.strip()[:10])
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid due_date format") from exc


def parse_date_filter(value: str | None, *, end: bool = False) -> datetime | None:
    if not value:
        return None
    cleaned = value.strip().replace("Z", "+00:00")
    try:
        if "T" in cleaned or ":" in cleaned:
            parsed = datetime.fromisoformat(cleaned)
        else:
            parsed_date = date.fromisoformat(cleaned[:10])
            parsed = datetime.combine(parsed_date, time.max if end else time.min)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid date filter format") from exc
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed


def item_or_404(db: Session, model: type, item_id: int, detail: str):
    item = db.get(model, item_id)
    if item is None:
        raise HTTPException(status_code=404, detail=detail)
    return item


def lesson_or_404(db: Session, lesson_id: int, *, tutor_id: int | None = None) -> Lesson:
    item = item_or_404(db, Lesson, lesson_id, "Lesson not found")
    if tutor_id is not None and item.tutor_id != tutor_id:
        raise HTTPException(status_code=404, detail="Lesson not found")
    return item


def lesson_topic_result_or_404(db: Session, result_id: int) -> LessonTopicResult:
    return item_or_404(db, LessonTopicResult, result_id, "Lesson topic result not found")


def lesson_mistake_or_404(db: Session, mistake_id: int) -> LessonMistake:
    return item_or_404(db, LessonMistake, mistake_id, "Lesson mistake not found")


def homework_or_404(db: Session, homework_id: int, *, tutor_id: int | None = None) -> Homework:
    item = item_or_404(db, Homework, homework_id, "Homework not found")
    if tutor_id is not None and item.tutor_id != tutor_id:
        raise HTTPException(status_code=404, detail="Homework not found")
    return item


OBSERVATION_FIELDS = (
    "mood_state",
    "energy_state",
    "discipline_state",
    "respect_state",
    "conversation_state",
    "argument_state",
    "answer_state",
    "concentration_score",
    "work_pace_score",
    "attention_stability_score",
    "intellectual_interest",
    "reasoning",
    "hypothesis_building",
    "inference_making",
    "task_independence_state",
    "subject_attitude",
    "answer_argumentation_state",
    "question_state",
    "extra_info_state",
    "keyword_state",
    "comment",
)


def lesson_observation_or_none(db: Session, lesson_id: int) -> LessonObservation | None:
    return db.scalar(select(LessonObservation).where(LessonObservation.lesson_id == lesson_id))


def upsert_lesson_observation(
    db: Session,
    *,
    lesson: Lesson,
    payload: LessonObservationCreate | LessonObservationUpdate,
) -> LessonObservation:
    item = lesson_observation_or_none(db, lesson.id)
    if item is None:
        item = LessonObservation(lesson_id=lesson.id, tutor_id=lesson.tutor_id)
        db.add(item)

    data = payload.model_dump(exclude_unset=True)
    for field in OBSERVATION_FIELDS:
        if field in data:
            value = data[field]
            if field == "comment" and value is not None:
                value = value.strip()
            setattr(item, field, value)
    db.flush()
    return item


def validate_student(db: Session, student_id: int, *, tutor_id: int | None = None) -> Student:
    item = item_or_404(db, Student, student_id, "Student not found")
    if tutor_id is not None and item.tutor_id != tutor_id:
        raise HTTPException(status_code=404, detail="Student not found")
    return item


def validate_subject(db: Session, subject_id: int) -> Subject:
    return item_or_404(db, Subject, subject_id, "Subject not found")


def validate_topic(db: Session, topic_id: int, *, subject_id: int | None = None, tutor_id: int | None = None) -> Topic:
    topic = item_or_404(db, Topic, topic_id, "Topic not found")
    if tutor_id is not None and topic.tutor_id not in (None, tutor_id):
        raise HTTPException(status_code=404, detail="Topic not found")
    if subject_id is not None and topic.subject_id != subject_id:
        raise HTTPException(status_code=400, detail="Topic must belong to lesson subject")
    return topic


def validate_skill(db: Session, skill_id: int | None, *, topic_id: int | None = None, tutor_id: int | None = None) -> Skill | None:
    if skill_id is None:
        return None
    skill = item_or_404(db, Skill, skill_id, "Skill not found")
    if tutor_id is not None and skill.tutor_id not in (None, tutor_id):
        raise HTTPException(status_code=404, detail="Skill not found")
    if topic_id is not None and skill.topic_id != topic_id:
        raise HTTPException(status_code=400, detail="Skill must belong to selected topic")
    return skill


def validate_mistake_type(db: Session, mistake_type_id: int, *, subject_id: int | None = None, tutor_id: int | None = None) -> MistakeType:
    mistake_type = item_or_404(db, MistakeType, mistake_type_id, "Mistake type not found")
    if tutor_id is not None and mistake_type.tutor_id not in (None, tutor_id):
        raise HTTPException(status_code=404, detail="Mistake type not found")
    if subject_id is not None and mistake_type.subject_id != subject_id:
        raise HTTPException(status_code=400, detail="Mistake type must belong to lesson subject")
    return mistake_type


def calculate_accuracy(total_tasks: int | None, correct_tasks: int | None, manual_accuracy: int | None) -> int | None:
    if total_tasks is not None and correct_tasks is not None:
        if total_tasks == 0:
            return manual_accuracy
        if correct_tasks > total_tasks:
            raise HTTPException(status_code=400, detail="correct_tasks cannot be greater than total_tasks")
        return round(correct_tasks / total_tasks * 100)
    return manual_accuracy


def calculate_progress_score(
    understanding_score: int,
    accuracy_percent: int | None,
    independence_score: int,
    attention_score: int,
) -> int:
    accuracy = accuracy_percent if accuracy_percent is not None else understanding_score
    return round(
        understanding_score * 0.35
        + accuracy * 0.30
        + independence_score * 0.25
        + attention_score * 0.10
    )


def define_mastery_status(progress_score: int, independence_score: int) -> str:
    if progress_score >= 85 and independence_score >= 50:
        return "mastered"
    if progress_score >= 70 and independence_score >= 50:
        return "almost_mastered"
    if progress_score >= 50:
        return "needs_practice"
    if progress_score >= 30:
        return "in_progress"
    return "introduced"


def define_risk_level(
    progress_score: int,
    independence_score: int,
    accuracy_percent: int | None,
    needs_repeat: bool,
) -> str:
    if needs_repeat or progress_score < 50 or independence_score < 40:
        return "high"
    if progress_score < 70 or independence_score < 60 or (accuracy_percent is not None and accuracy_percent < 65):
        return "medium"
    return "low"


def apply_calculated_fields(item: LessonTopicResult) -> None:
    item.accuracy_percent = calculate_accuracy(item.total_tasks, item.correct_tasks, item.accuracy_percent)
    progress_score = calculate_progress_score(
        item.understanding_score,
        item.accuracy_percent,
        item.independence_score,
        item.attention_score,
    )
    item.progress_score = progress_score
    item.mastery_status = define_mastery_status(progress_score, item.independence_score)
    item.risk_level = define_risk_level(
        progress_score,
        item.independence_score,
        item.accuracy_percent,
        item.needs_repeat,
    )


def create_topic_result_for_lesson(
    db: Session,
    *,
    lesson: Lesson,
    payload: LessonTopicResultCreate,
) -> LessonTopicResult:
    validate_topic(db, payload.topic_id, subject_id=lesson.subject_id, tutor_id=lesson.tutor_id)
    validate_skill(db, payload.skill_id, topic_id=payload.topic_id, tutor_id=lesson.tutor_id)
    accuracy = calculate_accuracy(payload.total_tasks, payload.correct_tasks, payload.accuracy_percent)
    progress_score = calculate_progress_score(
        payload.understanding_score,
        accuracy,
        payload.independence_score,
        payload.attention_score,
    )
    item = LessonTopicResult(
        lesson_id=lesson.id,
        topic_id=payload.topic_id,
        skill_id=payload.skill_id,
        understanding_score=payload.understanding_score,
        accuracy_percent=accuracy,
        independence_score=payload.independence_score,
        attention_score=payload.attention_score,
        speed_score=payload.speed_score,
        total_tasks=payload.total_tasks,
        correct_tasks=payload.correct_tasks,
        hint_count=payload.hint_count,
        needs_repeat=payload.needs_repeat,
        progress_score=progress_score,
        mastery_status=define_mastery_status(progress_score, payload.independence_score),
        risk_level=define_risk_level(progress_score, payload.independence_score, accuracy, payload.needs_repeat),
        comment=payload.comment,
    )
    db.add(item)
    db.flush()

    for mistake_payload in payload.mistakes:
        validate_mistake_type(db, mistake_payload.mistake_type_id, subject_id=lesson.subject_id, tutor_id=lesson.tutor_id)
        db.add(
            LessonMistake(
                lesson_topic_result_id=item.id,
                mistake_type_id=mistake_payload.mistake_type_id,
                count=mistake_payload.count,
                severity=mistake_payload.severity,
                comment=mistake_payload.comment,
            )
        )
    return item


def create_homework_for_lesson(
    db: Session,
    *,
    lesson: Lesson | None,
    payload: HomeworkCreate,
    tutor_id: int,
) -> Homework:
    if lesson is not None and payload.lesson_id is not None and payload.lesson_id != lesson.id:
        raise HTTPException(status_code=400, detail="homework lesson_id must match the lesson being created")

    student_id = payload.student_id or (lesson.student_id if lesson else None)
    if student_id is None:
        raise HTTPException(status_code=400, detail="student_id is required when homework is not linked to a lesson")
    validate_student(db, student_id, tutor_id=tutor_id)

    subject_id = payload.subject_id if payload.subject_id is not None else (lesson.subject_id if lesson else None)
    if subject_id is not None:
        validate_subject(db, subject_id)

    topic_id = payload.topic_id
    if payload.skill_id is not None:
        skill = validate_skill(db, payload.skill_id, tutor_id=tutor_id)
        if topic_id is None:
            topic_id = skill.topic_id
        validate_skill(db, payload.skill_id, topic_id=topic_id, tutor_id=tutor_id)

    if topic_id is not None:
        topic = validate_topic(db, topic_id, subject_id=subject_id, tutor_id=tutor_id)
        if subject_id is None:
            subject_id = topic.subject_id

    item = Homework(
        tutor_id=tutor_id,
        lesson_id=lesson.id if lesson else payload.lesson_id,
        student_id=student_id,
        subject_id=subject_id,
        topic_id=topic_id,
        skill_id=payload.skill_id,
        text=payload.text.strip(),
        status=payload.status,
        due_date=parse_optional_date(payload.due_date),
        completion_percent=payload.completion_percent,
        accuracy_percent=payload.accuracy_percent,
        teacher_comment=payload.teacher_comment,
    )
    db.add(item)
    db.flush()
    return item


def serialize_lesson_mistake(item: LessonMistake) -> dict[str, Any]:
    return {
        "id": item.id,
        "lessonTopicResultId": item.lesson_topic_result_id,
        "mistakeTypeId": item.mistake_type_id,
        "count": item.count,
        "severity": item.severity,
        "comment": item.comment or "",
        "createdAt": item.created_at.isoformat() if item.created_at else None,
    }


def serialize_lesson_topic_result(
    db: Session,
    item: LessonTopicResult,
    *,
    include_mistakes: bool = True,
    prefetched_mistakes: list[LessonMistake] | None = None,
) -> dict[str, Any]:
    data = {
        "id": item.id,
        "lessonId": item.lesson_id,
        "topicId": item.topic_id,
        "skillId": item.skill_id,
        "understandingScore": item.understanding_score,
        "accuracyPercent": item.accuracy_percent,
        "independenceScore": item.independence_score,
        "attentionScore": item.attention_score,
        "speedScore": item.speed_score,
        "totalTasks": item.total_tasks,
        "correctTasks": item.correct_tasks,
        "hintCount": item.hint_count,
        "needsRepeat": item.needs_repeat,
        "progressScore": item.progress_score,
        "masteryStatus": item.mastery_status,
        "riskLevel": item.risk_level,
        "comment": item.comment or "",
        "createdAt": item.created_at.isoformat() if item.created_at else None,
        "updatedAt": item.updated_at.isoformat() if item.updated_at else None,
    }
    if include_mistakes:
        if prefetched_mistakes is None:
            mistakes = list(db.scalars(
                select(LessonMistake)
                .where(LessonMistake.lesson_topic_result_id == item.id)
                .order_by(LessonMistake.id)
            ))
        else:
            mistakes = prefetched_mistakes
        data["mistakes"] = [serialize_lesson_mistake(mistake) for mistake in mistakes]
    return data


def serialize_lesson_observation(item: LessonObservation) -> dict[str, Any]:
    return {
        "id": item.id,
        "lessonId": item.lesson_id,
        "tutorId": item.tutor_id,
        "moodState": item.mood_state,
        "energyState": item.energy_state,
        "disciplineState": item.discipline_state,
        "respectState": item.respect_state,
        "conversationState": item.conversation_state,
        "argumentState": item.argument_state,
        "answerState": item.answer_state,
        "concentrationScore": item.concentration_score,
        "workPaceScore": item.work_pace_score,
        "attentionStabilityScore": item.attention_stability_score,
        "intellectualInterest": item.intellectual_interest,
        "reasoning": item.reasoning,
        "hypothesisBuilding": item.hypothesis_building,
        "inferenceMaking": item.inference_making,
        "taskIndependenceState": item.task_independence_state,
        "subjectAttitude": item.subject_attitude,
        "answerArgumentationState": item.answer_argumentation_state,
        "questionState": item.question_state,
        "extraInfoState": item.extra_info_state,
        "keywordState": item.keyword_state,
        "comment": item.comment or "",
        "createdAt": item.created_at.isoformat() if item.created_at else None,
        "updatedAt": item.updated_at.isoformat() if item.updated_at else None,
    }


def serialize_homework(item: Homework) -> dict[str, Any]:
    return {
        "id": item.id,
        "tutorId": item.tutor_id,
        "lessonId": item.lesson_id,
        "studentId": item.student_id,
        "subjectId": item.subject_id,
        "topicId": item.topic_id,
        "skillId": item.skill_id,
        "text": item.text or "",
        "status": item.status,
        "dueDate": item.due_date.isoformat() if item.due_date else None,
        "completionPercent": item.completion_percent,
        "accuracyPercent": item.accuracy_percent,
        "teacherComment": item.teacher_comment or "",
        "createdAt": item.created_at.isoformat() if item.created_at else None,
        "updatedAt": item.updated_at.isoformat() if item.updated_at else None,
    }


def serialize_lesson(db: Session, item: Lesson, *, include_details: bool = False) -> dict[str, Any]:
    data = {
        "id": item.id,
        "tutorId": item.tutor_id,
        "studentId": item.student_id,
        "subjectId": item.subject_id,
        "lessonDate": item.lesson_date.isoformat() if item.lesson_date else None,
        "durationMinutes": item.duration_minutes,
        "lessonType": item.lesson_type,
        "status": item.status,
        "generalComment": item.general_comment or "",
        "tutorComment": item.tutor_comment or "",
        "nextLessonPlan": item.next_lesson_plan or "",
        "createdAt": item.created_at.isoformat() if item.created_at else None,
        "updatedAt": item.updated_at.isoformat() if item.updated_at else None,
    }
    if include_details:
        results = list(db.scalars(
            select(LessonTopicResult)
            .where(LessonTopicResult.lesson_id == item.id)
            .order_by(LessonTopicResult.id)
        ))
        result_ids = [result.id for result in results]
        mistakes_by_result: dict[int, list[LessonMistake]] = {result_id: [] for result_id in result_ids}
        if result_ids:
            mistakes = db.scalars(
                select(LessonMistake)
                .where(LessonMistake.lesson_topic_result_id.in_(result_ids))
                .order_by(LessonMistake.lesson_topic_result_id, LessonMistake.id)
            )
            for mistake in mistakes:
                mistakes_by_result.setdefault(mistake.lesson_topic_result_id, []).append(mistake)

        homeworks = db.scalars(select(Homework).where(Homework.lesson_id == item.id).order_by(Homework.id))
        observation = lesson_observation_or_none(db, item.id)
        data["topicResults"] = [
            serialize_lesson_topic_result(db, result, prefetched_mistakes=mistakes_by_result.get(result.id, []))
            for result in results
        ]
        data["homeworks"] = [serialize_homework(homework) for homework in homeworks]
        data["observation"] = serialize_lesson_observation(observation) if observation else None
    return data
