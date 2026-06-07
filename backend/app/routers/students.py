from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.pagination import LimitQuery, OffsetQuery, apply_pagination
from app.core.security import require_tutor
from app.models import Homework, LearningGoal, Lesson, Student, StudentGroup, StudentGroupMember, User
from app.schemas.common import DeletedResponse
from app.schemas.students import (
    DashboardOverviewResponse,
    LearningGoalCreate,
    LearningGoalResponse,
    LearningGoalUpdate,
    StudentCreate,
    StudentGroupCreate,
    StudentGroupMemberCreate,
    StudentGroupResponse,
    StudentGroupUpdate,
    StudentResponse,
    StudentUpdate,
)
from app.services.students import (
    serialize_learning_goal,
    serialize_student,
    serialize_student_group,
    serialize_student_with_counts,
    student_or_404,
)
from app.services.share import create_student_share_link

router = APIRouter()


def owned_student_or_404(db: Session, student_id: int, current_user: User) -> Student:
    item = db.get(Student, student_id)
    if item is None or item.tutor_id != current_user.id:
        raise HTTPException(status_code=404, detail="Student not found")
    return item


def owned_learning_goal_or_404(db: Session, goal_id: int, current_user: User) -> LearningGoal:
    item = db.get(LearningGoal, goal_id)
    if item is None or item.tutor_id != current_user.id:
        raise HTTPException(status_code=404, detail="Learning goal not found")
    return item


def owned_student_group_or_404(db: Session, group_id: int, current_user: User) -> StudentGroup:
    item = db.get(StudentGroup, group_id)
    if item is None or item.tutor_id != current_user.id:
        raise HTTPException(status_code=404, detail="Student group not found")
    return item


@router.get("/api/dashboard/overview/", response_model=DashboardOverviewResponse)
def dashboard_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_tutor),
) -> dict[str, Any]:
    return {
        "activeStudents": db.scalar(
            select(func.count(Student.id)).where(Student.tutor_id == current_user.id, Student.is_active.is_(True))
        ) or 0,
        "lessonsCount": db.scalar(select(func.count(Lesson.id)).where(Lesson.tutor_id == current_user.id)) or 0,
        "activeHomeworks": db.scalar(
            select(func.count(Homework.id)).where(
                Homework.tutor_id == current_user.id,
                Homework.status.in_(["assigned", "redo_required", "partially_done"]),
            )
        ) or 0,
        "groupsCount": db.scalar(
            select(func.count(StudentGroup.id)).where(StudentGroup.tutor_id == current_user.id, StudentGroup.is_active.is_(True))
        ) or 0,
    }


@router.get("/api/students/", response_model=list[StudentResponse])
def list_students(
    grade: int | None = None,
    is_active: bool | None = None,
    q: str | None = None,
    limit: LimitQuery = 100,
    offset: OffsetQuery = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_tutor),
) -> list[dict[str, Any]]:
    filters = [Student.tutor_id == current_user.id]
    if grade is not None:
        filters.append(Student.grade == grade)
    if is_active is not None:
        filters.append(Student.is_active.is_(is_active))
    if q:
        pattern = f"%{q.strip()}%"
        filters.append((Student.first_name.ilike(pattern)) | (Student.last_name.ilike(pattern)) | (Student.parent_contact.ilike(pattern)))
    lessons_count_sq = (
        select(Lesson.student_id, func.count(Lesson.id).label("lessons_count"))
        .where(Lesson.tutor_id == current_user.id)
        .group_by(Lesson.student_id)
        .subquery()
    )
    active_homeworks_count_sq = (
        select(Homework.student_id, func.count(Homework.id).label("active_homeworks_count"))
        .where(
            Homework.tutor_id == current_user.id,
            Homework.status.in_(["assigned", "redo_required", "partially_done"]),
        )
        .group_by(Homework.student_id)
        .subquery()
    )
    query = (
        select(
            Student,
            func.coalesce(lessons_count_sq.c.lessons_count, 0),
            func.coalesce(active_homeworks_count_sq.c.active_homeworks_count, 0),
        )
        .outerjoin(lessons_count_sq, lessons_count_sq.c.student_id == Student.id)
        .outerjoin(active_homeworks_count_sq, active_homeworks_count_sq.c.student_id == Student.id)
        .where(*filters)
        .order_by(Student.is_active.desc(), Student.last_name, Student.first_name, Student.id)
    )
    query = apply_pagination(query, limit, offset)
    return [serialize_student_with_counts(db, item, lessons_count, active_homeworks_count) for item, lessons_count, active_homeworks_count in db.execute(query).all()]


@router.post("/api/students/", response_model=StudentResponse)
def create_student(
    payload: StudentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_tutor),
) -> dict[str, Any]:
    item = Student(
        tutor_id=current_user.id,
        first_name=payload.first_name.strip(),
        last_name=payload.last_name.strip(),
        grade=payload.grade,
        school_class_label=payload.school_class_label.strip(),
        parent_name=payload.parent_name.strip(),
        parent_contact=payload.parent_contact.strip(),
        learning_goal=payload.learning_goal.strip(),
        start_level=payload.start_level.strip(),
        comment=payload.comment.strip(),
        is_active=payload.is_active,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return serialize_student(db, item)


@router.get("/api/students/{student_id}/", response_model=StudentResponse)
def get_student(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_tutor),
) -> dict[str, Any]:
    return serialize_student(db, owned_student_or_404(db, student_id, current_user))


@router.patch("/api/students/{student_id}/", response_model=StudentResponse)
def update_student(
    student_id: int,
    payload: StudentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_tutor),
) -> dict[str, Any]:
    item = owned_student_or_404(db, student_id, current_user)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(item, field, value.strip() if isinstance(value, str) else value)
    db.commit()
    db.refresh(item)
    return serialize_student(db, item)


@router.post("/api/students/{student_id}/share-link/")
def regenerate_student_share_link(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_tutor),
) -> dict[str, Any]:
    item = owned_student_or_404(db, student_id, current_user)
    return create_student_share_link(db, item)


@router.delete("/api/students/{student_id}/", response_model=DeletedResponse)
def delete_student(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_tutor),
) -> dict[str, Any]:
    item = owned_student_or_404(db, student_id, current_user)
    db.delete(item)
    db.commit()
    return {"deleted": True, "id": student_id}


@router.get("/api/learning-goals/", response_model=list[LearningGoalResponse])
def list_learning_goals(
    student_id: int | None = None,
    limit: LimitQuery = 100,
    offset: OffsetQuery = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_tutor),
) -> list[dict[str, Any]]:
    filters = [LearningGoal.tutor_id == current_user.id]
    if student_id is not None:
        owned_student_or_404(db, student_id, current_user)
        filters.append(LearningGoal.student_id == student_id)
    query = select(LearningGoal).where(*filters).order_by(LearningGoal.created_at.desc(), LearningGoal.id.desc())
    return [serialize_learning_goal(item) for item in db.scalars(apply_pagination(query, limit, offset))]


@router.post("/api/learning-goals/", response_model=LearningGoalResponse)
def create_learning_goal(
    payload: LearningGoalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_tutor),
) -> dict[str, Any]:
    owned_student_or_404(db, payload.student_id, current_user)
    item = LearningGoal(
        tutor_id=current_user.id,
        student_id=payload.student_id,
        title=payload.title.strip(),
        description=payload.description.strip(),
        status=payload.status,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return serialize_learning_goal(item)


@router.patch("/api/learning-goals/{goal_id}/", response_model=LearningGoalResponse)
def update_learning_goal(
    goal_id: int,
    payload: LearningGoalUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_tutor),
) -> dict[str, Any]:
    item = owned_learning_goal_or_404(db, goal_id, current_user)
    if payload.title is not None:
        item.title = payload.title.strip()
    if payload.description is not None:
        item.description = payload.description.strip()
    if payload.status is not None:
        item.status = payload.status
    db.commit()
    db.refresh(item)
    return serialize_learning_goal(item)


@router.get("/api/student-groups/", response_model=list[StudentGroupResponse])
def list_student_groups(
    limit: LimitQuery = 100,
    offset: OffsetQuery = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_tutor),
) -> list[dict[str, Any]]:
    query = select(StudentGroup).where(StudentGroup.tutor_id == current_user.id).order_by(StudentGroup.name, StudentGroup.id)
    return [serialize_student_group(db, item) for item in db.scalars(apply_pagination(query, limit, offset))]


@router.post("/api/student-groups/", response_model=StudentGroupResponse)
def create_student_group(
    payload: StudentGroupCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_tutor),
) -> dict[str, Any]:
    if db.scalar(select(StudentGroup).where(StudentGroup.tutor_id == current_user.id, StudentGroup.name == payload.name.strip())):
        raise HTTPException(status_code=409, detail="Student group already exists")
    item = StudentGroup(tutor_id=current_user.id, name=payload.name.strip(), description=payload.description.strip(), is_active=payload.is_active)
    db.add(item)
    db.commit()
    db.refresh(item)
    return serialize_student_group(db, item)


@router.get("/api/student-groups/{group_id}/", response_model=StudentGroupResponse)
def get_student_group(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_tutor),
) -> dict[str, Any]:
    return serialize_student_group(db, owned_student_group_or_404(db, group_id, current_user))


@router.patch("/api/student-groups/{group_id}/", response_model=StudentGroupResponse)
def update_student_group(
    group_id: int,
    payload: StudentGroupUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_tutor),
) -> dict[str, Any]:
    item = owned_student_group_or_404(db, group_id, current_user)
    if payload.name is not None:
        item.name = payload.name.strip()
    if payload.description is not None:
        item.description = payload.description.strip()
    if payload.is_active is not None:
        item.is_active = payload.is_active
    db.commit()
    db.refresh(item)
    return serialize_student_group(db, item)


@router.post("/api/student-groups/{group_id}/members/", response_model=StudentGroupResponse)
def add_student_group_member(
    group_id: int,
    payload: StudentGroupMemberCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_tutor),
) -> dict[str, Any]:
    owned_student_group_or_404(db, group_id, current_user)
    owned_student_or_404(db, payload.student_id, current_user)
    exists = db.scalar(select(StudentGroupMember).where(StudentGroupMember.group_id == group_id, StudentGroupMember.student_id == payload.student_id))
    if not exists:
        db.add(StudentGroupMember(group_id=group_id, student_id=payload.student_id))
        db.commit()
    return serialize_student_group(db, owned_student_group_or_404(db, group_id, current_user))


@router.delete("/api/student-groups/{group_id}/members/{student_id}/", response_model=StudentGroupResponse)
def remove_student_group_member(
    group_id: int,
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_tutor),
) -> dict[str, Any]:
    owned_student_group_or_404(db, group_id, current_user)
    owned_student_or_404(db, student_id, current_user)
    item = db.scalar(select(StudentGroupMember).where(StudentGroupMember.group_id == group_id, StudentGroupMember.student_id == student_id))
    if item is not None:
        db.delete(item)
        db.commit()
    return serialize_student_group(db, owned_student_group_or_404(db, group_id, current_user))
