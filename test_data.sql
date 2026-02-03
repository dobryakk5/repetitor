-- ============================================
-- SQL скрипт для вставки тестовых данных
-- 12 вариантов для теста "Разбор предложения"
-- ============================================

-- Вариант 1: "Солнце ярко светит над полем."
INSERT INTO test_variants (test_type_id, variant_number, variant_data, difficulty_level)
VALUES (
    (SELECT test_type_id FROM test_types WHERE test_name = 'sentence_analysis'),
    1,
    '{
        "sentence": "Солнце ярко светит над полем.",
        "words": [
            {"word": "Солнце", "part": "существительное", "member": "подлежащее"},
            {"word": "ярко", "part": "наречие", "member": "обстоятельство"},
            {"word": "светит", "part": "глагол", "member": "сказуемое"},
            {"word": "над", "part": "предлог", "member": null},
            {"word": "полем", "part": "существительное", "member": "дополнение"}
        ]
    }'::jsonb,
    'easy'
);

-- Вариант 2: "Старый дом стоит на высоком холме."
INSERT INTO test_variants (test_type_id, variant_number, variant_data, difficulty_level)
VALUES (
    (SELECT test_type_id FROM test_types WHERE test_name = 'sentence_analysis'),
    2,
    '{
        "sentence": "Старый дом стоит на высоком холме.",
        "words": [
            {"word": "Старый", "part": "прилагательное", "member": "определение"},
            {"word": "дом", "part": "существительное", "member": "подлежащее"},
            {"word": "стоит", "part": "глагол", "member": "сказуемое"},
            {"word": "на", "part": "предлог", "member": null},
            {"word": "высоком", "part": "прилагательное", "member": "определение"},
            {"word": "холме", "part": "существительное", "member": "обстоятельство"}
        ]
    }'::jsonb,
    'medium'
);

-- Вариант 3: "Дети весело играют в парке."
INSERT INTO test_variants (test_type_id, variant_number, variant_data, difficulty_level)
VALUES (
    (SELECT test_type_id FROM test_types WHERE test_name = 'sentence_analysis'),
    3,
    '{
        "sentence": "Дети весело играют в парке.",
        "words": [
            {"word": "Дети", "part": "существительное", "member": "подлежащее"},
            {"word": "весело", "part": "наречие", "member": "обстоятельство"},
            {"word": "играют", "part": "глагол", "member": "сказуемое"},
            {"word": "в", "part": "предлог", "member": null},
            {"word": "парке", "part": "существительное", "member": "обстоятельство"}
        ]
    }'::jsonb,
    'easy'
);

-- Вариант 4: "Мама купила свежий хлеб в магазине."
INSERT INTO test_variants (test_type_id, variant_number, variant_data, difficulty_level)
VALUES (
    (SELECT test_type_id FROM test_types WHERE test_name = 'sentence_analysis'),
    4,
    '{
        "sentence": "Мама купила свежий хлеб в магазине.",
        "words": [
            {"word": "Мама", "part": "существительное", "member": "подлежащее"},
            {"word": "купила", "part": "глагол", "member": "сказуемое"},
            {"word": "свежий", "part": "прилагательное", "member": "определение"},
            {"word": "хлеб", "part": "существительное", "member": "дополнение"},
            {"word": "в", "part": "предлог", "member": null},
            {"word": "магазине", "part": "существительное", "member": "обстоятельство"}
        ]
    }'::jsonb,
    'medium'
);

-- Вариант 5: "Быстрая река течёт по долине."
INSERT INTO test_variants (test_type_id, variant_number, variant_data, difficulty_level)
VALUES (
    (SELECT test_type_id FROM test_types WHERE test_name = 'sentence_analysis'),
    5,
    '{
        "sentence": "Быстрая река течёт по долине.",
        "words": [
            {"word": "Быстрая", "part": "прилагательное", "member": "определение"},
            {"word": "река", "part": "существительное", "member": "подлежащее"},
            {"word": "течёт", "part": "глагол", "member": "сказуемое"},
            {"word": "по", "part": "предлог", "member": null},
            {"word": "долине", "part": "существительное", "member": "обстоятельство"}
        ]
    }'::jsonb,
    'easy'
);

-- Вариант 6: "Учитель объясняет новую тему ученикам."
INSERT INTO test_variants (test_type_id, variant_number, variant_data, difficulty_level)
VALUES (
    (SELECT test_type_id FROM test_types WHERE test_name = 'sentence_analysis'),
    6,
    '{
        "sentence": "Учитель объясняет новую тему ученикам.",
        "words": [
            {"word": "Учитель", "part": "существительное", "member": "подлежащее"},
            {"word": "объясняет", "part": "глагол", "member": "сказуемое"},
            {"word": "новую", "part": "прилагательное", "member": "определение"},
            {"word": "тему", "part": "существительное", "member": "дополнение"},
            {"word": "ученикам", "part": "существительное", "member": "дополнение"}
        ]
    }'::jsonb,
    'medium'
);

-- Вариант 7: "Красивые цветы растут в саду."
INSERT INTO test_variants (test_type_id, variant_number, variant_data, difficulty_level)
VALUES (
    (SELECT test_type_id FROM test_types WHERE test_name = 'sentence_analysis'),
    7,
    '{
        "sentence": "Красивые цветы растут в саду.",
        "words": [
            {"word": "Красивые", "part": "прилагательное", "member": "определение"},
            {"word": "цветы", "part": "существительное", "member": "подлежащее"},
            {"word": "растут", "part": "глагол", "member": "сказуемое"},
            {"word": "в", "part": "предлог", "member": null},
            {"word": "саду", "part": "существительное", "member": "обстоятельство"}
        ]
    }'::jsonb,
    'easy'
);

-- Вариант 8: "Птицы громко поют на рассвете."
INSERT INTO test_variants (test_type_id, variant_number, variant_data, difficulty_level)
VALUES (
    (SELECT test_type_id FROM test_types WHERE test_name = 'sentence_analysis'),
    8,
    '{
        "sentence": "Птицы громко поют на рассвете.",
        "words": [
            {"word": "Птицы", "part": "существительное", "member": "подлежащее"},
            {"word": "громко", "part": "наречие", "member": "обстоятельство"},
            {"word": "поют", "part": "глагол", "member": "сказуемое"},
            {"word": "на", "part": "предлог", "member": null},
            {"word": "рассвете", "part": "существительное", "member": "обстоятельство"}
        ]
    }'::jsonb,
    'medium'
);

-- Вариант 9: "Маленький котёнок спит под столом."
INSERT INTO test_variants (test_type_id, variant_number, variant_data, difficulty_level)
VALUES (
    (SELECT test_type_id FROM test_types WHERE test_name = 'sentence_analysis'),
    9,
    '{
        "sentence": "Маленький котёнок спит под столом.",
        "words": [
            {"word": "Маленький", "part": "прилагательное", "member": "определение"},
            {"word": "котёнок", "part": "существительное", "member": "подлежащее"},
            {"word": "спит", "part": "глагол", "member": "сказуемое"},
            {"word": "под", "part": "предлог", "member": null},
            {"word": "столом", "part": "существительное", "member": "обстоятельство"}
        ]
    }'::jsonb,
    'easy'
);

-- Вариант 10: "Студенты внимательно слушают лекцию профессора."
INSERT INTO test_variants (test_type_id, variant_number, variant_data, difficulty_level)
VALUES (
    (SELECT test_type_id FROM test_types WHERE test_name = 'sentence_analysis'),
    10,
    '{
        "sentence": "Студенты внимательно слушают лекцию профессора.",
        "words": [
            {"word": "Студенты", "part": "существительное", "member": "подлежащее"},
            {"word": "внимательно", "part": "наречие", "member": "обстоятельство"},
            {"word": "слушают", "part": "глагол", "member": "сказуемое"},
            {"word": "лекцию", "part": "существительное", "member": "дополнение"},
            {"word": "профессора", "part": "существительное", "member": "дополнение"}
        ]
    }'::jsonb,
    'hard'
);

-- Вариант 11: "Тёплый ветер приносит запах моря."
INSERT INTO test_variants (test_type_id, variant_number, variant_data, difficulty_level)
VALUES (
    (SELECT test_type_id FROM test_types WHERE test_name = 'sentence_analysis'),
    11,
    '{
        "sentence": "Тёплый ветер приносит запах моря.",
        "words": [
            {"word": "Тёплый", "part": "прилагательное", "member": "определение"},
            {"word": "ветер", "part": "существительное", "member": "подлежащее"},
            {"word": "приносит", "part": "глагол", "member": "сказуемое"},
            {"word": "запах", "part": "существительное", "member": "дополнение"},
            {"word": "моря", "part": "существительное", "member": "дополнение"}
        ]
    }'::jsonb,
    'medium'
);

-- Вариант 12: "Опытный врач помогает больным пациентам в больнице."
INSERT INTO test_variants (test_type_id, variant_number, variant_data, difficulty_level)
VALUES (
    (SELECT test_type_id FROM test_types WHERE test_name = 'sentence_analysis'),
    12,
    '{
        "sentence": "Опытный врач помогает больным пациентам в больнице.",
        "words": [
            {"word": "Опытный", "part": "прилагательное", "member": "определение"},
            {"word": "врач", "part": "существительное", "member": "подлежащее"},
            {"word": "помогает", "part": "глагол", "member": "сказуемое"},
            {"word": "больным", "part": "прилагательное", "member": "определение"},
            {"word": "пациентам", "part": "существительное", "member": "дополнение"},
            {"word": "в", "part": "предлог", "member": null},
            {"word": "больнице", "part": "существительное", "member": "обстоятельство"}
        ]
    }'::jsonb,
    'hard'
);

-- Вставка тестовых пользователей
INSERT INTO users (username, email) VALUES
    ('Анна', 'anna@example.com'),
    ('Иван', 'ivan@example.com'),
    ('Мария', 'maria@example.com'),
    ('Пётр', 'petr@example.com'),
    ('Елена', 'elena@example.com')
ON CONFLICT (username) DO NOTHING;

-- Вставка тестовых результатов для демонстрации
-- Анна: отличные результаты
INSERT INTO test_attempts (user_id, variant_id, total_questions, correct_answers, incorrect_answers, time_spent_seconds)
SELECT 
    (SELECT user_id FROM users WHERE username = 'Анна'),
    variant_id,
    CASE variant_number 
        WHEN 1 THEN 5
        WHEN 2 THEN 6
        WHEN 3 THEN 5
    END,
    CASE variant_number 
        WHEN 1 THEN 5
        WHEN 2 THEN 6
        WHEN 3 THEN 5
    END,
    0,
    CASE variant_number 
        WHEN 1 THEN 120
        WHEN 2 THEN 150
        WHEN 3 THEN 90
    END
FROM test_variants
WHERE test_type_id = (SELECT test_type_id FROM test_types WHERE test_name = 'sentence_analysis')
AND variant_number IN (1, 2, 3);

-- Иван: хорошие результаты с небольшими ошибками
INSERT INTO test_attempts (user_id, variant_id, total_questions, correct_answers, incorrect_answers, time_spent_seconds)
SELECT 
    (SELECT user_id FROM users WHERE username = 'Иван'),
    variant_id,
    CASE variant_number 
        WHEN 1 THEN 5
        WHEN 2 THEN 6
    END,
    CASE variant_number 
        WHEN 1 THEN 4
        WHEN 2 THEN 5
    END,
    CASE variant_number 
        WHEN 1 THEN 1
        WHEN 2 THEN 1
    END,
    CASE variant_number 
        WHEN 1 THEN 180
        WHEN 2 THEN 200
    END
FROM test_variants
WHERE test_type_id = (SELECT test_type_id FROM test_types WHERE test_name = 'sentence_analysis')
AND variant_number IN (1, 2);

-- Мария: средние результаты
INSERT INTO test_attempts (user_id, variant_id, total_questions, correct_answers, incorrect_answers, time_spent_seconds)
SELECT 
    (SELECT user_id FROM users WHERE username = 'Мария'),
    variant_id,
    5,
    3,
    2,
    240
FROM test_variants
WHERE test_type_id = (SELECT test_type_id FROM test_types WHERE test_name = 'sentence_analysis')
AND variant_number = 1;

-- Обновляем ранги
SELECT update_leaderboard_ranks();

-- Выводим результаты
SELECT 
    '=== LEADERBOARD (Топ-5) ===' AS info;

SELECT 
    rank,
    username,
    total_correct || '/' || total_questions AS score,
    accuracy || '%' AS accuracy
FROM v_leaderboard_detailed
WHERE test_name = 'Разбор предложения'
ORDER BY rank
LIMIT 5;

SELECT 
    '=== СТАТИСТИКА ПО ВАРИАНТАМ ===' AS info;

SELECT 
    variant_number,
    difficulty_level,
    variant_data->>'sentence' AS sentence
FROM test_variants
WHERE test_type_id = (SELECT test_type_id FROM test_types WHERE test_name = 'sentence_analysis')
ORDER BY variant_number;
