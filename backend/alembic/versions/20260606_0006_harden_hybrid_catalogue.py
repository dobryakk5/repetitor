"""harden hybrid school catalogue ownership

Revision ID: 20260606_0006
Revises: 20260605_0005
Create Date: 2026-06-06
"""

from __future__ import annotations

from alembic import op

revision = "20260606_0006"
down_revision = "20260605_0005"
branch_labels = None
depends_on = None


OWNER_FKS = (
    ("topics", "fk_topics_tutor_id_users"),
    ("skills", "fk_skills_tutor_id_users"),
    ("mistake_types", "fk_mistake_types_tutor_id_users"),
)


def _recreate_owner_fks(ondelete: str) -> None:
    for table_name, constraint_name in OWNER_FKS:
        op.drop_constraint(constraint_name, table_name, type_="foreignkey")
        op.create_foreign_key(
            constraint_name,
            table_name,
            "users",
            ["tutor_id"],
            ["id"],
            ondelete=ondelete,
        )


def upgrade() -> None:
    # A tutor account with personal catalogue rows should not be deleted
    # implicitly, because lesson/history rows may still reference those rows.
    # User deletion must be an explicit product-level operation.
    _recreate_owner_fks("RESTRICT")

    # Match service-level uniqueness checks: names/codes are unique regardless
    # of letter case inside one catalogue scope.
    op.execute("DROP INDEX IF EXISTS uq_topics_owner_subject_parent_grade_name")
    op.execute("DROP INDEX IF EXISTS uq_skills_owner_topic_name")
    op.execute("DROP INDEX IF EXISTS uq_mistake_types_owner_subject_code")

    op.execute(
        """
        CREATE UNIQUE INDEX uq_topics_owner_subject_parent_grade_name
        ON topics (COALESCE(tutor_id, 0), subject_id, COALESCE(parent_id, 0), COALESCE(grade, 0), lower(name))
        """
    )
    op.execute(
        """
        CREATE UNIQUE INDEX uq_skills_owner_topic_name
        ON skills (COALESCE(tutor_id, 0), topic_id, lower(name))
        """
    )
    op.execute(
        """
        CREATE UNIQUE INDEX uq_mistake_types_owner_subject_code
        ON mistake_types (COALESCE(tutor_id, 0), subject_id, lower(code))
        """
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS uq_mistake_types_owner_subject_code")
    op.execute("DROP INDEX IF EXISTS uq_skills_owner_topic_name")
    op.execute("DROP INDEX IF EXISTS uq_topics_owner_subject_parent_grade_name")

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

    _recreate_owner_fks("CASCADE")
