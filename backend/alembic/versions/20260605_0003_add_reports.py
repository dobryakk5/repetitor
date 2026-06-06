"""add reports

Revision ID: 20260605_0003
Revises: 20260605_0002
Create Date: 2026-06-05
"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "20260605_0003"
down_revision = "20260605_0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        CREATE TABLE reports (
            id SERIAL PRIMARY KEY,
            student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
            lesson_id INTEGER NULL REFERENCES lessons(id) ON DELETE SET NULL,
            report_type VARCHAR(32) NOT NULL,
            period_from DATE NULL,
            period_to DATE NULL,
            title VARCHAR(255) NOT NULL,
            content TEXT NOT NULL,
            payload_json JSONB NOT NULL DEFAULT '{}'::jsonb,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            CONSTRAINT ck_reports_type CHECK (report_type IN ('lesson_report', 'period_report', 'topic_report'))
        )
        """
    )
    op.execute("CREATE INDEX ix_reports_student_id ON reports (student_id)")
    op.execute("CREATE INDEX ix_reports_lesson_id ON reports (lesson_id)")
    op.execute("CREATE INDEX ix_reports_report_type ON reports (report_type)")
    op.execute("CREATE INDEX ix_reports_student_type ON reports (student_id, report_type)")
    op.execute("CREATE INDEX ix_reports_created_at ON reports (created_at)")


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS reports")
