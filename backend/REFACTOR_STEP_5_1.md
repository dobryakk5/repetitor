# Step 5.1 — Analytics Summary

Добавлен сводный аналитический слой для карточки ученика.

## Что добавлено

### Backend

Новый endpoint:

```http
GET /api/analytics/students/{student_id}/summary/
```

Он возвращает готовый блок для UI:

```json
{
  "studentId": 1,
  "overallProgress": 68,
  "monthlyDelta": 12,
  "strongTopics": [],
  "weakTopics": [],
  "repeatedMistakes": [],
  "overview": {}
}
```

Логика:

- `overallProgress` — среднее `current_progress_score` из `student_skill_states`.
- `monthlyDelta` — текущий средний прогресс минус средний прогресс по последним snapshot-ам, которые были не позже 30 дней назад. Если истории меньше чем на 30 дней, возвращается `null`.
- `strongTopics` — темы/навыки с `current_progress_score >= 75` и без высокого риска.
- `weakTopics` — темы/навыки с `risk_level = high`, `current_progress_score < 60` или статусами `introduced`, `in_progress`, `needs_practice`.
- `repeatedMistakes` — ошибки, которые встретились минимум на 2 уроках или суммарно 3+ раза.

Изменённые файлы:

```text
backend/app/services/analytics.py
backend/app/routers/analytics.py
```

Миграция не нужна: Step 5.1 использует уже существующие таблицы Step 5.

### Frontend

Добавлены типы и API:

```text
frontend/lib/types.ts
frontend/lib/api/analytics.ts
```

Карточка ученика теперь показывает блок **Учебная сводка**:

```text
Общий прогресс: 68 / 100
Динамика за месяц: +12

Сильные темы:
- ...

Требуют внимания:
- ...

Повторяющиеся ошибки:
- ...
```

Изменённый экран:

```text
frontend/app/students/[studentId]/page.tsx
```

## Проверка

Backend-статическая проверка:

```bash
python -m compileall backend/app backend/alembic
```

После запуска проекта:

```bash
curl http://localhost:8100/api/analytics/students/1/summary/
```

Frontend:

```bash
cd frontend
npm install
npm run typecheck
npm run dev
```

## Ограничение текущей версии

`monthlyDelta` появится только когда в `student_skill_history` есть данные старше 30 дней. На свежей базе он будет `null`, и UI покажет `недостаточно данных`.
