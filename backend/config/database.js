// config/database.js
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'russian_tests_db',
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432,
});

// Проверка подключения
pool.on('connect', () => {
    console.log('✓ Подключено к PostgreSQL');
});

pool.on('error', (err) => {
    console.error('Ошибка подключения к PostgreSQL:', err);
    process.exit(-1);
});

module.exports = pool;
