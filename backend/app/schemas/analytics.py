from __future__ import annotations

from pydantic import BaseModel


class RecommendationUpdate(BaseModel):
    is_done: bool | None = None
    priority: str | None = None
    text: str | None = None
from typing import Any
from pydantic import Field


class AnalyticsOverviewResponse(BaseModel):
    student_id: int = Field(alias="studentId")
    lessons_count: int = Field(alias="lessonsCount")
    tracked_skills_count: int = Field(alias="trackedSkillsCount")
    active_homeworks_count: int = Field(alias="activeHomeworksCount")
    active_recommendations_count: int = Field(alias="activeRecommendationsCount")
    average_progress_score: int | None = Field(default=None, alias="averageProgressScore")
    high_risk_topics_count: int = Field(alias="highRiskTopicsCount")
    low_risk_topics_count: int = Field(alias="lowRiskTopicsCount")

    model_config = {"populate_by_name": True}


class SkillStateResponse(BaseModel):
    id: int
    student_id: int = Field(alias="studentId")
    subject_id: int = Field(alias="subjectId")
    topic_id: int = Field(alias="topicId")
    skill_id: int | None = Field(default=None, alias="skillId")
    current_understanding: int = Field(alias="currentUnderstanding")
    current_accuracy: int | None = Field(default=None, alias="currentAccuracy")
    current_independence: int = Field(alias="currentIndependence")
    current_attention: int = Field(alias="currentAttention")
    current_progress_score: int = Field(alias="currentProgressScore")
    mastery_status: str = Field(alias="masteryStatus")
    risk_level: str = Field(alias="riskLevel")
    last_lesson_id: int | None = Field(default=None, alias="lastLessonId")
    last_practiced_at: str | None = Field(default=None, alias="lastPracticedAt")
    created_at: str | None = Field(default=None, alias="createdAt")
    updated_at: str | None = Field(default=None, alias="updatedAt")

    model_config = {"populate_by_name": True}


class SkillHistoryResponse(BaseModel):
    id: int
    student_id: int = Field(alias="studentId")
    subject_id: int = Field(alias="subjectId")
    topic_id: int = Field(alias="topicId")
    skill_id: int | None = Field(default=None, alias="skillId")
    lesson_id: int | None = Field(default=None, alias="lessonId")
    understanding: int
    accuracy: int | None = None
    independence: int
    attention: int
    progress_score: int = Field(alias="progressScore")
    mastery_status: str = Field(alias="masteryStatus")
    risk_level: str = Field(alias="riskLevel")
    created_at: str | None = Field(default=None, alias="createdAt")

    model_config = {"populate_by_name": True}


class RecommendationResponse(BaseModel):
    id: int
    student_id: int = Field(alias="studentId")
    lesson_id: int | None = Field(default=None, alias="lessonId")
    topic_id: int | None = Field(default=None, alias="topicId")
    skill_id: int | None = Field(default=None, alias="skillId")
    type: str
    priority: str
    text: str
    is_done: bool = Field(alias="isDone")
    created_at: str | None = Field(default=None, alias="createdAt")
    updated_at: str | None = Field(default=None, alias="updatedAt")

    model_config = {"populate_by_name": True}


class MistakeSummaryResponse(BaseModel):
    mistake_type_id: int = Field(alias="mistakeTypeId")
    mistake_name: str = Field(alias="mistakeName")
    topic_id: int = Field(alias="topicId")
    count: int
    lessons_count: int = Field(alias="lessonsCount")
    last_seen_at: str | None = Field(default=None, alias="lastSeenAt")

    model_config = {"populate_by_name": True}


class AnalyticsSummaryTopicResponse(BaseModel):
    topic_id: int = Field(alias="topicId")
    topic_name: str = Field(alias="topicName")
    skill_id: int | None = Field(default=None, alias="skillId")
    skill_name: str | None = Field(default=None, alias="skillName")
    progress_score: int = Field(alias="progressScore")
    risk_level: str = Field(alias="riskLevel")
    mastery_status: str = Field(alias="masteryStatus")
    last_practiced_at: str | None = Field(default=None, alias="lastPracticedAt")

    model_config = {"populate_by_name": True}


class AnalyticsSummaryMistakeResponse(MistakeSummaryResponse):
    topic_name: str = Field(alias="topicName")


class AnalyticsSummaryResponse(BaseModel):
    student_id: int = Field(alias="studentId")
    overall_progress: int | None = Field(default=None, alias="overallProgress")
    monthly_delta: int | None = Field(default=None, alias="monthlyDelta")
    strong_topics: list[AnalyticsSummaryTopicResponse] = Field(alias="strongTopics")
    weak_topics: list[AnalyticsSummaryTopicResponse] = Field(alias="weakTopics")
    repeated_mistakes: list[AnalyticsSummaryMistakeResponse] = Field(alias="repeatedMistakes")
    overview: AnalyticsOverviewResponse

    model_config = {"populate_by_name": True}
