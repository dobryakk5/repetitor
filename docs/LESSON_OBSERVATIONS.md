# Наблюдения за учеником на уроке

Наблюдения вынесены в отдельную сущность `LessonObservation`, связанную с уроком один-к-одному через `lesson_id`.

Причина: эмоциональное состояние, поведение, внимание и самостоятельность относятся ко всему занятию, а не к конкретной теме урока. Академические результаты остаются в `lesson_topic_results`.

## Структура

### Эмоциональная сфера — переключатели

- `mood_state`:
  - `stable` — занятие прошло ровно;
  - `mood_change` — смена настроения;
  - `emotional_outburst` — эмоциональная вспышка.
- `energy_state`:
  - `active` — ребенок бодр;
  - `tired` — ребенок пришел уставший.

### Поведение на занятии — переключатели

- `discipline_state`: `healthy_discipline` / `discipline_issues`.
- `respect_state`: `respectful` / `disrespect_signs`.
- `conversation_state`: `comments_answers` / `distracted_talks`.
- `argument_state`: `constructive_argument` / `distraction_argument`.
- `answer_state`: `answers_immediately` / `avoids_answer` / `does_not_answer`.

### Работоспособность и внимание — шкала 1–10

- `concentration_score` — концентрация.
- `work_pace_score` — темп выполнения заданий.
- `attention_stability_score` — удержание внимания.

### Интеллектуальный труд — чеклист из 4 пунктов

- `intellectual_interest` — проявлял интерес.
- `reasoning` — рассуждает.
- `hypothesis_building` — строит предположения.
- `inference_making` — делает умозаключения.

### Самостоятельность в обучении — переключатели

- `task_independence_state`: `independent` / `with_help` / `not_done`.
- `subject_attitude`: `likes` / `neutral` / `dislikes`.
- `answer_argumentation_state`: `can_argue` / `cannot_argue`.
- `question_state`: `asks_questions` / `does_not_ask_questions`.
- `extra_info_state`: `searches_extra_info` / `does_not_search_extra_info`.
- `keyword_state`: `highlights_keywords` / `does_not_highlight_keywords`.

## API

Наблюдение можно передавать внутри создания полного урока:

```json
{
  "student_id": 1,
  "subject_id": 1,
  "lesson_type": "practice",
  "status": "done",
  "observation": {
    "mood_state": "stable",
    "energy_state": "active",
    "discipline_state": "healthy_discipline",
    "respect_state": "respectful",
    "conversation_state": "comments_answers",
    "argument_state": "constructive_argument",
    "answer_state": "answers_immediately",
    "concentration_score": 8,
    "work_pace_score": 7,
    "attention_stability_score": 8,
    "intellectual_interest": true,
    "reasoning": true,
    "hypothesis_building": false,
    "inference_making": true,
    "task_independence_state": "with_help",
    "subject_attitude": "likes",
    "answer_argumentation_state": "can_argue",
    "question_state": "asks_questions",
    "extra_info_state": "does_not_search_extra_info",
    "keyword_state": "highlights_keywords",
    "comment": "Урок прошел спокойно, концентрация лучше во второй половине занятия."
  },
  "topic_results": [],
  "homeworks": []
}
```

`GET /api/lessons/{lesson_id}/` возвращает `observation` вместе с темами и домашними заданиями.

## Отчеты

При формировании отчета по уроку блок наблюдений включается в текст отчета и в `payload_json` отчета.

## Миграция

```bash
cd backend
alembic upgrade head
```

Новая таблица:

- `lesson_observations`
