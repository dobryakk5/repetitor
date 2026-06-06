"""End-to-end smoke test for a running TutorTrack backend.

Usage:
  BACKEND_API_URL=http://localhost:8100/api python backend/scripts/smoke_test.py

The script registers a temporary tutor, creates a student, creates a lesson,
checks analytics summary and generates a report. It leaves test data in DB.
"""
from __future__ import annotations

import json
import os
import time
import urllib.error
import urllib.request
from typing import Any

API_BASE_URL = os.getenv("BACKEND_API_URL", "http://localhost:8100/api").rstrip("/")
EMAIL = os.getenv("SMOKE_EMAIL", f"smoke-{int(time.time())}@example.com")
PASSWORD = os.getenv("SMOKE_PASSWORD", "SmokeTest12345")


def request(method: str, path: str, data: dict[str, Any] | None = None, token: str | None = None) -> Any:
    body = None if data is None else json.dumps(data).encode("utf-8")
    headers = {"Accept": "application/json"}
    if data is not None:
        headers["Content-Type"] = "application/json"
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(f"{API_BASE_URL}{path}", data=body, method=method, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:  # noqa: S310 - local smoke helper
            raw = resp.read().decode("utf-8")
            return json.loads(raw) if raw else None
    except urllib.error.HTTPError as exc:
        details = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"{method} {path} failed: {exc.code} {details}") from exc


def first(items: list[dict[str, Any]], label: str) -> dict[str, Any]:
    if not items:
        raise RuntimeError(f"No {label} returned by API")
    return items[0]


def main() -> None:
    print(f"Using backend API: {API_BASE_URL}")
    health = request("GET", "/health/")
    print("health:", health)

    request("POST", "/auth/register/", {"email": EMAIL, "password": PASSWORD, "fullName": "Smoke Tutor"})
    login = request("POST", "/auth/login/", {"email": EMAIL, "password": PASSWORD})
    token = login["access_token"]
    print("registered and logged in:", EMAIL)

    me = request("GET", "/auth/me/", token=token)
    print("me:", me["email"], me["role"])

    subjects = request("GET", "/school/subjects/?is_active=true", token=token)
    subject = first(subjects, "subjects")
    topics = request("GET", f"/school/topics/?subject_id={subject['id']}&is_active=true", token=token)
    topic = first(topics, "topics")
    skills = request("GET", f"/school/skills/?topic_id={topic['id']}&is_active=true", token=token)
    skill = skills[0] if skills else None
    mistakes = request("GET", f"/school/mistake-types/?subject_id={subject['id']}&is_active=true", token=token)
    mistake = mistakes[0] if mistakes else None
    print("dictionary:", subject["name"], topic["name"])

    student = request(
        "POST",
        "/students/",
        {
            "first_name": "Иван",
            "last_name": "Смоук",
            "grade": 6,
            "learning_goal": "Проверка полного smoke-сценария",
        },
        token=token,
    )
    print("student:", student["id"])

    topic_result: dict[str, Any] = {
        "topic_id": topic["id"],
        "skill_id": skill["id"] if skill else None,
        "understanding_score": 70,
        "independence_score": 55,
        "attention_score": 60,
        "total_tasks": 8,
        "correct_tasks": 6,
        "hint_count": 3,
        "needs_repeat": True,
        "comment": "Smoke: проверка создания урока.",
        "mistakes": [],
    }
    if mistake:
        topic_result["mistakes"].append(
            {"mistake_type_id": mistake["id"], "count": 1, "severity": "medium", "comment": "Smoke mistake"}
        )

    lesson = request(
        "POST",
        "/lessons/full/",
        {
            "student_id": student["id"],
            "subject_id": subject["id"],
            "duration_minutes": 60,
            "lesson_type": "practice",
            "general_comment": "Smoke lesson",
            "topic_results": [topic_result],
            "homeworks": [
                {
                    "topic_id": topic["id"],
                    "skill_id": skill["id"] if skill else None,
                    "text": "Smoke homework: решить 5 примеров.",
                }
            ],
        },
        token=token,
    )
    print("lesson:", lesson["id"])

    summary = request("GET", f"/analytics/students/{student['id']}/summary/", token=token)
    print("summary overallProgress:", summary.get("overallProgress"))

    report = request("POST", f"/reports/lessons/{lesson['id']}/", token=token)
    print("report:", report["id"])
    print("SMOKE TEST OK")


if __name__ == "__main__":
    main()
