'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowUpRight, BookOpen, ClipboardList, Plus, Shield, Users } from 'lucide-react';
import { studentsApi } from '@/lib/api/students';
import { LogoutButton } from '@/components/auth/LogoutButton';
import { getCachedAuthUser } from '@/lib/api/auth-cache';
import type { AuthUser, DashboardOverview, Student } from '@/lib/types';

const PANEL_CLASS = 'rounded-[10px] border border-[#e0ddd6] bg-white shadow-sm';

export default function StudentsPage() {
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError(null);
      const [overviewResult, studentsResult, userResult] = await Promise.allSettled([studentsApi.overview(), studentsApi.list(), getCachedAuthUser()]);
      if (!active) return;
      if (overviewResult.status === 'fulfilled') setOverview(overviewResult.value);
      if (studentsResult.status === 'fulfilled') setStudents(studentsResult.value);
      if (userResult.status === 'fulfilled') setUser(userResult.value);
      if (overviewResult.status === 'rejected' || studentsResult.status === 'rejected') setError('Не удалось загрузить данные. Проверь backend на :8100.');
      setLoading(false);
    }
    void load();
    return () => { active = false; };
  }, []);

  return (
    <main className="min-h-screen bg-[#f5f4f0] px-4 py-5 text-[#1a1a18] sm:px-6">
      <div className="mx-auto max-w-6xl space-y-5">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.5px] text-[#73726c]">TutorTrack</p>
            <h1 className="text-[26px] font-semibold leading-tight">Ученики и уроки</h1>
          </div>
          <div className="flex items-center gap-2">
            {user?.role === 'admin' ? (
              <Link href="/admin/catalog" className="inline-flex h-10 items-center justify-center gap-2 rounded-[8px] border border-[#d8d4ca] bg-white px-4 text-[13px] font-medium text-[#1a1a18]">
                <Shield className="h-4 w-4" /> Админ
              </Link>
            ) : null}
            <LogoutButton />
            <Link href="/students/new" className="inline-flex h-10 items-center justify-center gap-2 rounded-[8px] bg-[#1a1a18] px-4 text-[13px] font-medium text-white">
              <Plus className="h-4 w-4" /> Добавить ученика
            </Link>
          </div>
        </header>

        {error ? <div className="rounded-[8px] border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-800">{error}</div> : null}

        <section className="grid gap-3 sm:grid-cols-4">
          <StatCard icon={<Users className="h-4 w-4" />} label="активных учеников" value={loading ? '...' : overview?.activeStudents ?? students.length} />
          <StatCard icon={<BookOpen className="h-4 w-4" />} label="уроков" value={loading ? '...' : overview?.lessonsCount ?? 0} />
          <StatCard icon={<ClipboardList className="h-4 w-4" />} label="активных домашних" value={loading ? '...' : overview?.activeHomeworks ?? 0} />
          <StatCard icon={<Users className="h-4 w-4" />} label="групп" value={loading ? '...' : overview?.groupsCount ?? 0} />
        </section>

        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {students.map((student) => (
            <Link key={student.id} href={`/students/${student.id}`} className={`${PANEL_CLASS} block p-4 transition hover:border-[#bdb8ad]`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e1f5ee] text-[12px] font-medium text-[#0f6e56]">
                    {student.initials}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-[14px] font-medium">{student.name}</div>
                    <div className="truncate text-[12px] text-[#73726c]">{student.grade ? `${student.grade} класс` : 'Класс не указан'}</div>
                  </div>
                </div>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-[#73726c]" />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-[12px] text-[#73726c]">
                <div className="rounded-[8px] bg-[#f5f4f0] px-3 py-2">Уроков: <b className="text-[#1a1a18]">{student.lessonsCount ?? 0}</b></div>
                <div className="rounded-[8px] bg-[#f5f4f0] px-3 py-2">Домашка: <b className="text-[#1a1a18]">{student.activeHomeworksCount ?? 0}</b></div>
              </div>
              {student.learningGoal ? <p className="mt-3 line-clamp-2 text-[12px] text-[#73726c]">{student.learningGoal}</p> : null}
            </Link>
          ))}
          {!loading && students.length === 0 ? <div className={`${PANEL_CLASS} p-5 text-[13px] text-[#73726c]`}>Добавьте первого ученика.</div> : null}
        </section>
      </div>
    </main>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string | number; icon: ReactNode }) {
  return <div className={`${PANEL_CLASS} p-4`}><div className="flex items-center gap-2 text-[#73726c]">{icon}<span className="text-[11px] uppercase tracking-[0.4px]">{label}</span></div><div className="mt-2 text-[24px] font-semibold">{value}</div></div>;
}
