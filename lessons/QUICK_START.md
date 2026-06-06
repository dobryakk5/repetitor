# 🚀 Быстрый старт - Полный проект

## 📦 Что у вас есть:

```
russian-tests/
├── frontend/                    # HTML файлы (работают сразу)
│   ├── index.html
│   └── sentence_check.html
│
├── backend/                     # Node.js API (требует настройки)
│   ├── server.js
│   ├── package.json
│   ├── .env.example
│   ├── config/
│   │   └── database.js
│   ├── routes/
│   │   ├── users.js
│   │   ├── tests.js
│   │   ├── leaderboard.js
│   │   └── stats.js
│   └── public/
│       └── js/
│           └── api.js
│
└── database/                    # SQL скрипты
    ├── database_schema.sql
    └── test_data.sql
```

---

## 🎯 Вариант 1: Быстрый тест (только Frontend)

### Шаг 1: Откройте файлы
```bash
# Просто откройте index.html в браузере
open index.html
# или
firefox index.html
# или
chrome index.html
```

**Что работает:**
- ✅ Интерфейс тестов
- ✅ Проверка ответов
- ✅ Leaderboard (localStorage)
- ❌ Сохранение в БД (нужен backend)

---

## 🔥 Вариант 2: Полная установка (Frontend + Backend + Database)

### Шаг 1: Установите PostgreSQL

**Windows:**
1. Скачайте с https://www.postgresql.org/download/windows/
2. Установите, запомните пароль

**macOS:**
```bash
brew install postgresql
brew services start postgresql
```

**Linux:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

---

### Шаг 2: Создайте базу данных

```bash
# Создайте БД
psql -U postgres -c "CREATE DATABASE russian_tests_db;"

# Выполните схему (создание таблиц)
psql -U postgres -d russian_tests_db -f database/database_schema.sql

# Загрузите тестовые данные (12 предложений)
psql -U postgres -d russian_tests_db -f database/test_data.sql
```

**Проверка:**
```bash
psql -U postgres -d russian_tests_db -c "SELECT COUNT(*) FROM test_variants;"
# Должно вывести: 12
```

---

### Шаг 3: Настройте Backend

```bash
# Перейдите в директорию backend
cd backend/

# Установите зависимости
npm install

# Настройте переменные окружения
cp .env.example .env

# Отредактируйте .env (укажите ваш пароль PostgreSQL)
nano .env
# или
code .env
```

**.env файл:**
```env
DB_USER=postgres
DB_HOST=localhost
DB_NAME=russian_tests_db
DB_PASSWORD=ВАШ_ПАРОЛЬ_ЗДЕСЬ
DB_PORT=5432

PORT=3000
NODE_ENV=development
```

---

### Шаг 4: Запустите Backend

```bash
# Запустите сервер
npm start

# Или в режиме разработки (с автоперезагрузкой)
npm run dev
```

**Должны увидеть:**
```
╔═══════════════════════════════════════╗
║   🚀 Server is running on port 3000  ║
║   📝 Environment: development        ║
║   🌐 http://localhost:3000           ║
╚═══════════════════════════════════════╝
✓ Подключено к PostgreSQL
```

---

### Шаг 5: Протестируйте API

**Откройте новый терминал и выполните:**

```bash
# Health check
curl http://localhost:3000/health

# Получить типы тестов
curl http://localhost:3000/api/tests/types

# Получить leaderboard
curl http://localhost:3000/api/leaderboard/sentence_analysis
```

---

### Шаг 6: Обновите Frontend для работы с API

Откройте `index.html` и добавьте перед закрывающим `</body>`:

```html
<!-- Подключаем API клиент -->
<script src="http://localhost:3000/backend/public/js/api.js"></script>

<script>
// Теперь можно использовать API
async function loadLeaderboardFromAPI() {
    try {
        const result = await api.getLeaderboard('sentence_analysis', 10);
        console.log('Leaderboard:', result.leaderboard);
        // Отобразите данные в таблице
    } catch (error) {
        console.error('Ошибка загрузки:', error);
    }
}

loadLeaderboardFromAPI();
</script>
```

---

## 📊 Проверка всего стека

### 1. База данных работает?
```bash
psql -U postgres -d russian_tests_db -c "SELECT * FROM v_leaderboard_detailed LIMIT 5;"
```

### 2. Backend работает?
```bash
curl http://localhost:3000/health
```

### 3. Frontend работает?
Откройте `http://localhost:8080/index.html` (или просто откройте файл)

---

## 🎮 Полный цикл тестирования

### 1. Создайте пользователя через API

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"username": "Тестовый_Пользователь"}'
```

### 2. Получите варианты теста

```bash
curl http://localhost:3000/api/tests/variants/sentence_analysis
```

### 3. Отправьте результат теста

```bash
curl -X POST http://localhost:3000/api/tests/submit \
  -H "Content-Type: application/json" \
  -d '{
    "username": "Тестовый_Пользователь",
    "variant_id": 1,
    "total_questions": 5,
    "correct_answers": 4,
    "incorrect_answers": 1,
    "time_spent_seconds": 120
  }'
```

### 4. Проверьте leaderboard

```bash
curl http://localhost:3000/api/leaderboard/sentence_analysis
```

Вы должны увидеть "Тестовый_Пользователь" в списке!

---

## 🔧 Troubleshooting

### Проблема: "Cannot connect to PostgreSQL"

**Решение:**
```bash
# Проверьте, что PostgreSQL запущен
# macOS/Linux:
pg_isready

# Windows:
sc query postgresql-x64-14

# Если не запущен:
# macOS:
brew services start postgresql

# Linux:
sudo systemctl start postgresql

# Windows:
net start postgresql-x64-14
```

### Проблема: "Port 3000 already in use"

**Решение:**
```bash
# Измените порт в .env
PORT=3001

# Или убейте процесс на порту 3000
# macOS/Linux:
lsof -ti:3000 | xargs kill -9

# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Проблема: "password authentication failed"

**Решение:**
1. Проверьте пароль в `.env`
2. Или сбросьте пароль PostgreSQL:
```bash
# macOS/Linux:
sudo -u postgres psql
ALTER USER postgres PASSWORD 'новый_пароль';

# Windows: используйте pgAdmin
```

---

## 📚 Дополнительные материалы

- **Backend API документация:** `backend/README.md`
- **Database документация:** `database/API_DOCUMENTATION.md`
- **Установка БД:** `database/INSTALLATION.md`
- **Обзор проекта:** `PROJECT_OVERVIEW.md`

---

## ✅ Чеклист успешной установки

- [ ] PostgreSQL установлен и запущен
- [ ] База данных `russian_tests_db` создана
- [ ] Таблицы созданы (выполнен `database_schema.sql`)
- [ ] Тестовые данные загружены (выполнен `test_data.sql`)
- [ ] Node.js установлен (версия 14+)
- [ ] Зависимости установлены (`npm install`)
- [ ] Файл `.env` настроен
- [ ] Backend запущен (`npm start`)
- [ ] API отвечает (`curl http://localhost:3000/health`)
- [ ] Frontend открывается в браузере
- [ ] Тест прошёл успешно (можно отправить результат)

---

## 🎯 Что дальше?

1. **Интегрируйте frontend с API** - замените localStorage на API вызовы
2. **Добавьте аутентификацию** - JWT токены для пользователей
3. **Создайте админ панель** - управление тестами и пользователями
4. **Добавьте новые тесты** - орфография, пунктуация, лексика
5. **Деплой** - разверните на сервере (Heroku, DigitalOcean, AWS)

---

## 🌟 Поздравляем!

Вы успешно развернули полноценное приложение для тестирования по русскому языку с:
- ✅ Красивым frontend
- ✅ RESTful API backend
- ✅ PostgreSQL базой данных
- ✅ Системой leaderboard
- ✅ Статистикой пользователей

**Удачи в разработке!** 🚀
