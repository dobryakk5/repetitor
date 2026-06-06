# Step 7.2 — stabilization and performance cleanup

Applied after the architecture review.

## Fixed

1. Removed the unreachable correction block in `define_mastery_status()`.
   - The resulting behavior is unchanged.
   - The function now returns directly from explicit branches.

2. Removed N+1 from repeated mistake detection during lesson analytics recalculation.
   - `recalculate_lesson_analytics()` now preloads repeated mistake data for all topic results in the lesson.
   - `repeated_mistakes_for_results()` uses grouped SQL instead of one query per mistake.
   - `repeated_mistakes_for_result()` remains as a compatibility wrapper.

3. Removed N+1 from `GET /api/students/`.
   - The students list now joins grouped lesson and active-homework counters.
   - Single-student serialization still supports lazy count loading for detail/create/update flows.

4. Removed double loading of `StudentSkillState` in `analytics_summary()`.
   - `analytics_overview()` can now accept preloaded states.

5. Added Pydantic validation for lesson-level `lesson_type` and `status`.
   - Accepted lesson types: `practice`, `new_topic`, `review`, `mistake_review`, `test`, `exam_preparation`, `control`, `exam`, `assessment`.
   - Accepted lesson statuses: `planned`, `done`, `cancelled`, `draft`.

6. Removed hardcoded `SECRET_KEY` from `docker-compose.yml`.
   - Docker Compose now reads it from root `.env`.
   - Added root `.env.example` and updated README/DEPLOY instructions.

7. Reduced auth checks on frontend navigation.
   - `AppAuthBoundary` caches a successfully validated token/user.
   - `/api/auth/me/` is no longer called on every client-side route change when the token is unchanged.

8. Removed unused `frontend/components/auth/AuthGuard.tsx`.
   - Global route protection remains in `AppAuthBoundary`.

## Not changed in this step

- `python-jose` migration for JWT was not applied because it introduces a new runtime dependency and should be done together with dependency installation and token regression testing.
- Per-tutor curriculum isolation or an admin-only school catalogue was not applied because it requires schema/product decision and likely a migration.
- `httpOnly` cookie auth was not applied because it changes frontend/backend auth flow and CORS behavior.
- Pagination and response models were left for a separate API contract cleanup step.
