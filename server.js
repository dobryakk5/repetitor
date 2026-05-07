const path = require('path');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Платежи и подтверждение оплаты ЮMoney.
app.use('/api/payments', require('./backend/routes/payments'));

// Старые API тренажёров подключаются при наличии PostgreSQL и backend-модулей.
try {
    app.use('/api/users', require('./backend/routes/users'));
    app.use('/api/tests', require('./backend/routes/tests'));
    app.use('/api/leaderboard', require('./backend/routes/leaderboard'));
    app.use('/api/stats', require('./backend/routes/stats'));
} catch (error) {
    console.warn('Training API routes were not mounted:', error.message);
}

app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Раздача статических файлов лендинга и раздела «Тренировка».
app.use(express.static(__dirname, {
    extensions: ['html']
}));

app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, '404.html'), (error) => {
        if (error) res.status(404).json({ error: 'Not found' });
    });
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal server error', message: err.message });
});

app.listen(PORT, () => {
    console.log(`Site server is running on http://localhost:${PORT}`);
});

module.exports = app;
