# Step 6 — Reports

Добавлен модуль отчетов для родителей.

## Что появилось

Backend:

- `app/models/reports.py` — модель `Report`.
- `app/schemas/reports.py` — схемы `PeriodReportCreate`, `ReportUpdate`.
- `app/services/reports.py` — генерация отчетов по уроку и за период.
- `app/routers/reports.py` — API отчетов.
- `alembic/versions/20260605_0003_add_reports.py` — миграция таблицы `reports`.

Frontend:

- `frontend/lib/api/reports.ts` — API-клиент отчетов.
- `frontend/app/reports/[reportId]/page.tsx` — просмотр, редактирование и копирование отчета.
- `frontend/app/lessons/[lessonId]/page.tsx` — кнопка “Сформировать отчет”.
- `frontend/app/students/[studentId]/page.tsx` — блок “Отчеты” и кнопка “Отчет за месяц”.

## Новая таблица

```text
reports
- id
- student_id
- lesson_id nullable
- report_type
- period_from nullable
- period_to nullable
- title
- content
- payload_json
- created_at
- updated_at
```

Типы отчетов:

```text
lesson_report
period_report
topic_report — зарезервировано на будущее
```

## Новые API

```http
POST   /api/reports/lessons/{lesson_id}/
POST   /api/reports/students/{student_id}/period/
GET    /api/reports/students/{student_id}/
GET    /api/reports/{report_id}/
PATCH  /api/reports/{report_id}/
DELETE /api/reports/{report_id}/
```

## Логика отчета по уроку

Источник данных:

```text
lesson
student
subject
topics
skills
lesson_topic_results
lesson_mistakes
homeworks
recommendations
```

Отчет сохраняется как готовый текст в `reports.content`, а исходные данные сохраняются в `reports.payload_json`.

## Логика отчета за период

Источник данных:

```text
lessons за период
analytics summary из Step 5.1
active recommendations
```

Периодический отчет включает:

```text
- количество уроков
- общий прогресс
- динамику за месяц
- сильные темы
- темы, требующие внимания
- повторяющиеся ошибки
- основную рекомендацию
```

## Проверка

С пустой БД:

```bash
docker compose down -v
docker compose up --build
```

Проверить backend:

```bash
curl http://localhost:8100/api/health/
```

Сценарий:

1. Создать ученика.
2. Создать урок с темой, ошибками и домашкой.
3. Открыть страницу урока.
4. Нажать “Сформировать отчет”.
5. Открыть страницу отчета.
6. Отредактировать текст.
7. Сохранить.
8. Скопировать.
9. Вернуться в карточку ученика и увидеть отчет в списке.
10. Сформировать отчет за месяц.

## Ограничения

- PDF-экспорт не добавлен.
- Отправка в Telegram/email не добавлена.
- AI-генерация отчета не добавлена.
- Текст генерируется правилами и шаблонами.
