# Refactor step 7.6 — Deferred lesson catalogue FKs

## Why

Step 7.5 protected the hybrid catalogue by changing personal catalogue owner FKs
(`topics.tutor_id`, `skills.tutor_id`, `mistake_types.tutor_id`) from `CASCADE`
to `RESTRICT`. That was safe, but too conservative: it blocked account deletion
when a tutor had personal catalogue rows.

The better PostgreSQL-level fix is to allow personal catalogue rows to be deleted
together with the tutor account, while deferring lesson-catalogue FK validation
until transaction commit.

## Important PostgreSQL detail

`ON DELETE RESTRICT` is checked immediately. To actually defer FK validation,
the constraint must use:

```sql
ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED
```

So the migration intentionally uses `NO ACTION`, not `RESTRICT`, for:

- `lesson_topic_results.topic_id -> topics.id`
- `lesson_mistakes.mistake_type_id -> mistake_types.id`

By commit time, the cascade from `lessons` has already removed dependent lesson
results/mistakes, so the deferred check sees a consistent final state.

## What changed

Migration added:

```text
backend/alembic/versions/20260606_0007_defer_lesson_catalogue_fks.py
```

It does three things:

1. Restores owner FKs to `ON DELETE CASCADE`:
   - `topics.tutor_id`
   - `skills.tutor_id`
   - `mistake_types.tutor_id`
2. Drops old immediate FK constraints on lesson catalogue references.
3. Recreates them as `DEFERRABLE INITIALLY DEFERRED` constraints.

The migration drops both explicit and PostgreSQL auto-generated FK names safely:

- `fk_lesson_topic_results_topic_id`
- `lesson_topic_results_topic_id_fkey`
- `fk_lesson_mistakes_mistake_type_id`
- `lesson_mistakes_mistake_type_id_fkey`

## Product behavior after this step

Deleting a tutor account may delete:

- tutor-owned lessons,
- lesson topic results,
- lesson mistakes,
- personal catalogue rows,
- analytics rows tied to those catalogue rows.

System catalogue rows (`tutor_id IS NULL`) remain shared and are not owned by the
deleted tutor.

## Apply

```bash
cd backend
alembic upgrade head
```

## Check in PostgreSQL

```sql
SELECT
    conname,
    conrelid::regclass AS table_name,
    confrelid::regclass AS referenced_table,
    confdeltype,
    condeferrable,
    condeferred
FROM pg_constraint
WHERE conname IN (
    'fk_lesson_topic_results_topic_id',
    'fk_lesson_mistakes_mistake_type_id'
);
```

Expected:

- `condeferrable = true`
- `condeferred = true`
- `confdeltype = a` (`NO ACTION`)
