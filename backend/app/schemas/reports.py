from __future__ import annotations

from pydantic import BaseModel, Field


class PeriodReportCreate(BaseModel):
    period_from: str = Field(..., min_length=10)
    period_to: str = Field(..., min_length=10)


class ReportUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    content: str | None = Field(default=None, min_length=1)
from typing import Any


class ReportResponse(BaseModel):
    id: int
    tutor_id: int | None = Field(default=None, alias="tutorId")
    student_id: int = Field(alias="studentId")
    lesson_id: int | None = Field(default=None, alias="lessonId")
    report_type: str = Field(alias="reportType")
    period_from: str | None = Field(default=None, alias="periodFrom")
    period_to: str | None = Field(default=None, alias="periodTo")
    title: str
    content: str
    payload_json: dict[str, Any] = Field(alias="payloadJson")
    created_at: str | None = Field(default=None, alias="createdAt")
    updated_at: str | None = Field(default=None, alias="updatedAt")

    model_config = {"populate_by_name": True}
