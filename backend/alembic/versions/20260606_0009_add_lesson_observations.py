"""add lesson observations

Revision ID: 20260606_0009
Revises: 20260606_0008
Create Date: 2026-06-06
"""

from alembic import op

revision = "20260606_0009"
down_revision = "20260606_0008"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        CREATE TABLE lesson_observations (
            id SERIAL PRIMARY KEY,
            lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
            tutor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

            mood_state VARCHAR(32) NOT NULL DEFAULT 'stable',
            energy_state VARCHAR(32) NOT NULL DEFAULT 'active',

            discipline_state VARCHAR(32) NOT NULL DEFAULT 'healthy_discipline',
            respect_state VARCHAR(32) NOT NULL DEFAULT 'respectful',
            conversation_state VARCHAR(48) NOT NULL DEFAULT 'comments_answers',
            argument_state VARCHAR(48) NOT NULL DEFAULT 'constructive_argument',
            answer_state VARCHAR(48) NOT NULL DEFAULT 'answers_immediately',

            concentration_score INTEGER NOT NULL DEFAULT 7,
            work_pace_score INTEGER NOT NULL DEFAULT 7,
            attention_stability_score INTEGER NOT NULL DEFAULT 7,

            intellectual_interest BOOLEAN NOT NULL DEFAULT FALSE,
            reasoning BOOLEAN NOT NULL DEFAULT FALSE,
            hypothesis_building BOOLEAN NOT NULL DEFAULT FALSE,
            inference_making BOOLEAN NOT NULL DEFAULT FALSE,

            task_independence_state VARCHAR(32) NOT NULL DEFAULT 'with_help',
            subject_attitude VARCHAR(32) NOT NULL DEFAULT 'neutral',
            answer_argumentation_state VARCHAR(32) NOT NULL DEFAULT 'can_argue',
            question_state VARCHAR(32) NOT NULL DEFAULT 'asks_questions',
            extra_info_state VARCHAR(48) NOT NULL DEFAULT 'does_not_search_extra_info',
            keyword_state VARCHAR(48) NOT NULL DEFAULT 'highlights_keywords',

            comment TEXT NOT NULL DEFAULT '',
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

            CONSTRAINT uq_lesson_observations_lesson_id UNIQUE (lesson_id),
            CONSTRAINT ck_lesson_observations_mood CHECK (mood_state IN ('stable', 'mood_change', 'emotional_outburst')),
            CONSTRAINT ck_lesson_observations_energy CHECK (energy_state IN ('active', 'tired')),
            CONSTRAINT ck_lesson_observations_discipline CHECK (discipline_state IN ('healthy_discipline', 'discipline_issues')),
            CONSTRAINT ck_lesson_observations_respect CHECK (respect_state IN ('respectful', 'disrespect_signs')),
            CONSTRAINT ck_lesson_observations_conversation CHECK (conversation_state IN ('comments_answers', 'distracted_talks')),
            CONSTRAINT ck_lesson_observations_argument CHECK (argument_state IN ('constructive_argument', 'distraction_argument')),
            CONSTRAINT ck_lesson_observations_answer CHECK (answer_state IN ('answers_immediately', 'avoids_answer', 'does_not_answer')),
            CONSTRAINT ck_lesson_observations_concentration CHECK (concentration_score BETWEEN 1 AND 10),
            CONSTRAINT ck_lesson_observations_work_pace CHECK (work_pace_score BETWEEN 1 AND 10),
            CONSTRAINT ck_lesson_observations_attention_stability CHECK (attention_stability_score BETWEEN 1 AND 10),
            CONSTRAINT ck_lesson_observations_task_independence CHECK (task_independence_state IN ('independent', 'with_help', 'not_done')),
            CONSTRAINT ck_lesson_observations_subject_attitude CHECK (subject_attitude IN ('likes', 'neutral', 'dislikes')),
            CONSTRAINT ck_lesson_observations_answer_argumentation CHECK (answer_argumentation_state IN ('can_argue', 'cannot_argue')),
            CONSTRAINT ck_lesson_observations_question CHECK (question_state IN ('asks_questions', 'does_not_ask_questions')),
            CONSTRAINT ck_lesson_observations_extra_info CHECK (extra_info_state IN ('searches_extra_info', 'does_not_search_extra_info')),
            CONSTRAINT ck_lesson_observations_keyword CHECK (keyword_state IN ('highlights_keywords', 'does_not_highlight_keywords'))
        )
        """
    )
    op.execute("CREATE INDEX ix_lesson_observations_lesson_id ON lesson_observations (lesson_id)")
    op.execute("CREATE INDEX ix_lesson_observations_tutor_id ON lesson_observations (tutor_id)")


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS lesson_observations")
