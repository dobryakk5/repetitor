# TutorTrack

MVP-система для репетитора: ученики, учебные темы, уроки, ошибки, домашние задания, аналитика прогресса, отчеты и базовая авторизация.

## Быстрый локальный запуск через Docker

```bash
cp .env.example .env
python - <<'PY'
import pathlib, secrets
p = pathlib.Path('.env')
s = p.read_text()
s = s.replace('replace-with-generated-secret', secrets.token_urlsafe(48))
p.write_text(s)
PY
docker compose down -v
docker compose up --build
```

Backend API:

```text
http://localhost:8100/api/health/
```

Frontend запускается отдельно:

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

Открыть лендинг:

```text
http://localhost:3100/
```

Кабинет после входа:

```text
http://localhost:3100/students
```


### Landing page

Главная страница frontend (`/`) теперь открывается как публичный лендинг TutorTrack. Она не требует авторизации и ведет на:

- `/register` — регистрация репетитора;
- `/login` — вход;
- `/students` — рабочий кабинет после авторизации.

Auth guard пропускает публичные страницы `/`, `/login`, `/register`; остальные разделы кабинета остаются закрытыми.

## Ручной deploy

Подробная инструкция по созданию новой PostgreSQL-БД, Python venv, миграциям, frontend build и проверке:

```text
docs/DEPLOY.md
```

## Проверка MVP

Чеклист ручной проверки:

```text
docs/CHECKLIST.md
```

Smoke test backend:

```bash
cd backend
BACKEND_API_URL=http://localhost:8100/api python scripts/smoke_test.py
```

## Текущий статус

Готов MVP-сценарий:

```text
Регистрация/вход → Ученики → Карточка ученика → Новый урок → Аналитика → Отчет
```

Основные таблицы:

- `users`, `refresh_sessions`
- `students`
- `subjects`, `topics`, `skills`, `mistake_types`
- `lessons`, `lesson_topic_results`, `lesson_mistakes`, `lesson_observations`
- `homeworks`
- `student_skill_states`, `student_skill_history`, `recommendations`
- `reports`
- `student_groups`, `learning_goals`

## Важное

Схема БД управляется Alembic. Не используйте `Base.metadata.create_all()` для создания таблиц.

Дополнительно:

- авторизация в браузере работает через `httpOnly` cookie; Bearer token оставлен для smoke/curl/API-клиентов;
- регистрацию через UI получает роль `tutor`; редактировать общий учебный каталог может только `admin`;
- list-эндпоинты поддерживают `limit` и `offset` с безопасными ограничениями.

### Step 7.4: учебный каталог Skeleton + personal additions

В учебном каталоге используется гибридная схема:

- `subjects` — глобальные, редактирует только `admin`;
- `topics`, `skills`, `mistake_types` — системные (`tutor_id IS NULL`) + личные (`tutor_id = current_user.id`);
- tutor видит системные записи и свои личные добавления;
- tutor может редактировать только свои личные записи;
- admin создаёт и редактирует системные записи.

Перед запуском после обновления нужно выполнить:

```bash
cd backend
alembic upgrade head
```

### Step 7.5: hardening гибридного каталога

Дополнительно закрыты риски после Step 7.4:

- FK `topics/skills/mistake_types.tutor_id -> users.id` переведены на `ON DELETE RESTRICT`, чтобы аккаунт с личным каталогом не удалялся неявно и не ломал уроки/историю;
- unique-индексы каталога стали case-insensitive через `lower(name)` / `lower(code)`;
- гонки `SELECT before INSERT` теперь перехватываются как `409`, а не `500`;
- регистрация сразу устанавливает `httpOnly` cookie и возвращает тот же ответ, что login;
- `topics/tree` получил `limit/offset`, дефолт `limit=500`;
- для `https://` frontend cookie автоматически получает `Secure=true`.

### Step 7.6/7.7: исправления аналитики, истории и auth-сессий

Исправлены проблемы, найденные при ревизии после deferred FK:

- `recalculate_lesson_analytics` теперь удаляет старые `student_skill_history` строки конкретного урока и заново пишет актуальные снапшоты, поэтому редактирование комментариев/ошибок не раздувает историю дублями;
- `monthlyDelta` сравнивает только одинаковые пары `topic_id + skill_id`, у которых есть и текущий state, и baseline на дату 30 дней назад; новые темы без baseline больше не дают искусственный минус;
- удалена зависимость от PostgreSQL `DISTINCT ON` в расчете дельты;
- детальная сериализация урока загружает ошибки одним запросом на все `topicResults`, без `N_topics × mistakes` N+1;
- `Base.metadata.create_all()` заблокирован guard'ом: схему нужно создавать Alembic-миграциями;
- `StudentSkillState` создается через PostgreSQL `INSERT ... ON CONFLICT DO NOTHING`, затем строка берется `FOR UPDATE`, что закрывает гонку при параллельном сохранении одного навыка;
- добавлены refresh-сессии с ротацией refresh-token на `/api/auth/refresh/`;
- CORS оставлен credential-aware, но methods/headers заданы явным списком;
- обновление homework с `skill_id` без `topic_id` теперь подтягивает topic из skill и валидирует принадлежность;
- история темы в analytics валидирует `topic_id` с учетом текущего tutor.

Новая миграция:

```bash
cd backend
alembic upgrade head
```

Новая таблица:

- `refresh_sessions`

### Step 8.1: наблюдения за учеником на уроке

Добавлен структурированный блок `LessonObservation` на уровне урока:

- эмоциональная сфера — переключатели;
- поведение на занятии — переключатели;
- работоспособность и внимание — шкалы 1–10;
- интеллектуальный труд — чеклист из 4 пунктов;
- самостоятельность в обучении — переключатели.

Наблюдение сохраняется вместе с полным уроком через `observation`, возвращается в `GET /api/lessons/{lesson_id}/` и попадает в отчет по уроку. Подробная схема описана в `docs/LESSON_OBSERVATIONS.md`.

Новая миграция:

```bash
cd backend
alembic upgrade head
```

Новая таблица:

- `lesson_observations`
