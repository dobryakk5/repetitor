# Refactor step 7.7 — Analytics idempotency and auth session hardening

## Why

The post-7.6 review found three production risks:

1. `recalculate_lesson_analytics()` appended `StudentSkillHistory` rows every time the same lesson was recalculated.
2. `monthlyDelta` compared current average over all tracked skills with a historical average over only skills practiced before the 30-day cutoff.
3. Browser auth had access-token-only sessions, so an expired access cookie forced the user back to login.

## What changed

### Analytics

- `recalculate_lesson_analytics()` deletes old `student_skill_history` rows for the lesson before writing new snapshots.
- Migration `20260606_0008` deduplicates historical rows already created by older code, keeping the newest row for each `lesson_id + student_id + topic_id + skill_id` snapshot.
- `_monthly_delta()` now compares only matching current and baseline `topic_id + skill_id` pairs.
- PostgreSQL-specific `DISTINCT ON` was removed from the monthly delta calculation.
- `StudentSkillState` creation uses PostgreSQL `INSERT ... ON CONFLICT DO NOTHING`, then locks the row with `FOR UPDATE` before smoothing state values.

### Lesson serialization

- `serialize_lesson(..., include_details=True)` loads all mistakes for all lesson topic results in one query and passes them into `serialize_lesson_topic_result()`.
- The single-result serializer still works independently and falls back to its own mistakes query.

### Auth

- Added `refresh_sessions` table.
- Login/register now issue both access and refresh cookies.
- `/api/auth/refresh/` rotates refresh tokens and issues a new access cookie.
- `/api/auth/logout/` revokes the current refresh session and clears both cookies.
- Frontend `apiFetch()` tries one refresh request on browser-side `401`, then retries the original request.

### Safety guards

- `Base.metadata.create_all()` now raises by default. Use Alembic migrations for schema creation. For isolated tests only, `ALLOW_METADATA_CREATE_ALL=1` can re-enable it.
- CORS methods and headers are explicit instead of wildcard.
- Homework update with `skill_id` and no `topic_id` resolves the topic from the selected skill and validates ownership.
- Analytics topic history now validates `topic_id` against the current tutor's visible catalogue.

## Apply

```bash
cd backend
alembic upgrade head
```

## Test

```bash
cd backend
PYTHONPATH=. pytest -q
PYTHONPATH=. alembic heads
PYTHONPATH=. python - <<'PY'
from app.main import app
print(app.title)
PY
```
