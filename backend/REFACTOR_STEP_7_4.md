# Step 7.4 — Hybrid school catalogue: system skeleton + personal additions

## Goal

Replace the strict `admin-only` school catalogue with a hybrid model:

- `tutor_id IS NULL` — system catalogue row, created and edited by `admin`.
- `tutor_id = users.id` — personal catalogue row, created and edited by that tutor.
- Read queries return only visible rows: system rows plus the current tutor's personal rows.

`subjects` remain global and admin-only.

## Database changes

New nullable owner columns:

- `topics.tutor_id`
- `skills.tutor_id`
- `mistake_types.tutor_id`

Step 7.4 initially added owner FKs. Step 7.5 hardens them to `users(id) ON DELETE RESTRICT` so a user with personal catalogue rows is not deleted implicitly while lessons/history may still reference those rows.

Unique indexes were changed so personal rows do not conflict with system rows. Step 7.5 makes those indexes case-insensitive:

- `uq_topics_owner_subject_parent_grade_name`
- `uq_skills_owner_topic_name`
- `uq_mistake_types_owner_subject_code`

This allows a tutor to add a personal topic, skill, or mistake type in their own scope, while preventing case-only duplicates such as `Дроби` and `дроби` inside one scope.

## API behavior

### Subjects

Subjects are still system-level rows:

- `GET /api/school/subjects/` — tutor/admin.
- `POST/PATCH /api/school/subjects/` — admin only.

### Topics, skills, mistake types

- `GET` returns `system + own` rows only.
- `POST`:
  - admin creates system row (`tutor_id = NULL`),
  - tutor creates personal row (`tutor_id = current_user.id`).
- `PATCH`:
  - admin can edit system rows,
  - tutor can edit only own personal rows,
  - system rows cannot be edited by tutors,
  - personal rows of another tutor are returned as `404`.

## Safety rules

- A system topic cannot have a personal parent topic.
- A personal topic can have a system parent or its own personal parent.
- A system skill cannot be attached to a personal topic.
- A personal skill can be attached to a system topic or its own personal topic.
- Lesson/homework validation now checks that selected topics, skills, and mistake types are either system rows or owned by the current tutor.

## Response fields

School response models now include:

- `tutorId`
- `isSystem`

This lets the frontend distinguish system catalogue rows from personal additions.

## Migration

Apply after Step 7.3:

```bash
cd backend
alembic upgrade head
```

New migration:

```text
20260605_0005_add_personal_school_catalogue.py
```
