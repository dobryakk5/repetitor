#!/bin/sh
set -e

python - <<'PY'
import time
from sqlalchemy import create_engine, text
from app.core.config import settings

last_error = None
for _ in range(30):
    try:
        engine = create_engine(settings.database_url, pool_pre_ping=True)
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        raise SystemExit(0)
    except Exception as exc:  # pragma: no cover - startup helper
        last_error = exc
        time.sleep(1)
raise SystemExit(f"Database is not ready: {last_error}")
PY

alembic upgrade head
exec uvicorn app.main:app --host 0.0.0.0 --port 8100
