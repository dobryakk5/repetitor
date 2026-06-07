from __future__ import annotations

import hashlib
import secrets
from typing import Any

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.time import utc_now
from app.models import Lesson, Recommendation, Student, StudentSkillState, Subject, Topic, Skill
from app.services.analytics import analytics_summary, serialize_recommendation, serialize_skill_state
from app.services.students import serialize_student
from app.services.tutor import serialize_lesson


def hash_share_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def generate_share_token() -> str:
    return secrets.token_urlsafe(32)


def create_student_share_link(db: Session, student: Student) -> dict[str, Any]:
    token = generate_share_token()
    student.share_token_hash = hash_share_token(token)
    student.share_token_created_at = utc_now()
    db.commit()
    db.refresh(student)
    share_url = f"{settings.frontend_url.rstrip('/')}/share/{token}"
    return {
        "studentId": student.id,
        "token": token,
        "url": share_url,
        "createdAt": student.share_token_created_at.isoformat() if student.share_token_created_at else None,
    }


def student_by_share_token_or_404(db: Session, token: str) -> Student:
    if len(token) < 24:
        raise HTTPException(status_code=404, detail="Shared progress page not found")
    token_hash = hash_share_token(token)
    student = db.scalar(select(Student).where(Student.share_token_hash == token_hash, Student.is_active.is_(True)))
    if student is None:
        raise HTTPException(status_code=404, detail="Shared progress page not found")
    return student


def _subject_names(db: Session, subject_ids: set[int]) -> dict[int, str]:
    if not subject_ids:
        return {}
    return {int(subject_id): name for subject_id, name in db.execute(select(Subject.id, Subject.name).where(Subject.id.in_(subject_ids))).all()}


def _topic_names(db: Session, topic_ids: set[int]) -> dict[int, str]:
    if not topic_ids:
        return {}
    return {int(topic_id): name for topic_id, name in db.execute(select(Topic.id, Topic.name).where(Topic.id.in_(topic_ids))).all()}


def _skill_names(db: Session, skill_ids: set[int]) -> dict[int, str]:
    if not skill_ids:
        return {}
    return {int(skill_id): name for skill_id, name in db.execute(select(Skill.id, Skill.name).where(Skill.id.in_(skill_ids))).all()}


def public_student_progress(db: Session, token: str) -> dict[str, Any]:
    student = student_by_share_token_or_404(db, token)
    states = list(
        db.scalars(
            select(StudentSkillState)
            .where(StudentSkillState.student_id == student.id)
            .order_by(StudentSkillState.risk_level.desc(), StudentSkillState.current_progress_score.asc())
            .limit(12)
        )
    )
    recommendations = list(
        db.scalars(
            select(Recommendation)
            .where(
                Recommendation.student_id == student.id,
                Recommendation.tutor_id == student.tutor_id,
                Recommendation.is_done.is_(False),
            )
            .order_by(Recommendation.created_at.desc(), Recommendation.id.desc())
            .limit(8)
        )
    )
    lessons = list(
        db.scalars(
            select(Lesson)
            .where(Lesson.student_id == student.id, Lesson.tutor_id == student.tutor_id)
            .order_by(Lesson.lesson_date.desc().nulls_last(), Lesson.id.desc())
            .limit(30)
        )
    )
    lesson_payloads = [serialize_lesson(db, lesson, include_details=True) for lesson in lessons]

    lesson_subject_ids = {item["subjectId"] for item in lesson_payloads}
    lesson_topic_ids: set[int] = set()
    lesson_skill_ids: set[int] = set()
    mistake_type_ids: set[int] = set()
    for lesson_payload in lesson_payloads:
        for result in lesson_payload.get("topicResults", []):
            lesson_topic_ids.add(result["topicId"])
            if result.get("skillId") is not None:
                lesson_skill_ids.add(result["skillId"])
            for mistake in result.get("mistakes", []):
                mistake_type_ids.add(mistake["mistakeTypeId"])
        for homework in lesson_payload.get("homeworks", []):
            if homework.get("subjectId") is not None:
                lesson_subject_ids.add(homework["subjectId"])
            if homework.get("topicId") is not None:
                lesson_topic_ids.add(homework["topicId"])
            if homework.get("skillId") is not None:
                lesson_skill_ids.add(homework["skillId"])

    subject_names = _subject_names(db, {item.subject_id for item in states})
    lesson_subject_names = _subject_names(db, lesson_subject_ids)
    topic_names = _topic_names(db, {item.topic_id for item in states} | {item.topic_id for item in recommendations if item.topic_id is not None} | lesson_topic_ids)
    skill_names = _skill_names(db, {item.skill_id for item in states if item.skill_id is not None} | {item.skill_id for item in recommendations if item.skill_id is not None} | lesson_skill_ids)
    mistake_names = _mistake_names(db, mistake_type_ids)

    return {
        "student": public_student_payload(db, student),
        "summary": analytics_summary(db, student.id),
        "skillStates": [
            {
                **serialize_skill_state(item),
                "subjectName": subject_names.get(item.subject_id, f"Предмет #{item.subject_id}"),
                "topicName": topic_names.get(item.topic_id, f"Тема #{item.topic_id}"),
                "skillName": skill_names.get(item.skill_id) if item.skill_id is not None else None,
            }
            for item in states
        ],
        "recommendations": [
            {
                **serialize_recommendation(item),
                "topicName": topic_names.get(item.topic_id) if item.topic_id is not None else None,
                "skillName": skill_names.get(item.skill_id) if item.skill_id is not None else None,
            }
            for item in recommendations
        ],
        "lessons": [
            enrich_public_lesson(lesson_payload, lesson_subject_names, topic_names, skill_names, mistake_names)
            for lesson_payload in lesson_payloads
        ],
        "generatedAt": utc_now().isoformat(),
        "shareCreatedAt": student.share_token_created_at.isoformat() if student.share_token_created_at else None,
    }


def public_student_payload(db: Session, student: Student) -> dict[str, Any]:
    data = serialize_student(db, student)
    return {
        "id": data["id"],
        "firstName": data["firstName"],
        "lastName": data["lastName"],
        "name": data["name"],
        "initials": data["initials"],
        "grade": data["grade"],
        "schoolClassLabel": data["schoolClassLabel"],
        "learningGoal": data["learningGoal"],
        "lessonsCount": data.get("lessonsCount", 0),
        "activeHomeworksCount": data.get("activeHomeworksCount", 0),
    }


def _mistake_names(db: Session, mistake_type_ids: set[int]) -> dict[int, str]:
    if not mistake_type_ids:
        return {}
    from app.models import MistakeType

    return {int(mistake_id): name for mistake_id, name in db.execute(select(MistakeType.id, MistakeType.name).where(MistakeType.id.in_(mistake_type_ids))).all()}


def enrich_public_lesson(
    lesson: dict[str, Any],
    subject_names: dict[int, str],
    topic_names: dict[int, str],
    skill_names: dict[int, str],
    mistake_names: dict[int, str],
) -> dict[str, Any]:
    lesson = dict(lesson)
    lesson.pop("tutorComment", None)
    lesson["subjectName"] = subject_names.get(lesson["subjectId"], f"Предмет #{lesson['subjectId']}")
    lesson["topicResults"] = [
        {
            **result,
            "topicName": topic_names.get(result["topicId"], f"Тема #{result['topicId']}"),
            "skillName": skill_names.get(result["skillId"]) if result.get("skillId") is not None else None,
            "mistakes": [
                {
                    **mistake,
                    "mistakeName": mistake_names.get(mistake["mistakeTypeId"], f"Ошибка #{mistake['mistakeTypeId']}"),
                }
                for mistake in result.get("mistakes", [])
            ],
        }
        for result in lesson.get("topicResults", [])
    ]
    lesson["homeworks"] = [
        {
            **homework,
            "subjectName": subject_names.get(homework["subjectId"], f"Предмет #{homework['subjectId']}") if homework.get("subjectId") is not None else None,
            "topicName": topic_names.get(homework["topicId"], f"Тема #{homework['topicId']}") if homework.get("topicId") is not None else None,
            "skillName": skill_names.get(homework["skillId"]) if homework.get("skillId") is not None else None,
        }
        for homework in lesson.get("homeworks", [])
    ]
    return lesson
