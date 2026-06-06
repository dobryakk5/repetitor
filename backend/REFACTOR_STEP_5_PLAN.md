# Step 5 — Analytics core

## Статус перед шагом

Step 4 уже позволяет вести журнал уроков:

- students
- subjects / topics / skills / mistake_types
- lessons
- lesson_topic_results
- lesson_mistakes
- homeworks

Но пока система хранит факты уроков и не хранит текущее состояние навыков ученика.

## Маленькая техническая правка перед Step 5

В `backend/app/models/school.py` модель `Topic` приведена к реальному индексу из миграции:

```sql
CREATE UNIQUE INDEX uq_topics_subject_parent_grade_name
ON topics (subject_id, COALESCE(parent_id, 0), COALESCE(grade, 0), name)
```

В SQLAlchemy теперь используется функциональный `Index`, а не обычный `UniqueConstraint`, потому что PostgreSQL по-разному обрабатывает `NULL` в unique constraint и в выражении через `COALESCE`.

## Цель Step 5

Добавить аналитическое ядро:

```text
lesson_topic_results
  → progress_score
  → student_skill_states
  → student_skill_history
  → recommendations
```

После Step 5 система должна не только сохранять урок, но и обновлять состояние ученика по каждой теме/навыку.

## Новые таблицы

### 1. `student_skill_states`

Текущее состояние ученика по теме/навыку.

```text
id
student_id
subject_id
topic_id
skill_id nullable
current_understanding
current_accuracy
current_independence
current_attention
current_progress_score
mastery_status
risk_level
last_lesson_id
last_practiced_at
created_at
updated_at
```

Назначение: быстрый вывод карточки ученика, слабых тем и текущего уровня.

### 2. `student_skill_history`

История состояния после каждого урока.

```text
id
student_id
subject_id
topic_id
skill_id nullable
lesson_id
understanding
accuracy
independence
attention
progress_score
mastery_status
risk_level
created_at
```

Назначение: графики прогресса по урокам.

### 3. `recommendations`

Рекомендации по ученику, теме, навыку или уроку.

```text
id
student_id
lesson_id nullable
subject_id nullable
topic_id nullable
skill_id nullable
type
priority
text
is_done
created_at
updated_at
```

Примеры:

- повторить НОК;
- дать меньше подсказок, потому что точность высокая, а самостоятельность низкая;
- вернуться к теме, которая давно не повторялась;
- вынести повторяющуюся ошибку в отдельный мини-блок.

### 4. Поле в `lesson_topic_results`

Добавить:

```text
progress_score INTEGER NULL
risk_level VARCHAR(32) NULL
```

`progress_score` нужен, чтобы результат урока был полноценным снимком, а не только набором сырых метрик.

## Расчёт progress_score

Базовая формула:

```text
progress_score =
  understanding_score * 0.35
+ accuracy_percent * 0.30
+ independence_score * 0.25
+ attention_score * 0.10
```

Если `accuracy_percent` отсутствует, вместо него можно использовать среднее между `understanding_score` и `independence_score`, либо требовать заполнения точности.

## Расчёт mastery_status

```text
0–29    introduced
30–49   in_progress
50–69   needs_practice
70–84   almost_mastered
85–100  mastered
```

Ограничения:

```text
Если independence_score < 50, статус не выше needs_practice.
Если accuracy_percent < 60, статус не выше needs_practice.
Если needs_repeat = true, статус не выше needs_practice.
```

## Расчёт risk_level

```text
high:
- progress_score < 50
- или independence_score < 40
- или accuracy_percent < 50
- или одинаковая ошибка повторяется 3 урока подряд

medium:
- progress_score 50–69
- или needs_repeat = true
- или тема не повторялась больше 14 дней

low:
- progress_score >= 70
- independence_score >= 60
- нет повторяющихся ошибок
```

## Обновление текущего состояния навыка

`lesson_topic_results` — факт урока.

`student_skill_states` — сглаженное текущее состояние.

Формула сглаживания:

```text
new_state = old_state * (1 - weight) + lesson_result * weight
```

Вес по типу урока:

```text
new_topic       0.30
practice        0.40
review          0.35
mistake_review  0.45
test            0.70
exam_preparation 0.50
```

Если состояния ещё нет, берём значения первого урока без сглаживания.

## API Step 5

### Overview ученика

```http
GET /api/analytics/students/{student_id}/overview/
```

Возвращает:

- общий средний прогресс;
- количество освоенных тем;
- темы риска;
- последние рекомендации;
- активные домашки.

### Прогресс по темам

```http
GET /api/analytics/students/{student_id}/topics/
GET /api/analytics/students/{student_id}/topics/{topic_id}/history/
```

### История прогресса

```http
GET /api/analytics/students/{student_id}/progress/?topic_id=7&skill_id=2
```

### Ошибки

```http
GET /api/analytics/students/{student_id}/mistakes/
```

### Рекомендации

```http
GET /api/analytics/students/{student_id}/recommendations/
PATCH /api/analytics/recommendations/{recommendation_id}/
```

## Backend-файлы Step 5

```text
backend/app/models/analytics.py
backend/app/schemas/analytics.py
backend/app/services/analytics.py
backend/app/services/recommendations.py
backend/app/routers/analytics.py
backend/alembic/versions/20260605_0002_add_analytics_core.py
```

## Изменение существующего потока создания урока

Сейчас:

```text
POST /api/lessons/full/
  → create lesson
  → create topic_results
  → create mistakes
  → create homeworks
```

После Step 5:

```text
POST /api/lessons/full/
  → create lesson
  → create topic_results
  → create mistakes
  → create homeworks
  → calculate progress_score and risk_level
  → upsert student_skill_states
  → insert student_skill_history
  → generate recommendations
```

## Frontend Step 5

В карточку ученика добавить:

```text
- общий прогресс
- слабые темы
- сильные темы
- повторяющиеся ошибки
- рекомендации
```

Для первого варианта можно без сложных графиков:

- карточки тем;
- таблица текущих состояний;
- список рекомендаций.

Графики можно добавить следующим шагом.

## Критерий готовности

Step 5 готов, если:

1. После создания урока появляется запись в `student_skill_states`.
2. После создания урока появляется запись в `student_skill_history`.
3. В `lesson_topic_results` сохраняется `progress_score`.
4. Можно открыть `/api/analytics/students/{student_id}/overview/`.
5. Можно получить историю прогресса по теме.
6. Можно получить список слабых тем.
7. Можно получить повторяющиеся ошибки.
8. Можно получить рекомендации.
