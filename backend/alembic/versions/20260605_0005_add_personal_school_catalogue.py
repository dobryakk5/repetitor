"""add personal school catalogue rows

Revision ID: 20260605_0005
Revises: 20260605_0004
Create Date: 2026-06-06
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa

revision = "20260605_0005"
down_revision = "20260605_0004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("topics", sa.Column("tutor_id", sa.Integer(), nullable=True))
    op.create_foreign_key("fk_topics_tutor_id_users", "topics", "users", ["tutor_id"], ["id"], ondelete="CASCADE")
    op.create_index("ix_topics_tutor_id", "topics", ["tutor_id"])

    op.add_column("skills", sa.Column("tutor_id", sa.Integer(), nullable=True))
    op.create_foreign_key("fk_skills_tutor_id_users", "skills", "users", ["tutor_id"], ["id"], ondelete="CASCADE")
    op.create_index("ix_skills_tutor_id", "skills", ["tutor_id"])

    op.add_column("mistake_types", sa.Column("tutor_id", sa.Integer(), nullable=True))
    op.create_foreign_key("fk_mistake_types_tutor_id_users", "mistake_types", "users", ["tutor_id"], ["id"], ondelete="CASCADE")
    op.create_index("ix_mistake_types_tutor_id", "mistake_types", ["tutor_id"])

    op.execute("DROP INDEX IF EXISTS uq_topics_subject_parent_grade_name")
    op.execute("DROP INDEX IF EXISTS uq_skills_topic_name")
    op.execute("DROP INDEX IF EXISTS uq_mistake_types_subject_code")

    op.execute(
        """
        CREATE UNIQUE INDEX uq_topics_owner_subject_parent_grade_name
        ON topics (COALESCE(tutor_id, 0), subject_id, COALESCE(parent_id, 0), COALESCE(grade, 0), name)
        """
    )
    op.execute(
        """
        CREATE UNIQUE INDEX uq_skills_owner_topic_name
        ON skills (COALESCE(tutor_id, 0), topic_id, name)
        """
    )
    op.execute(
        """
        CREATE UNIQUE INDEX uq_mistake_types_owner_subject_code
        ON mistake_types (COALESCE(tutor_id, 0), subject_id, code)
        """
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS uq_mistake_types_owner_subject_code")
    op.execute("DROP INDEX IF EXISTS uq_skills_owner_topic_name")
    op.execute("DROP INDEX IF EXISTS uq_topics_owner_subject_parent_grade_name")

    op.execute(
        """
        CREATE UNIQUE INDEX uq_topics_subject_parent_grade_name
        ON topics (subject_id, COALESCE(parent_id, 0), COALESCE(grade, 0), name)
        """
    )
    op.execute("CREATE UNIQUE INDEX uq_skills_topic_name ON skills (topic_id, name)")
    op.execute("CREATE UNIQUE INDEX uq_mistake_types_subject_code ON mistake_types (subject_id, code)")

    op.drop_index("ix_mistake_types_tutor_id", table_name="mistake_types")
    op.drop_constraint("fk_mistake_types_tutor_id_users", "mistake_types", type_="foreignkey")
    op.drop_column("mistake_types", "tutor_id")

    op.drop_index("ix_skills_tutor_id", table_name="skills")
    op.drop_constraint("fk_skills_tutor_id_users", "skills", type_="foreignkey")
    op.drop_column("skills", "tutor_id")

    op.drop_index("ix_topics_tutor_id", table_name="topics")
    op.drop_constraint("fk_topics_tutor_id_users", "topics", type_="foreignkey")
    op.drop_column("topics", "tutor_id")
