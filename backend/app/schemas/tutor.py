from __future__ import annotations

from pydantic import BaseModel, Field, model_validator


LESSON_TYPE_PATTERN = "^(practice|new_topic|review|mistake_review|test|exam_preparation|control|exam|assessment)$"
LESSON_STATUS_PATTERN = "^(planned|done|cancelled|draft)$"


MOOD_STATE_PATTERN = "^(stable|mood_change|emotional_outburst)$"
ENERGY_STATE_PATTERN = "^(active|tired)$"
DISCIPLINE_STATE_PATTERN = "^(healthy_discipline|discipline_issues)$"
RESPECT_STATE_PATTERN = "^(respectful|disrespect_signs)$"
CONVERSATION_STATE_PATTERN = "^(comments_answers|distracted_talks)$"
ARGUMENT_STATE_PATTERN = "^(constructive_argument|distraction_argument)$"
ANSWER_STATE_PATTERN = "^(answers_immediately|avoids_answer|does_not_answer)$"
TASK_INDEPENDENCE_STATE_PATTERN = "^(independent|with_help|not_done)$"
SUBJECT_ATTITUDE_PATTERN = "^(likes|neutral|dislikes)$"
ANSWER_ARGUMENTATION_STATE_PATTERN = "^(can_argue|cannot_argue)$"
QUESTION_STATE_PATTERN = "^(asks_questions|does_not_ask_questions)$"
EXTRA_INFO_STATE_PATTERN = "^(searches_extra_info|does_not_search_extra_info)$"
KEYWORD_STATE_PATTERN = "^(highlights_keywords|does_not_highlight_keywords)$"


class LessonObservationCreate(BaseModel):
    mood_state: str = Field(default="stable", pattern=MOOD_STATE_PATTERN)
    energy_state: str = Field(default="active", pattern=ENERGY_STATE_PATTERN)
    discipline_state: str = Field(default="healthy_discipline", pattern=DISCIPLINE_STATE_PATTERN)
    respect_state: str = Field(default="respectful", pattern=RESPECT_STATE_PATTERN)
    conversation_state: str = Field(default="comments_answers", pattern=CONVERSATION_STATE_PATTERN)
    argument_state: str = Field(default="constructive_argument", pattern=ARGUMENT_STATE_PATTERN)
    answer_state: str = Field(default="answers_immediately", pattern=ANSWER_STATE_PATTERN)
    concentration_score: int = Field(default=7, ge=1, le=10)
    work_pace_score: int = Field(default=7, ge=1, le=10)
    attention_stability_score: int = Field(default=7, ge=1, le=10)
    intellectual_interest: bool = False
    reasoning: bool = False
    hypothesis_building: bool = False
    inference_making: bool = False
    task_independence_state: str = Field(default="with_help", pattern=TASK_INDEPENDENCE_STATE_PATTERN)
    subject_attitude: str = Field(default="neutral", pattern=SUBJECT_ATTITUDE_PATTERN)
    answer_argumentation_state: str = Field(default="can_argue", pattern=ANSWER_ARGUMENTATION_STATE_PATTERN)
    question_state: str = Field(default="asks_questions", pattern=QUESTION_STATE_PATTERN)
    extra_info_state: str = Field(default="does_not_search_extra_info", pattern=EXTRA_INFO_STATE_PATTERN)
    keyword_state: str = Field(default="highlights_keywords", pattern=KEYWORD_STATE_PATTERN)
    comment: str = ""


class LessonObservationUpdate(BaseModel):
    mood_state: str | None = Field(default=None, pattern=MOOD_STATE_PATTERN)
    energy_state: str | None = Field(default=None, pattern=ENERGY_STATE_PATTERN)
    discipline_state: str | None = Field(default=None, pattern=DISCIPLINE_STATE_PATTERN)
    respect_state: str | None = Field(default=None, pattern=RESPECT_STATE_PATTERN)
    conversation_state: str | None = Field(default=None, pattern=CONVERSATION_STATE_PATTERN)
    argument_state: str | None = Field(default=None, pattern=ARGUMENT_STATE_PATTERN)
    answer_state: str | None = Field(default=None, pattern=ANSWER_STATE_PATTERN)
    concentration_score: int | None = Field(default=None, ge=1, le=10)
    work_pace_score: int | None = Field(default=None, ge=1, le=10)
    attention_stability_score: int | None = Field(default=None, ge=1, le=10)
    intellectual_interest: bool | None = None
    reasoning: bool | None = None
    hypothesis_building: bool | None = None
    inference_making: bool | None = None
    task_independence_state: str | None = Field(default=None, pattern=TASK_INDEPENDENCE_STATE_PATTERN)
    subject_attitude: str | None = Field(default=None, pattern=SUBJECT_ATTITUDE_PATTERN)
    answer_argumentation_state: str | None = Field(default=None, pattern=ANSWER_ARGUMENTATION_STATE_PATTERN)
    question_state: str | None = Field(default=None, pattern=QUESTION_STATE_PATTERN)
    extra_info_state: str | None = Field(default=None, pattern=EXTRA_INFO_STATE_PATTERN)
    keyword_state: str | None = Field(default=None, pattern=KEYWORD_STATE_PATTERN)
    comment: str | None = None


class LessonObservationResponse(BaseModel):
    id: int
    lesson_id: int = Field(alias="lessonId")
    tutor_id: int = Field(alias="tutorId")
    mood_state: str = Field(alias="moodState")
    energy_state: str = Field(alias="energyState")
    discipline_state: str = Field(alias="disciplineState")
    respect_state: str = Field(alias="respectState")
    conversation_state: str = Field(alias="conversationState")
    argument_state: str = Field(alias="argumentState")
    answer_state: str = Field(alias="answerState")
    concentration_score: int = Field(alias="concentrationScore")
    work_pace_score: int = Field(alias="workPaceScore")
    attention_stability_score: int = Field(alias="attentionStabilityScore")
    intellectual_interest: bool = Field(alias="intellectualInterest")
    reasoning: bool
    hypothesis_building: bool = Field(alias="hypothesisBuilding")
    inference_making: bool = Field(alias="inferenceMaking")
    task_independence_state: str = Field(alias="taskIndependenceState")
    subject_attitude: str = Field(alias="subjectAttitude")
    answer_argumentation_state: str = Field(alias="answerArgumentationState")
    question_state: str = Field(alias="questionState")
    extra_info_state: str = Field(alias="extraInfoState")
    keyword_state: str = Field(alias="keywordState")
    comment: str
    created_at: str | None = Field(default=None, alias="createdAt")
    updated_at: str | None = Field(default=None, alias="updatedAt")

    model_config = {"populate_by_name": True}


class LessonMistakeCreate(BaseModel):
    mistake_type_id: int
    count: int = Field(default=1, ge=1)
    severity: str = Field(default="medium", pattern="^(low|medium|high)$")
    comment: str = ""


class LessonMistakeUpdate(BaseModel):
    mistake_type_id: int | None = None
    count: int | None = Field(default=None, ge=1)
    severity: str | None = Field(default=None, pattern="^(low|medium|high)$")
    comment: str | None = None


class LessonTopicResultCreate(BaseModel):
    topic_id: int
    skill_id: int | None = None
    understanding_score: int = Field(ge=0, le=100)
    accuracy_percent: int | None = Field(default=None, ge=0, le=100)
    independence_score: int = Field(ge=0, le=100)
    attention_score: int = Field(ge=0, le=100)
    speed_score: int | None = Field(default=None, ge=0, le=100)
    total_tasks: int | None = Field(default=None, ge=0)
    correct_tasks: int | None = Field(default=None, ge=0)
    hint_count: int | None = Field(default=None, ge=0)
    needs_repeat: bool = False
    comment: str = ""
    mistakes: list[LessonMistakeCreate] = Field(default_factory=list)

    @model_validator(mode="after")
    def validate_tasks(self) -> "LessonTopicResultCreate":
        if self.total_tasks is not None and self.correct_tasks is not None and self.correct_tasks > self.total_tasks:
            raise ValueError("correct_tasks cannot be greater than total_tasks")
        return self


class LessonTopicResultUpdate(BaseModel):
    topic_id: int | None = None
    skill_id: int | None = None
    understanding_score: int | None = Field(default=None, ge=0, le=100)
    accuracy_percent: int | None = Field(default=None, ge=0, le=100)
    independence_score: int | None = Field(default=None, ge=0, le=100)
    attention_score: int | None = Field(default=None, ge=0, le=100)
    speed_score: int | None = Field(default=None, ge=0, le=100)
    total_tasks: int | None = Field(default=None, ge=0)
    correct_tasks: int | None = Field(default=None, ge=0)
    hint_count: int | None = Field(default=None, ge=0)
    needs_repeat: bool | None = None
    comment: str | None = None

    @model_validator(mode="after")
    def validate_tasks(self) -> "LessonTopicResultUpdate":
        if self.total_tasks is not None and self.correct_tasks is not None and self.correct_tasks > self.total_tasks:
            raise ValueError("correct_tasks cannot be greater than total_tasks")
        return self


class HomeworkCreate(BaseModel):
    lesson_id: int | None = None
    student_id: int | None = None
    subject_id: int | None = None
    topic_id: int | None = None
    skill_id: int | None = None
    text: str = Field(min_length=1)
    status: str = Field(default="assigned", pattern="^(assigned|done|partially_done|not_done|checked|redo_required)$")
    due_date: str | None = None
    completion_percent: int | None = Field(default=None, ge=0, le=100)
    accuracy_percent: int | None = Field(default=None, ge=0, le=100)
    teacher_comment: str = ""


class HomeworkUpdate(BaseModel):
    lesson_id: int | None = None
    student_id: int | None = None
    subject_id: int | None = None
    topic_id: int | None = None
    skill_id: int | None = None
    text: str | None = Field(default=None, min_length=1)
    status: str | None = Field(default=None, pattern="^(assigned|done|partially_done|not_done|checked|redo_required)$")
    due_date: str | None = None
    completion_percent: int | None = Field(default=None, ge=0, le=100)
    accuracy_percent: int | None = Field(default=None, ge=0, le=100)
    teacher_comment: str | None = None


class LessonCreate(BaseModel):
    student_id: int
    subject_id: int
    lesson_date: str | None = None
    duration_minutes: int | None = Field(default=None, ge=1, le=600)
    lesson_type: str = Field(default="practice", pattern=LESSON_TYPE_PATTERN)
    status: str = Field(default="done", pattern=LESSON_STATUS_PATTERN)
    general_comment: str = ""
    tutor_comment: str = ""
    next_lesson_plan: str = ""
    observation: LessonObservationCreate | None = None


class LessonUpdate(BaseModel):
    student_id: int | None = None
    subject_id: int | None = None
    lesson_date: str | None = None
    duration_minutes: int | None = Field(default=None, ge=1, le=600)
    lesson_type: str | None = Field(default=None, pattern=LESSON_TYPE_PATTERN)
    status: str | None = Field(default=None, pattern=LESSON_STATUS_PATTERN)
    general_comment: str | None = None
    tutor_comment: str | None = None
    next_lesson_plan: str | None = None
    observation: LessonObservationUpdate | None = None


class LessonFullCreate(LessonCreate):
    topic_results: list[LessonTopicResultCreate] = Field(default_factory=list)
    homeworks: list[HomeworkCreate] = Field(default_factory=list)


class LessonMistakeResponse(BaseModel):
    id: int
    lesson_topic_result_id: int = Field(alias="lessonTopicResultId")
    mistake_type_id: int = Field(alias="mistakeTypeId")
    count: int
    severity: str
    comment: str
    created_at: str | None = Field(default=None, alias="createdAt")

    model_config = {"populate_by_name": True}


class LessonTopicResultResponse(BaseModel):
    id: int
    lesson_id: int = Field(alias="lessonId")
    topic_id: int = Field(alias="topicId")
    skill_id: int | None = Field(default=None, alias="skillId")
    understanding_score: int = Field(alias="understandingScore")
    accuracy_percent: int | None = Field(default=None, alias="accuracyPercent")
    independence_score: int = Field(alias="independenceScore")
    attention_score: int = Field(alias="attentionScore")
    speed_score: int | None = Field(default=None, alias="speedScore")
    total_tasks: int | None = Field(default=None, alias="totalTasks")
    correct_tasks: int | None = Field(default=None, alias="correctTasks")
    hint_count: int | None = Field(default=None, alias="hintCount")
    needs_repeat: bool = Field(alias="needsRepeat")
    progress_score: int | None = Field(default=None, alias="progressScore")
    mastery_status: str = Field(alias="masteryStatus")
    risk_level: str = Field(alias="riskLevel")
    comment: str
    mistakes: list[LessonMistakeResponse] | None = None
    created_at: str | None = Field(default=None, alias="createdAt")
    updated_at: str | None = Field(default=None, alias="updatedAt")

    model_config = {"populate_by_name": True}


class HomeworkResponse(BaseModel):
    id: int
    tutor_id: int | None = Field(default=None, alias="tutorId")
    lesson_id: int | None = Field(default=None, alias="lessonId")
    student_id: int = Field(alias="studentId")
    subject_id: int | None = Field(default=None, alias="subjectId")
    topic_id: int | None = Field(default=None, alias="topicId")
    skill_id: int | None = Field(default=None, alias="skillId")
    text: str
    status: str
    due_date: str | None = Field(default=None, alias="dueDate")
    completion_percent: int | None = Field(default=None, alias="completionPercent")
    accuracy_percent: int | None = Field(default=None, alias="accuracyPercent")
    teacher_comment: str = Field(alias="teacherComment")
    created_at: str | None = Field(default=None, alias="createdAt")
    updated_at: str | None = Field(default=None, alias="updatedAt")

    model_config = {"populate_by_name": True}


class LessonResponse(BaseModel):
    id: int
    tutor_id: int | None = Field(default=None, alias="tutorId")
    student_id: int = Field(alias="studentId")
    subject_id: int = Field(alias="subjectId")
    lesson_date: str | None = Field(default=None, alias="lessonDate")
    duration_minutes: int | None = Field(default=None, alias="durationMinutes")
    lesson_type: str = Field(alias="lessonType")
    status: str
    general_comment: str = Field(alias="generalComment")
    tutor_comment: str = Field(alias="tutorComment")
    next_lesson_plan: str = Field(alias="nextLessonPlan")
    topic_results: list[LessonTopicResultResponse] | None = Field(default=None, alias="topicResults")
    homeworks: list[HomeworkResponse] | None = None
    observation: LessonObservationResponse | None = None
    created_at: str | None = Field(default=None, alias="createdAt")
    updated_at: str | None = Field(default=None, alias="updatedAt")

    model_config = {"populate_by_name": True}
