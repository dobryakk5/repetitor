from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.pagination import LimitQuery, OffsetQuery, apply_pagination
from app.core.security import require_admin, require_tutor
from app.models import MistakeType, Skill, Subject, Topic, User
from app.schemas.school import (
    MistakeTypeCreate,
    MistakeTypeResponse,
    MistakeTypeUpdate,
    SkillCreate,
    SkillResponse,
    SkillUpdate,
    SubjectCreate,
    SubjectResponse,
    SubjectUpdate,
    TopicCreate,
    TopicResponse,
    TopicTreeResponse,
    TopicUpdate,
)
from app.services.school import (
    build_topic_tree,
    commit_or_409,
    ensure_can_edit_owned_item,
    ensure_mistake_code_is_unique,
    ensure_owner_can_use_parent,
    ensure_owner_can_use_topic,
    ensure_skill_name_is_unique,
    ensure_subject_code_is_unique,
    ensure_topic_name_is_unique,
    mistake_type_for_user_or_404,
    owner_filter,
    serialize_mistake_type,
    serialize_skill,
    serialize_subject,
    serialize_topic,
    skill_for_user_or_404,
    slugify_code,
    subject_or_404,
    target_tutor_id_for_create,
    topic_for_user_or_404,
)

router = APIRouter(dependencies=[Depends(require_tutor)])


def _active_filter(model, is_active: bool | None):
    return [] if is_active is None else [model.is_active.is_(is_active)]


@router.get("/api/school/subjects/", response_model=list[SubjectResponse])
def list_subjects(is_active: bool | None = None, limit: LimitQuery = 100, offset: OffsetQuery = 0, db: Session = Depends(get_db)) -> list[dict[str, Any]]:
    query = select(Subject).where(*_active_filter(Subject, is_active)).order_by(Subject.name, Subject.id)
    return [serialize_subject(item) for item in db.scalars(apply_pagination(query, limit, offset))]


@router.post("/api/school/subjects/", response_model=SubjectResponse)
def create_subject(payload: SubjectCreate, db: Session = Depends(get_db), _admin: Any = Depends(require_admin)) -> dict[str, Any]:
    name = payload.name.strip()
    code = slugify_code(payload.code or name)
    ensure_subject_code_is_unique(db, code)
    item = Subject(name=name, code=code, is_active=payload.is_active)
    db.add(item)
    commit_or_409(db)
    db.refresh(item)
    return serialize_subject(item)


@router.get("/api/school/subjects/{subject_id}/", response_model=SubjectResponse)
def get_subject(subject_id: int, db: Session = Depends(get_db)) -> dict[str, Any]:
    return serialize_subject(subject_or_404(db, subject_id))


@router.patch("/api/school/subjects/{subject_id}/", response_model=SubjectResponse)
def update_subject(subject_id: int, payload: SubjectUpdate, db: Session = Depends(get_db), _admin: Any = Depends(require_admin)) -> dict[str, Any]:
    item = subject_or_404(db, subject_id)
    if payload.name is not None:
        item.name = payload.name.strip()
    if payload.code is not None:
        code = slugify_code(payload.code)
        ensure_subject_code_is_unique(db, code, exclude_id=item.id)
        item.code = code
    if payload.is_active is not None:
        item.is_active = payload.is_active
    commit_or_409(db)
    db.refresh(item)
    return serialize_subject(item)


@router.get("/api/school/topics/", response_model=list[TopicResponse])
def list_topics(
    subject_id: int | None = None,
    grade: int | None = None,
    parent_id: int | None = None,
    is_active: bool | None = None,
    limit: LimitQuery = 100,
    offset: OffsetQuery = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_tutor),
) -> list[dict[str, Any]]:
    filters = [owner_filter(Topic, current_user)]
    if subject_id is not None:
        filters.append(Topic.subject_id == subject_id)
    if grade is not None:
        filters.append(Topic.grade == grade)
    if parent_id is not None:
        filters.append(Topic.parent_id == parent_id)
    filters.extend(_active_filter(Topic, is_active))
    query = select(Topic).where(*filters).order_by(Topic.grade.nulls_last(), Topic.sort_order, Topic.name, Topic.id)
    return [serialize_topic(item) for item in db.scalars(apply_pagination(query, limit, offset))]


@router.get("/api/school/topics/tree/", response_model=list[TopicTreeResponse])
def topics_tree(
    subject_id: int,
    grade: int | None = None,
    is_active: bool | None = True,
    limit: LimitQuery = 500,
    offset: OffsetQuery = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_tutor),
) -> list[dict[str, Any]]:
    subject_or_404(db, subject_id)
    filters = [Topic.subject_id == subject_id, owner_filter(Topic, current_user)]
    if grade is not None:
        filters.append(Topic.grade == grade)
    filters.extend(_active_filter(Topic, is_active))
    query = select(Topic).where(*filters).order_by(Topic.grade.nulls_last(), Topic.sort_order, Topic.name, Topic.id)
    return build_topic_tree(list(db.scalars(apply_pagination(query, limit, offset))))


@router.post("/api/school/topics/", response_model=TopicResponse)
def create_topic(payload: TopicCreate, db: Session = Depends(get_db), current_user: User = Depends(require_tutor)) -> dict[str, Any]:
    subject_or_404(db, payload.subject_id)
    tutor_id = target_tutor_id_for_create(current_user)
    if payload.parent_id is not None:
        parent = topic_for_user_or_404(db, payload.parent_id, current_user)
        if parent.subject_id != payload.subject_id:
            raise HTTPException(status_code=400, detail="Parent topic must belong to the same subject")
        ensure_owner_can_use_parent(parent, child_tutor_id=tutor_id)
    name = payload.name.strip()
    ensure_topic_name_is_unique(
        db,
        subject_id=payload.subject_id,
        parent_id=payload.parent_id,
        grade=payload.grade,
        name=name,
        tutor_id=tutor_id,
    )
    item = Topic(
        subject_id=payload.subject_id,
        parent_id=payload.parent_id,
        tutor_id=tutor_id,
        grade=payload.grade,
        name=name,
        description=payload.description or "",
        sort_order=payload.sort_order,
        is_active=payload.is_active,
    )
    db.add(item)
    commit_or_409(db)
    db.refresh(item)
    return serialize_topic(item)


@router.get("/api/school/topics/{topic_id}/", response_model=TopicResponse)
def get_topic(topic_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_tutor)) -> dict[str, Any]:
    return serialize_topic(topic_for_user_or_404(db, topic_id, current_user))


@router.patch("/api/school/topics/{topic_id}/", response_model=TopicResponse)
def update_topic(topic_id: int, payload: TopicUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_tutor)) -> dict[str, Any]:
    item = topic_for_user_or_404(db, topic_id, current_user)
    ensure_can_edit_owned_item(current_user, item)
    target_subject_id = payload.subject_id if payload.subject_id is not None else item.subject_id
    target_parent_id = item.parent_id
    target_grade = item.grade
    target_name = item.name

    if payload.subject_id is not None:
        subject_or_404(db, payload.subject_id)
        item.subject_id = payload.subject_id
    if payload.parent_id is not None:
        if payload.parent_id == item.id:
            raise HTTPException(status_code=400, detail="Topic cannot be parent of itself")
        parent = topic_for_user_or_404(db, payload.parent_id, current_user)
        if parent.subject_id != target_subject_id:
            raise HTTPException(status_code=400, detail="Parent topic must belong to the same subject")
        ensure_owner_can_use_parent(parent, child_tutor_id=item.tutor_id)
        item.parent_id = payload.parent_id
        target_parent_id = payload.parent_id
    elif "parent_id" in payload.model_fields_set:
        item.parent_id = None
        target_parent_id = None
    if payload.grade is not None or "grade" in payload.model_fields_set:
        item.grade = payload.grade
        target_grade = payload.grade
    if payload.name is not None:
        item.name = payload.name.strip()
        target_name = item.name
    if payload.model_fields_set & {"name", "subject_id", "parent_id", "grade"}:
        ensure_topic_name_is_unique(
            db,
            subject_id=target_subject_id,
            parent_id=target_parent_id,
            grade=target_grade,
            name=target_name,
            tutor_id=item.tutor_id,
            exclude_id=item.id,
        )
    if payload.description is not None:
        item.description = payload.description
    if payload.sort_order is not None:
        item.sort_order = payload.sort_order
    if payload.is_active is not None:
        item.is_active = payload.is_active
    commit_or_409(db)
    db.refresh(item)
    return serialize_topic(item)


@router.get("/api/school/skills/", response_model=list[SkillResponse])
def list_skills(
    topic_id: int | None = None,
    is_active: bool | None = None,
    limit: LimitQuery = 100,
    offset: OffsetQuery = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_tutor),
) -> list[dict[str, Any]]:
    filters = [owner_filter(Skill, current_user)]
    if topic_id is not None:
        topic_for_user_or_404(db, topic_id, current_user)
        filters.append(Skill.topic_id == topic_id)
    filters.extend(_active_filter(Skill, is_active))
    query = select(Skill).where(*filters).order_by(Skill.sort_order, Skill.name, Skill.id)
    return [serialize_skill(item) for item in db.scalars(apply_pagination(query, limit, offset))]


@router.post("/api/school/skills/", response_model=SkillResponse)
def create_skill(payload: SkillCreate, db: Session = Depends(get_db), current_user: User = Depends(require_tutor)) -> dict[str, Any]:
    topic = topic_for_user_or_404(db, payload.topic_id, current_user)
    tutor_id = target_tutor_id_for_create(current_user)
    ensure_owner_can_use_topic(topic, child_tutor_id=tutor_id)
    name = payload.name.strip()
    ensure_skill_name_is_unique(db, topic_id=payload.topic_id, name=name, tutor_id=tutor_id)
    item = Skill(
        topic_id=payload.topic_id,
        tutor_id=tutor_id,
        name=name,
        description=payload.description or "",
        sort_order=payload.sort_order,
        is_active=payload.is_active,
    )
    db.add(item)
    commit_or_409(db)
    db.refresh(item)
    return serialize_skill(item)


@router.get("/api/school/skills/{skill_id}/", response_model=SkillResponse)
def get_skill(skill_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_tutor)) -> dict[str, Any]:
    return serialize_skill(skill_for_user_or_404(db, skill_id, current_user))


@router.patch("/api/school/skills/{skill_id}/", response_model=SkillResponse)
def update_skill(skill_id: int, payload: SkillUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_tutor)) -> dict[str, Any]:
    item = skill_for_user_or_404(db, skill_id, current_user)
    ensure_can_edit_owned_item(current_user, item)
    target_topic_id = payload.topic_id if payload.topic_id is not None else item.topic_id
    target_name = item.name
    if payload.topic_id is not None:
        topic = topic_for_user_or_404(db, payload.topic_id, current_user)
        ensure_owner_can_use_topic(topic, child_tutor_id=item.tutor_id)
        item.topic_id = payload.topic_id
    if payload.name is not None:
        item.name = payload.name.strip()
        target_name = item.name
    if payload.model_fields_set & {"name", "topic_id"}:
        ensure_skill_name_is_unique(db, topic_id=target_topic_id, name=target_name, tutor_id=item.tutor_id, exclude_id=item.id)
    if payload.description is not None:
        item.description = payload.description
    if payload.sort_order is not None:
        item.sort_order = payload.sort_order
    if payload.is_active is not None:
        item.is_active = payload.is_active
    commit_or_409(db)
    db.refresh(item)
    return serialize_skill(item)


@router.get("/api/school/mistake-types/", response_model=list[MistakeTypeResponse])
def list_mistake_types(
    subject_id: int | None = None,
    is_active: bool | None = None,
    limit: LimitQuery = 100,
    offset: OffsetQuery = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_tutor),
) -> list[dict[str, Any]]:
    filters = [owner_filter(MistakeType, current_user)]
    if subject_id is not None:
        filters.append(MistakeType.subject_id == subject_id)
    filters.extend(_active_filter(MistakeType, is_active))
    query = select(MistakeType).where(*filters).order_by(MistakeType.name, MistakeType.id)
    return [serialize_mistake_type(item) for item in db.scalars(apply_pagination(query, limit, offset))]


@router.post("/api/school/mistake-types/", response_model=MistakeTypeResponse)
def create_mistake_type(payload: MistakeTypeCreate, db: Session = Depends(get_db), current_user: User = Depends(require_tutor)) -> dict[str, Any]:
    subject_or_404(db, payload.subject_id)
    tutor_id = target_tutor_id_for_create(current_user)
    code = slugify_code(payload.code or payload.name)
    ensure_mistake_code_is_unique(db, payload.subject_id, code, tutor_id=tutor_id)
    item = MistakeType(
        subject_id=payload.subject_id,
        tutor_id=tutor_id,
        code=code,
        name=payload.name.strip(),
        description=payload.description or "",
        is_active=payload.is_active,
    )
    db.add(item)
    commit_or_409(db)
    db.refresh(item)
    return serialize_mistake_type(item)


@router.get("/api/school/mistake-types/{mistake_type_id}/", response_model=MistakeTypeResponse)
def get_mistake_type(mistake_type_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_tutor)) -> dict[str, Any]:
    return serialize_mistake_type(mistake_type_for_user_or_404(db, mistake_type_id, current_user))


@router.patch("/api/school/mistake-types/{mistake_type_id}/", response_model=MistakeTypeResponse)
def update_mistake_type(mistake_type_id: int, payload: MistakeTypeUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_tutor)) -> dict[str, Any]:
    item = mistake_type_for_user_or_404(db, mistake_type_id, current_user)
    ensure_can_edit_owned_item(current_user, item)
    target_subject_id = payload.subject_id if payload.subject_id is not None else item.subject_id
    target_code = item.code
    if payload.subject_id is not None:
        subject_or_404(db, payload.subject_id)
        item.subject_id = payload.subject_id
    if payload.code is not None:
        target_code = slugify_code(payload.code)
        item.code = target_code
    if payload.model_fields_set & {"code", "subject_id"}:
        ensure_mistake_code_is_unique(db, target_subject_id, target_code, tutor_id=item.tutor_id, exclude_id=item.id)
    if payload.name is not None:
        item.name = payload.name.strip()
    if payload.description is not None:
        item.description = payload.description
    if payload.is_active is not None:
        item.is_active = payload.is_active
    commit_or_409(db)
    db.refresh(item)
    return serialize_mistake_type(item)
