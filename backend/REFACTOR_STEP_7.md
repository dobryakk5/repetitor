# Step 7 — авторизация и разграничение доступа

Добавлен базовый auth-слой для TutorTrack.

## Backend

Добавлено:

- `users`
- JWT access token на HS256 через `python-jose`
- PBKDF2-SHA256 hash пароля
- `GET /api/auth/me/`
- `POST /api/auth/register/`
- `POST /api/auth/login/`
- `tutor_id` в ключевых таблицах:
  - `students`
  - `lessons`
  - `homeworks`
  - `reports`
  - `recommendations`
  - `learning_goals`
  - `student_groups`

Новые файлы:

```text
backend/app/models/auth.py
backend/app/schemas/auth.py
backend/app/services/auth.py
backend/app/routers/auth.py
backend/app/core/security.py
backend/alembic/versions/20260605_0004_add_auth.py
```

## Защищенные API

Теперь требуют `Authorization: Bearer <token>`:

```text
/api/students/*
/api/lessons/*
/api/homeworks/*
/api/analytics/*
/api/reports/*
/api/student-groups/*
/api/school/*
```

Открытые endpoint-ы:

```text
/api/health/
/api/auth/register/
/api/auth/login/
```

## Правила доступа

Репетитор видит только свои данные:

```text
students.tutor_id = current_user.id
lessons.tutor_id = current_user.id
homeworks.tutor_id = current_user.id
reports.tutor_id = current_user.id
recommendations.tutor_id = current_user.id
```

Попытка открыть чужого ученика/урок/отчет возвращает `404`.

## Frontend

Добавлено:

```text
frontend/app/login/page.tsx
frontend/app/register/page.tsx
frontend/lib/api/auth.ts
frontend/components/auth/AuthGuard.tsx
frontend/components/auth/LogoutButton.tsx
```

`frontend/lib/api.ts` теперь:

- берет `accessToken` из `localStorage`
- добавляет `Authorization: Bearer <token>`
- при `401` удаляет token и перенаправляет на `/login`

На странице `/students` добавлена кнопка выхода.

## Проверка

С пустой БД:

```bash
docker compose down -v
docker compose up --build
```

Потом:

```text
1. Открыть /register
2. Создать аккаунт репетитора
3. Автоматически войти
4. Создать ученика
5. Создать урок
6. Сформировать отчет
7. Нажать “Выйти”
8. Проверить, что без token /api/students/ возвращает 401
```

Проверка через curl:

```bash
curl -X POST http://localhost:8100/api/auth/register/ \
  -H 'Content-Type: application/json' \
  -d '{"email":"tutor@example.com","password":"12345678","fullName":"Тестовый репетитор"}'

TOKEN=$(curl -s -X POST http://localhost:8100/api/auth/login/ \
  -H 'Content-Type: application/json' \
  -d '{"email":"tutor@example.com","password":"12345678"}' \
  | python -c "import sys,json; print(json.load(sys.stdin)['access_token'])")

curl http://localhost:8100/api/auth/me/ -H "Authorization: Bearer $TOKEN"
curl http://localhost:8100/api/students/ -H "Authorization: Bearer $TOKEN"
```

## Ограничения Step 7

Пока не реализовано:

- refresh token
- httpOnly cookie
- восстановление пароля
- email-подтверждение
- роли parent/student
- родительский кабинет

Для production лучше заменить `localStorage` token на httpOnly cookie + refresh token.
