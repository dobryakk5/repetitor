from __future__ import annotations

from typing import Any

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import Homework, LearningGoal, Lesson, Student, StudentGroup, StudentGroupMember


def initials(first_name: str, last_name: str = "") -> str:
    parts = [first_name.strip(), last_name.strip()]
    letters = [part[0].upper() for part in parts if part]
    return "".join(letters[:2]) or "У"


def student_or_404(db: Session, student_id: int) -> Student:
    item = db.get(Student, student_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Student not found")
    return item


def learning_goal_or_404(db: Session, goal_id: int) -> LearningGoal:
    item = db.get(LearningGoal, goal_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Learning goal not found")
    return item


def student_group_or_404(db: Session, group_id: int) -> StudentGroup:
    item = db.get(StudentGroup, group_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Student group not found")
    return item


def serialize_student(
    db: Session,
    item: Student,
    *,
    include_stats: bool = True,
    lessons_count: int | None = None,
    active_homeworks_count: int | None = None,
) -> dict[str, Any]:
    data = {
        "id": item.id,
        "tutorId": item.tutor_id,
        "firstName": item.first_name,
        "lastName": item.last_name,
        "name": f"{item.first_name} {item.last_name}".strip(),
        "initials": initials(item.first_name, item.last_name),
        "grade": item.grade,
        "schoolClassLabel": item.school_class_label,
        "parentName": item.parent_name,
        "parentContact": item.parent_contact,
        "learningGoal": item.learning_goal,
        "startLevel": item.start_level,
        "comment": item.comment,
        "isActive": item.is_active,
        "createdAt": item.created_at.isoformat() if item.created_at else None,
        "updatedAt": item.updated_at.isoformat() if item.updated_at else None,
    }
    if include_stats:
        if lessons_count is None:
            lessons_count = db.scalar(select(func.count(Lesson.id)).where(Lesson.student_id == item.id, Lesson.tutor_id == item.tutor_id)) or 0
        if active_homeworks_count is None:
            active_homeworks_count = db.scalar(
                select(func.count(Homework.id)).where(
                    Homework.student_id == item.id,
                    Homework.tutor_id == item.tutor_id,
                    Homework.status.in_(["assigned", "redo_required", "partially_done"]),
                )
            ) or 0
        data.update(
            {
                "lessonsCount": int(lessons_count),
                "activeHomeworksCount": int(active_homeworks_count),
            }
        )
    return data


def serialize_student_with_counts(
    db: Session,
    item: Student,
    lessons_count: int | None,
    active_homeworks_count: int | None,
) -> dict[str, Any]:
    return serialize_student(
        db,
        item,
        lessons_count=int(lessons_count or 0),
        active_homeworks_count=int(active_homeworks_count or 0),
    )


def serialize_learning_goal(item: LearningGoal) -> dict[str, Any]:
    return {
        "id": item.id,
        "tutorId": item.tutor_id,
        "studentId": item.student_id,
        "title": item.title,
        "description": item.description,
        "status": item.status,
        "createdAt": item.created_at.isoformat() if item.created_at else None,
        "updatedAt": item.updated_at.isoformat() if item.updated_at else None,
    }


def serialize_student_group(db: Session, item: StudentGroup) -> dict[str, Any]:
    member_ids = list(
        db.scalars(select(StudentGroupMember.student_id).where(StudentGroupMember.group_id == item.id).order_by(StudentGroupMember.student_id))
    )
    return {
        "id": item.id,
        "tutorId": item.tutor_id,
        "name": item.name,
        "description": item.description,
        "isActive": item.is_active,
        "memberIds": member_ids,
        "membersCount": len(member_ids),
        "createdAt": item.created_at.isoformat() if item.created_at else None,
        "updatedAt": item.updated_at.isoformat() if item.updated_at else None,
    }
