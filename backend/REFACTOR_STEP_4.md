# Step 4 — чистый домен репетитора и рабочий frontend-сценарий

База данных считается пустой, поэтому проект переведен с coachspace-терминологии на чистую модель TutorTrack.

## Что изменено

### Backend

- Убрана активная зависимость от старых таблиц `clients`, `sessions`, `goals`, `steps`.
- `main.py` больше не вызывает `Base.metadata.create_all()`.
- Alembic стал единственным источником схемы БД.
- Старые idempotent-миграции заменены одной чистой начальной миграцией:
  - `backend/alembic/versions/20260605_0001_initial_tutor_schema.py`

Новая схема создает таблицы:

- `students`
- `subjects`
- `topics`
- `skills`
- `mistake_types`
- `lessons`
- `lesson_topic_results`
- `lesson_mistakes`
- `homeworks`
- `learning_goals`
- `student_groups`
- `student_group_members`

Также добавлен seed по математике для 5–6 класса: предмет, темы, навыки и типы ошибок.

### Backend API

Новые основные endpoint-ы:

```text
GET/POST/PATCH/DELETE /api/students/
GET/POST/PATCH        /api/school/subjects/
GET/POST/PATCH        /api/school/topics/
GET                   /api/school/topics/tree/
GET/POST/PATCH        /api/school/skills/
GET/POST/PATCH        /api/school/mistake-types/
GET/POST/PATCH/DELETE /api/lessons/
POST                  /api/lessons/full/
GET/POST/PATCH/DELETE /api/homeworks/
GET/POST/PATCH        /api/student-groups/
GET/POST/PATCH        /api/learning-goals/
```

### Frontend

Добавлен рабочий сценарий для репетитора:

```text
/students
/students/new
/students/[studentId]
/students/[studentId]/lessons/new
/lessons/[lessonId]
```

Добавлены API-клиенты:

```text
frontend/lib/api/students.ts
frontend/lib/api/school.ts
frontend/lib/api/lessons.ts
```

Старые coachspace-страницы и старый API-клиент удалены из активного frontend.

## Проверочный сценарий

```bash
docker compose up --build
```

Дальше открыть:

```text
http://localhost:3100/students
```

Проверить вручную:

1. Создать ученика.
2. Открыть карточку ученика.
3. Создать новый урок.
4. Выбрать математику, тему, навык.
5. Заполнить метрики и ошибки.
6. Добавить домашку.
7. Сохранить урок.
8. Открыть страницу урока.

## Быстрая проверка API

```bash
curl http://localhost:8100/api/health/
curl http://localhost:8100/api/school/subjects/
curl http://localhost:8100/api/students/
```

Создать ученика:

```bash
curl -X POST http://localhost:8100/api/students/ \
  -H "Content-Type: application/json" \
  -d '{"first_name":"Иван","last_name":"Петров","grade":6,"learning_goal":"Подтянуть дроби"}'
```

Создать полный урок после создания ученика с `id=1`:

```bash
curl -X POST http://localhost:8100/api/lessons/full/ \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": 1,
    "subject_id": 1,
    "lesson_type": "practice",
    "duration_minutes": 60,
    "general_comment": "Закрепляли дроби.",
    "topic_results": [
      {
        "topic_id": 7,
        "skill_id": 2,
        "understanding_score": 70,
        "independence_score": 55,
        "attention_score": 60,
        "total_tasks": 8,
        "correct_tasks": 6,
        "hint_count": 3,
        "needs_repeat": true,
        "comment": "Путается в НОК.",
        "mistakes": [{"mistake_type_id": 8, "count": 1, "severity": "medium"}]
      }
    ],
    "homeworks": [
      {"text":"Решить 10 примеров на сложение дробей.", "topic_id": 7, "skill_id": 2}
    ]
  }'
```

## Что осталось на следующие шаги

- Step 5: аналитика прогресса — `student_skill_states`, `student_skill_history`, графики.
- Step 6: отчеты для родителей.
- Step 7: авторизация и роли.
