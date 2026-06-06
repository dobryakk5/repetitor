"""add analytics core

Revision ID: 20260605_0002
Revises: 20260605_0001
Create Date: 2026-06-05
"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "20260605_0002"
down_revision = "20260605_0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TABLE lesson_topic_results ADD COLUMN progress_score INTEGER NULL")
    op.execute("ALTER TABLE lesson_topic_results ADD COLUMN risk_level VARCHAR(16) NOT NULL DEFAULT 'medium'")
    op.execute("ALTER TABLE lesson_topic_results ADD CONSTRAINT ck_ltr_progress_score CHECK (progress_score IS NULL OR progress_score BETWEEN 0 AND 100)")
    op.execute("ALTER TABLE lesson_topic_results ADD CONSTRAINT ck_ltr_risk_level CHECK (risk_level IN ('low', 'medium', 'high'))")
    op.execute("CREATE INDEX ix_ltr_progress_score ON lesson_topic_results (progress_score)")
    op.execute("CREATE INDEX ix_ltr_risk_level ON lesson_topic_results (risk_level)")

    op.execute(
        """
        CREATE TABLE student_skill_states (
            id SERIAL PRIMARY KEY,
            student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
            subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
            topic_id INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
            skill_id INTEGER NULL REFERENCES skills(id) ON DELETE CASCADE,
            current_understanding INTEGER NOT NULL,
            current_accuracy INTEGER NULL,
            current_independence INTEGER NOT NULL,
            current_attention INTEGER NOT NULL,
            current_progress_score INTEGER NOT NULL,
            mastery_status VARCHAR(32) NOT NULL DEFAULT 'in_progress',
            risk_level VARCHAR(16) NOT NULL DEFAULT 'medium',
            last_lesson_id INTEGER NULL REFERENCES lessons(id) ON DELETE SET NULL,
            last_practiced_at TIMESTAMPTZ NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            CONSTRAINT ck_ss_understanding CHECK (current_understanding BETWEEN 0 AND 100),
            CONSTRAINT ck_ss_accuracy CHECK (current_accuracy IS NULL OR current_accuracy BETWEEN 0 AND 100),
            CONSTRAINT ck_ss_independence CHECK (current_independence BETWEEN 0 AND 100),
            CONSTRAINT ck_ss_attention CHECK (current_attention BETWEEN 0 AND 100),
            CONSTRAINT ck_ss_progress CHECK (current_progress_score BETWEEN 0 AND 100),
            CONSTRAINT ck_ss_risk_level CHECK (risk_level IN ('low', 'medium', 'high'))
        )
        """
    )
    op.execute("CREATE INDEX ix_student_skill_states_student_id ON student_skill_states (student_id)")
    op.execute("CREATE INDEX ix_student_skill_states_subject_id ON student_skill_states (subject_id)")
    op.execute("CREATE INDEX ix_student_skill_states_topic_id ON student_skill_states (topic_id)")
    op.execute("CREATE INDEX ix_student_skill_states_skill_id ON student_skill_states (skill_id)")
    op.execute("CREATE INDEX ix_student_skill_states_risk_level ON student_skill_states (risk_level)")
    op.execute(
        """
        CREATE UNIQUE INDEX uq_student_skill_states_student_topic_skill
        ON student_skill_states (student_id, topic_id, COALESCE(skill_id, 0))
        """
    )

    op.execute(
        """
        CREATE TABLE student_skill_history (
            id SERIAL PRIMARY KEY,
            student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
            subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
            topic_id INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
            skill_id INTEGER NULL REFERENCES skills(id) ON DELETE CASCADE,
            lesson_id INTEGER NULL REFERENCES lessons(id) ON DELETE SET NULL,
            understanding INTEGER NOT NULL,
            accuracy INTEGER NULL,
            independence INTEGER NOT NULL,
            attention INTEGER NOT NULL,
            progress_score INTEGER NOT NULL,
            mastery_status VARCHAR(32) NOT NULL,
            risk_level VARCHAR(16) NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            CONSTRAINT ck_ssh_understanding CHECK (understanding BETWEEN 0 AND 100),
            CONSTRAINT ck_ssh_accuracy CHECK (accuracy IS NULL OR accuracy BETWEEN 0 AND 100),
            CONSTRAINT ck_ssh_independence CHECK (independence BETWEEN 0 AND 100),
            CONSTRAINT ck_ssh_attention CHECK (attention BETWEEN 0 AND 100),
            CONSTRAINT ck_ssh_progress CHECK (progress_score BETWEEN 0 AND 100),
            CONSTRAINT ck_ssh_risk_level CHECK (risk_level IN ('low', 'medium', 'high'))
        )
        """
    )
    op.execute("CREATE INDEX ix_student_skill_history_student_id ON student_skill_history (student_id)")
    op.execute("CREATE INDEX ix_student_skill_history_subject_id ON student_skill_history (subject_id)")
    op.execute("CREATE INDEX ix_student_skill_history_topic_id ON student_skill_history (topic_id)")
    op.execute("CREATE INDEX ix_student_skill_history_skill_id ON student_skill_history (skill_id)")
    op.execute("CREATE INDEX ix_student_skill_history_lesson_id ON student_skill_history (lesson_id)")
    op.execute("CREATE INDEX ix_student_skill_history_created_at ON student_skill_history (created_at)")

    op.execute(
        """
        CREATE TABLE recommendations (
            id SERIAL PRIMARY KEY,
            student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
            lesson_id INTEGER NULL REFERENCES lessons(id) ON DELETE CASCADE,
            topic_id INTEGER NULL REFERENCES topics(id) ON DELETE SET NULL,
            skill_id INTEGER NULL REFERENCES skills(id) ON DELETE SET NULL,
            type VARCHAR(64) NOT NULL,
            priority VARCHAR(16) NOT NULL DEFAULT 'medium',
            text TEXT NOT NULL,
            is_done BOOLEAN NOT NULL DEFAULT FALSE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            CONSTRAINT ck_recommendations_priority CHECK (priority IN ('low', 'medium', 'high'))
        )
        """
    )
    op.execute("CREATE INDEX ix_recommendations_student_id ON recommendations (student_id)")
    op.execute("CREATE INDEX ix_recommendations_lesson_id ON recommendations (lesson_id)")
    op.execute("CREATE INDEX ix_recommendations_topic_id ON recommendations (topic_id)")
    op.execute("CREATE INDEX ix_recommendations_skill_id ON recommendations (skill_id)")
    op.execute("CREATE INDEX ix_recommendations_is_done ON recommendations (is_done)")
    op.execute("CREATE INDEX ix_recommendations_priority ON recommendations (priority)")


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS recommendations")
    op.execute("DROP TABLE IF EXISTS student_skill_history")
    op.execute("DROP TABLE IF EXISTS student_skill_states")
    op.execute("DROP INDEX IF EXISTS ix_ltr_risk_level")
    op.execute("DROP INDEX IF EXISTS ix_ltr_progress_score")
    op.execute("ALTER TABLE lesson_topic_results DROP CONSTRAINT IF EXISTS ck_ltr_risk_level")
    op.execute("ALTER TABLE lesson_topic_results DROP CONSTRAINT IF EXISTS ck_ltr_progress_score")
    op.execute("ALTER TABLE lesson_topic_results DROP COLUMN IF EXISTS risk_level")
    op.execute("ALTER TABLE lesson_topic_results DROP COLUMN IF EXISTS progress_score")
