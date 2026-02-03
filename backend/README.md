# 🚀 Backend API - Russian Tests

Полноценный REST API для системы тестирования по русскому языку на Node.js + Express + PostgreSQL.

---

## 📦 Установка

### 1. Установите зависимости

```bash
npm install
```

### 2. Настройте переменные окружения

Скопируйте `.env.example` в `.env` и заполните:

```bash
cp .env.example .env
```

Отредактируйте `.env`:
```env
DB_USER=postgres
DB_HOST=localhost
DB_NAME=russian_tests_db
DB_PASSWORD=your_actual_password
DB_PORT=5432

PORT=3000
NODE_ENV=development
```

### 3. Создайте базу данных

```bash
# Создайте БД
psql -U postgres -c "CREATE DATABASE russian_tests_db;"

# Выполните схему
psql -U postgres -d russian_tests_db -f database_schema.sql

# Загрузите тестовые данные
psql -U postgres -d russian_tests_db -f test_data.sql
```

### 4. Запустите сервер

```bash
# Production mode
npm start

# Development mode (с автоперезагрузкой)
npm run dev
```

Сервер запустится на `http://localhost:3000`

---

## 📡 API Endpoints

### 🏠 Основные

```
GET  /                 # Информация об API
GET  /health           # Health check
```

### 👥 Users

```
GET    /api/users                 # Все пользователи
GET    /api/users/:username       # Конкретный пользователь
POST   /api/users                 # Создать пользователя
DELETE /api/users/:userId         # Удалить пользователя
```

### 📝 Tests

```
GET  /api/tests/types                    # Все типы тестов
GET  /api/tests/variants/:testType       # Варианты теста
GET  /api/tests/variant/:variantId       # Конкретный вариант
POST /api/tests/submit                   # Отправить результат
GET  /api/tests/history/:username        # История пользователя
```

### 🏆 Leaderboard

```
GET  /api/leaderboard/:testType          # Leaderboard теста
GET  /api/leaderboard/all/top            # Топ по всем тестам
GET  /api/leaderboard/user/:username/rank # Позиция пользователя
POST /api/leaderboard/update-ranks       # Обновить ранги
```

### 📊 Statistics

```
GET /api/stats/user/:username      # Статистика пользователя
GET /api/stats/recent              # Последние попытки
GET /api/stats/tests/overview      # Обзор всех тестов
GET /api/stats/variants/difficulty # Сложность вариантов
GET /api/stats/active-users        # Активные пользователи
GET /api/stats/dashboard           # Статистика для dashboard
```

---

## 🔥 Примеры использования

### Создать пользователя

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"username": "Анна", "email": "anna@example.com"}'
```

Ответ:
```json
{
  "success": true,
  "user": {
    "user_id": 1,
    "username": "Анна",
    "email": "anna@example.com",
    "created_at": "2026-02-03T12:00:00.000Z"
  }
}
```

### Получить варианты теста

```bash
curl http://localhost:3000/api/tests/variants/sentence_analysis
```

Ответ:
```json
{
  "success": true,
  "count": 12,
  "variants": [
    {
      "variant_id": 1,
      "variant_number": 1,
      "variant_data": {
        "sentence": "Солнце ярко светит над полем.",
        "words": [...]
      },
      "difficulty_level": "easy",
      "test_name_ru": "Разбор предложения"
    },
    ...
  ]
}
```

### Отправить результат теста

```bash
curl -X POST http://localhost:3000/api/tests/submit \
  -H "Content-Type: application/json" \
  -d '{
    "username": "Анна",
    "variant_id": 1,
    "total_questions": 5,
    "correct_answers": 4,
    "incorrect_answers": 1,
    "user_answers": {
      "Солнце": {"selected": "существительное", "correct": true},
      "ярко": {"selected": "наречие", "correct": true}
    },
    "time_spent_seconds": 120
  }'
```

Ответ:
```json
{
  "success": true,
  "attempt_id": 1,
  "accuracy": 80.00,
  "user_id": 1
}
```

### Получить leaderboard

```bash
curl http://localhost:3000/api/leaderboard/sentence_analysis?limit=5
```

Ответ:
```json
{
  "success": true,
  "test_type": "sentence_analysis",
  "count": 5,
  "leaderboard": [
    {
      "rank": 1,
      "username": "Анна",
      "total_correct": 16,
      "total_questions": 16,
      "accuracy": 100.00,
      "last_updated": "2026-02-03T12:00:00.000Z"
    },
    ...
  ]
}
```

### Получить статистику пользователя

```bash
curl http://localhost:3000/api/stats/user/Анна
```

Ответ:
```json
{
  "success": true,
  "username": "Анна",
  "stats": [
    {
      "test_name_ru": "Разбор предложения",
      "total_attempts": 3,
      "total_correct": 16,
      "total_questions": 16,
      "average_accuracy": 100.00,
      "best_accuracy": 100.00,
      "rank": 1
    }
  ]
}
```

---

## 💻 Использование из JavaScript

### Подключите API клиент

```html
<script src="js/api.js"></script>
```

### Примеры использования

```javascript
// Создать пользователя
const user = await api.createUser('Анна', 'anna@example.com');

// Получить варианты теста
const variants = await api.getTestVariants('sentence_analysis');

// Отправить результат
const result = await api.submitTest({
    username: 'Анна',
    variant_id: 1,
    total_questions: 5,
    correct_answers: 4,
    incorrect_answers: 1,
    user_answers: {...},
    time_spent_seconds: 120
});

// Получить leaderboard
const leaderboard = await api.getLeaderboard('sentence_analysis', 10);

// Получить статистику
const stats = await api.getUserStats('Анна');
```

---

## 🔧 Структура проекта

```
backend/
├── server.js              # Главный файл сервера
├── package.json           # Зависимости
├── .env.example           # Пример конфигурации
├── config/
│   └── database.js        # Настройки PostgreSQL
├── routes/
│   ├── users.js           # Роуты пользователей
│   ├── tests.js           # Роуты тестов
│   ├── leaderboard.js     # Роуты leaderboard
│   └── stats.js           # Роуты статистики
└── public/
    └── js/
        └── api.js         # API клиент для frontend
```

---

## 🐛 Troubleshooting

### Ошибка подключения к БД

```
Error: password authentication failed for user "postgres"
```

**Решение:** Проверьте пароль в `.env` файле

### Ошибка "relation does not exist"

```
Error: relation "users" does not exist
```

**Решение:** Выполните SQL скрипты для создания таблиц:
```bash
psql -U postgres -d russian_tests_db -f database_schema.sql
```

### CORS ошибки

Если фронтенд на другом порту, добавьте в `server.js`:
```javascript
app.use(cors({
    origin: 'http://localhost:8080' // ваш порт
}));
```

---

## 📊 Мониторинг

### Проверка здоровья API

```bash
curl http://localhost:3000/health
```

### Проверка подключения к БД

```bash
psql -U postgres -d russian_tests_db -c "SELECT COUNT(*) FROM users;"
```

---

## 🚀 Деплой

### Production настройки

1. Установите `NODE_ENV=production`
2. Используйте сильный пароль БД
3. Настройте CORS для вашего домена
4. Используйте HTTPS
5. Настройте логирование

### PM2 (рекомендуется)

```bash
npm install -g pm2

pm2 start server.js --name russian-tests-api
pm2 save
pm2 startup
```

---

## 📝 Логи

Все запросы логируются в консоль с timestamp:

```
2026-02-03T12:00:00.000Z - POST /api/tests/submit
2026-02-03T12:00:01.000Z - GET /api/leaderboard/sentence_analysis
```

---

## 🔐 Безопасность

- ✅ Все SQL запросы используют параметризованные запросы (защита от SQL injection)
- ✅ Валидация входных данных
- ✅ CORS настроен
- ⚠️ Добавьте аутентификацию для production
- ⚠️ Добавьте rate limiting
- ⚠️ Используйте HTTPS в production

---

## 📄 Лицензия

MIT

---

**Готово к использованию!** 🎉

Запустите сервер: `npm start`
