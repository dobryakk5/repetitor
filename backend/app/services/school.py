from __future__ import annotations

import re
from typing import Any

from fastapi import HTTPException
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.models import MistakeType, Skill, Subject, Topic, User

OwnedSchoolModel = type[Topic] | type[Skill] | type[MistakeType]



def commit_or_409(db: Session, *, detail: str = "Catalogue item already exists") -> None:
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail=detail) from exc

def slugify_code(value: str) -> str:
    code = re.sub(r"[^a-zA-Z0-9_\-]+", "_", value.strip().lower())
    code = re.sub(r"_+", "_", code).strip("_")
    return code or "item"


def owner_filter(model: OwnedSchoolModel, user: User):
    """A tutor can see system rows and rows owned by that tutor.

    Admin follows the same read rule. Admin-created school rows are system rows
    (tutor_id=NULL), so the admin catalogue view stays clean and does not mix in
    personal rows created by individual tutors.
    """
    return or_(model.tutor_id.is_(None), model.tutor_id == user.id)


def owner_clause(model: OwnedSchoolModel, tutor_id: int | None):
    return model.tutor_id.is_(None) if tutor_id is None else model.tutor_id == tutor_id


def school_item_or_404(db: Session, model: type[Subject] | type[Topic] | type[Skill] | type[MistakeType], item_id: int):
    item = db.get(model, item_id)
    if item is None:
        raise HTTPException(status_code=404, detail=f"{model.__name__} not found")
    return item


def subject_or_404(db: Session, subject_id: int) -> Subject:
    return school_item_or_404(db, Subject, subject_id)


def topic_or_404(db: Session, topic_id: int) -> Topic:
    return school_item_or_404(db, Topic, topic_id)


def skill_or_404(db: Session, skill_id: int) -> Skill:
    return school_item_or_404(db, Skill, skill_id)


def mistake_type_or_404(db: Session, mistake_type_id: int) -> MistakeType:
    return school_item_or_404(db, MistakeType, mistake_type_id)


def topic_for_user_or_404(db: Session, topic_id: int, user: User) -> Topic:
    item = db.scalar(select(Topic).where(Topic.id == topic_id, owner_filter(Topic, user)))
    if item is None:
        raise HTTPException(status_code=404, detail="Topic not found")
    return item


def skill_for_user_or_404(db: Session, skill_id: int, user: User) -> Skill:
    item = db.scalar(select(Skill).where(Skill.id == skill_id, owner_filter(Skill, user)))
    if item is None:
        raise HTTPException(status_code=404, detail="Skill not found")
    return item


def mistake_type_for_user_or_404(db: Session, mistake_type_id: int, user: User) -> MistakeType:
    item = db.scalar(select(MistakeType).where(MistakeType.id == mistake_type_id, owner_filter(MistakeType, user)))
    if item is None:
        raise HTTPException(status_code=404, detail="Mistake type not found")
    return item


def target_tutor_id_for_create(user: User) -> int | None:
    return None if user.role == "admin" else user.id


def ensure_can_edit_owned_item(user: User, item: Topic | Skill | MistakeType) -> None:
    if item.tutor_id is None:
        if user.role != "admin":
            raise HTTPException(status_code=403, detail="Only admin can edit system catalogue items")
        return
    if item.tutor_id != user.id:
        raise HTTPException(status_code=404, detail=f"{item.__class__.__name__} not found")


def ensure_owner_can_use_parent(parent: Topic, *, child_tutor_id: int | None) -> None:
    if child_tutor_id is None and parent.tutor_id is not None:
        raise HTTPException(status_code=400, detail="System topic cannot have a personal parent topic")
    if child_tutor_id is not None and parent.tutor_id not in (None, child_tutor_id):
        raise HTTPException(status_code=400, detail="Parent topic belongs to another tutor")


def ensure_owner_can_use_topic(topic: Topic, *, child_tutor_id: int | None) -> None:
    if child_tutor_id is None and topic.tutor_id is not None:
        raise HTTPException(status_code=400, detail="System skill cannot belong to a personal topic")
    if child_tutor_id is not None and topic.tutor_id not in (None, child_tutor_id):
        raise HTTPException(status_code=400, detail="Topic belongs to another tutor")


def serialize_subject(item: Subject) -> dict[str, Any]:
    return {
        "id": item.id,
        "name": item.name,
        "code": item.code,
        "isActive": item.is_active,
        "createdAt": item.created_at.isoformat() if item.created_at else None,
        "updatedAt": item.updated_at.isoformat() if item.updated_at else None,
    }


def serialize_topic(item: Topic) -> dict[str, Any]:
    return {
        "id": item.id,
        "subjectId": item.subject_id,
        "tutorId": item.tutor_id,
        "isSystem": item.tutor_id is None,
        "parentId": item.parent_id,
        "grade": item.grade,
        "name": item.name,
        "description": item.description or "",
        "sortOrder": item.sort_order,
        "isActive": item.is_active,
        "createdAt": item.created_at.isoformat() if item.created_at else None,
        "updatedAt": item.updated_at.isoformat() if item.updated_at else None,
    }


def serialize_skill(item: Skill) -> dict[str, Any]:
    return {
        "id": item.id,
        "topicId": item.topic_id,
        "tutorId": item.tutor_id,
        "isSystem": item.tutor_id is None,
        "name": item.name,
        "description": item.description or "",
        "sortOrder": item.sort_order,
        "isActive": item.is_active,
        "createdAt": item.created_at.isoformat() if item.created_at else None,
        "updatedAt": item.updated_at.isoformat() if item.updated_at else None,
    }


def serialize_mistake_type(item: MistakeType) -> dict[str, Any]:
    return {
        "id": item.id,
        "subjectId": item.subject_id,
        "tutorId": item.tutor_id,
        "isSystem": item.tutor_id is None,
        "code": item.code,
        "name": item.name,
        "description": item.description or "",
        "isActive": item.is_active,
        "createdAt": item.created_at.isoformat() if item.created_at else None,
        "updatedAt": item.updated_at.isoformat() if item.updated_at else None,
    }


def build_topic_tree(topics: list[Topic]) -> list[dict[str, Any]]:
    nodes = [{**serialize_topic(topic), "children": []} for topic in topics]
    by_id = {node["id"]: node for node in nodes}
    roots: list[dict[str, Any]] = []

    for node in nodes:
        parent_id = node["parentId"]
        parent = by_id.get(parent_id) if parent_id is not None else None
        if parent is None:
            roots.append(node)
        else:
            parent["children"].append(node)

    return roots


def ensure_subject_code_is_unique(db: Session, code: str, exclude_id: int | None = None) -> None:
    query = select(Subject).where(func.lower(Subject.code) == code.lower())
    if exclude_id is not None:
        query = query.where(Subject.id != exclude_id)
    if db.scalar(query):
        raise HTTPException(status_code=409, detail="Subject code already exists")


def ensure_topic_name_is_unique(
    db: Session,
    *,
    subject_id: int,
    parent_id: int | None,
    grade: int | None,
    name: str,
    tutor_id: int | None,
    exclude_id: int | None = None,
) -> None:
    query = select(Topic).where(
        Topic.subject_id == subject_id,
        func.lower(Topic.name) == name.lower(),
        owner_clause(Topic, tutor_id),
        Topic.parent_id.is_(None) if parent_id is None else Topic.parent_id == parent_id,
        Topic.grade.is_(None) if grade is None else Topic.grade == grade,
    )
    if exclude_id is not None:
        query = query.where(Topic.id != exclude_id)
    if db.scalar(query):
        raise HTTPException(status_code=409, detail="Topic already exists in this catalogue scope")


def ensure_skill_name_is_unique(
    db: Session,
    *,
    topic_id: int,
    name: str,
    tutor_id: int | None,
    exclude_id: int | None = None,
) -> None:
    query = select(Skill).where(Skill.topic_id == topic_id, func.lower(Skill.name) == name.lower(), owner_clause(Skill, tutor_id))
    if exclude_id is not None:
        query = query.where(Skill.id != exclude_id)
    if db.scalar(query):
        raise HTTPException(status_code=409, detail="Skill already exists in this catalogue scope")


def ensure_mistake_code_is_unique(db: Session, subject_id: int, code: str, tutor_id: int | None = None, exclude_id: int | None = None) -> None:
    query = select(MistakeType).where(
        MistakeType.subject_id == subject_id,
        func.lower(MistakeType.code) == code.lower(),
        owner_clause(MistakeType, tutor_id),
    )
    if exclude_id is not None:
        query = query.where(MistakeType.id != exclude_id)
    if db.scalar(query):
        raise HTTPException(status_code=409, detail="Mistake code already exists in this catalogue scope")
