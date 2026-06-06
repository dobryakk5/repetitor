from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Index, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.core.time import utc_now


class StudentSkillState(Base):
    __tablename__ = "student_skill_states"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("students.id", ondelete="CASCADE"), index=True, nullable=False)
    subject_id: Mapped[int] = mapped_column(ForeignKey("subjects.id", ondelete="CASCADE"), index=True, nullable=False)
    topic_id: Mapped[int] = mapped_column(ForeignKey("topics.id", ondelete="CASCADE"), index=True, nullable=False)
    skill_id: Mapped[int | None] = mapped_column(ForeignKey("skills.id", ondelete="CASCADE"), index=True, nullable=True)
    current_understanding: Mapped[int] = mapped_column(Integer, nullable=False)
    current_accuracy: Mapped[int | None] = mapped_column(Integer, nullable=True)
    current_independence: Mapped[int] = mapped_column(Integer, nullable=False)
    current_attention: Mapped[int] = mapped_column(Integer, nullable=False)
    current_progress_score: Mapped[int] = mapped_column(Integer, nullable=False)
    mastery_status: Mapped[str] = mapped_column(String(32), default="in_progress", nullable=False)
    risk_level: Mapped[str] = mapped_column(String(16), default="medium", nullable=False)
    last_lesson_id: Mapped[int | None] = mapped_column(ForeignKey("lessons.id", ondelete="SET NULL"), nullable=True)
    last_practiced_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)


Index(
    "uq_student_skill_states_student_topic_skill",
    StudentSkillState.student_id,
    StudentSkillState.topic_id,
    func.coalesce(StudentSkillState.skill_id, 0),
    unique=True,
)

class StudentSkillHistory(Base):
    __tablename__ = "student_skill_history"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("students.id", ondelete="CASCADE"), index=True, nullable=False)
    subject_id: Mapped[int] = mapped_column(ForeignKey("subjects.id", ondelete="CASCADE"), index=True, nullable=False)
    topic_id: Mapped[int] = mapped_column(ForeignKey("topics.id", ondelete="CASCADE"), index=True, nullable=False)
    skill_id: Mapped[int | None] = mapped_column(ForeignKey("skills.id", ondelete="CASCADE"), index=True, nullable=True)
    lesson_id: Mapped[int | None] = mapped_column(ForeignKey("lessons.id", ondelete="SET NULL"), index=True, nullable=True)
    understanding: Mapped[int] = mapped_column(Integer, nullable=False)
    accuracy: Mapped[int | None] = mapped_column(Integer, nullable=True)
    independence: Mapped[int] = mapped_column(Integer, nullable=False)
    attention: Mapped[int] = mapped_column(Integer, nullable=False)
    progress_score: Mapped[int] = mapped_column(Integer, nullable=False)
    mastery_status: Mapped[str] = mapped_column(String(32), nullable=False)
    risk_level: Mapped[str] = mapped_column(String(16), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)


class Recommendation(Base):
    __tablename__ = "recommendations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    tutor_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    student_id: Mapped[int] = mapped_column(ForeignKey("students.id", ondelete="CASCADE"), index=True, nullable=False)
    lesson_id: Mapped[int | None] = mapped_column(ForeignKey("lessons.id", ondelete="CASCADE"), index=True, nullable=True)
    topic_id: Mapped[int | None] = mapped_column(ForeignKey("topics.id", ondelete="SET NULL"), index=True, nullable=True)
    skill_id: Mapped[int | None] = mapped_column(ForeignKey("skills.id", ondelete="SET NULL"), index=True, nullable=True)
    type: Mapped[str] = mapped_column(String(64), nullable=False)
    priority: Mapped[str] = mapped_column(String(16), default="medium", nullable=False)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    is_done: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)
