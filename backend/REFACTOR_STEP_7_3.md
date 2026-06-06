# Refactor Step 7.3 — remaining architecture review fixes

Applied on top of `step7_2_fixed`.

## Auth

- Replaced hand-written JWT signing/verification with `python-jose`.
- Kept PBKDF2 password hashing, because that code is not JWT-specific and is covered by tests.
- Added `httpOnly` auth cookie support:
  - `/api/auth/login/` returns the same JSON token response for API clients and also sets the cookie.
  - `/api/auth/me/` accepts either Bearer token or the cookie.
  - `/api/auth/logout/` clears the cookie.
- Removed browser token persistence in `localStorage`; frontend now authenticates through `credentials: 'include'` and caches the current user in memory.

## School catalogue isolation

- Kept the curriculum catalogue global: `subjects`, `topics`, `skills`, `mistake_types` are still shared dictionaries.
- Closed the multi-tenant write hole by making catalogue writes admin-only:
  - tutors/admins can read school dictionaries;
  - only admins can create or update school dictionaries.
- Existing `app.scripts.create_admin` is now the required path for creating the first catalogue admin.

## API contracts and pagination

- Added Pydantic `response_model` coverage for auth, health, school, students, lessons, homeworks, analytics and reports endpoints.
- Added `limit` / `offset` to list endpoints with guarded bounds:
  - default `limit=100`;
  - maximum `limit=500`;
  - non-negative `offset`.

## Performance and cleanup

- Replaced `_monthly_delta` full-history loading with a PostgreSQL `DISTINCT ON` query that selects the latest historical row per topic/skill at the 30-day cutoff.
- Moved duplicated model `utc_now()` helpers to `app.core.time.utc_now`.
- Removed the duplicate direct `apply_calculated_fields()` call from PATCH topic-result flow; recalculation remains centralized in `recalculate_lesson_analytics()`.

## Configuration

- Added `pydantic-settings` and `.env` loading to `app.core.config`.
- Added cookie-related environment variables:
  - `AUTH_COOKIE_SECURE`
  - `AUTH_COOKIE_SAMESITE`
- Updated Docker Compose and deploy docs.

## Notes

- No new database migration is required for this step.
- Bearer token auth remains available for scripts, smoke tests and external API clients.
