'use client';

import type { ReactNode } from 'react';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, BookOpen, CheckCircle2, ClipboardList, FileText, TrendingUp } from 'lucide-react';
import { shareApi } from '@/lib/api/share';
import { masteryStatusLabel } from '@/lib/labels';
import type { PublicStudentProgress } from '@/lib/types';

const PANEL = 'rounded-[10px] border border-[#e0ddd6] bg-white shadow-sm';

export default function SharedProgressPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const [data, setData] = useState<PublicStudentProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const result = await shareApi.studentProgress(token);
        if (!active) return;
        setData(result);
      } catch {
        if (!active) return;
        setError('Ссылка недействительна или была заменена новой.');
      } finally {
        if (active) setLoading(false);
      }
    }
    if (token) void load();
    return () => { active = false; };
  }, [token]);

  const sortedStates = useMemo(() => {
    return [...(data?.skillStates ?? [])].sort((a, b) => riskRank(a.riskLevel) - riskRank(b.riskLevel) || a.currentProgressScore - b.currentProgressScore);
  }, [data?.skillStates]);

  if (loading) {
    return <main className="min-h-screen bg-[#f5f4f0] p-6 text-[14px] text-[#73726c]">Загрузка прогресса...</main>;
  }

  if (error || !data) {
    return (
      <main className="min-h-screen bg-[#f5f4f0] px-4 py-8 text-[#1a1a18] sm:px-6">
        <section className={`${PANEL} mx-auto max-w-xl p-6`}>
          <h1 className="text-[24px] font-semibold">Прогресс недоступен</h1>
          <p className="mt-3 text-[14px] leading-6 text-[#73726c]">{error || 'Не удалось открыть ссылку.'}</p>
        </section>
      </main>
    );
  }

  const { student, summary } = data;
  const overview = summary.overview;

  return (
    <main className="min-h-screen bg-[#f5f4f0] px-4 py-5 text-[#1a1a18] sm:px-6">
      <div className="mx-auto max-w-6xl space-y-5">
        <header className={`${PANEL} p-5`}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#e1f5ee] text-[16px] font-semibold text-[#0f6e56]">
                {student.initials}
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.5px] text-[#73726c]">Прогресс ученика</p>
                <h1 className="mt-1 text-[28px] font-semibold">{student.name}</h1>
                <p className="mt-1 text-[13px] text-[#73726c]">{student.grade ? `${student.grade} класс` : 'Класс не указан'}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[12px]">
              <Badge icon={<BookOpen className="h-4 w-4" />} label="Уроков" value={overview.lessonsCount} />
              <Badge icon={<ClipboardList className="h-4 w-4" />} label="Домашек" value={overview.activeHomeworksCount} />
              <Badge icon={<TrendingUp className="h-4 w-4" />} label="Прогресс" value={summary.overallProgress ?? 0} />
              <Badge icon={<AlertTriangle className="h-4 w-4" />} label="Рекомендаций" value={overview.activeRecommendationsCount} />
            </div>
          </div>
          {student.learningGoal ? <div className="mt-5 rounded-[8px] bg-[#f5f4f0] p-4 text-[13px]"><b>Цель:</b> {student.learningGoal}</div> : null}
        </header>

        <section className={`${PANEL} overflow-hidden`}>
          <div className="border-b border-[#ece8df] px-5 py-4">
            <h2 className="text-[16px] font-semibold">Учебная сводка</h2>
          </div>
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
        </section>

        <section className="grid gap-5 lg:grid-cols-[1fr_1fr]">
          <div className={`${PANEL} overflow-hidden`}>
            <div className="border-b border-[#ece8df] px-5 py-4"><h2 className="text-[16px] font-semibold">Состояние тем</h2></div>
            {sortedStates.length ? <div className="divide-y divide-[#ece8df]">
              {sortedStates.map((state) => (
                <div key={state.id} className="px-5 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-[13px] font-medium">{state.topicName}{state.skillName ? ` · ${state.skillName}` : ''}</div>
                    <div className="text-[13px] font-semibold">{state.currentProgressScore}%</div>
                  </div>
                  <div className="mt-1 text-[12px] text-[#73726c]">{state.subjectName} · риск: {riskLabel(state.riskLevel)} · статус: {masteryStatusLabel(state.masteryStatus)}</div>
                </div>
              ))}
            </div> : <div className="px-5 py-6 text-[13px] text-[#73726c]">Аналитика появится после уроков с темами.</div>}
          </div>

          <div className={`${PANEL} overflow-hidden`}>
            <div className="border-b border-[#ece8df] px-5 py-4"><h2 className="text-[16px] font-semibold">Рекомендации</h2></div>
            {data.recommendations.length ? <div className="divide-y divide-[#ece8df]">
              {data.recommendations.map((recommendation) => (
                <div key={recommendation.id} className="px-5 py-4">
                  <div className="text-[13px] font-medium">{recommendation.text}</div>
                  <div className="mt-1 text-[12px] text-[#73726c]">
                    {recommendation.topicName || 'Без темы'}{recommendation.skillName ? ` · ${recommendation.skillName}` : ''} · приоритет: {riskLabel(recommendation.priority)}
                  </div>
                </div>
              ))}
            </div> : <div className="px-5 py-6 text-[13px] text-[#73726c]">Активных рекомендаций нет.</div>}
          </div>
        </section>

        <section className={`${PANEL} overflow-hidden`}>
          <div className="flex items-center gap-2 border-b border-[#ece8df] px-5 py-4">
            <FileText className="h-4 w-4" />
            <h2 className="text-[16px] font-semibold">Уроки</h2>
          </div>
          {data.lessons.length ? (
            <div className="divide-y divide-[#ece8df]">
              {data.lessons.map((lesson, index) => (
                <details key={lesson.id} className="group px-5 py-4" open={index === 0}>
                  <summary className="flex cursor-pointer list-none items-start justify-between gap-4">
                    <div>
                      <div className="text-[14px] font-medium">{formatDate(lesson.lessonDate)}</div>
                      <div className="mt-1 text-[12px] text-[#73726c]">
                        {lesson.subjectName} · {lessonTypeLabel(lesson.lessonType)}{lesson.durationMinutes ? ` · ${lesson.durationMinutes} мин` : ''}
                      </div>
                    </div>
                    <span className="shrink-0 text-[12px] text-[#73726c] group-open:hidden">Открыть</span>
                    <span className="hidden shrink-0 text-[12px] text-[#73726c] group-open:inline">Скрыть</span>
                  </summary>

                  <div className="mt-4 space-y-4">
                    {lesson.generalComment ? <div className="rounded-[8px] bg-[#f5f4f0] p-4 text-[13px]"><b>Комментарий:</b> {lesson.generalComment}</div> : null}
                    {lesson.nextLessonPlan ? <div className="rounded-[8px] bg-[#f5f4f0] p-4 text-[13px]"><b>План следующего урока:</b> {lesson.nextLessonPlan}</div> : null}

                    <div>
                      <h3 className="text-[13px] font-semibold">Темы и результаты</h3>
                      {lesson.topicResults?.length ? (
                        <div className="mt-3 grid gap-3">
                          {lesson.topicResults.map((result) => (
                            <div key={result.id} className="rounded-[8px] border border-[#ece8df] bg-white p-4">
                              <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                  <div className="text-[14px] font-medium">{result.topicName}</div>
                                  <div className="mt-1 text-[12px] text-[#73726c]">
                                    {result.skillName || 'Без конкретного навыка'} · статус: {masteryStatusLabel(result.masteryStatus)} · риск: {riskLabel(result.riskLevel)}
                                  </div>
                                </div>
                                {result.needsRepeat ? <span className="w-max rounded-full bg-amber-100 px-3 py-1 text-[12px] text-amber-800">нужно повторить</span> : null}
                              </div>
                              <div className="mt-3 grid gap-2 sm:grid-cols-4">
                                <Metric label="Понимание" value={result.understandingScore} />
                                <Metric label="Точность" value={result.accuracyPercent ?? '—'} />
                                <Metric label="Самостоятельность" value={result.independenceScore} />
                                <Metric label="Внимание" value={result.attentionScore} />
                              </div>
                              <div className="mt-3 text-[12px] text-[#73726c]">
                                Заданий: {result.totalTasks ?? '—'} · верно: {result.correctTasks ?? '—'} · подсказок: {result.hintCount ?? '—'} · прогресс: {result.progressScore ?? '—'}%
                              </div>
                              {result.mistakes?.length ? (
                                <div className="mt-3 flex flex-wrap gap-2">
                                  {result.mistakes.map((mistake) => (
                                    <span key={mistake.id} className="rounded-full border border-[#d8d4ca] px-3 py-1 text-[12px]">
                                      {mistake.mistakeName} · {severityLabel(mistake.severity)} · {mistake.count}
                                    </span>
                                  ))}
                                </div>
                              ) : null}
                              {result.comment ? <p className="mt-3 text-[13px] text-[#4b4a45]">{result.comment}</p> : null}
                            </div>
                          ))}
                        </div>
                      ) : <div className="mt-2 text-[13px] text-[#73726c]">Темы не добавлены.</div>}
                    </div>

                    <div>
                      <h3 className="text-[13px] font-semibold">Домашнее задание</h3>
                      {lesson.homeworks?.length ? (
                        <div className="mt-3 grid gap-2">
                          {lesson.homeworks.map((homework) => (
                            <div key={homework.id} className="rounded-[8px] bg-[#f5f4f0] p-4 text-[13px]">
                              <div className="font-medium">{homework.text}</div>
                              <div className="mt-1 text-[12px] text-[#73726c]">
                                {homework.topicName || homework.subjectName || 'Без темы'}{homework.skillName ? ` · ${homework.skillName}` : ''} · {homeworkStatusLabel(homework.status)}{homework.dueDate ? ` · до ${homework.dueDate}` : ''}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : <div className="mt-2 text-[13px] text-[#73726c]">Домашка не задана.</div>}
                    </div>
                  </div>
                </details>
              ))}
            </div>
          ) : <div className="px-5 py-6 text-[13px] text-[#73726c]">Уроков пока нет.</div>}
        </section>

        <footer className="text-center text-[12px] text-[#73726c]">
          Данные доступны только по текущей ссылке. Если преподаватель сгенерирует новую ссылку, эта перестанет открываться.
        </footer>
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

function Metric({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-[8px] bg-[#f5f4f0] px-3 py-2"><div className="text-[11px] text-[#73726c]">{label}</div><div className="mt-1 text-[16px] font-semibold">{value}</div></div>;
}

function riskRank(value: string) {
  if (value === 'high') return 0;
  if (value === 'medium') return 1;
  return 2;
}

function riskLabel(value: string) {
  if (value === 'high') return 'высокий';
  if (value === 'medium') return 'средний';
  if (value === 'low') return 'низкий';
  return value;
}

function formatDelta(value: number | null) {
  if (value === null) return 'недостаточно данных';
  if (value > 0) return `+${value}`;
  return String(value);
}

function formatDate(value: string | null) {
  if (!value) return 'Дата не указана';
  return new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}

function lessonTypeLabel(value: string) {
  if (value === 'new_topic') return 'новая тема';
  if (value === 'practice') return 'закрепление';
  if (value === 'review') return 'повторение';
  if (value === 'mistake_review') return 'разбор ошибок';
  if (value === 'test' || value === 'control' || value === 'assessment') return 'контрольная';
  if (value === 'exam_preparation' || value === 'exam') return 'подготовка';
  return value;
}

function homeworkStatusLabel(value: string) {
  if (value === 'assigned') return 'задано';
  if (value === 'done') return 'выполнено';
  if (value === 'partially_done') return 'частично выполнено';
  if (value === 'not_done') return 'не выполнено';
  if (value === 'checked') return 'проверено';
  if (value === 'redo_required') return 'нужно переделать';
  return value;
}

function severityLabel(value: string) {
  if (value === 'high') return 'серьезная';
  if (value === 'medium') return 'средняя';
  if (value === 'low') return 'легкая';
  return value;
}
