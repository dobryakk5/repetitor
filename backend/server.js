// server.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();
const pool = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Логирование запросов
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Routes
const userRoutes = require('./routes/users');
const testRoutes = require('./routes/tests');
const leaderboardRoutes = require('./routes/leaderboard');
const statsRoutes = require('./routes/stats');

app.use('/api/users', userRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/stats', statsRoutes);

// Главная страница API
app.get('/', (req, res) => {
    res.json({
        message: 'Russian Tests API',
        version: '1.0.0',
        endpoints: {
            users: '/api/users',
            tests: '/api/tests',
            leaderboard: '/api/leaderboard',
            stats: '/api/stats'
        }
    });
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal server error', message: err.message });
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════╗
║   🚀 Server is running on port ${PORT}  ║
║   📝 Environment: ${process.env.NODE_ENV || 'development'}        ║
║   🌐 http://localhost:${PORT}           ║
╚═══════════════════════════════════════╝
    `);

    void warmLeaderboard();
});

async function warmLeaderboard() {
    try {
        await pool.query('SELECT update_leaderboard_ranks()');
        const result = await pool.query('SELECT COUNT(*)::int AS count FROM leaderboard');
        const count = result.rows[0]?.count ?? 0;
        console.log(`✓ Leaderboard loaded from DB (${count} rows)`);
    } catch (error) {
        console.error('Ошибка загрузки leaderboard при старте:', error.message);
    }
}

module.exports = app;
