# 🚀 Инструкция по установке PostgreSQL базы данных

## Шаг 1: Установка PostgreSQL

### Windows:
1. Скачайте PostgreSQL с https://www.postgresql.org/download/windows/
2. Запустите установщик
3. Запомните пароль для пользователя `postgres`
4. По умолчанию PostgreSQL будет работать на порту 5432

### macOS:
```bash
brew install postgresql
brew services start postgresql
```

### Linux (Ubuntu/Debian):
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

---

## Шаг 2: Создание базы данных

### Способ 1: Через командную строку

```bash
# Войти в PostgreSQL
psql -U postgres

# В консоли PostgreSQL:
CREATE DATABASE russian_tests_db;
\c russian_tests_db
\i /path/to/database_schema.sql
\i /path/to/test_data.sql
\q
```

### Способ 2: Через psql одной командой

```bash
# Создать базу данных
psql -U postgres -c "CREATE DATABASE russian_tests_db;"

# Выполнить скрипт создания схемы
psql -U postgres -d russian_tests_db -f database_schema.sql

# Выполнить скрипт с тестовыми данными
psql -U postgres -d russian_tests_db -f test_data.sql
```

### Способ 3: Через pgAdmin (графический интерфейс)

1. Откройте pgAdmin
2. Подключитесь к серверу PostgreSQL
3. Правый клик на "Databases" → Create → Database
4. Имя: `russian_tests_db`
5. Правый клик на новой базе → Query Tool
6. Откройте файл `database_schema.sql` и выполните (F5)
7. Откройте файл `test_data.sql` и выполните (F5)

---

## Шаг 3: Проверка установки

```sql
-- Подключитесь к базе данных
psql -U postgres -d russian_tests_db

-- Проверьте список таблиц
\dt

-- Должны увидеть:
-- achievements
-- leaderboard
-- test_attempts
-- test_types
-- test_variants
-- user_achievements
-- user_statistics
-- users

-- Проверьте данные
SELECT * FROM test_types;
SELECT * FROM v_leaderboard_detailed;

-- Если всё ок, выйдите
\q
```

---

## Шаг 4: Настройка подключения для приложения

### Создание строки подключения

```javascript
// Node.js
const connectionString = "postgresql://postgres:your_password@localhost:5432/russian_tests_db";

// Python
DATABASE_URL = "postgresql://postgres:your_password@localhost:5432/russian_tests_db"

// Java
jdbc:postgresql://localhost:5432/russian_tests_db
```

### Создание пользователя для приложения (рекомендуется)

```sql
-- Подключитесь как postgres
psql -U postgres -d russian_tests_db

-- Создайте пользователя
CREATE USER app_user WITH PASSWORD 'secure_app_password';

-- Дайте права
GRANT SELECT, INSERT ON ALL TABLES IN SCHEMA public TO app_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO app_user;

-- Проверьте
\du
```

Теперь используйте:
```
postgresql://app_user:secure_app_password@localhost:5432/russian_tests_db
```

---

## Шаг 5: Тестирование

### Вставка тестового результата

```sql
-- Создаём пользователя
INSERT INTO users (username) 
VALUES ('Тестовый_Пользователь')
RETURNING user_id;

-- Запомните user_id (например, 6)

-- Сохраняем результат
INSERT INTO test_attempts (
    user_id, 
    variant_id, 
    total_questions, 
    correct_answers, 
    incorrect_answers,
    time_spent_seconds
)
VALUES (6, 1, 5, 4, 1, 120)
RETURNING attempt_id, accuracy;

-- Проверяем leaderboard
SELECT * FROM v_leaderboard_detailed
WHERE test_name = 'Разбор предложения'
ORDER BY rank;
```

---

## Шаг 6: Резервное копирование

### Создание бэкапа

```bash
# Полный бэкап
pg_dump -U postgres -d russian_tests_db > backup_$(date +%Y%m%d).sql

# Только данные (без схемы)
pg_dump -U postgres -d russian_tests_db --data-only > backup_data.sql

# Только схема (без данных)
pg_dump -U postgres -d russian_tests_db --schema-only > backup_schema.sql
```

### Восстановление из бэкапа

```bash
# Восстановление
psql -U postgres -d russian_tests_db < backup_20260203.sql
```

---

## 🔧 Устранение проблем

### Проблема: "psql: command not found"

**Решение:** Добавьте PostgreSQL в PATH

Windows:
```
Система → Дополнительные параметры → Переменные среды
Path → Добавить → C:\Program Files\PostgreSQL\15\bin
```

macOS/Linux:
```bash
export PATH="/usr/local/pgsql/bin:$PATH"
```

### Проблема: "password authentication failed"

**Решение:** Сбросьте пароль

```bash
# Linux/macOS
sudo -u postgres psql
ALTER USER postgres PASSWORD 'new_password';

# Windows: используйте pgAdmin для сброса пароля
```

### Проблема: "permission denied for table"

**Решение:** Дайте права пользователю

```sql
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_user;
```

### Проблема: "database does not exist"

**Решение:** Создайте базу данных

```bash
createdb -U postgres russian_tests_db
```

---

## 📊 Полезные команды psql

```bash
\l              # Список всех баз данных
\c dbname       # Подключиться к базе данных
\dt             # Список таблиц
\d table_name   # Структура таблицы
\dv             # Список представлений
\df             # Список функций
\du             # Список пользователей
\q              # Выход

\i file.sql     # Выполнить SQL файл
\o file.txt     # Вывод результатов в файл
\timing         # Показывать время выполнения запросов
```

---

## 🎯 Следующие шаги

После успешной установки базы данных:

1. ✅ База данных создана
2. ✅ Тестовые данные загружены
3. ⏳ Настройте backend (Node.js/Python/etc.)
4. ⏳ Подключите frontend к API
5. ⏳ Настройте автоматические бэкапы
6. ⏳ Настройте мониторинг

---

## 📞 Поддержка

Если возникли проблемы:
1. Проверьте логи PostgreSQL
2. Убедитесь, что сервис PostgreSQL запущен
3. Проверьте права доступа
4. Проверьте файрвол (порт 5432)

**Логи PostgreSQL:**
- Linux: `/var/log/postgresql/`
- macOS: `/usr/local/var/log/`
- Windows: `C:\Program Files\PostgreSQL\15\data\log\`

---

Готово! 🎉 База данных настроена и готова к использованию!
