from __future__ import annotations

from pydantic import BaseModel, Field


class StudentCreate(BaseModel):
    first_name: str = Field(min_length=1, max_length=120)
    last_name: str = Field(default="", max_length=120)
    grade: int | None = Field(default=None, ge=1, le=11)
    school_class_label: str = Field(default="", max_length=64)
    parent_name: str = Field(default="", max_length=255)
    parent_contact: str = Field(default="", max_length=255)
    learning_goal: str = ""
    start_level: str = ""
    comment: str = ""
    is_active: bool = True


class StudentUpdate(BaseModel):
    first_name: str | None = Field(default=None, min_length=1, max_length=120)
    last_name: str | None = Field(default=None, max_length=120)
    grade: int | None = Field(default=None, ge=1, le=11)
    school_class_label: str | None = Field(default=None, max_length=64)
    parent_name: str | None = Field(default=None, max_length=255)
    parent_contact: str | None = Field(default=None, max_length=255)
    learning_goal: str | None = None
    start_level: str | None = None
    comment: str | None = None
    is_active: bool | None = None


class LearningGoalCreate(BaseModel):
    student_id: int
    title: str = Field(min_length=1, max_length=255)
    description: str = ""
    status: str = Field(default="active", pattern="^(active|done|paused|cancelled)$")


class LearningGoalUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    status: str | None = Field(default=None, pattern="^(active|done|paused|cancelled)$")


class StudentGroupCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    description: str = ""
    is_active: bool = True


class StudentGroupUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    is_active: bool | None = None


class StudentGroupMemberCreate(BaseModel):
    student_id: int


class StudentResponse(BaseModel):
    id: int
    tutor_id: int | None = Field(default=None, alias="tutorId")
    first_name: str = Field(alias="firstName")
    last_name: str = Field(alias="lastName")
    name: str
    initials: str
    grade: int | None
    school_class_label: str = Field(alias="schoolClassLabel")
    parent_name: str = Field(alias="parentName")
    parent_contact: str = Field(alias="parentContact")
    learning_goal: str = Field(alias="learningGoal")
    start_level: str = Field(alias="startLevel")
    comment: str
    is_active: bool = Field(alias="isActive")
    lessons_count: int | None = Field(default=None, alias="lessonsCount")
    active_homeworks_count: int | None = Field(default=None, alias="activeHomeworksCount")
    created_at: str | None = Field(default=None, alias="createdAt")
    updated_at: str | None = Field(default=None, alias="updatedAt")

    model_config = {"populate_by_name": True}


class LearningGoalResponse(BaseModel):
    id: int
    tutor_id: int = Field(alias="tutorId")
    student_id: int = Field(alias="studentId")
    title: str
    description: str
    status: str
    created_at: str | None = Field(default=None, alias="createdAt")
    updated_at: str | None = Field(default=None, alias="updatedAt")

    model_config = {"populate_by_name": True}


class StudentGroupResponse(BaseModel):
    id: int
    tutor_id: int = Field(alias="tutorId")
    name: str
    description: str
    is_active: bool = Field(alias="isActive")
    member_ids: list[int] = Field(alias="memberIds")
    members_count: int = Field(alias="membersCount")
    created_at: str | None = Field(default=None, alias="createdAt")
    updated_at: str | None = Field(default=None, alias="updatedAt")

    model_config = {"populate_by_name": True}


class DashboardOverviewResponse(BaseModel):
    active_students: int = Field(alias="activeStudents")
    lessons_count: int = Field(alias="lessonsCount")
    active_homeworks: int = Field(alias="activeHomeworks")
    groups_count: int = Field(alias="groupsCount")

    model_config = {"populate_by_name": True}
