from __future__ import annotations

from datetime import date, datetime

from sqlalchemy import Boolean, CheckConstraint, Date, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.core.time import utc_now


class Lesson(Base):
    __tablename__ = "lessons"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    tutor_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    student_id: Mapped[int] = mapped_column(ForeignKey("students.id", ondelete="CASCADE"), index=True, nullable=False)
    subject_id: Mapped[int] = mapped_column(ForeignKey("subjects.id", ondelete="RESTRICT"), index=True, nullable=False)
    lesson_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True, default=utc_now, nullable=False)
    duration_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    lesson_type: Mapped[str] = mapped_column(String(64), default="practice", nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="done", nullable=False)
    general_comment: Mapped[str] = mapped_column(Text, default="")
    tutor_comment: Mapped[str] = mapped_column(Text, default="")
    next_lesson_plan: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)


class LessonObservation(Base):
    __tablename__ = "lesson_observations"
    __table_args__ = (
        UniqueConstraint("lesson_id", name="uq_lesson_observations_lesson_id"),
        CheckConstraint("concentration_score BETWEEN 1 AND 10", name="ck_lesson_observations_concentration"),
        CheckConstraint("work_pace_score BETWEEN 1 AND 10", name="ck_lesson_observations_work_pace"),
        CheckConstraint("attention_stability_score BETWEEN 1 AND 10", name="ck_lesson_observations_attention_stability"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    lesson_id: Mapped[int] = mapped_column(ForeignKey("lessons.id", ondelete="CASCADE"), index=True, nullable=False)
    tutor_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)

    # Эмоциональная сфера: переключатели.
    mood_state: Mapped[str] = mapped_column(String(32), default="stable", nullable=False)
    energy_state: Mapped[str] = mapped_column(String(32), default="active", nullable=False)

    # Поведение на занятии: переключатели.
    discipline_state: Mapped[str] = mapped_column(String(32), default="healthy_discipline", nullable=False)
    respect_state: Mapped[str] = mapped_column(String(32), default="respectful", nullable=False)
    conversation_state: Mapped[str] = mapped_column(String(48), default="comments_answers", nullable=False)
    argument_state: Mapped[str] = mapped_column(String(48), default="constructive_argument", nullable=False)
    answer_state: Mapped[str] = mapped_column(String(48), default="answers_immediately", nullable=False)

    # Работоспособность и внимание: шкала 1-10.
    concentration_score: Mapped[int] = mapped_column(Integer, default=7, nullable=False)
    work_pace_score: Mapped[int] = mapped_column(Integer, default=7, nullable=False)
    attention_stability_score: Mapped[int] = mapped_column(Integer, default=7, nullable=False)

    # Интеллектуальный труд: чеклист из 4 пунктов.
    intellectual_interest: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    reasoning: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    hypothesis_building: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    inference_making: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Самостоятельность в обучении: переключатели.
    task_independence_state: Mapped[str] = mapped_column(String(32), default="with_help", nullable=False)
    subject_attitude: Mapped[str] = mapped_column(String(32), default="neutral", nullable=False)
    answer_argumentation_state: Mapped[str] = mapped_column(String(32), default="can_argue", nullable=False)
    question_state: Mapped[str] = mapped_column(String(32), default="asks_questions", nullable=False)
    extra_info_state: Mapped[str] = mapped_column(String(48), default="does_not_search_extra_info", nullable=False)
    keyword_state: Mapped[str] = mapped_column(String(48), default="highlights_keywords", nullable=False)

    comment: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)


class LessonTopicResult(Base):
    __tablename__ = "lesson_topic_results"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    lesson_id: Mapped[int] = mapped_column(ForeignKey("lessons.id", ondelete="CASCADE"), index=True, nullable=False)
    topic_id: Mapped[int] = mapped_column(ForeignKey("topics.id", ondelete="NO ACTION", deferrable=True, initially="DEFERRED"), index=True, nullable=False)
    skill_id: Mapped[int | None] = mapped_column(ForeignKey("skills.id", ondelete="SET NULL"), index=True, nullable=True)
    understanding_score: Mapped[int] = mapped_column(Integer, nullable=False)
    accuracy_percent: Mapped[int | None] = mapped_column(Integer, nullable=True)
    independence_score: Mapped[int] = mapped_column(Integer, nullable=False)
    attention_score: Mapped[int] = mapped_column(Integer, nullable=False)
    speed_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    total_tasks: Mapped[int | None] = mapped_column(Integer, nullable=True)
    correct_tasks: Mapped[int | None] = mapped_column(Integer, nullable=True)
    hint_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    needs_repeat: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    progress_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    mastery_status: Mapped[str] = mapped_column(String(32), default="in_progress", nullable=False)
    risk_level: Mapped[str] = mapped_column(String(16), default="medium", nullable=False)
    comment: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)


class LessonMistake(Base):
    __tablename__ = "lesson_mistakes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    lesson_topic_result_id: Mapped[int] = mapped_column(
        ForeignKey("lesson_topic_results.id", ondelete="CASCADE"), index=True, nullable=False
    )
    mistake_type_id: Mapped[int] = mapped_column(ForeignKey("mistake_types.id", ondelete="NO ACTION", deferrable=True, initially="DEFERRED"), index=True, nullable=False)
    count: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    severity: Mapped[str] = mapped_column(String(16), default="medium", nullable=False)
    comment: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)


class Homework(Base):
    __tablename__ = "homeworks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    tutor_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    lesson_id: Mapped[int | None] = mapped_column(ForeignKey("lessons.id", ondelete="SET NULL"), index=True, nullable=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("students.id", ondelete="CASCADE"), index=True, nullable=False)
    subject_id: Mapped[int | None] = mapped_column(ForeignKey("subjects.id", ondelete="SET NULL"), index=True, nullable=True)
    topic_id: Mapped[int | None] = mapped_column(ForeignKey("topics.id", ondelete="SET NULL"), index=True, nullable=True)
    skill_id: Mapped[int | None] = mapped_column(ForeignKey("skills.id", ondelete="SET NULL"), index=True, nullable=True)
    text: Mapped[str] = mapped_column(Text, default="", nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="assigned", index=True, nullable=False)
    due_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    completion_percent: Mapped[int | None] = mapped_column(Integer, nullable=True)
    accuracy_percent: Mapped[int | None] = mapped_column(Integer, nullable=True)
    teacher_comment: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)
