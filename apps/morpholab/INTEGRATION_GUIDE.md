# 🔗 Интеграция МорфоЛаб с основным проектом

## Варианты интеграции

### Вариант 1: Отдельное приложение (рекомендуется для разработки)

```bash
# Запустите МорфоЛаб отдельно
cd morpholab
npm install
npm run dev
# Откроется на http://localhost:3000
```

**Плюсы:**
- Простая разработка
- Независимое тестирование
- Можно использовать разные порты

---

### Вариант 2: Встроить в основной проект

#### Шаг 1: Добавить в index.html ссылку на игру

```html
<!-- index.html -->
<div class="test-card" onclick="window.open('morpholab/index.html', '_blank')">
    <div class="test-icon">🧪</div>
    <div class="test-title">МорфоЛаб</div>
    <div class="test-description">
        Собирай слова из морфем в интерактивной игре
    </div>
    <div class="test-status">
        <span>Новинка!</span>
    </div>
</div>
```

#### Шаг 2: Билд Next.js приложения

```bash
cd morpholab
npm run build
npm run export  # Экспортирует статические файлы
```

#### Шаг 3: Копирование файлов

```bash
# Скопируйте out/ директорию в ваш проект
cp -r morpholab/out/* public/morpholab/
```

---

### Вариант 3: API интеграция с PostgreSQL

#### Добавьте в database_schema.sql:

```sql
-- Таблица для игры МорфоЛаб
CREATE TABLE IF NOT EXISTS morpholab_games (
    game_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    level_id INTEGER NOT NULL,
    word_constructed VARCHAR(100) NOT NULL,
    is_correct BOOLEAN NOT NULL,
    time_spent_seconds INTEGER,
    attempts INTEGER DEFAULT 1,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_morpholab_user ON morpholab_games(user_id);
CREATE INDEX idx_morpholab_level ON morpholab_games(level_id);

-- Представление для статистики МорфоЛаб
CREATE OR REPLACE VIEW v_morpholab_stats AS
SELECT 
    u.username,
    COUNT(*) as total_games,
    SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) as correct_words,
    ROUND(AVG(CASE WHEN is_correct THEN 1 ELSE 0 END) * 100, 2) as accuracy,
    MAX(level_id) as max_level_reached,
    AVG(time_spent_seconds) as avg_time
FROM morpholab_games mg
JOIN users u ON mg.user_id = u.user_id
GROUP BY u.username
ORDER BY accuracy DESC, total_games DESC;
```

#### Добавьте API endpoint в backend:

```javascript
// routes/morpholab.js
const express = require('express');
const router = express.Router();
const pool = require('../config/database');

/**
 * POST /api/morpholab/save-game
 * Сохранить результат игры
 */
router.post('/save-game', async (req, res) => {
    const { 
        username, 
        level_id, 
        word_constructed, 
        is_correct,
        time_spent_seconds,
        attempts 
    } = req.body;
    
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
        
        // Сохраняем игру
        const gameResult = await client.query(`
            INSERT INTO morpholab_games (
                user_id, level_id, word_constructed, 
                is_correct, time_spent_seconds, attempts
            )
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING game_id
        `, [userId, level_id, word_constructed, is_correct, time_spent_seconds, attempts]);
        
        await client.query('COMMIT');
        
        res.json({
            success: true,
            game_id: gameResult.rows[0].game_id
        });
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error saving game:', error);
        res.status(500).json({ success: false, error: error.message });
    } finally {
        client.release();
    }
});

/**
 * GET /api/morpholab/stats/:username
 * Получить статистику игрока
 */
router.get('/stats/:username', async (req, res) => {
    const { username } = req.params;
    
    try {
        const result = await pool.query(`
            SELECT * FROM v_morpholab_stats
            WHERE username = $1
        `, [username]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'User not found' 
            });
        }
        
        res.json({
            success: true,
            stats: result.rows[0]
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/morpholab/leaderboard
 * Топ игроков МорфоЛаб
 */
router.get('/leaderboard', async (req, res) => {
    const limit = req.query.limit || 10;
    
    try {
        const result = await pool.query(`
            SELECT * FROM v_morpholab_stats
            LIMIT $1
        `, [limit]);
        
        res.json({
            success: true,
            leaderboard: result.rows
        });
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
```

#### Подключите роут в server.js:

```javascript
// server.js
const morpholabRoutes = require('./routes/morpholab');
app.use('/api/morpholab', morpholabRoutes);
```

#### Интегрируйте в Next.js приложение:

```typescript
// app/page.tsx - добавьте функцию сохранения
const saveGameResult = async (
    username: string,
    levelId: number,
    word: string,
    isCorrect: boolean,
    timeSpent: number,
    attempts: number
) => {
    try {
        const response = await fetch('http://localhost:3000/api/morpholab/save-game', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username,
                level_id: levelId,
                word_constructed: word,
                is_correct: isCorrect,
                time_spent_seconds: timeSpent,
                attempts
            })
        });
        
        const data = await response.json();
        console.log('Game saved:', data);
    } catch (error) {
        console.error('Error saving game:', error);
    }
};

// Вызывайте при успешном завершении уровня
if (result.isValid) {
    await saveGameResult(
        playerName,
        currentLevelIndex + 1,
        result.word!,
        true,
        timeSpent,
        attempts
    );
}
```

---

## 📊 Единая таблица лидеров

Можно объединить leaderboard из всех игр:

```sql
CREATE OR REPLACE VIEW v_unified_leaderboard AS
SELECT 
    username,
    'sentence_analysis' as game_type,
    accuracy,
    total_correct as score
FROM v_leaderboard_detailed
WHERE test_name = 'Разбор предложения'

UNION ALL

SELECT 
    username,
    'morpholab' as game_type,
    accuracy,
    correct_words as score
FROM v_morpholab_stats

ORDER BY accuracy DESC, score DESC
LIMIT 20;
```

---

## 🎮 Запуск всего проекта

### Терминал 1: Backend API
```bash
cd backend/
npm start
# Запустится на http://localhost:3000
```

### Терминал 2: МорфоЛаб
```bash
cd morpholab/
npm run dev
# Запустится на http://localhost:3001
```

### Терминал 3: Основной frontend
```bash
# Откройте index.html в браузере
open index.html
```

---

## 🔄 Синхронизация данных

### Опция 1: Shared localStorage

```javascript
// Используйте один ключ для всех игр
const STORAGE_KEY = 'russian_tests_user';

// Сохранение
localStorage.setItem(STORAGE_KEY, JSON.stringify({
    username: 'Анна',
    sentenceAnalysis: { ... },
    morpholab: { ... }
}));

// Чтение
const userData = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
```

### Опция 2: API синхронизация

```javascript
// Автоматическая синхронизация между играми
const syncUserData = async (username: string) => {
    // Получаем данные из sentence_analysis
    const sentenceStats = await fetch(`/api/stats/user/${username}`);
    
    // Получаем данные из morpholab
    const morpholabStats = await fetch(`/api/morpholab/stats/${username}`);
    
    // Объединяем и показываем
    return {
        username,
        totalGames: sentence.total_attempts + morpholab.total_games,
        accuracy: (sentence.avg_accuracy + morpholab.accuracy) / 2
    };
};
```

---

## 📱 Адаптация UI

### Единый дизайн

Используйте те же цвета из основного проекта:

```css
/* morpholab/app/globals.css */
:root {
    --primary: #667eea;
    --secondary: #764ba2;
    --success: #10b981;
    --error: #ef4444;
}
```

### Общий header

```typescript
// Добавьте в morpholab/app/layout.tsx
<header>
    <nav>
        <a href="/">← Назад к тестам</a>
        <h1>МорфоЛаб</h1>
    </nav>
</header>
```

---

## ✅ Чеклист интеграции

- [ ] SQL таблицы для МорфоЛаб созданы
- [ ] API endpoints добавлены в backend
- [ ] Ссылка на МорфоЛаб в index.html
- [ ] Сохранение результатов работает
- [ ] Единый leaderboard настроен
- [ ] Дизайн согласован
- [ ] Навигация между играми работает

---

**Готово!** 🎉 МорфоЛаб интегрирован в основной проект.
