'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { lessonsApi } from '@/lib/api/lessons';
import { schoolApi } from '@/lib/api/school';
import { studentsApi } from '@/lib/api/students';
import type { MistakeType, Skill, Student, Subject, Topic } from '@/lib/types';

type TopicDraft = {
  topicId: string;
  skillId: string;
  understandingScore: number;
  independenceScore: number;
  attentionScore: number;
  totalTasks: string;
  correctTasks: string;
  hintCount: string;
  needsRepeat: boolean;
  comment: string;
  mistakeIds: number[];
};

type HomeworkDraft = { text: string; topicId: string; skillId: string; dueDate: string };

type ObservationDraft = {
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

const defaultTopicDraft = (): TopicDraft => ({
  topicId: '',
  skillId: '',
  understandingScore: 70,
  independenceScore: 60,
  attentionScore: 70,
  totalTasks: '',
  correctTasks: '',
  hintCount: '',
  needsRepeat: false,
  comment: '',
  mistakeIds: [],
});

const defaultObservationDraft = (): ObservationDraft => ({
  moodState: 'stable',
  energyState: 'active',
  disciplineState: 'healthy_discipline',
  respectState: 'respectful',
  conversationState: 'comments_answers',
  argumentState: 'constructive_argument',
  answerState: 'answers_immediately',
  concentrationScore: 7,
  workPaceScore: 7,
  attentionStabilityScore: 7,
  intellectualInterest: false,
  reasoning: false,
  hypothesisBuilding: false,
  inferenceMaking: false,
  taskIndependenceState: 'with_help',
  subjectAttitude: 'neutral',
  answerArgumentationState: 'can_argue',
  questionState: 'asks_questions',
  extraInfoState: 'does_not_search_extra_info',
  keywordState: 'highlights_keywords',
  comment: '',
});

export default function NewLessonPage() {
  const params = useParams<{ studentId: string }>();
  const router = useRouter();
  const studentId = Number(params.studentId);
  const [student, setStudent] = useState<Student | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [mistakes, setMistakes] = useState<MistakeType[]>([]);
  const [subjectId, setSubjectId] = useState<number>(1);
  const [lessonDate, setLessonDate] = useState(() => new Date().toISOString().slice(0, 16));
  const [duration, setDuration] = useState('60');
  const [lessonType, setLessonType] = useState('practice');
  const [generalComment, setGeneralComment] = useState('');
  const [nextPlan, setNextPlan] = useState('');
  const [observation, setObservation] = useState<ObservationDraft>(defaultObservationDraft());
  const [topicResults, setTopicResults] = useState<TopicDraft[]>([defaultTopicDraft()]);
  const [homeworks, setHomeworks] = useState<HomeworkDraft[]>([{ text: '', topicId: '', skillId: '', dueDate: '' }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      const [studentResult, subjectsResult] = await Promise.all([studentsApi.get(studentId), schoolApi.subjects()]);
      if (!active) return;
      setStudent(studentResult);
      setSubjects(subjectsResult);
      if (subjectsResult[0]) setSubjectId(subjectsResult[0].id);
    }
    if (Number.isFinite(studentId)) void load().catch(() => setError('Не удалось загрузить данные.'));
    return () => { active = false; };
  }, [studentId]);

  useEffect(() => {
    let active = true;
    async function loadSchool() {
      const [topicsResult, skillsResult, mistakesResult] = await Promise.all([
        schoolApi.topics(subjectId, student?.grade ?? undefined),
        schoolApi.skills(),
        schoolApi.mistakeTypes(subjectId),
      ]);
      if (!active) return;
      setTopics(topicsResult);
      setSkills(skillsResult);
      setMistakes(mistakesResult);
    }
    if (subjectId) void loadSchool().catch(() => setError('Не удалось загрузить учебные справочники.'));
    return () => { active = false; };
  }, [subjectId, student?.grade]);

  const skillsByTopic = useMemo(() => {
    const map = new Map<number, Skill[]>();
    for (const skill of skills) map.set(skill.topicId, [...(map.get(skill.topicId) ?? []), skill]);
    return map;
  }, [skills]);

  function updateTopic(index: number, patch: Partial<TopicDraft>) {
    setTopicResults((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
  }

  function updateHomework(index: number, patch: Partial<HomeworkDraft>) {
    setHomeworks((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
  }

  function updateObservation(patch: Partial<ObservationDraft>) {
    setObservation((current) => ({ ...current, ...patch }));
  }

  async function submit() {
    const validResults = topicResults.filter((item) => item.topicId);
    if (!validResults.length) { setError('Добавьте хотя бы одну тему урока.'); return; }
    setSaving(true); setError(null);
    try {
      const payload = {
        student_id: studentId,
        subject_id: subjectId,
        lesson_date: lessonDate ? new Date(lessonDate).toISOString() : null,
        duration_minutes: duration ? Number(duration) : null,
        lesson_type: lessonType,
        status: 'done',
        general_comment: generalComment,
        next_lesson_plan: nextPlan,
        observation: {
          mood_state: observation.moodState,
          energy_state: observation.energyState,
          discipline_state: observation.disciplineState,
          respect_state: observation.respectState,
          conversation_state: observation.conversationState,
          argument_state: observation.argumentState,
          answer_state: observation.answerState,
          concentration_score: observation.concentrationScore,
          work_pace_score: observation.workPaceScore,
          attention_stability_score: observation.attentionStabilityScore,
          intellectual_interest: observation.intellectualInterest,
          reasoning: observation.reasoning,
          hypothesis_building: observation.hypothesisBuilding,
          inference_making: observation.inferenceMaking,
          task_independence_state: observation.taskIndependenceState,
          subject_attitude: observation.subjectAttitude,
          answer_argumentation_state: observation.answerArgumentationState,
          question_state: observation.questionState,
          extra_info_state: observation.extraInfoState,
          keyword_state: observation.keywordState,
          comment: observation.comment,
        },
        topic_results: validResults.map((item) => ({
          topic_id: Number(item.topicId),
          skill_id: item.skillId ? Number(item.skillId) : null,
          understanding_score: Number(item.understandingScore),
          independence_score: Number(item.independenceScore),
          attention_score: Number(item.attentionScore),
          total_tasks: item.totalTasks ? Number(item.totalTasks) : null,
          correct_tasks: item.correctTasks ? Number(item.correctTasks) : null,
          hint_count: item.hintCount ? Number(item.hintCount) : null,
          needs_repeat: item.needsRepeat,
          comment: item.comment,
          mistakes: item.mistakeIds.map((mistakeId) => ({ mistake_type_id: mistakeId, count: 1, severity: 'medium' as const, comment: '' })),
        })),
        homeworks: homeworks.filter((item) => item.text.trim()).map((item) => ({
          student_id: studentId,
          subject_id: subjectId,
          topic_id: item.topicId ? Number(item.topicId) : null,
          skill_id: item.skillId ? Number(item.skillId) : null,
          text: item.text,
          status: 'assigned',
          due_date: item.dueDate || null,
        })),
      };
      const lesson = await lessonsApi.createFull(payload);
      router.push(`/lessons/${lesson.id}`);
    } catch {
      setError('Не удалось сохранить урок. Проверьте, что количество верных заданий не больше общего количества.');
    } finally { setSaving(false); }
  }

  return (
    <main className="min-h-screen bg-[#f5f4f0] px-4 py-5 text-[#1a1a18] sm:px-6">
      <div className="mx-auto max-w-5xl space-y-5">
        <Link href={`/students/${studentId}`} className="text-[13px] text-[#73726c]">← К карточке ученика</Link>
        <section className="rounded-[10px] border border-[#e0ddd6] bg-white p-5 shadow-sm">
          <h1 className="text-[24px] font-semibold">Новый урок{student ? `: ${student.name}` : ''}</h1>
          {error ? <div className="mt-4 rounded-[8px] border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-800">{error}</div> : null}
          <div className="mt-5 grid gap-4 sm:grid-cols-4">
            <Field label="Дата"><input className="input" type="datetime-local" value={lessonDate} onChange={(e) => setLessonDate(e.target.value)} /></Field>
            <Field label="Длительность"><input className="input" type="number" value={duration} onChange={(e) => setDuration(e.target.value)} /></Field>
            <Field label="Предмет"><select className="input" value={subjectId} onChange={(e) => setSubjectId(Number(e.target.value))}>{subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}</select></Field>
            <Field label="Тип урока"><select className="input" value={lessonType} onChange={(e) => setLessonType(e.target.value)}><option value="new_topic">Новая тема</option><option value="practice">Закрепление</option><option value="review">Повторение</option><option value="mistake_review">Разбор ошибок</option><option value="test">Контрольная</option><option value="exam_preparation">Подготовка</option></select></Field>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Комментарий к уроку"><textarea className="textarea" value={generalComment} onChange={(e) => setGeneralComment(e.target.value)} /></Field>
            <Field label="План следующего урока"><textarea className="textarea" value={nextPlan} onChange={(e) => setNextPlan(e.target.value)} /></Field>
          </div>
        </section>

        <section className="rounded-[10px] border border-[#e0ddd6] bg-white p-5 shadow-sm">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.5px] text-[#73726c]">Наблюдение за учеником</p>
            <h2 className="mt-1 text-[18px] font-semibold">Эмоции, поведение, внимание и самостоятельность</h2>
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <ObservationBlock title="Эмоциональная сфера">
              <SwitchGroup label="Настроение" value={observation.moodState} onChange={(value) => updateObservation({ moodState: value })} options={[
                ['stable', 'Занятие прошло ровно'], ['mood_change', 'Смена настроения'], ['emotional_outburst', 'Эмоциональная вспышка'],
              ]} />
              <SwitchGroup label="Состояние" value={observation.energyState} onChange={(value) => updateObservation({ energyState: value })} options={[
                ['active', 'Ребенок бодр'], ['tired', 'Ребенок устал'],
              ]} />
            </ObservationBlock>

            <ObservationBlock title="Поведение на занятии">
              <SwitchGroup label="Дисциплина" value={observation.disciplineState} onChange={(value) => updateObservation({ disciplineState: value })} options={[
                ['healthy_discipline', 'Соблюдает здоровую дисциплину'], ['discipline_issues', 'Не соблюдает дисциплину'],
              ]} />
              <SwitchGroup label="Коммуникация" value={observation.respectState} onChange={(value) => updateObservation({ respectState: value })} options={[
                ['respectful', 'Вежлив'], ['disrespect_signs', 'Признаки неуважения'],
              ]} />
              <SwitchGroup label="Комментарии" value={observation.conversationState} onChange={(value) => updateObservation({ conversationState: value })} options={[
                ['comments_answers', 'Работает, комментируя ответы'], ['distracted_talks', 'Отвлекается на разговоры'],
              ]} />
              <SwitchGroup label="Спор" value={observation.argumentState} onChange={(value) => updateObservation({ argumentState: value })} options={[
                ['constructive_argument', 'Спорит по делу'], ['distraction_argument', 'Спорит, чтобы отвлечь внимание'],
              ]} />
              <SwitchGroup label="Ответы" value={observation.answerState} onChange={(value) => updateObservation({ answerState: value })} options={[
                ['answers_immediately', 'Отвечает сразу'], ['avoids_answer', 'Заговаривает зубы'], ['does_not_answer', 'Не отвечает'],
              ]} />
            </ObservationBlock>
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <ObservationBlock title="Работоспособность и внимание: шкала 1–10">
              <Scale10 label="Концентрация" value={observation.concentrationScore} onChange={(value) => updateObservation({ concentrationScore: value })} />
              <Scale10 label="Темп выполнения заданий" value={observation.workPaceScore} onChange={(value) => updateObservation({ workPaceScore: value })} />
              <Scale10 label="Удержание внимания" value={observation.attentionStabilityScore} onChange={(value) => updateObservation({ attentionStabilityScore: value })} />
            </ObservationBlock>

            <ObservationBlock title="Интеллектуальный труд: чеклист">
              <Check label="Проявлял интерес" checked={observation.intellectualInterest} onChange={(value) => updateObservation({ intellectualInterest: value })} />
              <Check label="Рассуждает" checked={observation.reasoning} onChange={(value) => updateObservation({ reasoning: value })} />
              <Check label="Строит предположения" checked={observation.hypothesisBuilding} onChange={(value) => updateObservation({ hypothesisBuilding: value })} />
              <Check label="Делает умозаключения" checked={observation.inferenceMaking} onChange={(value) => updateObservation({ inferenceMaking: value })} />
            </ObservationBlock>
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <ObservationBlock title="Самостоятельность в обучении">
              <SwitchGroup label="Выполнение заданий" value={observation.taskIndependenceState} onChange={(value) => updateObservation({ taskIndependenceState: value })} options={[
                ['independent', 'Без помощи'], ['with_help', 'С помощью'], ['not_done', 'Не выполняет'],
              ]} />
              <SwitchGroup label="Отношение к предмету" value={observation.subjectAttitude} onChange={(value) => updateObservation({ subjectAttitude: value })} options={[
                ['likes', 'Нравится'], ['neutral', 'Нейтрально'], ['dislikes', 'Не нравится'],
              ]} />
              <SwitchGroup label="Аргументация ответа" value={observation.answerArgumentationState} onChange={(value) => updateObservation({ answerArgumentationState: value })} options={[
                ['can_argue', 'Способен аргументировать'], ['cannot_argue', 'Не аргументирует'],
              ]} />
              <SwitchGroup label="Вопросы" value={observation.questionState} onChange={(value) => updateObservation({ questionState: value })} options={[
                ['asks_questions', 'Задает вопросы'], ['does_not_ask_questions', 'Не задает вопросы'],
              ]} />
              <SwitchGroup label="Дополнительная информация" value={observation.extraInfoState} onChange={(value) => updateObservation({ extraInfoState: value })} options={[
                ['searches_extra_info', 'Ищет в других источниках'], ['does_not_search_extra_info', 'Не ищет'],
              ]} />
              <SwitchGroup label="Ключевые слова" value={observation.keywordState} onChange={(value) => updateObservation({ keywordState: value })} options={[
                ['highlights_keywords', 'Выделяет ключевые слова'], ['does_not_highlight_keywords', 'Не выделяет'],
              ]} />
            </ObservationBlock>
            <Field label="Комментарий к наблюдению"><textarea className="textarea min-h-[180px]" value={observation.comment} onChange={(e) => updateObservation({ comment: e.target.value })} /></Field>
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between"><h2 className="text-[18px] font-semibold">Темы урока</h2><button type="button" onClick={() => setTopicResults([...topicResults, defaultTopicDraft()])} className="inline-flex h-9 items-center gap-2 rounded-[8px] bg-white px-3 text-[12px] font-medium shadow-sm"><Plus className="h-4 w-4" /> Добавить тему</button></div>
          {topicResults.map((item, index) => {
            const topicSkills = item.topicId ? skillsByTopic.get(Number(item.topicId)) ?? [] : [];
            return <div key={index} className="rounded-[10px] border border-[#e0ddd6] bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between"><div className="font-medium">Тема #{index + 1}</div>{topicResults.length > 1 ? <button type="button" onClick={() => setTopicResults(topicResults.filter((_, itemIndex) => itemIndex !== index))} className="text-[#a33]"><Trash2 className="h-4 w-4" /></button> : null}</div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Тема"><select className="input" value={item.topicId} onChange={(e) => updateTopic(index, { topicId: e.target.value, skillId: '' })}><option value="">Выберите тему</option>{topics.map((topic) => <option key={topic.id} value={topic.id}>{catalogueTopicLabel(topic)}</option>)}</select></Field>
                <Field label="Навык"><select className="input" value={item.skillId} onChange={(e) => updateTopic(index, { skillId: e.target.value })}><option value="">Без навыка</option>{topicSkills.map((skill) => <option key={skill.id} value={skill.id}>{catalogueItemLabel(skill)}</option>)}</select></Field>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-3"><Score label="Понимание" value={item.understandingScore} onChange={(value) => updateTopic(index, { understandingScore: value })} /><Score label="Самостоятельность" value={item.independenceScore} onChange={(value) => updateTopic(index, { independenceScore: value })} /><Score label="Внимательность" value={item.attentionScore} onChange={(value) => updateTopic(index, { attentionScore: value })} /></div>
              <div className="mt-4 grid gap-4 sm:grid-cols-3"><Field label="Всего заданий"><input className="input" type="number" value={item.totalTasks} onChange={(e) => updateTopic(index, { totalTasks: e.target.value })} /></Field><Field label="Верно"><input className="input" type="number" value={item.correctTasks} onChange={(e) => updateTopic(index, { correctTasks: e.target.value })} /></Field><Field label="Подсказок"><input className="input" type="number" value={item.hintCount} onChange={(e) => updateTopic(index, { hintCount: e.target.value })} /></Field></div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2"><div><div className="mb-2 text-[12px] font-medium text-[#73726c]">Ошибки</div><div className="flex flex-wrap gap-2">{mistakes.map((mistake) => <button type="button" key={mistake.id} onClick={() => updateTopic(index, { mistakeIds: item.mistakeIds.includes(mistake.id) ? item.mistakeIds.filter((id) => id !== mistake.id) : [...item.mistakeIds, mistake.id] })} className={`rounded-full border px-3 py-1 text-[12px] ${item.mistakeIds.includes(mistake.id) ? 'border-[#1a1a18] bg-[#1a1a18] text-white' : 'border-[#d8d4ca] bg-white'}`}>{catalogueItemLabel(mistake)}</button>)}</div></div><Field label="Комментарий по теме"><textarea className="textarea" value={item.comment} onChange={(e) => updateTopic(index, { comment: e.target.value })} /></Field></div>
              <label className="mt-4 flex items-center gap-2 text-[13px]"><input type="checkbox" checked={item.needsRepeat} onChange={(e) => updateTopic(index, { needsRepeat: e.target.checked })} /> Нужно повторить</label>
            </div>;
          })}
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between"><h2 className="text-[18px] font-semibold">Домашнее задание</h2><button type="button" onClick={() => setHomeworks([...homeworks, { text: '', topicId: '', skillId: '', dueDate: '' }])} className="inline-flex h-9 items-center gap-2 rounded-[8px] bg-white px-3 text-[12px] font-medium shadow-sm"><Plus className="h-4 w-4" /> Добавить</button></div>
          {homeworks.map((item, index) => <div key={index} className="rounded-[10px] border border-[#e0ddd6] bg-white p-5 shadow-sm"><div className="grid gap-4 sm:grid-cols-[1fr_180px]"><Field label="Текст"><textarea className="textarea" value={item.text} onChange={(e) => updateHomework(index, { text: e.target.value })} /></Field><Field label="Срок"><input className="input" type="date" value={item.dueDate} onChange={(e) => updateHomework(index, { dueDate: e.target.value })} /></Field></div></div>)}
        </section>

        <button onClick={() => void submit()} disabled={saving} className="h-11 rounded-[8px] bg-[#1a1a18] px-6 text-[13px] font-medium text-white disabled:opacity-50">Сохранить урок</button>
      </div>
      <style jsx>{`.input{height:40px;width:100%;border:1px solid #d8d4ca;border-radius:8px;padding:0 12px;font-size:14px}.textarea{min-height:86px;width:100%;border:1px solid #d8d4ca;border-radius:8px;padding:10px 12px;font-size:14px}`}</style>
    </main>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) { return <label className="block"><span className="mb-1 block text-[12px] font-medium text-[#73726c]">{label}</span>{children}</label>; }
function ObservationBlock({ title, children }: { title: string; children: ReactNode }) { return <div className="rounded-[8px] border border-[#ece8df] bg-[#faf9f6] p-4"><h3 className="mb-3 text-[14px] font-semibold">{title}</h3><div className="space-y-3">{children}</div></div>; }
function Score({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) { return <Field label={`${label}: ${value}`}><input className="w-full" type="range" min="0" max="100" step="5" value={value} onChange={(e) => onChange(Number(e.target.value))} /></Field>; }
function Scale10({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) { return <Field label={`${label}: ${value}/10`}><input className="w-full" type="range" min="1" max="10" step="1" value={value} onChange={(e) => onChange(Number(e.target.value))} /></Field>; }
function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) { return <label className="flex items-center gap-2 text-[13px]"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} /><span>{label}</span></label>; }
function SwitchGroup<TValue extends string>({ label, value, options, onChange }: { label: string; value: TValue; options: Array<[TValue, string]>; onChange: (value: TValue) => void }) {
  return <div><div className="mb-2 text-[12px] font-medium text-[#73726c]">{label}</div><div className="flex flex-wrap gap-2">{options.map(([optionValue, optionLabel]) => <button key={optionValue} type="button" onClick={() => onChange(optionValue)} className={`rounded-full border px-3 py-1 text-[12px] ${value === optionValue ? 'border-[#1a1a18] bg-[#1a1a18] text-white' : 'border-[#d8d4ca] bg-white'}`}>{optionLabel}</button>)}</div></div>;
}
function catalogueScopeLabel(item: { isSystem?: boolean }) {
  return item.isSystem === false ? 'личное' : 'системное';
}
function catalogueItemLabel(item: { name: string; isSystem?: boolean }) {
  return `${item.name} · ${catalogueScopeLabel(item)}`;
}
function catalogueTopicLabel(topic: Topic) {
  const grade = topic.grade ? `${topic.grade} кл. · ` : '';
  return `${grade}${catalogueItemLabel(topic)}`;
}
