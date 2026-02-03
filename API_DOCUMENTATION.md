# API Документация - База данных тестирования

## 📊 Структура базы данных

### Основные таблицы:
1. **users** - Пользователи
2. **test_types** - Типы тестов
3. **test_variants** - Варианты тестов
4. **test_attempts** - Попытки прохождения
5. **user_statistics** - Статистика пользователей
6. **leaderboard** - Таблица лидеров
7. **achievements** - Достижения
8. **user_achievements** - Достижения пользователей

---

## 🚀 Примеры использования

### 1. Создание нового пользователя

```sql
INSERT INTO users (username, email) 
VALUES ('Анна', 'anna@example.com')
RETURNING user_id, username;
```

### 2. Получение или создание пользователя

```sql
INSERT INTO users (username) 
VALUES ('Иван')
ON CONFLICT (username) DO UPDATE 
SET last_active = CURRENT_TIMESTAMP
RETURNING user_id;
```

### 3. Добавление нового варианта теста

```sql
INSERT INTO test_variants (test_type_id, variant_number, variant_data, difficulty_level)
VALUES (
    1, -- ID типа теста "Разбор предложения"
    1, -- Номер варианта
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
    'medium'
);
```

### 4. Сохранение результата теста

```sql
-- Сначала получаем user_id
WITH user_data AS (
    INSERT INTO users (username) 
    VALUES ('Анна')
    ON CONFLICT (username) DO UPDATE 
    SET last_active = CURRENT_TIMESTAMP
    RETURNING user_id
)
-- Затем сохраняем попытку
INSERT INTO test_attempts (
    user_id, 
    variant_id, 
    total_questions, 
    correct_answers, 
    incorrect_answers,
    user_answers,
    time_spent_seconds
)
SELECT 
    ud.user_id,
    1, -- variant_id
    10, -- всего вопросов
    8,  -- правильных
    2,  -- неправильных
    '{
        "Солнце": {"selected": "существительное", "correct": true},
        "ярко": {"selected": "наречие", "correct": true},
        "светит": {"selected": "глагол", "correct": true}
    }'::jsonb,
    120 -- время в секундах
FROM user_data ud
RETURNING attempt_id, accuracy;

-- Статистика и leaderboard обновятся автоматически через триггеры!
```

### 5. Получить топ-10 пользователей

```sql
SELECT 
    rank,
    username,
    total_correct,
    total_questions,
    accuracy
FROM v_leaderboard_detailed
WHERE test_name = 'Разбор предложения'
ORDER BY rank
LIMIT 10;
```

### 6. Получить статистику пользователя

```sql
SELECT 
    test_name_ru,
    total_attempts,
    total_correct,
    total_questions,
    average_accuracy,
    best_accuracy,
    rank
FROM v_user_detailed_stats
WHERE username = 'Анна'
ORDER BY test_name_ru;
```

### 7. Получить последние 20 попыток

```sql
SELECT * FROM v_recent_attempts
LIMIT 20;
```

### 8. Обновить ранги в leaderboard

```sql
SELECT update_leaderboard_ranks();
```

---

## 📱 Интеграция с Frontend

### JavaScript функция для сохранения результата

```javascript
async function saveTestResult(username, variantId, totalQuestions, correctAnswers, userAnswers, timeSpent) {
    const response = await fetch('/api/save-result', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            username: username,
            variant_id: variantId,
            total_questions: totalQuestions,
            correct_answers: correctAnswers,
            incorrect_answers: totalQuestions - correctAnswers,
            user_answers: userAnswers,
            time_spent_seconds: timeSpent
        })
    });
    
    return await response.json();
}
```

### Backend (Node.js + Express + pg)

```javascript
const { Pool } = require('pg');

const pool = new Pool({
    user: 'your_user',
    host: 'localhost',
    database: 'russian_tests_db',
    password: 'your_password',
    port: 5432,
});

// API endpoint для сохранения результата
app.post('/api/save-result', async (req, res) => {
    const { username, variant_id, total_questions, correct_answers, incorrect_answers, user_answers, time_spent_seconds } = req.body;
    
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        // Получаем или создаем пользователя
        const userResult = await client.query(`
            INSERT INTO users (username) 
            VALUES ($1)
            ON CONFLICT (username) DO UPDATE 
            SET last_active = CURRENT_TIMESTAMP
            RETURNING user_id
        `, [username]);
        
        const userId = userResult.rows[0].user_id;
        
        // Сохраняем попытку
        const attemptResult = await client.query(`
            INSERT INTO test_attempts (
                user_id, variant_id, total_questions, 
                correct_answers, incorrect_answers, 
                user_answers, time_spent_seconds
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING attempt_id, accuracy
        `, [userId, variant_id, total_questions, correct_answers, incorrect_answers, 
            JSON.stringify(user_answers), time_spent_seconds]);
        
        await client.query('COMMIT');
        
        res.json({
            success: true,
            attempt_id: attemptResult.rows[0].attempt_id,
            accuracy: attemptResult.rows[0].accuracy
        });
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error saving result:', error);
        res.status(500).json({ success: false, error: error.message });
    } finally {
        client.release();
    }
});

// API endpoint для получения leaderboard
app.get('/api/leaderboard/:testType', async (req, res) => {
    const { testType } = req.params;
    const limit = req.query.limit || 10;
    
    try {
        const result = await pool.query(`
            SELECT 
                rank,
                username,
                total_correct,
                total_questions,
                accuracy,
                last_updated
            FROM v_leaderboard_detailed
            WHERE test_name = (
                SELECT test_name_ru FROM test_types WHERE test_name = $1
            )
            ORDER BY rank
            LIMIT $2
        `, [testType, limit]);
        
        res.json({
            success: true,
            leaderboard: result.rows
        });
        
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// API endpoint для получения статистики пользователя
app.get('/api/user-stats/:username', async (req, res) => {
    const { username } = req.params;
    
    try {
        const result = await pool.query(`
            SELECT * FROM v_user_detailed_stats
            WHERE username = $1
            ORDER BY test_name_ru
        `, [username]);
        
        res.json({
            success: true,
            stats: result.rows
        });
        
    } catch (error) {
        console.error('Error fetching user stats:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});
```

---

## 🔧 Полезные запросы для администрирования

### Получить статистику по всем тестам

```sql
SELECT 
    tt.test_name_ru,
    COUNT(DISTINCT ta.user_id) AS unique_users,
    COUNT(ta.attempt_id) AS total_attempts,
    ROUND(AVG(ta.accuracy), 2) AS average_accuracy,
    MAX(ta.accuracy) AS best_accuracy
FROM test_attempts ta
JOIN test_variants tv ON ta.variant_id = tv.variant_id
JOIN test_types tt ON tv.test_type_id = tt.test_type_id
GROUP BY tt.test_name_ru
ORDER BY total_attempts DESC;
```

### Найти самые сложные варианты

```sql
SELECT 
    tt.test_name_ru,
    tv.variant_number,
    COUNT(*) AS attempts,
    ROUND(AVG(ta.accuracy), 2) AS avg_accuracy
FROM test_attempts ta
JOIN test_variants tv ON ta.variant_id = tv.variant_id
JOIN test_types tt ON tv.test_type_id = tt.test_type_id
GROUP BY tt.test_name_ru, tv.variant_number
HAVING COUNT(*) >= 5
ORDER BY avg_accuracy ASC
LIMIT 10;
```

### Активные пользователи за последние 7 дней

```sql
SELECT 
    u.username,
    COUNT(ta.attempt_id) AS attempts_last_week,
    ROUND(AVG(ta.accuracy), 2) AS avg_accuracy
FROM users u
JOIN test_attempts ta ON u.user_id = ta.user_id
WHERE ta.completed_at >= CURRENT_TIMESTAMP - INTERVAL '7 days'
GROUP BY u.username
ORDER BY attempts_last_week DESC;
```

### Очистка старых данных (старше 1 года)

```sql
-- ОСТОРОЖНО! Это удалит данные без возможности восстановления
DELETE FROM test_attempts 
WHERE completed_at < CURRENT_TIMESTAMP - INTERVAL '1 year';
```

---

## 🎯 Миграция данных из localStorage

Если у вас уже есть данные в localStorage (из текущей HTML версии), вот скрипт для миграции:

```javascript
async function migrateFromLocalStorage() {
    try {
        const keys = await window.storage.list('leaderboard:', true);
        
        if (!keys || !keys.keys || keys.keys.length === 0) {
            console.log('No data to migrate');
            return;
        }

        const migrationData = [];
        
        for (const key of keys.keys) {
            try {
                const data = await window.storage.get(key, true);
                if (data && data.value) {
                    const score = JSON.parse(data.value);
                    migrationData.push({
                        username: score.name,
                        total_correct: score.correct,
                        total_questions: score.total,
                        accuracy: score.accuracy
                    });
                }
            } catch (e) {
                console.log('Error reading key:', key);
            }
        }

        // Отправляем на backend
        const response = await fetch('/api/migrate-data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ data: migrationData })
        });
        
        const result = await response.json();
        console.log('Migration result:', result);
        
    } catch (error) {
        console.error('Migration error:', error);
    }
}

// Backend endpoint для миграции
app.post('/api/migrate-data', async (req, res) => {
    const { data } = req.body;
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        for (const record of data) {
            // Создаем пользователя
            const userResult = await client.query(`
                INSERT INTO users (username) 
                VALUES ($1)
                ON CONFLICT (username) DO NOTHING
                RETURNING user_id
            `, [record.username]);
            
            if (userResult.rows.length > 0) {
                const userId = userResult.rows[0].user_id;
                
                // Создаем фиктивную попытку для статистики
                await client.query(`
                    INSERT INTO test_attempts (
                        user_id, variant_id, total_questions, 
                        correct_answers, incorrect_answers
                    )
                    VALUES ($1, 1, $2, $3, $4)
                `, [userId, record.total_questions, record.total_correct, 
                    record.total_questions - record.total_correct]);
            }
        }
        
        await client.query('COMMIT');
        res.json({ success: true, migrated: data.length });
        
    } catch (error) {
        await client.query('ROLLBACK');
        res.status(500).json({ success: false, error: error.message });
    } finally {
        client.release();
    }
});
```

---

## 📈 Мониторинг и оптимизация

### Проверка размера таблиц

```sql
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Анализ производительности запросов

```sql
-- Включить логирование медленных запросов в postgresql.conf:
-- log_min_duration_statement = 1000  # логировать запросы дольше 1 секунды

EXPLAIN ANALYZE
SELECT * FROM v_leaderboard_detailed
WHERE test_name = 'Разбор предложения'
LIMIT 10;
```

### Вакуумизация для оптимизации

```sql
VACUUM ANALYZE test_attempts;
VACUUM ANALYZE user_statistics;
VACUUM ANALYZE leaderboard;
```

---

## 🔐 Безопасность

### Создание пользователя БД с ограниченными правами

```sql
-- Создаем пользователя только для приложения
CREATE USER app_user WITH PASSWORD 'secure_password';

-- Даём права только на нужные таблицы
GRANT SELECT, INSERT ON users TO app_user;
GRANT SELECT, INSERT ON test_attempts TO app_user;
GRANT SELECT ON test_types, test_variants TO app_user;
GRANT SELECT ON v_leaderboard_detailed, v_user_detailed_stats, v_recent_attempts TO app_user;

-- Даём права на последовательности
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;
```

---

## ✅ Чек-лист после установки

- [ ] База данных создана
- [ ] SQL скрипт выполнен успешно
- [ ] Все 8 таблиц созданы
- [ ] Все триггеры работают
- [ ] Представления доступны
- [ ] Тестовые данные добавлены
- [ ] Backend API настроен
- [ ] Frontend подключен к API
- [ ] Миграция из localStorage выполнена (если нужно)
- [ ] Резервное копирование настроено

---

Готово! 🎉
