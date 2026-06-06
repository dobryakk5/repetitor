from __future__ import annotations

from pydantic import BaseModel, Field


class SubjectCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    code: str | None = Field(default=None, max_length=64)
    is_active: bool = True


class SubjectUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    code: str | None = Field(default=None, min_length=1, max_length=64)
    is_active: bool | None = None


class TopicCreate(BaseModel):
    subject_id: int
    parent_id: int | None = None
    grade: int | None = Field(default=None, ge=1, le=11)
    name: str = Field(min_length=1, max_length=255)
    description: str = ""
    sort_order: int = 0
    is_active: bool = True


class TopicUpdate(BaseModel):
    subject_id: int | None = None
    parent_id: int | None = None
    grade: int | None = Field(default=None, ge=1, le=11)
    name: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    sort_order: int | None = None
    is_active: bool | None = None


class SkillCreate(BaseModel):
    topic_id: int
    name: str = Field(min_length=1, max_length=255)
    description: str = ""
    sort_order: int = 0
    is_active: bool = True


class SkillUpdate(BaseModel):
    topic_id: int | None = None
    name: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    sort_order: int | None = None
    is_active: bool | None = None


class MistakeTypeCreate(BaseModel):
    subject_id: int
    code: str | None = Field(default=None, max_length=96)
    name: str = Field(min_length=1, max_length=255)
    description: str = ""
    is_active: bool = True


class MistakeTypeUpdate(BaseModel):
    subject_id: int | None = None
    code: str | None = Field(default=None, min_length=1, max_length=96)
    name: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    is_active: bool | None = None


class SubjectResponse(BaseModel):
    id: int
    name: str
    code: str
    is_active: bool = Field(alias="isActive")
    created_at: str | None = Field(default=None, alias="createdAt")
    updated_at: str | None = Field(default=None, alias="updatedAt")

    model_config = {"populate_by_name": True}


class TopicResponse(BaseModel):
    id: int
    subject_id: int = Field(alias="subjectId")
    tutor_id: int | None = Field(default=None, alias="tutorId")
    is_system: bool = Field(alias="isSystem")
    parent_id: int | None = Field(default=None, alias="parentId")
    grade: int | None = None
    name: str
    description: str
    sort_order: int = Field(alias="sortOrder")
    is_active: bool = Field(alias="isActive")
    created_at: str | None = Field(default=None, alias="createdAt")
    updated_at: str | None = Field(default=None, alias="updatedAt")

    model_config = {"populate_by_name": True}


class TopicTreeResponse(TopicResponse):
    children: list["TopicTreeResponse"] = Field(default_factory=list)


class SkillResponse(BaseModel):
    id: int
    topic_id: int = Field(alias="topicId")
    tutor_id: int | None = Field(default=None, alias="tutorId")
    is_system: bool = Field(alias="isSystem")
    name: str
    description: str
    sort_order: int = Field(alias="sortOrder")
    is_active: bool = Field(alias="isActive")
    created_at: str | None = Field(default=None, alias="createdAt")
    updated_at: str | None = Field(default=None, alias="updatedAt")

    model_config = {"populate_by_name": True}


class MistakeTypeResponse(BaseModel):
    id: int
    subject_id: int = Field(alias="subjectId")
    tutor_id: int | None = Field(default=None, alias="tutorId")
    is_system: bool = Field(alias="isSystem")
    code: str
    name: str
    description: str
    is_active: bool = Field(alias="isActive")
    created_at: str | None = Field(default=None, alias="createdAt")
    updated_at: str | None = Field(default=None, alias="updatedAt")

    model_config = {"populate_by_name": True}
