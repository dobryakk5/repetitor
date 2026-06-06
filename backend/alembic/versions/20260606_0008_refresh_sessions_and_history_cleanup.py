"""add refresh sessions and cleanup skill history duplicates

Revision ID: 20260606_0008
Revises: 20260606_0007
Create Date: 2026-06-06
"""

from alembic import op

revision = "20260606_0008"
down_revision = "20260606_0007"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        CREATE TABLE refresh_sessions (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            token_hash VARCHAR(128) NOT NULL UNIQUE,
            expires_at TIMESTAMPTZ NOT NULL,
            revoked_at TIMESTAMPTZ NULL,
            replaced_by_id INTEGER NULL REFERENCES refresh_sessions(id) ON DELETE SET NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
        """
    )
    op.execute("CREATE INDEX ix_refresh_sessions_user_id ON refresh_sessions (user_id)")
    op.execute("CREATE INDEX ix_refresh_sessions_token_hash ON refresh_sessions (token_hash)")
    op.execute("CREATE INDEX ix_refresh_sessions_expires_at ON refresh_sessions (expires_at)")
    op.execute("CREATE INDEX ix_refresh_sessions_revoked_at ON refresh_sessions (revoked_at)")

    # Old recalculate_lesson_analytics versions could write the same lesson/topic/skill
    # snapshot multiple times. Keep the newest row per recalculable lesson snapshot.
    op.execute(
        """
        DELETE FROM student_skill_history h
        USING (
            SELECT
                id,
                ROW_NUMBER() OVER (
                    PARTITION BY lesson_id, student_id, topic_id, COALESCE(skill_id, 0)
                    ORDER BY created_at DESC, id DESC
                ) AS rn
            FROM student_skill_history
            WHERE lesson_id IS NOT NULL
        ) d
        WHERE h.id = d.id AND d.rn > 1
        """
    )


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS refresh_sessions")
