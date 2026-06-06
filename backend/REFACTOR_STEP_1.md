# Refactor step 1: backend modularization

Цель шага — сохранить текущее поведение CoachSpace API и подготовить backend к добавлению учебного домена репетитора.

## Что изменено

- `app/main.py` сокращен до сборки FastAPI-приложения, CORS, startup и подключения router-ов.
- Настройки вынесены в `app/core/config.py`.
- Подключение к БД и `Base` вынесены в `app/core/database.py`.
- SQLAlchemy-модели вынесены в `app/models/coach.py`.
- Pydantic-схемы разнесены по `app/schemas/`.
- Общие функции, lookup-и, история и сериализация вынесены в `app/services/`.
- HTTP endpoint-ы разнесены по `app/routers/`.

## Что специально не менялось

- URL существующих API сохранены.
- Названия старых таблиц сохранены: `clients`, `goals`, `steps`, `sessions`, `coach_groups` и другие.
- Логика coach-домена сохранена без миграции в `students/lessons`.
- Alembic пока не добавлялся, `Base.metadata.create_all()` оставлен в startup.
- Frontend не менялся.

## Следующий шаг

Добавить новый учебный домен рядом со старым:

- `subjects`
- `topics`
- `skills`
- `mistake_types`
- `lesson_topic_results`
- `student_skill_states`
- `student_skill_history`
