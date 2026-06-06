from __future__ import annotations

from collections import defaultdict
from datetime import datetime, timedelta, timezone
from typing import Any

from fastapi import HTTPException
from sqlalchemy import delete, func, select, text
from sqlalchemy.orm import Session
from sqlalchemy.dialects.postgresql import insert as pg_insert

from app.models import (
    Homework,
    Lesson,
    LessonMistake,
    LessonTopicResult,
    MistakeType,
    Recommendation,
    Student,
    StudentSkillHistory,
    StudentSkillState,
    Subject,
    Topic,
    Skill,
)
from app.services.tutor import apply_calculated_fields, define_mastery_status, define_risk_level


def smooth(old_value: int | None, new_value: int | None, weight: float) -> int | None:
    if new_value is None:
        return old_value
    if old_value is None:
        return new_value
    return round(old_value * (1 - weight) + new_value * weight)


def lesson_weight(lesson_type: str) -> float:
    normalized = (lesson_type or "").lower()
    if normalized in {"test", "control", "exam", "assessment", "контрольная"}:
        return 0.7
    if normalized in {"new_topic", "intro", "new", "новая тема"}:
        return 0.3
    return 0.4


def skill_state_filter(student_id: int, topic_id: int, skill_id: int | None):
    clauses = [
        StudentSkillState.student_id == student_id,
        StudentSkillState.topic_id == topic_id,
    ]
    if skill_id is None:
        clauses.append(StudentSkillState.skill_id.is_(None))
    else:
        clauses.append(StudentSkillState.skill_id == skill_id)
    return clauses


def get_state(
    db: Session,
    student_id: int,
    topic_id: int,
    skill_id: int | None,
    *,
    for_update: bool = False,
) -> StudentSkillState | None:
    query = select(StudentSkillState).where(*skill_state_filter(student_id, topic_id, skill_id))
    if for_update:
        query = query.with_for_update()
    return db.scalar(query)


def _ensure_skill_state_row(
    db: Session,
    *,
    lesson: Lesson,
    result: LessonTopicResult,
    accuracy: int | None,
    progress_score: int,
) -> StudentSkillState:
    """Create the state row atomically if it is absent, then lock it for update.

    PostgreSQL uses a functional unique index over COALESCE(skill_id, 0), so
    concurrent lesson saves for the same student/topic/skill cannot create two
    StudentSkillState rows. Existing rows are locked before the smoothing update.
    """
    values = dict(
        student_id=lesson.student_id,
        subject_id=lesson.subject_id,
        topic_id=result.topic_id,
        skill_id=result.skill_id,
        current_understanding=result.understanding_score,
        current_accuracy=accuracy,
        current_independence=result.independence_score,
        current_attention=result.attention_score,
        current_progress_score=progress_score,
        mastery_status=result.mastery_status,
        risk_level=result.risk_level,
        last_lesson_id=lesson.id,
        last_practiced_at=lesson.lesson_date,
    )

    if db.get_bind().dialect.name == "postgresql":
        stmt = (
            pg_insert(StudentSkillState)
            .values(**values)
            .on_conflict_do_nothing(
                index_elements=[
                    StudentSkillState.student_id,
                    StudentSkillState.topic_id,
                    text("COALESCE(skill_id, 0)"),
                ]
            )
        )
        db.execute(stmt)
        db.flush()
    else:
        state = get_state(db, lesson.student_id, result.topic_id, result.skill_id, for_update=True)
        if state is None:
            db.add(StudentSkillState(**values))
            db.flush()

    state = get_state(db, lesson.student_id, result.topic_id, result.skill_id, for_update=True)
    if state is None:
        raise HTTPException(status_code=500, detail="Student skill state was not created")
    return state


def recalculate_lesson_analytics(db: Session, lesson_id: int) -> None:
    lesson = db.get(Lesson, lesson_id)
    if lesson is None:
        raise HTTPException(status_code=404, detail="Lesson not found")

    results = list(db.scalars(select(LessonTopicResult).where(LessonTopicResult.lesson_id == lesson.id).order_by(LessonTopicResult.id)))
    # История навыков для урока является пересчитываемым снапшотом.
    # При повторном recalculate_lesson_analytics не копим дубли за тот же урок.
    db.execute(delete(StudentSkillHistory).where(StudentSkillHistory.lesson_id == lesson.id))
    # Lesson-level recommendations are regenerated from current lesson facts.
    db.execute(delete(Recommendation).where(Recommendation.lesson_id == lesson.id, Recommendation.is_done.is_(False)))

    repeated_mistakes_by_result = repeated_mistakes_for_results(db, lesson, results)

    for result in results:
        apply_calculated_fields(result)
        db.flush()
        update_skill_state_from_result(db, lesson, result)
        create_recommendations_for_result(
            db,
            lesson,
            result,
            repeated_mistakes=repeated_mistakes_by_result.get(result.id, []),
        )


def update_skill_state_from_result(db: Session, lesson: Lesson, result: LessonTopicResult) -> StudentSkillState:
    weight = lesson_weight(lesson.lesson_type)
    accuracy = result.accuracy_percent
    progress_score = result.progress_score or 0

    state = _ensure_skill_state_row(
        db,
        lesson=lesson,
        result=result,
        accuracy=accuracy,
        progress_score=progress_score,
    )
    state.subject_id = lesson.subject_id
    state.current_understanding = smooth(state.current_understanding, result.understanding_score, weight) or result.understanding_score
    state.current_accuracy = smooth(state.current_accuracy, accuracy, weight)
    state.current_independence = smooth(state.current_independence, result.independence_score, weight) or result.independence_score
    state.current_attention = smooth(state.current_attention, result.attention_score, weight) or result.attention_score
    state.current_progress_score = smooth(state.current_progress_score, progress_score, weight) or progress_score
    state.mastery_status = define_mastery_status(state.current_progress_score, state.current_independence)
    state.risk_level = define_risk_level(
        state.current_progress_score,
        state.current_independence,
        state.current_accuracy,
        result.needs_repeat,
    )
    state.last_lesson_id = lesson.id
    state.last_practiced_at = lesson.lesson_date
    state.updated_at = datetime.now(timezone.utc)
    db.flush()

    db.add(
        StudentSkillHistory(
            student_id=lesson.student_id,
            subject_id=lesson.subject_id,
            topic_id=result.topic_id,
            skill_id=result.skill_id,
            lesson_id=lesson.id,
            understanding=state.current_understanding,
            accuracy=state.current_accuracy,
            independence=state.current_independence,
            attention=state.current_attention,
            progress_score=state.current_progress_score,
            mastery_status=state.mastery_status,
            risk_level=state.risk_level,
        )
    )
    return state


def create_recommendations_for_result(
    db: Session,
    lesson: Lesson,
    result: LessonTopicResult,
    *,
    repeated_mistakes: list[tuple[str, int]] | None = None,
) -> None:
    recommendations: list[tuple[str, str, str]] = []
    progress = result.progress_score or 0
    accuracy = result.accuracy_percent

    if result.needs_repeat or result.risk_level == "high":
        recommendations.append((
            "repeat_topic",
            "high" if result.risk_level == "high" else "medium",
            "Тема требует повторения: текущий уровень освоения низкий или репетитор отметил необходимость повторить материал.",
        ))

    if accuracy is not None and accuracy >= 80 and result.independence_score < 50:
        recommendations.append((
            "reduce_hints",
            "medium",
            "Точность высокая, но самостоятельность низкая. На следующем уроке стоит дать похожие задания с меньшим количеством подсказок.",
        ))

    if accuracy is not None and accuracy < 60 and result.understanding_score >= 70:
        recommendations.append((
            "practice_technique",
            "medium",
            "Идея темы в целом понятна, но много ошибок в выполнении. Нужна короткая тренировка техники решения.",
        ))

    if result.attention_score < 50:
        recommendations.append((
            "attention_checklist",
            "medium",
            "Низкая внимательность. Стоит добавить проверку решения по шагам перед ответом.",
        ))

    if progress >= 80 and result.independence_score >= 70 and not result.needs_repeat:
        recommendations.append((
            "increase_difficulty",
            "low",
            "Навык выглядит устойчивым. Можно дать более сложные задания или перейти к задачам на применение.",
        ))

    repeated = repeated_mistakes if repeated_mistakes is not None else repeated_mistakes_for_result(db, lesson, result)
    for mistake_name, lesson_count in repeated:
        recommendations.append((
            "repeated_mistake",
            "high",
            f"Ошибка «{mistake_name}» повторяется на {lesson_count} уроках. Стоит вынести её в отдельный мини-блок.",
        ))

    seen: set[tuple[str, str]] = set()
    for rec_type, priority, text in recommendations:
        key = (rec_type, text)
        if key in seen:
            continue
        seen.add(key)
        db.add(
            Recommendation(
                tutor_id=lesson.tutor_id,
                student_id=lesson.student_id,
                lesson_id=lesson.id,
                topic_id=result.topic_id,
                skill_id=result.skill_id,
                type=rec_type,
                priority=priority,
                text=text,
            )
        )


def repeated_mistakes_for_results(
    db: Session,
    lesson: Lesson,
    results: list[LessonTopicResult],
) -> dict[int, list[tuple[str, int]]]:
    result_ids = [item.id for item in results]
    if not result_ids:
        return {}

    current_rows = db.execute(
        select(
            LessonMistake.lesson_topic_result_id,
            LessonTopicResult.topic_id,
            LessonMistake.mistake_type_id,
            LessonMistake.count,
            MistakeType.name,
        )
        .select_from(LessonMistake)
        .join(LessonTopicResult, LessonTopicResult.id == LessonMistake.lesson_topic_result_id)
        .outerjoin(MistakeType, MistakeType.id == LessonMistake.mistake_type_id)
        .where(LessonMistake.lesson_topic_result_id.in_(result_ids))
    ).all()
    if not current_rows:
        return {}

    topic_ids = {int(topic_id) for _, topic_id, _, _, _ in current_rows}
    mistake_type_ids = {int(mistake_type_id) for _, _, mistake_type_id, _, _ in current_rows}
    lesson_count_rows = db.execute(
        select(
            LessonTopicResult.topic_id,
            LessonMistake.mistake_type_id,
            func.count(func.distinct(Lesson.id)),
        )
        .select_from(LessonMistake)
        .join(LessonTopicResult, LessonTopicResult.id == LessonMistake.lesson_topic_result_id)
        .join(Lesson, Lesson.id == LessonTopicResult.lesson_id)
        .where(
            Lesson.tutor_id == lesson.tutor_id,
            Lesson.student_id == lesson.student_id,
            LessonTopicResult.topic_id.in_(topic_ids),
            LessonMistake.mistake_type_id.in_(mistake_type_ids),
        )
        .group_by(LessonTopicResult.topic_id, LessonMistake.mistake_type_id)
    ).all()
    lesson_counts = {
        (int(topic_id), int(mistake_type_id)): int(lesson_count or 0)
        for topic_id, mistake_type_id, lesson_count in lesson_count_rows
    }

    repeated: dict[int, list[tuple[str, int]]] = defaultdict(list)
    seen: set[tuple[int, int]] = set()
    for result_id, topic_id, mistake_type_id, mistake_count, mistake_name in current_rows:
        result_id = int(result_id)
        topic_id = int(topic_id)
        mistake_type_id = int(mistake_type_id)
        lesson_count = lesson_counts.get((topic_id, mistake_type_id), 0)
        if lesson_count >= 3 or int(mistake_count or 0) >= 3:
            key = (result_id, mistake_type_id)
            if key in seen:
                continue
            seen.add(key)
            repeated[result_id].append((mistake_name or f"#{mistake_type_id}", lesson_count))
    return repeated


def repeated_mistakes_for_result(db: Session, lesson: Lesson, result: LessonTopicResult) -> list[tuple[str, int]]:
    return repeated_mistakes_for_results(db, lesson, [result]).get(result.id, [])


def serialize_skill_state(item: StudentSkillState) -> dict[str, Any]:
    return {
        "id": item.id,
        "studentId": item.student_id,
        "subjectId": item.subject_id,
        "topicId": item.topic_id,
        "skillId": item.skill_id,
        "currentUnderstanding": item.current_understanding,
        "currentAccuracy": item.current_accuracy,
        "currentIndependence": item.current_independence,
        "currentAttention": item.current_attention,
        "currentProgressScore": item.current_progress_score,
        "masteryStatus": item.mastery_status,
        "riskLevel": item.risk_level,
        "lastLessonId": item.last_lesson_id,
        "lastPracticedAt": item.last_practiced_at.isoformat() if item.last_practiced_at else None,
        "createdAt": item.created_at.isoformat() if item.created_at else None,
        "updatedAt": item.updated_at.isoformat() if item.updated_at else None,
    }


def serialize_skill_history(item: StudentSkillHistory) -> dict[str, Any]:
    return {
        "id": item.id,
        "studentId": item.student_id,
        "subjectId": item.subject_id,
        "topicId": item.topic_id,
        "skillId": item.skill_id,
        "lessonId": item.lesson_id,
        "understanding": item.understanding,
        "accuracy": item.accuracy,
        "independence": item.independence,
        "attention": item.attention,
        "progressScore": item.progress_score,
        "masteryStatus": item.mastery_status,
        "riskLevel": item.risk_level,
        "createdAt": item.created_at.isoformat() if item.created_at else None,
    }


def serialize_recommendation(item: Recommendation) -> dict[str, Any]:
    return {
        "id": item.id,
        "studentId": item.student_id,
        "lessonId": item.lesson_id,
        "topicId": item.topic_id,
        "skillId": item.skill_id,
        "type": item.type,
        "priority": item.priority,
        "text": item.text,
        "isDone": item.is_done,
        "createdAt": item.created_at.isoformat() if item.created_at else None,
        "updatedAt": item.updated_at.isoformat() if item.updated_at else None,
    }


def analytics_overview(
    db: Session,
    student_id: int,
    *,
    states: list[StudentSkillState] | None = None,
) -> dict[str, Any]:
    student = db.get(Student, student_id)
    if student is None:
        raise HTTPException(status_code=404, detail="Student not found")

    if states is None:
        states = list(db.scalars(select(StudentSkillState).where(StudentSkillState.student_id == student_id)))
    lessons_count = db.scalar(select(func.count()).select_from(Lesson).where(Lesson.student_id == student_id, Lesson.tutor_id == student.tutor_id)) or 0
    active_homeworks_count = db.scalar(
        select(func.count()).select_from(Homework).where(
            Homework.student_id == student_id,
            Homework.tutor_id == student.tutor_id,
            Homework.status.in_(["assigned", "redo_required", "partially_done"]),
        )
    ) or 0
    active_recommendations_count = db.scalar(
        select(func.count()).select_from(Recommendation).where(Recommendation.student_id == student_id, Recommendation.tutor_id == student.tutor_id, Recommendation.is_done.is_(False))
    ) or 0

    avg_progress = round(sum(item.current_progress_score for item in states) / len(states)) if states else None
    high_risk_topics = sum(1 for item in states if item.risk_level == "high")
    low_risk_topics = sum(1 for item in states if item.risk_level == "low")

    return {
        "studentId": student_id,
        "lessonsCount": int(lessons_count),
        "trackedSkillsCount": len(states),
        "activeHomeworksCount": int(active_homeworks_count),
        "activeRecommendationsCount": int(active_recommendations_count),
        "averageProgressScore": avg_progress,
        "highRiskTopicsCount": high_risk_topics,
        "lowRiskTopicsCount": low_risk_topics,
    }


def mistake_summary(db: Session, student_id: int) -> list[dict[str, Any]]:
    student = db.get(Student, student_id)
    if student is None:
        raise HTTPException(status_code=404, detail="Student not found")

    rows = db.execute(
        select(
            MistakeType.id,
            MistakeType.name,
            LessonTopicResult.topic_id,
            func.sum(LessonMistake.count),
            func.count(func.distinct(Lesson.id)),
            func.max(Lesson.lesson_date),
        )
        .select_from(LessonMistake)
        .join(MistakeType, MistakeType.id == LessonMistake.mistake_type_id)
        .join(LessonTopicResult, LessonTopicResult.id == LessonMistake.lesson_topic_result_id)
        .join(Lesson, Lesson.id == LessonTopicResult.lesson_id)
        .where(Lesson.student_id == student_id, Lesson.tutor_id == student.tutor_id)
        .group_by(MistakeType.id, MistakeType.name, LessonTopicResult.topic_id)
        .order_by(func.sum(LessonMistake.count).desc())
    ).all()

    return [
        {
            "mistakeTypeId": mistake_type_id,
            "mistakeName": mistake_name,
            "topicId": topic_id,
            "count": int(total_count or 0),
            "lessonsCount": int(lesson_count or 0),
            "lastSeenAt": last_seen.isoformat() if last_seen else None,
        }
        for mistake_type_id, mistake_name, topic_id, total_count, lesson_count, last_seen in rows
    ]


def _topic_name_map(db: Session, topic_ids: set[int]) -> dict[int, str]:
    if not topic_ids:
        return {}
    rows = db.execute(select(Topic.id, Topic.name).where(Topic.id.in_(topic_ids))).all()
    return {int(topic_id): name for topic_id, name in rows}


def _skill_name_map(db: Session, skill_ids: set[int]) -> dict[int, str]:
    if not skill_ids:
        return {}
    rows = db.execute(select(Skill.id, Skill.name).where(Skill.id.in_(skill_ids))).all()
    return {int(skill_id): name for skill_id, name in rows}


def _serialize_summary_topic(
    item: StudentSkillState,
    topic_names: dict[int, str],
    skill_names: dict[int, str],
) -> dict[str, Any]:
    return {
        "topicId": item.topic_id,
        "topicName": topic_names.get(item.topic_id, f"Тема #{item.topic_id}"),
        "skillId": item.skill_id,
        "skillName": skill_names.get(item.skill_id) if item.skill_id is not None else None,
        "progressScore": item.current_progress_score,
        "riskLevel": item.risk_level,
        "masteryStatus": item.mastery_status,
        "lastPracticedAt": item.last_practiced_at.isoformat() if item.last_practiced_at else None,
    }


def _risk_sort_rank(value: str) -> int:
    return {"high": 0, "medium": 1, "low": 2}.get(value, 3)


def _skill_key(topic_id: int, skill_id: int | None) -> tuple[int, int]:
    return topic_id, skill_id or 0


def _monthly_delta(db: Session, student_id: int, current_states: list[StudentSkillState]) -> int | None:
    """Return average 30-day progress change for the same topic/skill set.

    The dashboard average still describes all currently tracked skills. The
    monthly delta intentionally compares only skills that have both a current
    state and a baseline snapshot at the 30-day cutoff, so newly added topics do
    not produce an artificial negative delta.
    """
    if not current_states:
        return None

    current_by_key = {_skill_key(item.topic_id, item.skill_id): item.current_progress_score for item in current_states}
    cutoff = datetime.now(timezone.utc) - timedelta(days=30)

    baseline_by_key: dict[tuple[int, int], int] = {}
    baseline_rows = db.scalars(
        select(StudentSkillHistory)
        .where(StudentSkillHistory.student_id == student_id, StudentSkillHistory.created_at <= cutoff)
        .order_by(
            StudentSkillHistory.topic_id.asc(),
            StudentSkillHistory.skill_id.asc().nulls_first(),
            StudentSkillHistory.created_at.desc(),
            StudentSkillHistory.id.desc(),
        )
    )
    for item in baseline_rows:
        key = _skill_key(item.topic_id, item.skill_id)
        if key in current_by_key and key not in baseline_by_key:
            baseline_by_key[key] = item.progress_score

    deltas = [current_by_key[key] - baseline for key, baseline in baseline_by_key.items()]
    if not deltas:
        return None
    return round(sum(deltas) / len(deltas))


def analytics_summary(db: Session, student_id: int) -> dict[str, Any]:
    student = db.get(Student, student_id)
    if student is None:
        raise HTTPException(status_code=404, detail="Student not found")

    states = list(db.scalars(select(StudentSkillState).where(StudentSkillState.student_id == student_id)))
    overview = analytics_overview(db, student_id, states=states)
    topic_ids = {item.topic_id for item in states}
    skill_ids = {item.skill_id for item in states if item.skill_id is not None}
    topic_names = _topic_name_map(db, topic_ids)
    skill_names = _skill_name_map(db, skill_ids)

    strong_states = sorted(
        [item for item in states if item.current_progress_score >= 75 and item.risk_level != "high"],
        key=lambda item: (-item.current_progress_score, _risk_sort_rank(item.risk_level), item.topic_id, item.skill_id or 0),
    )[:5]

    weak_states = sorted(
        [
            item for item in states
            if item.risk_level == "high"
            or item.current_progress_score < 60
            or item.mastery_status in {"introduced", "in_progress", "needs_practice"}
        ],
        key=lambda item: (_risk_sort_rank(item.risk_level), item.current_progress_score, item.topic_id, item.skill_id or 0),
    )[:5]

    repeated_mistakes = [
        item for item in mistake_summary(db, student_id)
        if item["lessonsCount"] >= 2 or item["count"] >= 3
    ][:5]

    mistake_topic_names = _topic_name_map(db, {item["topicId"] for item in repeated_mistakes if item.get("topicId") is not None})
    repeated_mistakes_payload = [
        {
            **item,
            "topicName": mistake_topic_names.get(item["topicId"], f"Тема #{item['topicId']}"),
        }
        for item in repeated_mistakes
    ]

    current_average = overview["averageProgressScore"]
    return {
        "studentId": student_id,
        "overallProgress": current_average,
        "monthlyDelta": _monthly_delta(db, student_id, states),
        "strongTopics": [_serialize_summary_topic(item, topic_names, skill_names) for item in strong_states],
        "weakTopics": [_serialize_summary_topic(item, topic_names, skill_names) for item in weak_states],
        "repeatedMistakes": repeated_mistakes_payload,
        "overview": overview,
    }

