"""initial clean TutorTrack schema

Revision ID: 20260605_0001
Revises:
Create Date: 2026-06-05
"""

from __future__ import annotations

from alembic import op

revision = "20260605_0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        CREATE TABLE students (
            id SERIAL PRIMARY KEY,
            first_name VARCHAR(120) NOT NULL,
            last_name VARCHAR(120) NOT NULL DEFAULT '',
            grade INTEGER NULL,
            school_class_label VARCHAR(64) NOT NULL DEFAULT '',
            parent_name VARCHAR(255) NOT NULL DEFAULT '',
            parent_contact VARCHAR(255) NOT NULL DEFAULT '',
            learning_goal TEXT NOT NULL DEFAULT '',
            start_level TEXT NOT NULL DEFAULT '',
            comment TEXT NOT NULL DEFAULT '',
            is_active BOOLEAN NOT NULL DEFAULT TRUE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            CONSTRAINT ck_students_grade CHECK (grade IS NULL OR grade BETWEEN 1 AND 11)
        )
        """
    )
    op.execute("CREATE INDEX ix_students_grade ON students (grade)")
    op.execute("CREATE INDEX ix_students_is_active ON students (is_active)")

    op.execute(
        """
        CREATE TABLE subjects (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            code VARCHAR(64) NOT NULL,
            is_active BOOLEAN NOT NULL DEFAULT TRUE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
        """
    )
    op.execute("CREATE UNIQUE INDEX ix_subjects_code ON subjects (code)")

    op.execute(
        """
        CREATE TABLE topics (
            id SERIAL PRIMARY KEY,
            subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
            parent_id INTEGER NULL REFERENCES topics(id) ON DELETE CASCADE,
            grade INTEGER NULL,
            name VARCHAR(255) NOT NULL,
            description TEXT NULL DEFAULT '',
            sort_order INTEGER NOT NULL DEFAULT 0,
            is_active BOOLEAN NOT NULL DEFAULT TRUE,
            created_at TIMESTAMPTZ NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NULL DEFAULT now(),
            CONSTRAINT ck_topics_grade CHECK (grade IS NULL OR grade BETWEEN 1 AND 11)
        )
        """
    )
    op.execute("CREATE INDEX ix_topics_subject_id ON topics (subject_id)")
    op.execute("CREATE INDEX ix_topics_parent_id ON topics (parent_id)")
    op.execute("CREATE INDEX ix_topics_grade ON topics (grade)")
    op.execute(
        """
        CREATE UNIQUE INDEX uq_topics_subject_parent_grade_name
        ON topics (subject_id, COALESCE(parent_id, 0), COALESCE(grade, 0), name)
        """
    )

    op.execute(
        """
        CREATE TABLE skills (
            id SERIAL PRIMARY KEY,
            topic_id INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
            name VARCHAR(255) NOT NULL,
            description TEXT NULL DEFAULT '',
            sort_order INTEGER NOT NULL DEFAULT 0,
            is_active BOOLEAN NOT NULL DEFAULT TRUE,
            created_at TIMESTAMPTZ NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NULL DEFAULT now()
        )
        """
    )
    op.execute("CREATE INDEX ix_skills_topic_id ON skills (topic_id)")
    op.execute("CREATE UNIQUE INDEX uq_skills_topic_name ON skills (topic_id, name)")

    op.execute(
        """
        CREATE TABLE mistake_types (
            id SERIAL PRIMARY KEY,
            subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
            code VARCHAR(96) NOT NULL,
            name VARCHAR(255) NOT NULL,
            description TEXT NULL DEFAULT '',
            is_active BOOLEAN NOT NULL DEFAULT TRUE,
            created_at TIMESTAMPTZ NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NULL DEFAULT now()
        )
        """
    )
    op.execute("CREATE INDEX ix_mistake_types_subject_id ON mistake_types (subject_id)")
    op.execute("CREATE UNIQUE INDEX uq_mistake_types_subject_code ON mistake_types (subject_id, code)")

    op.execute(
        """
        CREATE TABLE lessons (
            id SERIAL PRIMARY KEY,
            student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
            subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE RESTRICT,
            lesson_date TIMESTAMPTZ NOT NULL DEFAULT now(),
            duration_minutes INTEGER NULL,
            lesson_type VARCHAR(64) NOT NULL DEFAULT 'practice',
            status VARCHAR(32) NOT NULL DEFAULT 'done',
            general_comment TEXT NULL DEFAULT '',
            tutor_comment TEXT NULL DEFAULT '',
            next_lesson_plan TEXT NULL DEFAULT '',
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            CONSTRAINT ck_lessons_duration_positive CHECK (duration_minutes IS NULL OR duration_minutes > 0)
        )
        """
    )
    op.execute("CREATE INDEX ix_lessons_student_id ON lessons (student_id)")
    op.execute("CREATE INDEX ix_lessons_subject_id ON lessons (subject_id)")
    op.execute("CREATE INDEX ix_lessons_lesson_date ON lessons (lesson_date)")

    op.execute(
        """
        CREATE TABLE lesson_topic_results (
            id SERIAL PRIMARY KEY,
            lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
            topic_id INTEGER NOT NULL REFERENCES topics(id) ON DELETE RESTRICT,
            skill_id INTEGER NULL REFERENCES skills(id) ON DELETE SET NULL,
            understanding_score INTEGER NOT NULL,
            accuracy_percent INTEGER NULL,
            independence_score INTEGER NOT NULL,
            attention_score INTEGER NOT NULL,
            speed_score INTEGER NULL,
            total_tasks INTEGER NULL,
            correct_tasks INTEGER NULL,
            hint_count INTEGER NULL,
            needs_repeat BOOLEAN NOT NULL DEFAULT FALSE,
            mastery_status VARCHAR(32) NOT NULL DEFAULT 'in_progress',
            comment TEXT NULL DEFAULT '',
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            CONSTRAINT ck_ltr_understanding CHECK (understanding_score BETWEEN 0 AND 100),
            CONSTRAINT ck_ltr_accuracy CHECK (accuracy_percent IS NULL OR accuracy_percent BETWEEN 0 AND 100),
            CONSTRAINT ck_ltr_independence CHECK (independence_score BETWEEN 0 AND 100),
            CONSTRAINT ck_ltr_attention CHECK (attention_score BETWEEN 0 AND 100),
            CONSTRAINT ck_ltr_speed CHECK (speed_score IS NULL OR speed_score BETWEEN 0 AND 100),
            CONSTRAINT ck_ltr_tasks CHECK (total_tasks IS NULL OR total_tasks >= 0),
            CONSTRAINT ck_ltr_correct_tasks CHECK (correct_tasks IS NULL OR correct_tasks >= 0),
            CONSTRAINT ck_ltr_correct_not_gt_total CHECK (total_tasks IS NULL OR correct_tasks IS NULL OR correct_tasks <= total_tasks),
            CONSTRAINT ck_ltr_hint_count CHECK (hint_count IS NULL OR hint_count >= 0)
        )
        """
    )
    op.execute("CREATE INDEX ix_ltr_lesson_id ON lesson_topic_results (lesson_id)")
    op.execute("CREATE INDEX ix_ltr_topic_id ON lesson_topic_results (topic_id)")
    op.execute("CREATE INDEX ix_ltr_skill_id ON lesson_topic_results (skill_id)")

    op.execute(
        """
        CREATE TABLE lesson_mistakes (
            id SERIAL PRIMARY KEY,
            lesson_topic_result_id INTEGER NOT NULL REFERENCES lesson_topic_results(id) ON DELETE CASCADE,
            mistake_type_id INTEGER NOT NULL REFERENCES mistake_types(id) ON DELETE RESTRICT,
            count INTEGER NOT NULL DEFAULT 1,
            severity VARCHAR(16) NOT NULL DEFAULT 'medium',
            comment TEXT NULL DEFAULT '',
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            CONSTRAINT ck_lesson_mistakes_count CHECK (count > 0),
            CONSTRAINT ck_lesson_mistakes_severity CHECK (severity IN ('low', 'medium', 'high'))
        )
        """
    )
    op.execute("CREATE INDEX ix_lesson_mistakes_result_id ON lesson_mistakes (lesson_topic_result_id)")
    op.execute("CREATE INDEX ix_lesson_mistakes_type_id ON lesson_mistakes (mistake_type_id)")

    op.execute(
        """
        CREATE TABLE homeworks (
            id SERIAL PRIMARY KEY,
            lesson_id INTEGER NULL REFERENCES lessons(id) ON DELETE SET NULL,
            student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
            subject_id INTEGER NULL REFERENCES subjects(id) ON DELETE SET NULL,
            topic_id INTEGER NULL REFERENCES topics(id) ON DELETE SET NULL,
            skill_id INTEGER NULL REFERENCES skills(id) ON DELETE SET NULL,
            text TEXT NOT NULL DEFAULT '',
            status VARCHAR(32) NOT NULL DEFAULT 'assigned',
            due_date DATE NULL,
            completion_percent INTEGER NULL,
            accuracy_percent INTEGER NULL,
            teacher_comment TEXT NULL DEFAULT '',
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            CONSTRAINT ck_homeworks_status CHECK (status IN ('assigned', 'done', 'partially_done', 'not_done', 'checked', 'redo_required')),
            CONSTRAINT ck_homeworks_completion CHECK (completion_percent IS NULL OR completion_percent BETWEEN 0 AND 100),
            CONSTRAINT ck_homeworks_accuracy CHECK (accuracy_percent IS NULL OR accuracy_percent BETWEEN 0 AND 100)
        )
        """
    )
    op.execute("CREATE INDEX ix_homeworks_lesson_id ON homeworks (lesson_id)")
    op.execute("CREATE INDEX ix_homeworks_student_id ON homeworks (student_id)")
    op.execute("CREATE INDEX ix_homeworks_subject_id ON homeworks (subject_id)")
    op.execute("CREATE INDEX ix_homeworks_topic_id ON homeworks (topic_id)")
    op.execute("CREATE INDEX ix_homeworks_skill_id ON homeworks (skill_id)")
    op.execute("CREATE INDEX ix_homeworks_status ON homeworks (status)")

    op.execute(
        """
        CREATE TABLE learning_goals (
            id SERIAL PRIMARY KEY,
            student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
            title VARCHAR(255) NOT NULL,
            description TEXT NOT NULL DEFAULT '',
            status VARCHAR(32) NOT NULL DEFAULT 'active',
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            CONSTRAINT ck_learning_goals_status CHECK (status IN ('active', 'done', 'paused', 'cancelled'))
        )
        """
    )
    op.execute("CREATE INDEX ix_learning_goals_student_id ON learning_goals (student_id)")
    op.execute("CREATE INDEX ix_learning_goals_status ON learning_goals (status)")

    op.execute(
        """
        CREATE TABLE student_groups (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL UNIQUE,
            description TEXT NOT NULL DEFAULT '',
            is_active BOOLEAN NOT NULL DEFAULT TRUE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
        """
    )
    op.execute("CREATE INDEX ix_student_groups_is_active ON student_groups (is_active)")

    op.execute(
        """
        CREATE TABLE student_group_members (
            id SERIAL PRIMARY KEY,
            group_id INTEGER NOT NULL REFERENCES student_groups(id) ON DELETE CASCADE,
            student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            CONSTRAINT uq_student_group_member UNIQUE (group_id, student_id)
        )
        """
    )
    op.execute("CREATE INDEX ix_student_group_members_group_id ON student_group_members (group_id)")
    op.execute("CREATE INDEX ix_student_group_members_student_id ON student_group_members (student_id)")

    # Seed data for manual testing of the first tutor workflow.
    op.execute("INSERT INTO subjects (id, name, code, is_active) VALUES (1, 'Математика', 'math', TRUE)")
    op.execute(
        """
        INSERT INTO topics (id, subject_id, parent_id, grade, name, description, sort_order, is_active)
        VALUES
            (1, 1, NULL, 5, 'Натуральные числа', 'Базовые действия и свойства натуральных чисел.', 10, TRUE),
            (2, 1, NULL, 5, 'Обыкновенные дроби', 'Доли, дроби, сравнение и действия с дробями.', 20, TRUE),
            (3, 1, 2, 5, 'Сравнение дробей', 'Сравнение дробей с одинаковыми и разными знаменателями.', 10, TRUE),
            (4, 1, 2, 5, 'Сложение дробей', 'Сложение дробей с одинаковыми и разными знаменателями.', 20, TRUE),
            (5, 1, 2, 5, 'Вычитание дробей', 'Вычитание дробей с одинаковыми и разными знаменателями.', 30, TRUE),
            (6, 1, NULL, 6, 'Дроби', 'Повторение и развитие навыков работы с дробями.', 10, TRUE),
            (7, 1, 6, 6, 'Сложение дробей с разными знаменателями', 'Нахождение общего знаменателя и сложение дробей.', 10, TRUE),
            (8, 1, 6, 6, 'Сокращение дробей', 'Приведение ответа к простому виду.', 20, TRUE),
            (9, 1, NULL, 6, 'Проценты', 'Нахождение процентов, числа по проценту и процента от числа.', 20, TRUE),
            (10, 1, NULL, 6, 'Отрицательные числа', 'Сравнение и действия с отрицательными числами.', 30, TRUE),
            (11, 1, NULL, 6, 'Уравнения', 'Простые линейные уравнения и проверка корня.', 40, TRUE),
            (12, 1, NULL, 6, 'Задачи на движение', 'Скорость, время, расстояние и текстовые задачи.', 50, TRUE)
        """
    )
    op.execute(
        """
        INSERT INTO skills (id, topic_id, name, description, sort_order, is_active)
        VALUES
            (1, 7, 'Находить НОК', 'Ученик умеет находить наименьшее общее кратное знаменателей.', 10, TRUE),
            (2, 7, 'Приводить дроби к общему знаменателю', 'Ученик правильно домножает числитель и знаменатель.', 20, TRUE),
            (3, 7, 'Складывать дроби', 'Ученик складывает числители после приведения к общему знаменателю.', 30, TRUE),
            (4, 8, 'Сокращать дроби', 'Ученик видит общий делитель и сокращает результат.', 10, TRUE),
            (5, 6, 'Переводить смешанное число в неправильную дробь', 'Ученик переводит смешанные числа перед действиями с дробями.', 40, TRUE),
            (6, 9, 'Находить процент от числа', 'Ученик решает базовые задачи на процент от числа.', 10, TRUE),
            (7, 12, 'Связывать скорость, время и расстояние', 'Ученик выбирает правильную формулу для задач на движение.', 10, TRUE)
        """
    )
    op.execute(
        """
        INSERT INTO mistake_types (id, subject_id, code, name, description, is_active)
        VALUES
            (1, 1, 'calculation_error', 'Вычислительная ошибка', 'Ошибка в арифметических действиях.', TRUE),
            (2, 1, 'attention_error', 'Невнимательность', 'Пропуск знака, числа, условия или шага решения.', TRUE),
            (3, 1, 'condition_misread', 'Неверно понял условие', 'Ученик неправильно прочитал или интерпретировал условие задачи.', TRUE),
            (4, 1, 'formula_error', 'Ошибка в формуле', 'Неверно выбрана или записана формула.', TRUE),
            (5, 1, 'logic_error', 'Ошибка в логике решения', 'Нарушена последовательность рассуждения или выбран неверный ход.', TRUE),
            (6, 1, 'sign_error', 'Ошибка со знаком', 'Ошибка с плюсами, минусами или направлением неравенства.', TRUE),
            (7, 1, 'unit_error', 'Ошибка с единицами измерения', 'Неверный перевод или использование единиц измерения.', TRUE),
            (8, 1, 'algorithm_error', 'Ошибка в алгоритме', 'Ученик не удерживает порядок действий или способ решения.', TRUE)
        """
    )
    op.execute("SELECT setval(pg_get_serial_sequence('subjects', 'id'), COALESCE((SELECT MAX(id) FROM subjects), 1), true)")
    op.execute("SELECT setval(pg_get_serial_sequence('topics', 'id'), COALESCE((SELECT MAX(id) FROM topics), 1), true)")
    op.execute("SELECT setval(pg_get_serial_sequence('skills', 'id'), COALESCE((SELECT MAX(id) FROM skills), 1), true)")
    op.execute("SELECT setval(pg_get_serial_sequence('mistake_types', 'id'), COALESCE((SELECT MAX(id) FROM mistake_types), 1), true)")


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS student_group_members CASCADE")
    op.execute("DROP TABLE IF EXISTS student_groups CASCADE")
    op.execute("DROP TABLE IF EXISTS learning_goals CASCADE")
    op.execute("DROP TABLE IF EXISTS homeworks CASCADE")
    op.execute("DROP TABLE IF EXISTS lesson_mistakes CASCADE")
    op.execute("DROP TABLE IF EXISTS lesson_topic_results CASCADE")
    op.execute("DROP TABLE IF EXISTS lessons CASCADE")
    op.execute("DROP TABLE IF EXISTS mistake_types CASCADE")
    op.execute("DROP TABLE IF EXISTS skills CASCADE")
    op.execute("DROP TABLE IF EXISTS topics CASCADE")
    op.execute("DROP TABLE IF EXISTS subjects CASCADE")
    op.execute("DROP TABLE IF EXISTS students CASCADE")
