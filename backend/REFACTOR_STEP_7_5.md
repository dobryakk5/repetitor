# Step 7.5 — Hybrid catalogue hardening

## Fixed

1. Replaced personal catalogue owner FKs from `ON DELETE CASCADE` to `ON DELETE RESTRICT` for:
   - `topics.tutor_id`,
   - `skills.tutor_id`,
   - `mistake_types.tutor_id`.

   This avoids implicit deletion of personal catalogue rows that may still be referenced by lessons, skill states, history, recommendations, or homework. User deletion must now be an explicit product-level workflow.

2. Made school catalogue unique checks case-insensitive in both service code and PostgreSQL indexes:
   - topics: `lower(name)`,
   - skills: `lower(name)`,
   - mistake types: `lower(code)`.

3. Added `commit_or_409()` for catalogue writes. Concurrent duplicate inserts now return HTTP `409` instead of leaking an `IntegrityError` as `500`.

4. Optimized update endpoints by running uniqueness checks only when identity fields changed:
   - topic: `name`, `subject_id`, `parent_id`, `grade`;
   - skill: `name`, `topic_id`;
   - mistake type: `code`, `subject_id`.

5. Changed registration flow:
   - `POST /api/auth/register/` now returns `TokenResponse`;
   - it sets the same `httpOnly` auth cookie as login;
   - frontend registration no longer performs a second `login()` request.

6. Added pagination bounds to `GET /api/school/topics/tree/` with default `limit=500`.

7. Added config guard: when `FRONTEND_URL` starts with `https://` or `AUTH_COOKIE_SAMESITE=none`, `AUTH_COOKIE_SECURE` is forced to `true`.

8. Frontend lesson screens now display catalogue scope labels (`системное` / `личное`) for topics, skills, and mistake types.

## Migration

New migration:

```text
20260606_0006_harden_hybrid_catalogue.py
```

Run:

```bash
cd backend
alembic upgrade head
```

Before applying this migration on existing data, check for case-only duplicates inside one catalogue scope, because the new `lower(...)` indexes will reject them.

## Follow-up

Step 7.6 replaces the conservative owner-FK `RESTRICT` approach with a better
PostgreSQL solution: personal catalogue owner FKs return to `CASCADE`, while
lesson catalogue references become `NO ACTION DEFERRABLE INITIALLY DEFERRED`.
