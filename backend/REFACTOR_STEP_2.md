# Refactor Step 2 — учебный домен для репетитора

Добавлен второй слой проекта: справочники школьного обучения, к которым дальше будут привязываться уроки, результаты, ошибки и аналитика.

## Что добавлено

### Backend-модули

```text
backend/app/models/school.py
backend/app/schemas/school.py
backend/app/services/school.py
backend/app/routers/school.py
```

### Новые таблицы

```text
subjects       — предметы
topics         — темы и подтемы с parent_id
skills         — конкретные навыки внутри темы
mistake_types  — типы ошибок по предмету
```

### Alembic

```text
backend/alembic.ini
backend/alembic/env.py
backend/alembic/versions/20260605_0001_add_school_domain.py
```

Миграция сделана идемпотентной, потому что старый MVP использовал `Base.metadata.create_all()` на старте. Если таблицы уже были созданы автоматически, Alembic не должен упасть на повторном создании таблиц.

### Docker

`backend/Dockerfile` теперь копирует Alembic-файлы и запускает `backend/start.sh`.

`backend/start.sh`:

1. ждёт доступности PostgreSQL;
2. выполняет `alembic upgrade head`;
3. запускает FastAPI через uvicorn.

## Seed-данные

Миграция добавляет стартовую карту по математике:

```text
Предмет:
- Математика

Темы:
- 5 класс / Натуральные числа
- 5 класс / Обыкновенные дроби
- 5 класс / Сравнение дробей
- 5 класс / Сложение дробей
- 5 класс / Вычитание дробей
- 6 класс / Дроби
- 6 класс / Сложение дробей с разными знаменателями
- 6 класс / Сокращение дробей
- 6 класс / Проценты
- 6 класс / Отрицательные числа
- 6 класс / Уравнения
- 6 класс / Задачи на движение

Навыки:
- находить НОК
- приводить дроби к общему знаменателю
- складывать дроби
- сокращать дроби
- переводить смешанное число в неправильную дробь
- находить процент от числа
- связывать скорость, время и расстояние

Типы ошибок:
- вычислительная ошибка
- невнимательность
- неверно понял условие
- ошибка в формуле
- ошибка в логике решения
- ошибка со знаком
- ошибка с единицами измерения
- ошибка в алгоритме
```

## Новые API

### Предметы

```http
GET   /api/school/subjects/
POST  /api/school/subjects/
GET   /api/school/subjects/{subject_id}/
PATCH /api/school/subjects/{subject_id}/
```

### Темы

```http
GET   /api/school/topics/?subject_id=1&grade=6
GET   /api/school/topics/tree/?subject_id=1&grade=6
POST  /api/school/topics/
GET   /api/school/topics/{topic_id}/
PATCH /api/school/topics/{topic_id}/
```

### Навыки

```http
GET   /api/school/skills/?topic_id=7
POST  /api/school/skills/
GET   /api/school/skills/{skill_id}/
PATCH /api/school/skills/{skill_id}/
```

### Типы ошибок

```http
GET   /api/school/mistake-types/?subject_id=1
POST  /api/school/mistake-types/
GET   /api/school/mistake-types/{mistake_type_id}/
PATCH /api/school/mistake-types/{mistake_type_id}/
```

## Примеры запросов

Создать предмет:

```bash
curl -X POST http://localhost:8100/api/school/subjects/ \
  -H "Content-Type: application/json" \
  -d '{"name":"Русский язык","code":"russian"}'
```

Получить дерево тем по математике за 6 класс:

```bash
curl "http://localhost:8100/api/school/topics/tree/?subject_id=1&grade=6"
```

Создать тему:

```bash
curl -X POST http://localhost:8100/api/school/topics/ \
  -H "Content-Type: application/json" \
  -d '{"subject_id":1,"parent_id":6,"grade":6,"name":"Умножение дробей","sort_order":30}'
```

Создать навык:

```bash
curl -X POST http://localhost:8100/api/school/skills/ \
  -H "Content-Type: application/json" \
  -d '{"topic_id":7,"name":"Проверять ответ после сложения дробей","sort_order":40}'
```

Создать тип ошибки:

```bash
curl -X POST http://localhost:8100/api/school/mistake-types/ \
  -H "Content-Type: application/json" \
  -d '{"subject_id":1,"code":"nok_error","name":"Ошибка при нахождении НОК"}'
```

## Что не менялось

Старые coachspace endpoint-ы сохранены. Frontend не менялся.

## Что проверено

```bash
python -m compileall backend/app backend/alembic
```

Статическая компиляция Python-файлов проходит.

## Следующий шаг

Step 3 — добавить учебные результаты урока:

```text
lessons как учебные уроки
lesson_topic_results
lesson_mistakes
homeworks
```

После этого можно будет фиксировать по каждому уроку: тему, навык, понимание, точность, самостоятельность, внимательность и типы ошибок.
