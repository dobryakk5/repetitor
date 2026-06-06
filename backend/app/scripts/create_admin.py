"""Create or update an admin user.

Usage:
  ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD='StrongPassword123' \
  PYTHONPATH=. python -m app.scripts.create_admin
"""
from __future__ import annotations

import os

from sqlalchemy import select

from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models.auth import User
from app.services.auth import normalize_email


def main() -> None:
    email_raw = os.getenv("ADMIN_EMAIL")
    password = os.getenv("ADMIN_PASSWORD")
    full_name = os.getenv("ADMIN_FULL_NAME", "Administrator")
    if not email_raw or not password:
        raise SystemExit("ADMIN_EMAIL and ADMIN_PASSWORD are required")
    if len(password) < 8:
        raise SystemExit("ADMIN_PASSWORD must be at least 8 characters")

    email = normalize_email(email_raw)
    db = SessionLocal()
    try:
        user = db.scalar(select(User).where(User.email == email))
        if user is None:
            user = User(
                email=email,
                password_hash=hash_password(password),
                full_name=full_name,
                role="admin",
                is_active=True,
            )
            db.add(user)
            action = "created"
        else:
            user.password_hash = hash_password(password)
            user.full_name = full_name
            user.role = "admin"
            user.is_active = True
            action = "updated"
        db.commit()
        db.refresh(user)
        print(f"Admin user {action}: id={user.id} email={user.email}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
