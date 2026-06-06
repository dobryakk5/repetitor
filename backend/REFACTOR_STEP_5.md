# Step 5 — Analytics Core

Добавлено аналитическое ядро поверх фактов урока.

## Что добавлено в БД

Новая миграция:

```text
backend/alembic/versions/20260605_0002_add_analytics_core.py
```

Она добавляет:

```text
lesson_topic_results.progress_score
lesson_topic_results.risk_level
student_skill_states
student_skill_history
recommendations
```

## Новые backend-файлы

```text
backend/app/models/analytics.py
backend/app/schemas/analytics.py
backend/app/services/analytics.py
backend/app/routers/analytics.py
```

## Новая логика после сохранения урока

После создания полного урока через:

```http
POST /api/lessons/full/
```

или после добавления/изменения результата темы урока backend делает:

```text
1. считает accuracy_percent
2. считает progress_score
3. определяет mastery_status
4. определяет risk_level
5. обновляет student_skill_states
6. добавляет snapshot в student_skill_history
7. генерирует recommendations
```

Формула первого MVP:

```text
progress_score =
  understanding_score * 0.35
+ accuracy_percent * 0.30
+ independence_score * 0.25
+ attention_score * 0.10
```

Если `accuracy_percent` не передан и нет `total_tasks/correct_tasks`, вместо accuracy используется `understanding_score`.

## Новые API

```http
GET   /api/analytics/students/{student_id}/overview/
GET   /api/analytics/students/{student_id}/topics/
GET   /api/analytics/students/{student_id}/topics/{topic_id}/history/
GET   /api/analytics/students/{student_id}/progress/
GET   /api/analytics/students/{student_id}/mistakes/
GET   /api/analytics/students/{student_id}/recommendations/
PATCH /api/analytics/recommendations/{recommendation_id}/
```

## Frontend

Добавлено:

```text
frontend/lib/api/analytics.ts
```

В карточку ученика добавлены блоки:

```text
- Состояние тем
- Рекомендации
- Средний прогресс
- Количество активных рекомендаций
```

## Проверка

Сбросить пустую БД и применить миграции:

```bash
docker compose down -v
docker compose up --build
```

Проверка API:

```bash
curl http://localhost:8100/api/health/
curl http://localhost:8100/api/analytics/students/1/overview/
curl http://localhost:8100/api/analytics/students/1/topics/
curl http://localhost:8100/api/analytics/students/1/recommendations/
```

## Ограничения текущего шага

Step 5 пока не делает:

```text
- красивые графики
- отчеты родителям
- AI-разбор комментариев
- полноценное редактирование аналитики вручную
- очистку старых skill_state при удалении всех уроков по теме
```

Это следующие шаги.
