-- ============================================
-- SQL скрипт для создания базы данных
-- Система тестирования по русскому языку
-- PostgreSQL 12+
-- ============================================

-- Создание базы данных (опционально)
-- CREATE DATABASE russian_tests_db;
-- \c russian_tests_db;

-- ============================================
-- 1. ТАБЛИЦА ПОЛЬЗОВАТЕЛЕЙ
-- ============================================

CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Индексы
    CONSTRAINT username_length CHECK (LENGTH(username) >= 2)
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);

COMMENT ON TABLE users IS 'Таблица пользователей системы';
COMMENT ON COLUMN users.username IS 'Имя пользователя (уникальное)';


-- ============================================
-- 2. ТАБЛИЦА ТИПОВ ТЕСТОВ
-- ============================================

CREATE TABLE IF NOT EXISTS test_types (
    test_type_id SERIAL PRIMARY KEY,
    test_name VARCHAR(100) NOT NULL UNIQUE,
    test_name_ru VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Примеры: 'sentence_analysis', 'orthography', 'punctuation', 'lexicon'
    CONSTRAINT test_name_format CHECK (test_name ~ '^[a-z_]+$')
);

COMMENT ON TABLE test_types IS 'Типы доступных тестов';

-- Вставка начальных типов тестов
INSERT INTO test_types (test_name, test_name_ru, description, icon) VALUES
    ('sentence_analysis', 'Разбор предложения', 'Определите части речи и члены предложения', '📝'),
    ('orthography', 'Орфография', 'Проверьте знание правил написания слов', '🔤'),
    ('punctuation', 'Пунктуация', 'Расставьте знаки препинания правильно', '✏️'),
    ('lexicon', 'Лексика', 'Подберите синонимы и антонимы к словам', '📚')
ON CONFLICT (test_name) DO NOTHING;


-- ============================================
-- 3. ТАБЛИЦА ВАРИАНТОВ ТЕСТОВ
-- ============================================

CREATE TABLE IF NOT EXISTS test_variants (
    variant_id SERIAL PRIMARY KEY,
    test_type_id INTEGER NOT NULL REFERENCES test_types(test_type_id) ON DELETE CASCADE,
    variant_number INTEGER NOT NULL,
    variant_data JSONB NOT NULL,
    difficulty_level VARCHAR(20) DEFAULT 'medium',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Уникальность: один тип теста + номер варианта
    CONSTRAINT unique_test_variant UNIQUE (test_type_id, variant_number),
    CONSTRAINT difficulty_check CHECK (difficulty_level IN ('easy', 'medium', 'hard'))
);

CREATE INDEX idx_test_variants_type ON test_variants(test_type_id);
CREATE INDEX idx_test_variants_difficulty ON test_variants(difficulty_level);

COMMENT ON TABLE test_variants IS 'Варианты тестов с данными';
COMMENT ON COLUMN test_variants.variant_data IS 'JSON с предложением и правильными ответами';

-- Пример структуры variant_data для разбора предложения:
-- {
--   "sentence": "Солнце ярко светит над полем.",
--   "words": [
--     {"word": "Солнце", "part": "существительное", "member": "подлежащее"},
--     {"word": "ярко", "part": "наречие", "member": "обстоятельство"},
--     ...
--   ]
-- }


-- ============================================
-- 4. ТАБЛИЦА ПОПЫТОК ПРОХОЖДЕНИЯ ТЕСТОВ
-- ============================================

CREATE TABLE IF NOT EXISTS test_attempts (
    attempt_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    variant_id INTEGER NOT NULL REFERENCES test_variants(variant_id) ON DELETE CASCADE,
    
    -- Результаты
    total_questions INTEGER NOT NULL,
    correct_answers INTEGER NOT NULL,
    incorrect_answers INTEGER NOT NULL,
    accuracy DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE 
            WHEN total_questions > 0 
            THEN ROUND((correct_answers::DECIMAL / total_questions * 100), 2)
            ELSE 0 
        END
    ) STORED,
    
    -- Детали
    user_answers JSONB,
    time_spent_seconds INTEGER,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT answers_valid CHECK (correct_answers + incorrect_answers <= total_questions),
    CONSTRAINT time_positive CHECK (time_spent_seconds >= 0)
);

CREATE INDEX idx_attempts_user ON test_attempts(user_id);
CREATE INDEX idx_attempts_variant ON test_attempts(variant_id);
CREATE INDEX idx_attempts_completed ON test_attempts(completed_at DESC);
CREATE INDEX idx_attempts_accuracy ON test_attempts(accuracy DESC);

COMMENT ON TABLE test_attempts IS 'История попыток прохождения тестов';
COMMENT ON COLUMN test_attempts.accuracy IS 'Процент правильных ответов (вычисляется автоматически)';


-- ============================================
-- 5. ТАБЛИЦА ОБЩЕЙ СТАТИСТИКИ ПОЛЬЗОВАТЕЛЕЙ
-- ============================================

CREATE TABLE IF NOT EXISTS user_statistics (
    stat_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    test_type_id INTEGER NOT NULL REFERENCES test_types(test_type_id) ON DELETE CASCADE,
    
    -- Агрегированная статистика
    total_attempts INTEGER DEFAULT 0,
    total_questions INTEGER DEFAULT 0,
    total_correct INTEGER DEFAULT 0,
    total_incorrect INTEGER DEFAULT 0,
    average_accuracy DECIMAL(5,2) DEFAULT 0,
    best_accuracy DECIMAL(5,2) DEFAULT 0,
    
    -- Прогресс
    variants_completed INTEGER DEFAULT 0,
    total_time_spent INTEGER DEFAULT 0,
    
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_user_test_stat UNIQUE (user_id, test_type_id)
);

CREATE INDEX idx_user_stats_user ON user_statistics(user_id);
CREATE INDEX idx_user_stats_type ON user_statistics(test_type_id);
CREATE INDEX idx_user_stats_accuracy ON user_statistics(average_accuracy DESC);

COMMENT ON TABLE user_statistics IS 'Агрегированная статистика по пользователям и типам тестов';


-- ============================================
-- 6. ТАБЛИЦА LEADERBOARD (ТАБЛИЦА ЛИДЕРОВ)
-- ============================================

CREATE TABLE IF NOT EXISTS leaderboard (
    leaderboard_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    test_type_id INTEGER NOT NULL REFERENCES test_types(test_type_id) ON DELETE CASCADE,
    
    -- Показатели для рейтинга
    total_score INTEGER DEFAULT 0,
    total_correct INTEGER DEFAULT 0,
    total_questions INTEGER DEFAULT 0,
    accuracy DECIMAL(5,2) DEFAULT 0,
    
    -- Ранг (обновляется триггером)
    rank INTEGER,
    
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_leaderboard_entry UNIQUE (user_id, test_type_id)
);

CREATE INDEX idx_leaderboard_type ON leaderboard(test_type_id);
CREATE INDEX idx_leaderboard_rank ON leaderboard(test_type_id, rank);
CREATE INDEX idx_leaderboard_accuracy ON leaderboard(test_type_id, accuracy DESC);

COMMENT ON TABLE leaderboard IS 'Таблица лидеров по каждому типу теста';


-- ============================================
-- 7. ТАБЛИЦА ДОСТИЖЕНИЙ
-- ============================================

CREATE TABLE IF NOT EXISTS achievements (
    achievement_id SERIAL PRIMARY KEY,
    achievement_code VARCHAR(50) NOT NULL UNIQUE,
    achievement_name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    criteria JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE achievements IS 'Доступные достижения';

-- Примеры достижений
INSERT INTO achievements (achievement_code, achievement_name, description, icon, criteria) VALUES
    ('first_test', 'Первый шаг', 'Пройдите первый тест', '🎯', '{"type": "attempts", "count": 1}'),
    ('perfectionist', 'Перфекционист', 'Получите 100% в любом тесте', '💯', '{"type": "accuracy", "value": 100}'),
    ('master_10', 'Мастер', 'Пройдите 10 тестов', '🏆', '{"type": "attempts", "count": 10}'),
    ('speed_demon', 'Скоростной демон', 'Пройдите тест менее чем за 60 секунд', '⚡', '{"type": "time", "max_seconds": 60}')
ON CONFLICT (achievement_code) DO NOTHING;


-- ============================================
-- 8. ТАБЛИЦА ДОСТИЖЕНИЙ ПОЛЬЗОВАТЕЛЕЙ
-- ============================================

CREATE TABLE IF NOT EXISTS user_achievements (
    user_achievement_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    achievement_id INTEGER NOT NULL REFERENCES achievements(achievement_id) ON DELETE CASCADE,
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_user_achievement UNIQUE (user_id, achievement_id)
);

CREATE INDEX idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX idx_user_achievements_earned ON user_achievements(earned_at DESC);

COMMENT ON TABLE user_achievements IS 'Достижения, полученные пользователями';


-- ============================================
-- ФУНКЦИИ И ТРИГГЕРЫ
-- ============================================

-- Функция для обновления статистики пользователя
CREATE OR REPLACE FUNCTION update_user_statistics()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_statistics (
        user_id, 
        test_type_id,
        total_attempts,
        total_questions,
        total_correct,
        total_incorrect,
        average_accuracy,
        best_accuracy,
        variants_completed,
        total_time_spent
    )
    SELECT 
        NEW.user_id,
        tv.test_type_id,
        COUNT(*),
        SUM(NEW.total_questions),
        SUM(NEW.correct_answers),
        SUM(NEW.incorrect_answers),
        ROUND(AVG(NEW.accuracy), 2),
        MAX(NEW.accuracy),
        COUNT(DISTINCT NEW.variant_id),
        SUM(COALESCE(NEW.time_spent_seconds, 0))
    FROM test_variants tv
    WHERE tv.variant_id = NEW.variant_id
    GROUP BY NEW.user_id, tv.test_type_id
    
    ON CONFLICT (user_id, test_type_id) 
    DO UPDATE SET
        total_attempts = user_statistics.total_attempts + 1,
        total_questions = user_statistics.total_questions + NEW.total_questions,
        total_correct = user_statistics.total_correct + NEW.correct_answers,
        total_incorrect = user_statistics.total_incorrect + NEW.incorrect_answers,
        average_accuracy = ROUND(
            ((user_statistics.total_correct + NEW.correct_answers)::DECIMAL / 
             (user_statistics.total_questions + NEW.total_questions) * 100), 2
        ),
        best_accuracy = GREATEST(user_statistics.best_accuracy, NEW.accuracy),
        total_time_spent = user_statistics.total_time_spent + COALESCE(NEW.time_spent_seconds, 0),
        updated_at = CURRENT_TIMESTAMP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггер для автоматического обновления статистики
CREATE TRIGGER trigger_update_user_statistics
AFTER INSERT ON test_attempts
FOR EACH ROW
EXECUTE FUNCTION update_user_statistics();


-- Функция для обновления leaderboard
CREATE OR REPLACE FUNCTION update_leaderboard()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO leaderboard (
        user_id,
        test_type_id,
        total_score,
        total_correct,
        total_questions,
        accuracy
    )
    SELECT 
        NEW.user_id,
        NEW.test_type_id,
        NEW.total_correct,
        NEW.total_correct,
        NEW.total_questions,
        NEW.average_accuracy
    FROM user_statistics
    WHERE user_id = NEW.user_id AND test_type_id = NEW.test_type_id
    
    ON CONFLICT (user_id, test_type_id)
    DO UPDATE SET
        total_correct = EXCLUDED.total_correct,
        total_questions = EXCLUDED.total_questions,
        accuracy = EXCLUDED.accuracy,
        total_score = EXCLUDED.total_score,
        last_updated = CURRENT_TIMESTAMP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггер для обновления leaderboard при изменении статистики
CREATE TRIGGER trigger_update_leaderboard
AFTER INSERT OR UPDATE ON user_statistics
FOR EACH ROW
EXECUTE FUNCTION update_leaderboard();


-- Функция для обновления рангов в leaderboard
CREATE OR REPLACE FUNCTION update_leaderboard_ranks()
RETURNS void AS $$
BEGIN
    -- Обновляем ранги для каждого типа теста
    WITH ranked_users AS (
        SELECT 
            leaderboard_id,
            ROW_NUMBER() OVER (
                PARTITION BY test_type_id 
                ORDER BY accuracy DESC, total_correct DESC, last_updated ASC
            ) AS new_rank
        FROM leaderboard
    )
    UPDATE leaderboard l
    SET rank = r.new_rank
    FROM ranked_users r
    WHERE l.leaderboard_id = r.leaderboard_id;
END;
$$ LANGUAGE plpgsql;


-- Функция для обновления last_active пользователя
CREATE OR REPLACE FUNCTION update_user_last_active()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE users 
    SET last_active = CURRENT_TIMESTAMP 
    WHERE user_id = NEW.user_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггер для обновления last_active
CREATE TRIGGER trigger_update_user_last_active
AFTER INSERT ON test_attempts
FOR EACH ROW
EXECUTE FUNCTION update_user_last_active();


-- ============================================
-- ПРЕДСТАВЛЕНИЯ (VIEWS)
-- ============================================

-- Представление: топ пользователей по всем тестам
CREATE OR REPLACE VIEW v_top_users AS
SELECT 
    u.user_id,
    u.username,
    SUM(us.total_correct) AS total_correct,
    SUM(us.total_questions) AS total_questions,
    ROUND(
        CASE 
            WHEN SUM(us.total_questions) > 0 
            THEN (SUM(us.total_correct)::DECIMAL / SUM(us.total_questions) * 100)
            ELSE 0 
        END, 2
    ) AS overall_accuracy,
    SUM(us.total_attempts) AS total_attempts,
    COUNT(DISTINCT us.test_type_id) AS tests_completed
FROM users u
LEFT JOIN user_statistics us ON u.user_id = us.user_id
GROUP BY u.user_id, u.username
ORDER BY overall_accuracy DESC, total_correct DESC;

COMMENT ON VIEW v_top_users IS 'Топ пользователей по общей статистике';


-- Представление: детальная статистика по пользователю
CREATE OR REPLACE VIEW v_user_detailed_stats AS
SELECT 
    u.user_id,
    u.username,
    tt.test_name_ru,
    us.total_attempts,
    us.total_correct,
    us.total_questions,
    us.average_accuracy,
    us.best_accuracy,
    us.variants_completed,
    us.total_time_spent,
    l.rank,
    u.created_at,
    u.last_active
FROM users u
LEFT JOIN user_statistics us ON u.user_id = us.user_id
LEFT JOIN test_types tt ON us.test_type_id = tt.test_type_id
LEFT JOIN leaderboard l ON u.user_id = l.user_id AND us.test_type_id = l.test_type_id
ORDER BY u.user_id, tt.test_name;

COMMENT ON VIEW v_user_detailed_stats IS 'Детальная статистика по каждому пользователю и типу теста';


-- Представление: leaderboard с именами пользователей
CREATE OR REPLACE VIEW v_leaderboard_detailed AS
SELECT 
    l.rank,
    u.username,
    tt.test_name_ru AS test_name,
    l.total_correct,
    l.total_questions,
    l.accuracy,
    l.last_updated
FROM leaderboard l
JOIN users u ON l.user_id = u.user_id
JOIN test_types tt ON l.test_type_id = tt.test_type_id
WHERE l.rank IS NOT NULL
ORDER BY tt.test_name, l.rank;

COMMENT ON VIEW v_leaderboard_detailed IS 'Leaderboard с именами пользователей и названиями тестов';


-- Представление: последние попытки
CREATE OR REPLACE VIEW v_recent_attempts AS
SELECT 
    u.username,
    tt.test_name_ru AS test_name,
    tv.variant_number,
    ta.correct_answers,
    ta.total_questions,
    ta.accuracy,
    ta.time_spent_seconds,
    ta.completed_at
FROM test_attempts ta
JOIN users u ON ta.user_id = u.user_id
JOIN test_variants tv ON ta.variant_id = tv.variant_id
JOIN test_types tt ON tv.test_type_id = tt.test_type_id
ORDER BY ta.completed_at DESC
LIMIT 100;

COMMENT ON VIEW v_recent_attempts IS 'Последние 100 попыток прохождения тестов';


-- ============================================
-- ПОЛЕЗНЫЕ ЗАПРОСЫ (ПРИМЕРЫ)
-- ============================================

/*
-- Получить топ-10 пользователей по конкретному тесту
SELECT * FROM v_leaderboard_detailed 
WHERE test_name = 'Разбор предложения' 
LIMIT 10;

-- Получить всю статистику конкретного пользователя
SELECT * FROM v_user_detailed_stats 
WHERE username = 'Анна';

-- Получить последние попытки пользователя
SELECT * FROM v_recent_attempts 
WHERE username = 'Анна' 
ORDER BY completed_at DESC 
LIMIT 10;

-- Обновить ранги в leaderboard
SELECT update_leaderboard_ranks();

-- Получить пользователей с лучшей точностью
SELECT * FROM v_top_users 
WHERE overall_accuracy >= 80 
ORDER BY overall_accuracy DESC;
*/


-- ============================================
-- ИНДЕКСЫ ДЛЯ ПРОИЗВОДИТЕЛЬНОСТИ
-- ============================================

-- Дополнительные индексы для JSONB полей
CREATE INDEX idx_variant_data ON test_variants USING GIN(variant_data);
CREATE INDEX idx_user_answers ON test_attempts USING GIN(user_answers);


-- ============================================
-- ЗАВЕРШЕНИЕ
-- ============================================

-- Обновление рангов после создания таблиц
SELECT update_leaderboard_ranks();

-- Вывод информации
DO $$
BEGIN
    RAISE NOTICE '================================================';
    RAISE NOTICE 'База данных успешно создана!';
    RAISE NOTICE '================================================';
    RAISE NOTICE 'Создано таблиц: 8';
    RAISE NOTICE 'Создано представлений: 4';
    RAISE NOTICE 'Создано функций: 4';
    RAISE NOTICE 'Создано триггеров: 3';
    RAISE NOTICE '================================================';
END $$;
