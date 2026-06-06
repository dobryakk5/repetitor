'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { authApi } from '@/lib/api/auth';

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!email.trim() || password.length < 8) {
      setError('Укажите email и пароль не короче 8 символов.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await authApi.register({ email, password, fullName });
      router.replace('/students');
    } catch {
      setError('Не удалось зарегистрироваться. Возможно, такой email уже есть.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f4f0] px-4 py-10 text-[#1a1a18]">
      <section className="mx-auto max-w-md rounded-[10px] border border-[#e0ddd6] bg-white p-6 shadow-sm">
        <p className="text-[11px] font-medium uppercase tracking-[0.5px] text-[#73726c]">TutorTrack</p>
        <h1 className="mt-1 text-[26px] font-semibold">Регистрация репетитора</h1>
        {error ? <div className="mt-4 rounded-[8px] bg-red-50 px-4 py-3 text-[13px] text-red-800">{error}</div> : null}
        <div className="mt-5 space-y-4">
          <label className="block"><span className="mb-1 block text-[12px] font-medium text-[#73726c]">Имя</span><input value={fullName} onChange={(e) => setFullName(e.target.value)} className="input" /></label>
          <label className="block"><span className="mb-1 block text-[12px] font-medium text-[#73726c]">Email</span><input value={email} onChange={(e) => setEmail(e.target.value)} className="input" type="email" /></label>
          <label className="block"><span className="mb-1 block text-[12px] font-medium text-[#73726c]">Пароль</span><input value={password} onChange={(e) => setPassword(e.target.value)} className="input" type="password" /></label>
        </div>
        <button onClick={() => void submit()} disabled={loading} className="mt-5 h-10 w-full rounded-[8px] bg-[#1a1a18] px-5 text-[13px] font-medium text-white disabled:opacity-50">{loading ? 'Создание...' : 'Создать аккаунт'}</button>
        <p className="mt-4 text-center text-[13px] text-[#73726c]">Уже есть аккаунт? <Link href="/login" className="font-medium text-[#1a1a18]">Войти</Link></p>
      </section>
      <style jsx>{`.input{height:40px;width:100%;border:1px solid #d8d4ca;border-radius:8px;padding:0 12px;font-size:14px}`}</style>
    </main>
  );
}
