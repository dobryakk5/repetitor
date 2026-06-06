'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { lessonsApi } from '@/lib/api/lessons';
import { reportsApi } from '@/lib/api/reports';
import { schoolApi } from '@/lib/api/school';
import { studentsApi } from '@/lib/api/students';
import type { Lesson, MistakeType, Skill, Student, Subject, Topic } from '@/lib/types';

const PANEL_CLASS = 'rounded-[10px] border border-[#e0ddd6] bg-white shadow-sm';

export default function LessonPage() {
  const params = useParams<{ lessonId: string }>();
  const router = useRouter();
  const lessonId = Number(params.lessonId);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [mistakes, setMistakes] = useState<MistakeType[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      const lessonResult = await lessonsApi.get(lessonId);
      const [studentResult, subjectsResult, topicsResult, skillsResult, mistakesResult] = await Promise.all([
        studentsApi.get(lessonResult.studentId),
        schoolApi.subjects(),
        schoolApi.topics(lessonResult.subjectId),
        schoolApi.skills(),
        schoolApi.mistakeTypes(lessonResult.subjectId),
      ]);
      if (!active) return;
      setLesson(lessonResult); setStudent(studentResult); setSubjects(subjectsResult); setTopics(topicsResult); setSkills(skillsResult); setMistakes(mistakesResult); setLoading(false);
    }
    if (Number.isFinite(lessonId)) void load().catch(() => setLoading(false));
    return () => { active = false; };
  }, [lessonId]);

  const subjectById = useMemo(() => new Map(subjects.map((item) => [item.id, item.name])), [subjects]);
  const topicById = useMemo(() => new Map(topics.map((item) => [item.id, catalogueTopicLabel(item)])), [topics]);
  const skillById = useMemo(() => new Map(skills.map((item) => [item.id, catalogueItemLabel(item)])), [skills]);
  const mistakeById = useMemo(() => new Map(mistakes.map((item) => [item.id, catalogueItemLabel(item)])), [mistakes]);


  async function createLessonReport() {
    setGeneratingReport(true);
    setReportError(null);
    try {
      const report = await reportsApi.createLessonReport(lessonId);
      router.push(`/reports/${report.id}`);
    } catch {
      setReportError('Не удалось сформировать отчет.');
      setGeneratingReport(false);
    }
  }

  if (loading) return <main className="p-6 text-[14px] text-[#73726c]">Загрузка...</main>;
  if (!lesson) return <main className="p-6 text-[14px] text-[#8a4b00]">Урок не найден.</main>;

  return (
    <main className="min-h-screen bg-[#f5f4f0] px-4 py-5 text-[#1a1a18] sm:px-6">
      <div className="mx-auto max-w-5xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href={student ? `/students/${student.id}` : '/students'} className="text-[13px] text-[#73726c]">← К ученику</Link>
          <button onClick={createLessonReport} disabled={generatingReport} className="h-10 rounded-[8px] bg-[#1a1a18] px-4 text-[13px] font-medium text-white disabled:opacity-60">{generatingReport ? 'Формирование...' : 'Сформировать отчет'}</button>
        </div>
        {reportError ? <div className="rounded-[8px] bg-red-50 px-4 py-3 text-[13px] text-red-800">{reportError}</div> : null}
        <section className={`${PANEL_CLASS} p-5`}>
          <p className="text-[11px] font-medium uppercase tracking-[0.5px] text-[#73726c]">{subjectById.get(lesson.subjectId) || `Предмет #${lesson.subjectId}`}</p>
          <h1 className="mt-1 text-[26px] font-semibold">Урок от {formatDate(lesson.lessonDate)}</h1>
          <div className="mt-2 text-[13px] text-[#73726c]">{student?.name || `Ученик #${lesson.studentId}`} · {lesson.lessonType}{lesson.durationMinutes ? ` · ${lesson.durationMinutes} мин` : ''}</div>
          {lesson.generalComment ? <div className="mt-5 rounded-[8px] bg-[#f5f4f0] p-4 text-[13px]"><b>Комментарий:</b> {lesson.generalComment}</div> : null}
          {lesson.nextLessonPlan ? <div className="mt-3 rounded-[8px] bg-[#f5f4f0] p-4 text-[13px]"><b>План следующего урока:</b> {lesson.nextLessonPlan}</div> : null}
        </section>



        {lesson.observation ? <section className={`${PANEL_CLASS} p-5`}>
          <h2 className="text-[18px] font-semibold">Наблюдение за учеником</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <Metric label="Концентрация" value={`${lesson.observation.concentrationScore}/10`} />
            <Metric label="Темп" value={`${lesson.observation.workPaceScore}/10`} />
            <Metric label="Внимание" value={`${lesson.observation.attentionStabilityScore}/10`} />
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <ObservationGroup title="Эмоциональная сфера" items={[
              ['Настроение', observationLabel(lesson.observation.moodState)],
              ['Состояние', observationLabel(lesson.observation.energyState)],
            ]} />
            <ObservationGroup title="Поведение" items={[
              ['Дисциплина', observationLabel(lesson.observation.disciplineState)],
              ['Коммуникация', observationLabel(lesson.observation.respectState)],
              ['Комментарии', observationLabel(lesson.observation.conversationState)],
              ['Спор', observationLabel(lesson.observation.argumentState)],
              ['Ответы', observationLabel(lesson.observation.answerState)],
            ]} />
            <ObservationGroup title="Интеллектуальный труд" items={[
              ['Интерес', lesson.observation.intellectualInterest ? 'да' : 'нет'],
              ['Рассуждает', lesson.observation.reasoning ? 'да' : 'нет'],
              ['Строит предположения', lesson.observation.hypothesisBuilding ? 'да' : 'нет'],
              ['Делает умозаключения', lesson.observation.inferenceMaking ? 'да' : 'нет'],
            ]} />
            <ObservationGroup title="Самостоятельность" items={[
              ['Задания', observationLabel(lesson.observation.taskIndependenceState)],
              ['Отношение к предмету', observationLabel(lesson.observation.subjectAttitude)],
              ['Аргументация', observationLabel(lesson.observation.answerArgumentationState)],
              ['Вопросы', observationLabel(lesson.observation.questionState)],
              ['Доп. информация', observationLabel(lesson.observation.extraInfoState)],
              ['Ключевые слова', observationLabel(lesson.observation.keywordState)],
            ]} />
          </div>
          {lesson.observation.comment ? <p className="mt-4 rounded-[8px] bg-[#f5f4f0] p-4 text-[13px] text-[#4b4a45]">{lesson.observation.comment}</p> : null}
        </section> : null}

        <section className="space-y-3">
          <h2 className="text-[18px] font-semibold">Темы и результаты</h2>
          {lesson.topicResults?.length ? lesson.topicResults.map((result) => (
            <div key={result.id} className={`${PANEL_CLASS} p-5`}>
              <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="text-[16px] font-semibold">{topicById.get(result.topicId) || `Тема #${result.topicId}`}</div>
                  <div className="mt-1 text-[12px] text-[#73726c]">{result.skillId ? skillById.get(result.skillId) || `Навык #${result.skillId}` : 'Без конкретного навыка'} · статус: {result.masteryStatus}</div>
                </div>
                {result.needsRepeat ? <span className="w-max rounded-full bg-amber-100 px-3 py-1 text-[12px] text-amber-800">нужно повторить</span> : null}
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-4">
                <Metric label="Понимание" value={result.understandingScore} />
                <Metric label="Точность" value={result.accuracyPercent ?? '—'} />
                <Metric label="Самостоятельность" value={result.independenceScore} />
                <Metric label="Внимательность" value={result.attentionScore} />
              </div>
              <div className="mt-3 text-[12px] text-[#73726c]">Заданий: {result.totalTasks ?? '—'} · верно: {result.correctTasks ?? '—'} · подсказок: {result.hintCount ?? '—'}</div>
              {result.mistakes?.length ? <div className="mt-4 flex flex-wrap gap-2">{result.mistakes.map((mistake) => <span key={mistake.id} className="rounded-full border border-[#d8d4ca] px-3 py-1 text-[12px]">{mistakeById.get(mistake.mistakeTypeId) || `Ошибка #${mistake.mistakeTypeId}`} · {mistake.severity}</span>)}</div> : null}
              {result.comment ? <p className="mt-4 text-[13px] text-[#4b4a45]">{result.comment}</p> : null}
            </div>
          )) : <div className={`${PANEL_CLASS} p-5 text-[13px] text-[#73726c]`}>Темы не добавлены.</div>}
        </section>

        <section className={`${PANEL_CLASS} overflow-hidden`}>
          <div className="border-b border-[#ece8df] px-5 py-4"><h2 className="text-[18px] font-semibold">Домашнее задание</h2></div>
          {lesson.homeworks?.length ? <div className="divide-y divide-[#ece8df]">{lesson.homeworks.map((homework) => <div key={homework.id} className="px-5 py-4"><div className="text-[14px] font-medium">{homework.text}</div><div className="mt-1 text-[12px] text-[#73726c]">{homework.status}{homework.dueDate ? ` · до ${homework.dueDate}` : ''}</div></div>)}</div> : <div className="px-5 py-6 text-[13px] text-[#73726c]">Домашка не задана.</div>}
        </section>
      </div>
    </main>
  );
}


function ObservationGroup({ title, items }: { title: string; items: Array<[string, string]> }) {
  return <div className="rounded-[8px] bg-[#f5f4f0] p-4"><div className="text-[13px] font-semibold">{title}</div><div className="mt-3 space-y-2">{items.map(([label, value]) => <div key={label} className="flex gap-2 text-[12px]"><span className="min-w-[140px] text-[#73726c]">{label}</span><span className="font-medium text-[#1a1a18]">{value}</span></div>)}</div></div>;
}

const OBSERVATION_LABELS: Record<string, string> = {
  stable: 'занятие прошло ровно',
  mood_change: 'смена настроения',
  emotional_outburst: 'эмоциональная вспышка',
  active: 'ребенок бодр',
  tired: 'ребенок устал',
  healthy_discipline: 'здоровая дисциплина',
  discipline_issues: 'нарушает дисциплину',
  respectful: 'вежлив',
  disrespect_signs: 'признаки неуважения',
  comments_answers: 'комментирует ответы',
  distracted_talks: 'отвлекается на разговоры',
  constructive_argument: 'спорит по делу',
  distraction_argument: 'спорит, чтобы отвлечь внимание',
  answers_immediately: 'отвечает сразу',
  avoids_answer: 'заговаривает зубы',
  does_not_answer: 'не отвечает',
  independent: 'без помощи',
  with_help: 'с помощью',
  not_done: 'не выполняет',
  likes: 'нравится',
  neutral: 'нейтрально',
  dislikes: 'не нравится',
  can_argue: 'аргументирует ответ',
  cannot_argue: 'не аргументирует',
  asks_questions: 'задает вопросы',
  does_not_ask_questions: 'не задает вопросы',
  searches_extra_info: 'ищет в других источниках',
  does_not_search_extra_info: 'не ищет',
  highlights_keywords: 'выделяет ключевые слова',
  does_not_highlight_keywords: 'не выделяет',
};

function observationLabel(value: string) {
  return OBSERVATION_LABELS[value] ?? value;
}

function Metric({ label, value }: { label: string; value: string | number }) { return <div className="rounded-[8px] bg-[#f5f4f0] px-3 py-2"><div className="text-[11px] text-[#73726c]">{label}</div><div className="mt-1 text-[20px] font-semibold">{value}{typeof value === 'number' ? '%' : ''}</div></div>; }
function formatDate(value: string | null) { if (!value) return 'Дата не указана'; return new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value)); }
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
