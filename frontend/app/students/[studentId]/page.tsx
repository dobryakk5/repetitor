'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AlertTriangle, BookOpen, CheckCircle2, ClipboardList, FileText, Plus, TrendingUp } from 'lucide-react';
import { analyticsApi } from '@/lib/api/analytics';
import { lessonsApi } from '@/lib/api/lessons';
import { reportsApi } from '@/lib/api/reports';
import { schoolApi } from '@/lib/api/school';
import { studentsApi } from '@/lib/api/students';
import type { AnalyticsOverview, AnalyticsSummary, Homework, Lesson, Recommendation, Report, SkillState, Student, Subject, Topic } from '@/lib/types';

const PANEL_CLASS = 'rounded-[10px] border border-[#e0ddd6] bg-white shadow-sm';

export default function StudentPage() {
  const params = useParams<{ studentId: string }>();
  const router = useRouter();
  const studentId = Number(params.studentId);
  const [student, setStudent] = useState<Student | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [skillStates, setSkillStates] = useState<SkillState[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [creatingPeriodReport, setCreatingPeriodReport] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true); setError(null);
      const [
        studentResult,
        lessonsResult,
        homeworksResult,
        subjectsResult,
        topicsResult,
        overviewResult,
        summaryResult,
        skillStatesResult,
        recommendationsResult,
        reportsResult,
      ] = await Promise.allSettled([
        studentsApi.get(studentId),
        lessonsApi.list(studentId),
        lessonsApi.homeworks(studentId),
        schoolApi.subjects(),
        schoolApi.topics(1),
        analyticsApi.overview(studentId),
        analyticsApi.summary(studentId),
        analyticsApi.topics(studentId),
        analyticsApi.recommendations(studentId),
        reportsApi.listByStudent(studentId),
      ]);
      if (!active) return;
      if (studentResult.status === 'fulfilled') setStudent(studentResult.value);
      if (lessonsResult.status === 'fulfilled') setLessons(lessonsResult.value);
      if (homeworksResult.status === 'fulfilled') setHomeworks(homeworksResult.value);
      if (subjectsResult.status === 'fulfilled') setSubjects(subjectsResult.value);
      if (topicsResult.status === 'fulfilled') setTopics(topicsResult.value);
      if (overviewResult.status === 'fulfilled') setOverview(overviewResult.value);
      if (summaryResult.status === 'fulfilled') setSummary(summaryResult.value);
      if (skillStatesResult.status === 'fulfilled') setSkillStates(skillStatesResult.value);
      if (recommendationsResult.status === 'fulfilled') setRecommendations(recommendationsResult.value);
      if (reportsResult.status === 'fulfilled') setReports(reportsResult.value);
      if (studentResult.status === 'rejected') setError('Не удалось загрузить ученика.');
      setLoading(false);
    }
    if (Number.isFinite(studentId)) void load();
    return () => { active = false; };
  }, [studentId]);

  const effectiveOverview = summary?.overview ?? overview;
  const subjectById = useMemo(() => new Map(subjects.map((item) => [item.id, item.name])), [subjects]);
  const topicById = useMemo(() => new Map(topics.map((item) => [item.id, item.name])), [topics]);


  async function createMonthlyReport() {
    setCreatingPeriodReport(true);
    setReportError(null);
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const to = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
    try {
      const report = await reportsApi.createPeriodReport(studentId, from, to);
      router.push(`/reports/${report.id}`);
    } catch {
      setReportError('Не удалось сформировать отчет за период.');
      setCreatingPeriodReport(false);
    }
  }

  if (loading) return <main className="p-6 text-[14px] text-[#73726c]">Загрузка...</main>;
  if (error || !student) return <main className="p-6 text-[14px] text-[#8a4b00]">{error || 'Ученик не найден.'}</main>;

  return (
    <main className="min-h-screen bg-[#f5f4f0] px-4 py-5 text-[#1a1a18] sm:px-6">
      <div className="mx-auto max-w-6xl space-y-5">
        <div className="flex items-center justify-between gap-3">
          <Link href="/students" className="text-[13px] text-[#73726c]">← К ученикам</Link>
          <Link href={`/students/${student.id}/lessons/new`} className="inline-flex h-10 items-center gap-2 rounded-[8px] bg-[#1a1a18] px-4 text-[13px] font-medium text-white"><Plus className="h-4 w-4" /> Новый урок</Link>
        </div>

        <section className={`${PANEL_CLASS} p-5`}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#e1f5ee] text-[16px] font-semibold text-[#0f6e56]">{student.initials}</div>
              <div>
                <h1 className="text-[26px] font-semibold">{student.name}</h1>
                <div className="mt-1 text-[13px] text-[#73726c]">{student.grade ? `${student.grade} класс` : 'Класс не указан'}{student.parentContact ? ` · ${student.parentContact}` : ''}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[12px]">
              <Badge icon={<BookOpen className="h-4 w-4" />} label="Уроков" value={lessons.length} />
              <Badge icon={<ClipboardList className="h-4 w-4" />} label="Домашек" value={homeworks.length} />
              <Badge icon={<TrendingUp className="h-4 w-4" />} label="Прогресс" value={summary?.overallProgress ?? effectiveOverview?.averageProgressScore ?? 0} />
              <Badge icon={<AlertTriangle className="h-4 w-4" />} label="Рекомендаций" value={effectiveOverview?.activeRecommendationsCount ?? 0} />
            </div>
          </div>
          {student.learningGoal ? <div className="mt-5 rounded-[8px] bg-[#f5f4f0] p-4 text-[13px]"><b>Цель:</b> {student.learningGoal}</div> : null}
          {student.startLevel ? <div className="mt-3 rounded-[8px] bg-[#f5f4f0] p-4 text-[13px]"><b>Стартовый уровень:</b> {student.startLevel}</div> : null}
        </section>

        <section className={`${PANEL_CLASS} overflow-hidden`}>
          <div className="border-b border-[#ece8df] px-5 py-4">
            <h2 className="text-[16px] font-semibold">Учебная сводка</h2>
          </div>
          {summary ? (
            <div className="grid gap-0 divide-y divide-[#ece8df] lg:grid-cols-[0.8fr_1fr_1fr_1fr] lg:divide-x lg:divide-y-0">
              <div className="p-5">
                <div className="text-[12px] text-[#73726c]">Общий прогресс</div>
                <div className="mt-2 text-[32px] font-semibold">{summary.overallProgress ?? 0} / 100</div>
                <div className="mt-1 text-[12px] text-[#73726c]">Динамика за месяц: {formatDelta(summary.monthlyDelta)}</div>
              </div>
              <SummaryList
                title="Сильные темы"
                empty="Пока нет тем выше порога."
                items={summary.strongTopics.map((item) => `${item.topicName}${item.skillName ? ` · ${item.skillName}` : ''} — ${item.progressScore}%`)}
                icon={<CheckCircle2 className="h-4 w-4" />}
              />
              <SummaryList
                title="Требуют внимания"
                empty="Критичных тем пока нет."
                items={summary.weakTopics.map((item) => `${item.topicName}${item.skillName ? ` · ${item.skillName}` : ''} — ${item.progressScore}%, риск: ${riskLabel(item.riskLevel)}`)}
                icon={<AlertTriangle className="h-4 w-4" />}
              />
              <SummaryList
                title="Повторяющиеся ошибки"
                empty="Повторяющихся ошибок пока нет."
                items={summary.repeatedMistakes.map((item) => `${item.mistakeName} · ${item.count} раз, ${item.lessonsCount} урок.`)}
                icon={<ClipboardList className="h-4 w-4" />}
              />
            </div>
          ) : (
            <div className="px-5 py-6 text-[13px] text-[#73726c]">Сводка появится после сохранения урока с темами.</div>
          )}
        </section>

        <section className="grid gap-5 lg:grid-cols-[1fr_1fr]">
          <div className={`${PANEL_CLASS} overflow-hidden`}>
            <div className="border-b border-[#ece8df] px-5 py-4"><h2 className="text-[16px] font-semibold">Состояние тем</h2></div>
            {skillStates.length ? <div className="divide-y divide-[#ece8df]">
              {skillStates.slice(0, 5).map((state) => (
                <div key={state.id} className="px-5 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-[13px] font-medium">{topicById.get(state.topicId) || `Тема #${state.topicId}`}</div>
                    <div className="text-[13px] font-semibold">{state.currentProgressScore}%</div>
                  </div>
                  <div className="mt-1 text-[12px] text-[#73726c]">Риск: {riskLabel(state.riskLevel)} · статус: {state.masteryStatus}</div>
                </div>
              ))}
            </div> : <div className="px-5 py-6 text-[13px] text-[#73726c]">Аналитика появится после сохранения урока с темами.</div>}
          </div>

          <div className={`${PANEL_CLASS} overflow-hidden`}>
            <div className="border-b border-[#ece8df] px-5 py-4"><h2 className="text-[16px] font-semibold">Рекомендации</h2></div>
            {recommendations.length ? <div className="divide-y divide-[#ece8df]">
              {recommendations.slice(0, 5).map((recommendation) => (
                <div key={recommendation.id} className="px-5 py-4">
                  <div className="text-[13px] font-medium">{recommendation.text}</div>
                  <div className="mt-1 text-[12px] text-[#73726c]">Приоритет: {riskLabel(recommendation.priority)}</div>
                </div>
              ))}
            </div> : <div className="px-5 py-6 text-[13px] text-[#73726c]">Активных рекомендаций нет.</div>}
          </div>
        </section>


        <section className={`${PANEL_CLASS} overflow-hidden`}>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#ece8df] px-5 py-4">
            <h2 className="text-[16px] font-semibold">Отчеты</h2>
            <button onClick={createMonthlyReport} disabled={creatingPeriodReport} className="inline-flex h-9 items-center gap-2 rounded-[8px] border border-[#d8d4ca] bg-white px-3 text-[13px] font-medium disabled:opacity-60"><FileText className="h-4 w-4" /> {creatingPeriodReport ? 'Формирование...' : 'Отчет за месяц'}</button>
          </div>
          {reportError ? <div className="border-b border-[#ece8df] bg-red-50 px-5 py-3 text-[13px] text-red-800">{reportError}</div> : null}
          {reports.length ? <div className="divide-y divide-[#ece8df]">
            {reports.slice(0, 5).map((report) => (
              <Link href={`/reports/${report.id}`} key={report.id} className="block px-5 py-4 transition hover:bg-[#faf9f6]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-[14px] font-medium">{report.title}</div>
                    <div className="mt-1 text-[12px] text-[#73726c]">{reportTypeLabel(report.reportType)}{report.createdAt ? ` · ${formatDate(report.createdAt)}` : ''}</div>
                  </div>
                  <div className="text-[12px] text-[#73726c]">Открыть</div>
                </div>
              </Link>
            ))}
          </div> : <div className="px-5 py-6 text-[13px] text-[#73726c]">Отчетов пока нет. Сформировать отчет можно из урока или кнопкой выше за текущий месяц.</div>}
        </section>

        <section className="grid gap-5 lg:grid-cols-[1.4fr_0.8fr]">
          <div className={`${PANEL_CLASS} overflow-hidden`}>
            <div className="border-b border-[#ece8df] px-5 py-4"><h2 className="text-[16px] font-semibold">История уроков</h2></div>
            {lessons.length ? <div className="divide-y divide-[#ece8df]">
              {lessons.map((lesson) => (
                <Link href={`/lessons/${lesson.id}`} key={lesson.id} className="block px-5 py-4 transition hover:bg-[#faf9f6]">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-[14px] font-medium">{formatDate(lesson.lessonDate)}</div>
                      <div className="mt-1 text-[12px] text-[#73726c]">{subjectById.get(lesson.subjectId) || `Предмет #${lesson.subjectId}`} · {lesson.lessonType}</div>
                      {lesson.generalComment ? <p className="mt-2 line-clamp-2 text-[12px] text-[#73726c]">{lesson.generalComment}</p> : null}
                    </div>
                    <div className="text-right text-[12px] text-[#73726c]">{lesson.durationMinutes ? `${lesson.durationMinutes} мин` : ''}</div>
                  </div>
                </Link>
              ))}
            </div> : <div className="px-5 py-6 text-[13px] text-[#73726c]">Уроков пока нет.</div>}
          </div>

          <div className={`${PANEL_CLASS} overflow-hidden`}>
            <div className="border-b border-[#ece8df] px-5 py-4"><h2 className="text-[16px] font-semibold">Домашние задания</h2></div>
            {homeworks.length ? <div className="divide-y divide-[#ece8df]">
              {homeworks.map((homework) => (
                <div key={homework.id} className="px-5 py-4">
                  <div className="text-[13px] font-medium">{homework.text}</div>
                  <div className="mt-1 text-[12px] text-[#73726c]">{homework.topicId ? topicById.get(homework.topicId) || `Тема #${homework.topicId}` : 'Без темы'} · {homework.status}{homework.dueDate ? ` · до ${homework.dueDate}` : ''}</div>
                </div>
              ))}
            </div> : <div className="px-5 py-6 text-[13px] text-[#73726c]">Активной домашки нет.</div>}
          </div>
        </section>
      </div>
    </main>
  );
}

function Badge({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
  return <div className="rounded-[8px] bg-[#f5f4f0] px-3 py-2"><div className="flex items-center gap-2 text-[#73726c]">{icon}<span>{label}</span></div><div className="mt-1 text-[18px] font-semibold">{value}</div></div>;
}

function SummaryList({ title, items, empty, icon }: { title: string; items: string[]; empty: string; icon: ReactNode }) {
  return (
    <div className="p-5">
      <div className="flex items-center gap-2 text-[13px] font-semibold">{icon}{title}</div>
      {items.length ? (
        <ul className="mt-3 space-y-2 text-[13px] text-[#34342f]">
          {items.slice(0, 5).map((item) => <li key={item}>- {item}</li>)}
        </ul>
      ) : <div className="mt-3 text-[12px] text-[#73726c]">{empty}</div>}
    </div>
  );
}


function reportTypeLabel(value: string) {
  if (value === 'lesson_report') return 'отчет по уроку';
  if (value === 'period_report') return 'отчет за период';
  if (value === 'topic_report') return 'отчет по теме';
  return value;
}

function formatDate(value: string | null) {
  if (!value) return 'Дата не указана';
  return new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}

function formatDelta(value: number | null) {
  if (value === null) return 'недостаточно данных';
  if (value > 0) return `+${value}`;
  return String(value);
}

function riskLabel(value: string) {
  if (value === 'high') return 'высокий';
  if (value === 'medium') return 'средний';
  if (value === 'low') return 'низкий';
  return value;
}
