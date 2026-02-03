// config/database.js
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
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
