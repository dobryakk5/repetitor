# Step 7.1 — MVP stabilization

This step does not add a new product feature. It makes the current MVP easier to deploy and verify.

## Added

- Root `.gitignore` for Python, Node.js, Next.js, env files and service artifacts.
- `backend/requirements-dev.txt` for local tests.
- `backend/scripts/run_backend_local.sh` to load `.env`, apply migrations and start Uvicorn.
- `backend/scripts/smoke_test.py` and `backend/scripts/smoke_test.sh` for end-to-end backend verification.
- `backend/app/scripts/create_admin.py` for optional admin user creation.
- Minimal unit tests:
  - `backend/tests/test_security.py`
  - `backend/tests/test_calculations.py`
- `frontend/.env.example`.
- `docs/DEPLOY.md` with manual deploy instructions.
- `docs/CHECKLIST.md` with MVP verification scenarios.
- Updated root `README.md`.
- Updated `backend/Dockerfile` to copy helper scripts and set executable permissions.

## Verified statically

```bash
python -m compileall backend/app backend/alembic backend/tests
bash -n backend/scripts/run_backend_local.sh
bash -n backend/scripts/smoke_test.sh
python -m py_compile backend/scripts/smoke_test.py backend/app/scripts/create_admin.py
```

## Runtime checks still required on the target machine

```bash
docker compose down -v
docker compose up --build
```

Then:

```bash
curl http://localhost:8100/api/health/
cd backend
BACKEND_API_URL=http://localhost:8100/api python scripts/smoke_test.py
```

Frontend:

```bash
cd frontend
npm install
npm run typecheck
npm run build
```
