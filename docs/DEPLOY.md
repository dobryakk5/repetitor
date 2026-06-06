# TutorTrack deploy and verification guide

This guide assumes a clean PostgreSQL database. The current schema is managed only by Alembic migrations.

## 0. Required versions

Recommended:

```bash
python3 --version       # Python 3.12 is recommended; 3.11+ should also work
psql --version          # PostgreSQL 16 recommended
node --version          # Node.js 20+
npm --version
```

Backend port used below: `8100`.
Frontend port used below: `3100`.

---

## 1. Create a new PostgreSQL database

Run as a PostgreSQL superuser:

```bash
sudo -u postgres psql
```

Inside `psql`:

```sql
CREATE USER tutor WITH PASSWORD 'CHANGE_THIS_STRONG_PASSWORD';
CREATE DATABASE tutor OWNER tutortrack ENCODING 'UTF8';
GRANT ALL PRIVILEGES ON DATABASE tutortrack TO tutortrack;
\c tutortrack
GRANT ALL ON SCHEMA public TO tutortrack;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO tutor;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO tutor;
\q
```

Connection string example for local PostgreSQL:

```text
postgresql+psycopg://tutortrack:CHANGE_THIS_STRONG_PASSWORD@127.0.0.1:5432/tutortrack
```

---

## 2. Install backend Python environment

From the project root:

```bash
cd backend
python3.12 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip wheel
pip install -r requirements.txt
```

For tests and local checks:

```bash
pip install -r requirements-dev.txt
```

---

## 3. Configure backend environment

Create `backend/.env`:

```bash
cp .env.example .env
```

Edit values:

```env
DATABASE_URL=postgresql+psycopg://tutortrack:CHANGE_THIS_STRONG_PASSWORD@127.0.0.1:5432/tutortrack
FRONTEND_URL=http://localhost:3100
SECRET_KEY=REPLACE_WITH_LONG_RANDOM_SECRET
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=30
AUTH_COOKIE_SECURE=false
AUTH_COOKIE_SAMESITE=lax
```

Generate a random secret:

```bash
python - <<'PY'
import secrets
print(secrets.token_urlsafe(48))
PY
```

The app reads environment variables from the shell. For manual commands, load `.env` like this:

```bash
set -a
source .env
set +a
export PYTHONPATH=.
```

---

## 4. Run migrations

From `backend/` with venv activated and env loaded:

```bash
alembic upgrade head
alembic current
```

Expected migration chain:

```text
20260605_0001_initial_tutor_schema
20260605_0002_add_analytics_core
20260605_0003_add_reports
20260605_0004_add_auth
```

No extra migration is needed for the admin-only school catalogue policy: it is enforced at API level by role checks.

Check tables and seed data:

```bash
psql "$DATABASE_URL" -c "SELECT version();"
psql "$DATABASE_URL" -c "SELECT * FROM alembic_version;"
psql "$DATABASE_URL" -c "SELECT id, name, code FROM subjects;"
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM topics;"
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM skills;"
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM mistake_types;"
```

If `psql "$DATABASE_URL"` does not accept the SQLAlchemy-style URL, use the native URL form:

```bash
psql "postgresql://tutortrack:CHANGE_THIS_STRONG_PASSWORD@127.0.0.1:5432/tutortrack"
```

---

## 5. Create the first admin user

Open registration creates a `tutor` user. A tutor can read the shared school catalogue, but only an `admin` can create or edit `subjects`, `topics`, `skills` and `mistake_types`. Create an `admin` user from CLI:

```bash
ADMIN_EMAIL=admin@example.com \
ADMIN_PASSWORD='StrongPassword123' \
ADMIN_FULL_NAME='Admin' \
PYTHONPATH=. python -m app.scripts.create_admin
```

For normal lesson-entry MVP use you can register through `/register`. For curriculum/catalogue setup use the admin account.

---

## 6. Start backend manually

From `backend/`:

```bash
./scripts/run_backend_local.sh
```

Or directly:

```bash
alembic upgrade head
uvicorn app.main:app --host 0.0.0.0 --port 8100
```

Check health:

```bash
curl http://localhost:8100/api/health/
```

Expected:

```json
{"ok":"true"}
```

---

## 7. Install and run frontend

From the project root:

```bash
cd frontend
cp .env.example .env.local
npm install
npm run typecheck
npm run build
npm run start
```

For development:

```bash
npm run dev
```

Open:

```text
http://localhost:3100/register
```

---

## 8. Docker compose local deploy

Docker Compose reads `SECRET_KEY` from the project-root `.env` file. Generate it before the first run:

```bash
cp .env.example .env
python - <<'PY'
import pathlib, secrets
p = pathlib.Path('.env')
s = p.read_text()
s = s.replace('replace-with-generated-secret', secrets.token_urlsafe(48))
p.write_text(s)
PY
```

For a clean local run with Docker:

```bash
docker compose down -v
docker compose up --build
```

This starts PostgreSQL and backend. Frontend is still run separately from `frontend/`:

```bash
npm install
npm run dev
```

---

## 9. Smoke test

After backend is running:

```bash
cd backend
source .venv/bin/activate
BACKEND_API_URL=http://localhost:8100/api python scripts/smoke_test.py
```

Expected final line:

```text
SMOKE TEST OK
```

The smoke test registers a temporary tutor, creates a student, creates a lesson, checks analytics and generates a report.

---

## 10. Curl verification

Register:

```bash
curl -s -X POST http://localhost:8100/api/auth/register/ \
  -H 'Content-Type: application/json' \
  -d '{"email":"tutor@example.com","password":"StrongPassword123","fullName":"Tutor"}'
```

Login and save token:

```bash
TOKEN=$(curl -s -X POST http://localhost:8100/api/auth/login/ \
  -H 'Content-Type: application/json' \
  -d '{"email":"tutor@example.com","password":"StrongPassword123"}' \
  | python -c 'import json,sys; print(json.load(sys.stdin)["access_token"])')
```

Check current user with Bearer token:

```bash
curl -s http://localhost:8100/api/auth/me/ \
  -H "Authorization: Bearer $TOKEN"
```

Browser login uses an `httpOnly` cookie. You can verify cookie mode with curl as well:

```bash
curl -c /tmp/tutortrack-cookie.txt -s -X POST http://localhost:8100/api/auth/login/ \
  -H 'Content-Type: application/json' \
  -d '{"email":"tutor@example.com","password":"StrongPassword123"}' >/dev/null
curl -b /tmp/tutortrack-cookie.txt -s http://localhost:8100/api/auth/me/
```

Check seeded school dictionaries:

```bash
curl -s http://localhost:8100/api/school/subjects/ \
  -H "Authorization: Bearer $TOKEN"
```

Unauthorized check:

```bash
curl -i http://localhost:8100/api/students/
```

Expected status:

```text
401 Unauthorized
```

---

## 11. Minimal systemd unit for backend

Example `/etc/systemd/system/tutortrack-backend.service`:

```ini
[Unit]
Description=TutorTrack FastAPI backend
After=network.target postgresql.service

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/tutortrack/backend
Environment=DATABASE_URL=postgresql+psycopg://tutortrack:CHANGE_THIS_STRONG_PASSWORD@127.0.0.1:5432/tutortrack
Environment=FRONTEND_URL=https://YOUR_DOMAIN
Environment=SECRET_KEY=REPLACE_WITH_LONG_RANDOM_SECRET
Environment=ACCESS_TOKEN_EXPIRE_MINUTES=30
Environment=REFRESH_TOKEN_EXPIRE_DAYS=30
Environment=AUTH_COOKIE_SECURE=true
Environment=AUTH_COOKIE_SAMESITE=lax
Environment=PYTHONPATH=.
ExecStart=/var/www/tutortrack/backend/.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8100
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Apply migrations before starting or on every deploy:

```bash
cd /var/www/tutortrack/backend
source .venv/bin/activate
set -a; source .env; set +a
PYTHONPATH=. alembic upgrade head
sudo systemctl restart tutortrack-backend
```

---

## 12. Production notes

Before real production usage:

1. Replace `SECRET_KEY`.
2. Use HTTPS.
3. Do not store `.env` in git.
4. Add database backups.
5. Keep auth cookies `httpOnly`; use HTTPS and set `AUTH_COOKIE_SECURE=true` outside local development.
6. Run `npm run build`, backend tests and smoke test on every deploy.

## Step 7.4 hybrid school catalogue

Step 7.4 adds nullable `tutor_id` owner columns to `topics`, `skills`, and `mistake_types`.
Run migrations after deployment:

```bash
cd backend
alembic upgrade head
```

Catalogue rules:

- `tutor_id IS NULL` means a system row managed by admin.
- `tutor_id = current_user.id` means a personal tutor row.
- Tutors can read system rows plus their own personal rows.
- Subjects stay global and admin-only.

### Step 7.6 FK check

After `alembic upgrade head`, verify that lesson catalogue FKs are deferred:

```sql
SELECT conname, condeferrable, condeferred, confdeltype
FROM pg_constraint
WHERE conname IN (
  'fk_lesson_topic_results_topic_id',
  'fk_lesson_mistakes_mistake_type_id'
);
```

Expected: `condeferrable = true`, `condeferred = true`, `confdeltype = a`.
