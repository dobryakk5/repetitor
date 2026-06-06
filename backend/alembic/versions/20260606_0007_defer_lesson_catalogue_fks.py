"""defer lesson catalogue foreign keys

Revision ID: 20260606_0007
Revises: 20260606_0006
Create Date: 2026-06-06
"""

from __future__ import annotations

from alembic import op

revision = "20260606_0007"
down_revision = "20260606_0006"
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


def _drop_lesson_catalogue_fks() -> None:
    # Initial migrations used PostgreSQL auto-generated names. Later migrations
    # may already have explicit names, so drop both variants safely.
    op.execute(
        """
        ALTER TABLE lesson_topic_results
            DROP CONSTRAINT IF EXISTS fk_lesson_topic_results_topic_id,
            DROP CONSTRAINT IF EXISTS lesson_topic_results_topic_id_fkey
        """
    )
    op.execute(
        """
        ALTER TABLE lesson_mistakes
            DROP CONSTRAINT IF EXISTS fk_lesson_mistakes_mistake_type_id,
            DROP CONSTRAINT IF EXISTS lesson_mistakes_mistake_type_id_fkey
        """
    )


def _create_deferred_lesson_catalogue_fks() -> None:
    # PostgreSQL can defer NO ACTION foreign-key checks. RESTRICT is checked
    # immediately by design, so use NO ACTION + DEFERRABLE for the intended
    # commit-time validation.
    op.execute(
        """
        ALTER TABLE lesson_topic_results
        ADD CONSTRAINT fk_lesson_topic_results_topic_id
            FOREIGN KEY (topic_id) REFERENCES topics(id)
            ON DELETE NO ACTION
            DEFERRABLE INITIALLY DEFERRED
        """
    )
    op.execute(
        """
        ALTER TABLE lesson_mistakes
        ADD CONSTRAINT fk_lesson_mistakes_mistake_type_id
            FOREIGN KEY (mistake_type_id) REFERENCES mistake_types(id)
            ON DELETE NO ACTION
            DEFERRABLE INITIALLY DEFERRED
        """
    )


def _create_immediate_lesson_catalogue_fks() -> None:
    op.execute(
        """
        ALTER TABLE lesson_topic_results
        ADD CONSTRAINT fk_lesson_topic_results_topic_id
            FOREIGN KEY (topic_id) REFERENCES topics(id)
            ON DELETE RESTRICT
        """
    )
    op.execute(
        """
        ALTER TABLE lesson_mistakes
        ADD CONSTRAINT fk_lesson_mistakes_mistake_type_id
            FOREIGN KEY (mistake_type_id) REFERENCES mistake_types(id)
            ON DELETE RESTRICT
        """
    )


def upgrade() -> None:
    # Personal catalogue rows can now be deleted together with the tutor account;
    # lesson result rows that reference them are protected by deferred FK checks.
    _recreate_owner_fks("CASCADE")
    _drop_lesson_catalogue_fks()
    _create_deferred_lesson_catalogue_fks()


def downgrade() -> None:
    _drop_lesson_catalogue_fks()
    _create_immediate_lesson_catalogue_fks()
    _recreate_owner_fks("RESTRICT")
