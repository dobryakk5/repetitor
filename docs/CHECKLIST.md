# MVP verification checklist

## Backend

```bash
cd backend
python -m compileall app alembic
```

With dependencies installed:

```bash
pytest -q
BACKEND_API_URL=http://localhost:8100/api python scripts/smoke_test.py
```

## Frontend

```bash
cd frontend
npm install
npm run typecheck
npm run build
```

## Manual acceptance scenario

1. Open `/register` and create a tutor.
2. Log in; browser auth should work through the `httpOnly` cookie, not `localStorage`.
3. Create a student.
4. Create a lesson with topic, metrics, mistake and homework.
5. Open the student card and check the learning summary.
6. Open the lesson.
7. Generate a report.
8. Edit and save the report.
9. Log out.
10. Check that `/students` redirects to `/login`.

## Access-control scenario

1. Create tutor A and create a student, lesson and report.
2. Create tutor B.
3. Log in as tutor B.
4. Tutor B must not see tutor A's students.
5. Direct access to tutor A's student/lesson/report IDs must return `404` or authorization error.

## School catalogue scenario

1. Create a normal tutor through `/register`.
2. As this tutor, check that `GET /api/school/subjects/` works.
3. As this tutor, check that `POST /api/school/subjects/` returns `403`.
4. Create an admin via `PYTHONPATH=. python -m app.scripts.create_admin`.
5. As admin, check that school catalogue create/update endpoints work.
