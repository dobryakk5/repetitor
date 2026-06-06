"""add auth and tutor ownership

Revision ID: 20260605_0004
Revises: 20260605_0003
Create Date: 2026-06-05
"""

from alembic import op

revision = "20260605_0004"
down_revision = "20260605_0003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        CREATE TABLE users (
            id SERIAL PRIMARY KEY,
            email VARCHAR(255) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            full_name VARCHAR(255) NOT NULL DEFAULT '',
            role VARCHAR(32) NOT NULL DEFAULT 'tutor',
            is_active BOOLEAN NOT NULL DEFAULT TRUE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            CONSTRAINT ck_users_role CHECK (role IN ('admin', 'tutor'))
        )
        """
    )
    op.execute("CREATE INDEX ix_users_email ON users (email)")
    op.execute("CREATE INDEX ix_users_role ON users (role)")
    op.execute("CREATE INDEX ix_users_is_active ON users (is_active)")

    # Empty-database migration: columns are NOT NULL because Step 7 starts before real data entry.
    op.execute("ALTER TABLE students ADD COLUMN tutor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE")
    op.execute("CREATE INDEX ix_students_tutor_id ON students (tutor_id)")

    op.execute("ALTER TABLE lessons ADD COLUMN tutor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE")
    op.execute("CREATE INDEX ix_lessons_tutor_id ON lessons (tutor_id)")

    op.execute("ALTER TABLE homeworks ADD COLUMN tutor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE")
    op.execute("CREATE INDEX ix_homeworks_tutor_id ON homeworks (tutor_id)")

    op.execute("ALTER TABLE recommendations ADD COLUMN tutor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE")
    op.execute("CREATE INDEX ix_recommendations_tutor_id ON recommendations (tutor_id)")

    op.execute("ALTER TABLE reports ADD COLUMN tutor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE")
    op.execute("CREATE INDEX ix_reports_tutor_id ON reports (tutor_id)")

    op.execute("ALTER TABLE learning_goals ADD COLUMN tutor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE")
    op.execute("CREATE INDEX ix_learning_goals_tutor_id ON learning_goals (tutor_id)")

    op.execute("ALTER TABLE student_groups ADD COLUMN tutor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE")
    op.execute("CREATE INDEX ix_student_groups_tutor_id ON student_groups (tutor_id)")
    op.execute("ALTER TABLE student_groups DROP CONSTRAINT IF EXISTS student_groups_name_key")
    op.execute("CREATE UNIQUE INDEX uq_student_groups_tutor_name ON student_groups (tutor_id, name)")


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS uq_student_groups_tutor_name")
    op.execute("ALTER TABLE student_groups ADD CONSTRAINT student_groups_name_key UNIQUE (name)")
    op.execute("ALTER TABLE student_groups DROP COLUMN IF EXISTS tutor_id")
    op.execute("ALTER TABLE learning_goals DROP COLUMN IF EXISTS tutor_id")
    op.execute("ALTER TABLE reports DROP COLUMN IF EXISTS tutor_id")
    op.execute("ALTER TABLE recommendations DROP COLUMN IF EXISTS tutor_id")
    op.execute("ALTER TABLE homeworks DROP COLUMN IF EXISTS tutor_id")
    op.execute("ALTER TABLE lessons DROP COLUMN IF EXISTS tutor_id")
    op.execute("ALTER TABLE students DROP COLUMN IF EXISTS tutor_id")
    op.execute("DROP TABLE IF EXISTS users")
