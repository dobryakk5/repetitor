export type AuthUser = {
  id: number;
  email: string;
  fullName: string;
  role: 'admin' | 'tutor';
  isActive: boolean;
};

export type LoginResponse = {
  access_token: string;
  token_type: 'bearer';
  user: AuthUser;
};

export type DashboardOverview = {
  activeStudents: number;
  lessonsCount: number;
  activeHomeworks: number;
  groupsCount: number;
};

export type Student = {
  id: number;
  tutorId?: number;
  firstName: string;
  lastName: string;
  name: string;
  initials: string;
  grade: number | null;
  schoolClassLabel: string;
  parentName: string;
  parentContact: string;
  learningGoal: string;
  startLevel: string;
  comment: string;
  isActive: boolean;
  lessonsCount?: number;
  activeHomeworksCount?: number;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type Subject = {
  id: number;
  name: string;
  code: string;
  isActive: boolean;
};

export type Topic = {
  id: number;
  subjectId: number;
  tutorId?: number | null;
  isSystem?: boolean;
  parentId: number | null;
  grade: number | null;
  name: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
  children?: Topic[];
};

export type Skill = {
  id: number;
  topicId: number;
  tutorId?: number | null;
  isSystem?: boolean;
  name: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
};

export type MistakeType = {
  id: number;
  subjectId: number;
  tutorId?: number | null;
  isSystem?: boolean;
  code: string;
  name: string;
  description: string;
  isActive: boolean;
};

export type LessonMistake = {
  id: number;
  lessonTopicResultId: number;
  mistakeTypeId: number;
  count: number;
  severity: 'low' | 'medium' | 'high';
  comment: string;
};

export type LessonTopicResult = {
  id: number;
  lessonId: number;
  topicId: number;
  skillId: number | null;
  understandingScore: number;
  accuracyPercent: number | null;
  independenceScore: number;
  attentionScore: number;
  speedScore: number | null;
  totalTasks: number | null;
  correctTasks: number | null;
  hintCount: number | null;
  needsRepeat: boolean;
  progressScore: number | null;
  masteryStatus: string;
  riskLevel: 'low' | 'medium' | 'high';
  comment: string;
  mistakes?: LessonMistake[];
};


export type LessonObservation = {
  id: number;
  lessonId: number;
  tutorId: number;
  moodState: 'stable' | 'mood_change' | 'emotional_outburst';
  energyState: 'active' | 'tired';
  disciplineState: 'healthy_discipline' | 'discipline_issues';
  respectState: 'respectful' | 'disrespect_signs';
  conversationState: 'comments_answers' | 'distracted_talks';
  argumentState: 'constructive_argument' | 'distraction_argument';
  answerState: 'answers_immediately' | 'avoids_answer' | 'does_not_answer';
  concentrationScore: number;
  workPaceScore: number;
  attentionStabilityScore: number;
  intellectualInterest: boolean;
  reasoning: boolean;
  hypothesisBuilding: boolean;
  inferenceMaking: boolean;
  taskIndependenceState: 'independent' | 'with_help' | 'not_done';
  subjectAttitude: 'likes' | 'neutral' | 'dislikes';
  answerArgumentationState: 'can_argue' | 'cannot_argue';
  questionState: 'asks_questions' | 'does_not_ask_questions';
  extraInfoState: 'searches_extra_info' | 'does_not_search_extra_info';
  keywordState: 'highlights_keywords' | 'does_not_highlight_keywords';
  comment: string;
};

export type Homework = {
  id: number;
  tutorId?: number;
  lessonId: number | null;
  studentId: number;
  subjectId: number | null;
  topicId: number | null;
  skillId: number | null;
  text: string;
  status: string;
  dueDate: string | null;
  completionPercent: number | null;
  accuracyPercent: number | null;
  teacherComment: string;
};

export type Lesson = {
  id: number;
  tutorId?: number;
  studentId: number;
  subjectId: number;
  lessonDate: string | null;
  durationMinutes: number | null;
  lessonType: string;
  status: string;
  generalComment: string;
  tutorComment: string;
  nextLessonPlan: string;
  topicResults?: LessonTopicResult[];
  homeworks?: Homework[];
  observation?: LessonObservation | null;
};

export type LessonFullCreatePayload = {
  student_id: number;
  subject_id: number;
  lesson_date?: string | null;
  duration_minutes?: number | null;
  lesson_type: string;
  status: string;
  general_comment?: string;
  tutor_comment?: string;
  next_lesson_plan?: string;
  observation?: {
    mood_state: 'stable' | 'mood_change' | 'emotional_outburst';
    energy_state: 'active' | 'tired';
    discipline_state: 'healthy_discipline' | 'discipline_issues';
    respect_state: 'respectful' | 'disrespect_signs';
    conversation_state: 'comments_answers' | 'distracted_talks';
    argument_state: 'constructive_argument' | 'distraction_argument';
    answer_state: 'answers_immediately' | 'avoids_answer' | 'does_not_answer';
    concentration_score: number;
    work_pace_score: number;
    attention_stability_score: number;
    intellectual_interest: boolean;
    reasoning: boolean;
    hypothesis_building: boolean;
    inference_making: boolean;
    task_independence_state: 'independent' | 'with_help' | 'not_done';
    subject_attitude: 'likes' | 'neutral' | 'dislikes';
    answer_argumentation_state: 'can_argue' | 'cannot_argue';
    question_state: 'asks_questions' | 'does_not_ask_questions';
    extra_info_state: 'searches_extra_info' | 'does_not_search_extra_info';
    keyword_state: 'highlights_keywords' | 'does_not_highlight_keywords';
    comment?: string;
  };
  topic_results: Array<{
    topic_id: number;
    skill_id?: number | null;
    understanding_score: number;
    accuracy_percent?: number | null;
    independence_score: number;
    attention_score: number;
    speed_score?: number | null;
    total_tasks?: number | null;
    correct_tasks?: number | null;
    hint_count?: number | null;
    needs_repeat?: boolean;
    comment?: string;
    mistakes: Array<{
      mistake_type_id: number;
      count: number;
      severity: 'low' | 'medium' | 'high';
      comment?: string;
    }>;
  }>;
  homeworks: Array<{
    student_id?: number | null;
    subject_id?: number | null;
    topic_id?: number | null;
    skill_id?: number | null;
    text: string;
    status?: string;
    due_date?: string | null;
  }>;
};

export type OperatorTaskHistory = {
  id: string;
  note: string;
  authorName?: string;
  createdAt: string;
  action?: string;
};

export type AnalyticsOverview = {
  studentId: number;
  lessonsCount: number;
  trackedSkillsCount: number;
  activeHomeworksCount: number;
  activeRecommendationsCount: number;
  averageProgressScore: number | null;
  highRiskTopicsCount: number;
  lowRiskTopicsCount: number;
};

export type SkillState = {
  id: number;
  studentId: number;
  subjectId: number;
  topicId: number;
  skillId: number | null;
  currentUnderstanding: number;
  currentAccuracy: number | null;
  currentIndependence: number;
  currentAttention: number;
  currentProgressScore: number;
  masteryStatus: string;
  riskLevel: 'low' | 'medium' | 'high';
  lastLessonId: number | null;
  lastPracticedAt: string | null;
};

export type Recommendation = {
  id: number;
  tutorId?: number;
  studentId: number;
  lessonId: number | null;
  topicId: number | null;
  skillId: number | null;
  type: string;
  priority: 'low' | 'medium' | 'high';
  text: string;
  isDone: boolean;
  createdAt: string | null;
  updatedAt: string | null;
};

export type MistakeSummary = {
  mistakeTypeId: number;
  mistakeName: string;
  topicId: number;
  count: number;
  lessonsCount: number;
  lastSeenAt: string | null;
};

export type AnalyticsSummaryTopic = {
  topicId: number;
  topicName: string;
  skillId: number | null;
  skillName: string | null;
  progressScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  masteryStatus: string;
  lastPracticedAt: string | null;
};

export type AnalyticsSummaryMistake = MistakeSummary & {
  topicName: string;
};

export type AnalyticsSummary = {
  studentId: number;
  overallProgress: number | null;
  monthlyDelta: number | null;
  strongTopics: AnalyticsSummaryTopic[];
  weakTopics: AnalyticsSummaryTopic[];
  repeatedMistakes: AnalyticsSummaryMistake[];
  overview: AnalyticsOverview;
};


export type Report = {
  id: number;
  tutorId?: number;
  studentId: number;
  lessonId: number | null;
  reportType: 'lesson_report' | 'period_report' | 'topic_report';
  periodFrom: string | null;
  periodTo: string | null;
  title: string;
  content: string;
  payloadJson: Record<string, unknown>;
  createdAt: string | null;
  updatedAt: string | null;
};
