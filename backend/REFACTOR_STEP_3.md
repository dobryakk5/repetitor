# Refactor Step 3 — Tutor lesson domain

Добавлен третий шаг переделки coachspace в систему для репетитора.

## Что добавлено

- `app/models/tutor.py`
  - `Lesson`
  - `LessonTopicResult`
  - `LessonMistake`
  - `Homework`
- `app/schemas/tutor.py`
  - Pydantic-схемы для уроков, результатов по темам, ошибок и домашних заданий.
- `app/services/tutor.py`
  - валидация связей;
  - расчет `accuracy_percent` из `total_tasks/correct_tasks`;
  - первичный расчет `mastery_status`;
  - сериализация уроков, результатов, ошибок и домашних заданий.
- `app/routers/tutor.py`
  - CRUD API уроков;
  - CRUD API результатов по темам урока;
  - CRUD API ошибок;
  - CRUD API домашних заданий;
  - endpoint создания полного урока одним запросом.
- `alembic/versions/20260605_0002_add_tutor_lessons.py`
  - миграция таблиц `lessons`, `lesson_topic_results`, `lesson_mistakes`, `homeworks`.

## Новые API

```text
GET    /api/tutor/lessons/
POST   /api/tutor/lessons/
POST   /api/tutor/lessons/full/
GET    /api/tutor/lessons/{lesson_id}/
PATCH  /api/tutor/lessons/{lesson_id}/
DELETE /api/tutor/lessons/{lesson_id}/

POST   /api/tutor/lessons/{lesson_id}/topic-results/
PATCH  /api/tutor/lesson-topic-results/{result_id}/
DELETE /api/tutor/lesson-topic-results/{result_id}/

POST   /api/tutor/lesson-topic-results/{result_id}/mistakes/
PATCH  /api/tutor/lesson-mistakes/{mistake_id}/
DELETE /api/tutor/lesson-mistakes/{mistake_id}/

GET    /api/tutor/homeworks/
POST   /api/tutor/homeworks/
GET    /api/tutor/homeworks/{homework_id}/
PATCH  /api/tutor/homeworks/{homework_id}/
DELETE /api/tutor/homeworks/{homework_id}/
```

## Пример создания полного урока

```bash
curl -X POST http://localhost:8100/api/tutor/lessons/full/ \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": 1,
    "subject_id": 1,
    "lesson_date": "2026-06-05T18:00:00",
    "duration_minutes": 60,
    "lesson_type": "practice",
    "general_comment": "Закрепляли сложение дробей.",
    "topic_results": [
      {
        "topic_id": 7,
        "skill_id": 1,
        "understanding_score": 70,
        "independence_score": 55,
        "attention_score": 60,
        "total_tasks": 8,
        "correct_tasks": 6,
        "hint_count": 3,
        "needs_repeat": true,
        "comment": "Путается в НОК.",
        "mistakes": [
          {
            "mistake_type_id": 8,
            "count": 3,
            "severity": "medium",
            "comment": "Ошибки при нахождении НОК."
          }
        ]
      }
    ],
    "homeworks": [
      {
        "topic_id": 7,
        "skill_id": 1,
        "text": "Решить 10 примеров на сложение дробей.",
        "due_date": "2026-06-08"
      }
    ]
  }'
```

## Что пока не добавлялось

- `student_skill_states`
- `student_skill_history`
- аналитика и графики
- отчеты родителям
- рекомендации
- AI-разбор комментария

Это следующий шаг.
