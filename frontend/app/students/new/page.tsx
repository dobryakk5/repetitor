'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { studentsApi } from '@/lib/api/students';

export default function NewStudentPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ firstName: '', lastName: '', grade: '6', parentContact: '', learningGoal: '', startLevel: '', comment: '' });

  async function submit() {
    if (!form.firstName.trim()) { setError('Укажите имя ученика.'); return; }
    setSaving(true); setError(null);
    try {
      const student = await studentsApi.create({
        first_name: form.firstName,
        last_name: form.lastName,
        grade: form.grade ? Number(form.grade) : null,
        parent_contact: form.parentContact,
        learning_goal: form.learningGoal,
        start_level: form.startLevel,
        comment: form.comment,
      });
      router.push(`/students/${student.id}`);
    } catch {
      setError('Не удалось создать ученика.');
    } finally { setSaving(false); }
  }

  return (
    <main className="min-h-screen bg-[#f5f4f0] px-4 py-5 text-[#1a1a18] sm:px-6">
      <div className="mx-auto max-w-3xl space-y-5">
        <Link href="/students" className="text-[13px] text-[#73726c]">← К ученикам</Link>
        <section className="rounded-[10px] border border-[#e0ddd6] bg-white p-5 shadow-sm">
          <h1 className="text-[24px] font-semibold">Новый ученик</h1>
          {error ? <div className="mt-4 rounded-[8px] border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-800">{error}</div> : null}
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Имя"><input value={form.firstName} onChange={(e) => setForm({...form, firstName: e.target.value})} className="input" /></Field>
            <Field label="Фамилия"><input value={form.lastName} onChange={(e) => setForm({...form, lastName: e.target.value})} className="input" /></Field>
            <Field label="Класс"><input value={form.grade} onChange={(e) => setForm({...form, grade: e.target.value})} className="input" type="number" min="1" max="11" /></Field>
            <Field label="Контакт родителя"><input value={form.parentContact} onChange={(e) => setForm({...form, parentContact: e.target.value})} className="input" /></Field>
            <Field label="Цель занятий"><textarea value={form.learningGoal} onChange={(e) => setForm({...form, learningGoal: e.target.value})} className="textarea" /></Field>
            <Field label="Стартовый уровень"><textarea value={form.startLevel} onChange={(e) => setForm({...form, startLevel: e.target.value})} className="textarea" /></Field>
            <div className="sm:col-span-2"><Field label="Комментарий"><textarea value={form.comment} onChange={(e) => setForm({...form, comment: e.target.value})} className="textarea" /></Field></div>
          </div>
          <button onClick={() => void submit()} disabled={saving} className="mt-5 h-10 rounded-[8px] bg-[#1a1a18] px-5 text-[13px] font-medium text-white disabled:opacity-50">Сохранить</button>
        </section>
      </div>
      <style jsx>{`.input{height:40px;width:100%;border:1px solid #d8d4ca;border-radius:8px;padding:0 12px;font-size:14px}.textarea{min-height:86px;width:100%;border:1px solid #d8d4ca;border-radius:8px;padding:10px 12px;font-size:14px}`}</style>
    </main>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block"><span className="mb-1 block text-[12px] font-medium text-[#73726c]">{label}</span>{children}</label>;
}
