from __future__ import annotations

from datetime import date, datetime, time, timezone
from typing import Any

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import (
    Homework,
    Lesson,
    LessonMistake,
    LessonObservation,
    LessonTopicResult,
    MistakeType,
    Recommendation,
    Report,
    Skill,
    Student,
    Subject,
    Topic,
)
from app.services.analytics import analytics_summary


def parse_report_date(value: str) -> date:
    try:
        return date.fromisoformat(value.strip()[:10])
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid period date format") from exc


def start_of_day(value: date) -> datetime:
    return datetime.combine(value, time.min).replace(tzinfo=timezone.utc)


def end_of_day(value: date) -> datetime:
    return datetime.combine(value, time.max).replace(tzinfo=timezone.utc)


def report_or_404(db: Session, report_id: int, *, tutor_id: int | None = None) -> Report:
    item = db.get(Report, report_id)
    if item is None or (tutor_id is not None and item.tutor_id != tutor_id):
        raise HTTPException(status_code=404, detail="Report not found")
    return item


def _student_or_404(db: Session, student_id: int, *, tutor_id: int | None = None) -> Student:
    item = db.get(Student, student_id)
    if item is None or (tutor_id is not None and item.tutor_id != tutor_id):
        raise HTTPException(status_code=404, detail="Student not found")
    return item


def _lesson_or_404(db: Session, lesson_id: int, *, tutor_id: int | None = None) -> Lesson:
    item = db.get(Lesson, lesson_id)
    if item is None or (tutor_id is not None and item.tutor_id != tutor_id):
        raise HTTPException(status_code=404, detail="Lesson not found")
    return item


def _student_name(student: Student) -> str:
    return " ".join(part for part in [student.first_name, student.last_name] if part).strip() or f"Ученик #{student.id}"


def _format_date(value: datetime | date | None) -> str:
    if value is None:
        return "дата не указана"
    if isinstance(value, datetime):
        value = value.date()
    return value.strftime("%d.%m.%Y")


def _subject_name(db: Session, subject_id: int | None) -> str:
    if subject_id is None:
        return "предмет не указан"
    subject = db.get(Subject, subject_id)
    return subject.name if subject else f"Предмет #{subject_id}"


def _topic_name(db: Session, topic_id: int | None) -> str:
    if topic_id is None:
        return "тема не указана"
    topic = db.get(Topic, topic_id)
    return topic.name if topic else f"Тема #{topic_id}"


def _skill_name(db: Session, skill_id: int | None) -> str | None:
    if skill_id is None:
        return None
    skill = db.get(Skill, skill_id)
    return skill.name if skill else f"Навык #{skill_id}"


def _mistake_name(db: Session, mistake_type_id: int) -> str:
    mistake = db.get(MistakeType, mistake_type_id)
    return mistake.name if mistake else f"Ошибка #{mistake_type_id}"


def _serialize_report(item: Report) -> dict[str, Any]:
    return {
        "id": item.id,
        "tutorId": item.tutor_id,
        "studentId": item.student_id,
        "lessonId": item.lesson_id,
        "reportType": item.report_type,
        "periodFrom": item.period_from.isoformat() if item.period_from else None,
        "periodTo": item.period_to.isoformat() if item.period_to else None,
        "title": item.title,
        "content": item.content,
        "payloadJson": item.payload_json or {},
        "createdAt": item.created_at.isoformat() if item.created_at else None,
        "updatedAt": item.updated_at.isoformat() if item.updated_at else None,
    }


def serialize_report(item: Report) -> dict[str, Any]:
    return _serialize_report(item)


def _result_mistakes(db: Session, result_id: int) -> list[LessonMistake]:
    return list(
        db.scalars(
            select(LessonMistake).where(LessonMistake.lesson_topic_result_id == result_id).order_by(LessonMistake.id)
        )
    )



_OBSERVATION_LABELS = {
    "stable": "занятие прошло ровно",
    "mood_change": "смена настроения",
    "emotional_outburst": "эмоциональная вспышка",
    "active": "ребенок бодр",
    "tired": "ребенок устал",
    "healthy_discipline": "соблюдает здоровую дисциплину",
    "discipline_issues": "не соблюдает дисциплину",
    "respectful": "вежлив",
    "disrespect_signs": "проявляет признаки неуважения",
    "comments_answers": "работает, комментируя ответы",
    "distracted_talks": "часто отвлекается на посторонние разговоры",
    "constructive_argument": "спорит по делу",
    "distraction_argument": "спорит, чтобы отвлечь внимание",
    "answers_immediately": "отвечает на вопросы сразу",
    "avoids_answer": "заговаривает зубы вместо ответа",
    "does_not_answer": "не отвечает",
    "independent": "выполняет задания без помощи",
    "with_help": "выполняет задания с помощью",
    "not_done": "не выполняет задания",
    "likes": "предмет нравится",
    "neutral": "отношение к предмету нейтральное",
    "dislikes": "предмет не нравится",
    "can_argue": "способен аргументировать ответ",
    "cannot_argue": "не аргументирует ответ",
    "asks_questions": "задает вопросы",
    "does_not_ask_questions": "не задает вопросы",
    "searches_extra_info": "ищет дополнительную информацию",
    "does_not_search_extra_info": "не ищет дополнительную информацию",
    "highlights_keywords": "выделяет ключевые слова",
    "does_not_highlight_keywords": "не выделяет ключевые слова",
}


def _observation_label(value: str) -> str:
    return _OBSERVATION_LABELS.get(value, value)


def _serialize_observation(item: LessonObservation | None) -> dict[str, Any] | None:
    if item is None:
        return None
    return {
        "moodState": item.mood_state,
        "moodLabel": _observation_label(item.mood_state),
        "energyState": item.energy_state,
        "energyLabel": _observation_label(item.energy_state),
        "disciplineState": item.discipline_state,
        "disciplineLabel": _observation_label(item.discipline_state),
        "respectState": item.respect_state,
        "respectLabel": _observation_label(item.respect_state),
        "conversationState": item.conversation_state,
        "conversationLabel": _observation_label(item.conversation_state),
        "argumentState": item.argument_state,
        "argumentLabel": _observation_label(item.argument_state),
        "answerState": item.answer_state,
        "answerLabel": _observation_label(item.answer_state),
        "concentrationScore": item.concentration_score,
        "workPaceScore": item.work_pace_score,
        "attentionStabilityScore": item.attention_stability_score,
        "intellectualChecklist": {
            "intellectualInterest": item.intellectual_interest,
            "reasoning": item.reasoning,
            "hypothesisBuilding": item.hypothesis_building,
            "inferenceMaking": item.inference_making,
        },
        "taskIndependenceState": item.task_independence_state,
        "taskIndependenceLabel": _observation_label(item.task_independence_state),
        "subjectAttitudeState": item.subject_attitude,
        "subjectAttitudeLabel": _observation_label(item.subject_attitude),
        "answerArgumentationState": item.answer_argumentation_state,
        "answerArgumentationLabel": _observation_label(item.answer_argumentation_state),
        "questionState": item.question_state,
        "questionLabel": _observation_label(item.question_state),
        "extraInfoState": item.extra_info_state,
        "extraInfoLabel": _observation_label(item.extra_info_state),
        "keywordState": item.keyword_state,
        "keywordLabel": _observation_label(item.keyword_state),
        "comment": item.comment or "",
    }


def _observation_summary(observation: dict[str, Any] | None) -> str:
    if not observation:
        return "Наблюдение за эмоциональной сферой, поведением и вниманием на этом уроке не заполнено."
    checklist = observation.get("intellectualChecklist") or {}
    active_items = []
    if checklist.get("intellectualInterest"):
        active_items.append("проявлял(а) интерес")
    if checklist.get("reasoning"):
        active_items.append("рассуждал(а)")
    if checklist.get("hypothesisBuilding"):
        active_items.append("строил(а) предположения")
    if checklist.get("inferenceMaking"):
        active_items.append("делал(а) умозаключения")
    intellectual = ", ".join(active_items) if active_items else "пункты интеллектуального труда не отмечены"
    lines = [
        f"Эмоциональная сфера: {observation['moodLabel']}, {observation['energyLabel']}.",
        f"Поведение: {observation['disciplineLabel']}; {observation['respectLabel']}; {observation['answerLabel']}.",
        f"Работоспособность: концентрация {observation['concentrationScore']}/10, темп {observation['workPaceScore']}/10, удержание внимания {observation['attentionStabilityScore']}/10.",
        f"Интеллектуальный труд: {intellectual}.",
        f"Самостоятельность: {observation['taskIndependenceLabel']}; {observation['subjectAttitudeLabel']}; {observation['questionLabel']}.",
    ]
    if observation.get("comment"):
        lines.append(f"Комментарий: {observation['comment']}")
    return "\n".join(lines)


def _positive_summary(student_name: str, results_payload: list[dict[str, Any]]) -> str:
    if not results_payload:
        return f"{student_name} работал(а) по плану урока. Подробные результаты по темам пока не заполнены."

    best = max(results_payload, key=lambda item: item.get("progressScore") or 0)
    parts: list[str] = []
    if (best.get("understandingScore") or 0) >= 70:
        parts.append(f"понимает основной принцип темы «{best['topicName']}»")
    if best.get("accuracyPercent") is not None and best["accuracyPercent"] >= 70:
        parts.append("правильно решил(а) большую часть заданий")
    if (best.get("independenceScore") or 0) >= 70:
        parts.append("работал(а) достаточно самостоятельно")

    if parts:
        return f"{student_name} " + ", ".join(parts) + "."

    return f"{student_name} включился(лась) в работу, но тема пока находится на этапе первичного закрепления."


def _weak_summary(results_payload: list[dict[str, Any]]) -> str:
    weak_parts: list[str] = []
    for item in results_payload:
        topic = item["topicName"]
        if item.get("needsRepeat"):
            weak_parts.append(f"тему «{topic}» стоит повторить")
        if (item.get("independenceScore") or 0) < 50:
            weak_parts.append(f"по теме «{topic}» пока требуется помощь и подсказки")
        if item.get("accuracyPercent") is not None and item["accuracyPercent"] < 60:
            weak_parts.append(f"по теме «{topic}» есть трудности с точностью решения")
        if (item.get("attentionScore") or 0) < 60:
            weak_parts.append(f"по теме «{topic}» нужно обратить внимание на аккуратность")

    unique = list(dict.fromkeys(weak_parts))
    if not unique:
        return "Критичных трудностей по уроку не отмечено. Можно продолжать закрепление и постепенно усложнять задания."
    return "; ".join(unique[:4]) + "."


def _mistakes_summary(results_payload: list[dict[str, Any]]) -> str:
    mistake_names: list[str] = []
    for item in results_payload:
        mistake_names.extend(mistake["name"] for mistake in item.get("mistakes", []))
    unique = list(dict.fromkeys(mistake_names))
    if not unique:
        return "Существенных ошибок на уроке не отмечено."
    return "На уроке встречались ошибки: " + ", ".join(unique[:6]) + "."


def _homework_summary(homeworks_payload: list[dict[str, Any]]) -> str:
    if not homeworks_payload:
        return "Домашнее задание не задано."
    if len(homeworks_payload) == 1:
        item = homeworks_payload[0]
        suffix = f" Срок: {_format_date(item.get('dueDate'))}." if item.get("dueDate") else ""
        return f"Домашнее задание: {item['text']}.{suffix}"
    lines = ["Домашнее задание:"]
    for index, item in enumerate(homeworks_payload, start=1):
        due = f" до {_format_date(item.get('dueDate'))}" if item.get("dueDate") else ""
        lines.append(f"{index}. {item['text']}{due}")
    return "\n".join(lines)


def _recommendation_summary(recommendations_payload: list[dict[str, Any]]) -> str:
    if not recommendations_payload:
        return "На следующем уроке можно продолжить закрепление материала и дать короткую проверку понимания."
    high = [item for item in recommendations_payload if item.get("priority") == "high"]
    picked = high[0] if high else recommendations_payload[0]
    return picked["text"]


def build_lesson_report_payload(db: Session, lesson: Lesson) -> dict[str, Any]:
    student = _student_or_404(db, lesson.student_id)
    results = list(db.scalars(select(LessonTopicResult).where(LessonTopicResult.lesson_id == lesson.id).order_by(LessonTopicResult.id)))
    homeworks = list(db.scalars(select(Homework).where(Homework.lesson_id == lesson.id).order_by(Homework.id)))
    observation = db.scalar(select(LessonObservation).where(LessonObservation.lesson_id == lesson.id))
    recommendations = list(
        db.scalars(
            select(Recommendation)
            .where(Recommendation.lesson_id == lesson.id)
            .order_by(Recommendation.priority.desc(), Recommendation.id.asc())
        )
    )

    results_payload: list[dict[str, Any]] = []
    for result in results:
        mistakes_payload = [
            {
                "id": mistake.id,
                "mistakeTypeId": mistake.mistake_type_id,
                "name": _mistake_name(db, mistake.mistake_type_id),
                "count": mistake.count,
                "severity": mistake.severity,
                "comment": mistake.comment or "",
            }
            for mistake in _result_mistakes(db, result.id)
        ]
        results_payload.append(
            {
                "id": result.id,
                "topicId": result.topic_id,
                "topicName": _topic_name(db, result.topic_id),
                "skillId": result.skill_id,
                "skillName": _skill_name(db, result.skill_id),
                "understandingScore": result.understanding_score,
                "accuracyPercent": result.accuracy_percent,
                "independenceScore": result.independence_score,
                "attentionScore": result.attention_score,
                "progressScore": result.progress_score,
                "riskLevel": result.risk_level,
                "masteryStatus": result.mastery_status,
                "needsRepeat": result.needs_repeat,
                "comment": result.comment or "",
                "mistakes": mistakes_payload,
            }
        )

    homeworks_payload = [
        {
            "id": item.id,
            "text": item.text or "",
            "status": item.status,
            "dueDate": item.due_date,
            "topicId": item.topic_id,
            "topicName": _topic_name(db, item.topic_id) if item.topic_id else None,
            "skillId": item.skill_id,
            "skillName": _skill_name(db, item.skill_id) if item.skill_id else None,
        }
        for item in homeworks
    ]
    recommendations_payload = [
        {
            "id": item.id,
            "type": item.type,
            "priority": item.priority,
            "text": item.text,
            "topicId": item.topic_id,
            "skillId": item.skill_id,
        }
        for item in recommendations
    ]

    return {
        "student": {
            "id": student.id,
            "name": _student_name(student),
            "grade": student.grade,
        },
        "lesson": {
            "id": lesson.id,
            "date": lesson.lesson_date,
            "subjectId": lesson.subject_id,
            "subjectName": _subject_name(db, lesson.subject_id),
            "lessonType": lesson.lesson_type,
            "durationMinutes": lesson.duration_minutes,
            "generalComment": lesson.general_comment or "",
            "nextLessonPlan": lesson.next_lesson_plan or "",
        },
        "topics": results_payload,
        "homeworks": homeworks_payload,
        "observation": _serialize_observation(observation),
        "recommendations": recommendations_payload,
    }


def render_lesson_report(payload: dict[str, Any]) -> tuple[str, str]:
    student_name = payload["student"]["name"]
    lesson = payload["lesson"]
    topics = payload["topics"]
    homeworks = payload["homeworks"]
    recommendations = payload["recommendations"]
    observation = payload.get("observation")
    lesson_date = _format_date(lesson.get("date"))
    topic_names = ", ".join(dict.fromkeys(item["topicName"] for item in topics)) or "материал по плану урока"
    title = f"Отчет по уроку от {lesson_date}"

    content = "\n\n".join(
        [
            title,
            f"Сегодня занимались: {topic_names}.",
            "Что получилось:\n" + _positive_summary(student_name, topics),
            "Что требует внимания:\n" + _weak_summary(topics),
            "Ошибки:\n" + _mistakes_summary(topics),
            "Наблюдение за работой на уроке:\n" + _observation_summary(observation),
            _homework_summary(homeworks),
            "Рекомендация:\n" + _recommendation_summary(recommendations),
        ]
    )
    return title, content


def create_lesson_report(db: Session, lesson_id: int, *, tutor_id: int) -> Report:
    lesson = _lesson_or_404(db, lesson_id, tutor_id=tutor_id)
    payload = build_lesson_report_payload(db, lesson)
    title, content = render_lesson_report(payload)
    item = Report(
        tutor_id=tutor_id,
        student_id=lesson.student_id,
        lesson_id=lesson.id,
        report_type="lesson_report",
        title=title,
        content=content,
        payload_json=_json_safe(payload),
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def _json_safe(value: Any) -> Any:
    if isinstance(value, datetime):
        return value.isoformat()
    if isinstance(value, date):
        return value.isoformat()
    if isinstance(value, list):
        return [_json_safe(item) for item in value]
    if isinstance(value, dict):
        return {key: _json_safe(item) for key, item in value.items()}
    return value


def _format_topic_list(items: list[dict[str, Any]], *, include_score: bool = True) -> str:
    if not items:
        return "- пока нет данных"
    lines: list[str] = []
    for item in items[:5]:
        name = item.get("topicName") or f"Тема #{item.get('topicId')}"
        skill = item.get("skillName")
        full_name = f"{name} — {skill}" if skill else name
        score = f" ({item.get('progressScore')} / 100)" if include_score and item.get("progressScore") is not None else ""
        lines.append(f"- {full_name}{score}")
    return "\n".join(lines)


def _format_mistake_list(items: list[dict[str, Any]]) -> str:
    if not items:
        return "- пока нет повторяющихся ошибок"
    return "\n".join(
        f"- {item['mistakeName']} — {item['count']} раз, {item['lessonsCount']} урок." for item in items[:5]
    )


def create_period_report(db: Session, student_id: int, period_from: str, period_to: str, *, tutor_id: int) -> Report:
    student = _student_or_404(db, student_id, tutor_id=tutor_id)
    start_date = parse_report_date(period_from)
    end_date = parse_report_date(period_to)
    if end_date < start_date:
        raise HTTPException(status_code=400, detail="period_to must be greater than or equal to period_from")

    lessons = list(
        db.scalars(
            select(Lesson)
            .where(
                Lesson.student_id == student_id,
                Lesson.tutor_id == tutor_id,
                Lesson.lesson_date >= start_of_day(start_date),
                Lesson.lesson_date <= end_of_day(end_date),
            )
            .order_by(Lesson.lesson_date.asc(), Lesson.id.asc())
        )
    )
    summary = analytics_summary(db, student_id)
    observation = db.scalar(select(LessonObservation).where(LessonObservation.lesson_id == lesson.id))
    recommendations = list(
        db.scalars(
            select(Recommendation)
            .where(Recommendation.student_id == student_id, Recommendation.tutor_id == tutor_id, Recommendation.is_done.is_(False))
            .order_by(Recommendation.priority.desc(), Recommendation.id.asc())
        )
    )
    recommendations_payload = [
        {
            "id": item.id,
            "type": item.type,
            "priority": item.priority,
            "text": item.text,
            "lessonId": item.lesson_id,
            "topicId": item.topic_id,
            "skillId": item.skill_id,
        }
        for item in recommendations
    ]

    payload = {
        "student": {"id": student.id, "name": _student_name(student), "grade": student.grade},
        "period": {"from": start_date, "to": end_date},
        "lessonsCount": len(lessons),
        "summary": summary,
        "recommendations": recommendations_payload,
    }
    title, content = render_period_report(payload)
    item = Report(
        tutor_id=tutor_id,
        student_id=student_id,
        lesson_id=None,
        report_type="period_report",
        period_from=start_date,
        period_to=end_date,
        title=title,
        content=content,
        payload_json=_json_safe(payload),
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def render_period_report(payload: dict[str, Any]) -> tuple[str, str]:
    period = payload["period"]
    summary = payload["summary"]
    title = f"Отчет за период: {_format_date(period['from'])} — {_format_date(period['to'])}"
    delta = summary.get("monthlyDelta")
    delta_text = "недостаточно данных" if delta is None else (f"+{delta}" if delta > 0 else str(delta))
    recommendation = payload.get("recommendations", [])
    main_recommendation = recommendation[0]["text"] if recommendation else "Продолжить закрепление тем, которые требуют внимания, и периодически возвращаться к уже освоенным навыкам."
    content = "\n\n".join(
        [
            title,
            f"За этот период проведено уроков: {payload['lessonsCount']}.",
            f"Общий прогресс: {summary.get('overallProgress') if summary.get('overallProgress') is not None else 0} / 100.\nДинамика за месяц: {delta_text}.",
            "Сильные темы:\n" + _format_topic_list(summary.get("strongTopics", [])),
            "Требуют внимания:\n" + _format_topic_list(summary.get("weakTopics", [])),
            "Повторяющиеся ошибки:\n" + _format_mistake_list(summary.get("repeatedMistakes", [])),
            "Рекомендация:\n" + main_recommendation,
        ]
    )
    return title, content


def list_student_reports(db: Session, student_id: int, report_type: str | None = None, *, tutor_id: int) -> list[Report]:
    _student_or_404(db, student_id, tutor_id=tutor_id)
    filters = [Report.student_id == student_id, Report.tutor_id == tutor_id]
    if report_type:
        filters.append(Report.report_type == report_type)
    return list(db.scalars(select(Report).where(*filters).order_by(Report.created_at.desc(), Report.id.desc())))
