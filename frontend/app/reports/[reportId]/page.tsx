'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { reportsApi } from '@/lib/api/reports';
import type { Report } from '@/lib/types';

const PANEL_CLASS = 'rounded-[10px] border border-[#e0ddd6] bg-white shadow-sm';

export default function ReportPage() {
  const params = useParams<{ reportId: string }>();
  const router = useRouter();
  const reportId = Number(params.reportId);
  const [report, setReport] = useState<Report | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const item = await reportsApi.get(reportId);
        if (!active) return;
        setReport(item);
        setTitle(item.title);
        setContent(item.content);
      } catch {
        if (active) setError('Не удалось загрузить отчет.');
      } finally {
        if (active) setLoading(false);
      }
    }
    if (Number.isFinite(reportId)) void load();
    return () => { active = false; };
  }, [reportId]);

  async function saveReport() {
    if (!report) return;
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const updated = await reportsApi.update(report.id, { title, content });
      setReport(updated);
      setTitle(updated.title);
      setContent(updated.content);
      setMessage('Отчет сохранен.');
    } catch {
      setError('Не удалось сохранить отчет.');
    } finally {
      setSaving(false);
    }
  }

  async function copyReport() {
    try {
      await navigator.clipboard.writeText(content);
      setMessage('Текст скопирован.');
    } catch {
      setError('Не удалось скопировать текст.');
    }
  }

  async function deleteReport() {
    if (!report) return;
    const confirmed = window.confirm('Удалить отчет?');
    if (!confirmed) return;
    await reportsApi.delete(report.id);
    router.push(`/students/${report.studentId}`);
  }

  if (loading) return <main className="p-6 text-[14px] text-[#73726c]">Загрузка...</main>;
  if (error && !report) return <main className="p-6 text-[14px] text-[#8a4b00]">{error}</main>;
  if (!report) return <main className="p-6 text-[14px] text-[#8a4b00]">Отчет не найден.</main>;

  return (
    <main className="min-h-screen bg-[#f5f4f0] px-4 py-5 text-[#1a1a18] sm:px-6">
      <div className="mx-auto max-w-4xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href={`/students/${report.studentId}`} className="text-[13px] text-[#73726c]">← К ученику</Link>
          <div className="flex flex-wrap gap-2">
            <button onClick={copyReport} className="h-10 rounded-[8px] border border-[#d8d4ca] bg-white px-4 text-[13px] font-medium">Скопировать</button>
            <button onClick={saveReport} disabled={saving} className="h-10 rounded-[8px] bg-[#1a1a18] px-4 text-[13px] font-medium text-white disabled:opacity-60">{saving ? 'Сохранение...' : 'Сохранить'}</button>
            <button onClick={deleteReport} className="h-10 rounded-[8px] border border-red-200 bg-white px-4 text-[13px] font-medium text-red-700">Удалить</button>
          </div>
        </div>

        <section className={`${PANEL_CLASS} p-5`}>
          <div className="text-[12px] uppercase tracking-[0.5px] text-[#73726c]">{reportTypeLabel(report.reportType)}{report.createdAt ? ` · создан ${formatDate(report.createdAt)}` : ''}</div>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="mt-3 w-full rounded-[8px] border border-[#d8d4ca] bg-white px-3 py-2 text-[20px] font-semibold outline-none focus:border-[#1a1a18]"
          />
          {report.periodFrom && report.periodTo ? <div className="mt-2 text-[12px] text-[#73726c]">Период: {report.periodFrom} — {report.periodTo}</div> : null}
        </section>

        {(message || error) ? <div className={`rounded-[8px] px-4 py-3 text-[13px] ${error ? 'bg-red-50 text-red-800' : 'bg-[#e1f5ee] text-[#0f6e56]'}`}>{error || message}</div> : null}

        <section className={`${PANEL_CLASS} p-5`}>
          <label className="text-[13px] font-medium">Текст отчета</label>
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            rows={20}
            className="mt-3 w-full rounded-[8px] border border-[#d8d4ca] bg-white px-3 py-3 text-[14px] leading-6 outline-none focus:border-[#1a1a18]"
          />
        </section>
      </div>
    </main>
  );
}

function reportTypeLabel(value: string) {
  if (value === 'lesson_report') return 'Отчет по уроку';
  if (value === 'period_report') return 'Отчет за период';
  if (value === 'topic_report') return 'Отчет по теме';
  return value;
}

function formatDate(value: string | null) {
  if (!value) return 'дата не указана';
  return new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}
