"""add student share tokens

Revision ID: 20260607_0010
Revises: 20260606_0009
Create Date: 2026-06-07
"""

from alembic import op

revision = "20260607_0010"
down_revision = "20260606_0009"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TABLE students ADD COLUMN share_token_hash VARCHAR(64)")
    op.execute("ALTER TABLE students ADD COLUMN share_token_created_at TIMESTAMPTZ")
    op.execute("CREATE UNIQUE INDEX ix_students_share_token_hash ON students (share_token_hash)")


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_students_share_token_hash")
    op.execute("ALTER TABLE students DROP COLUMN IF EXISTS share_token_created_at")
    op.execute("ALTER TABLE students DROP COLUMN IF EXISTS share_token_hash")
