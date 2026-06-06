'use client';

import Link from 'next/link';
import type { FormEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { BookOpen, CheckCircle2, Edit2, Layers, ListChecks, LogOut, Plus, Shield, XCircle } from 'lucide-react';
import { LogoutButton } from '@/components/auth/LogoutButton';
import { schoolApi } from '@/lib/api/school';
import { getCachedAuthUser } from '@/lib/api/auth-cache';
import type { AuthUser, MistakeType, Skill, Subject, Topic } from '@/lib/types';

type Tab = 'subjects' | 'topics' | 'skills' | 'mistakes';
type SelectOption = { value: number; label: string };

type SubjectForm = { id: number | null; name: string; code: string; isActive: boolean };
type TopicForm = { id: number | null; subjectId: string; parentId: string; grade: string; name: string; description: string; sortOrder: string; isActive: boolean };
type SkillForm = { id: number | null; topicId: string; name: string; description: string; sortOrder: string; isActive: boolean };
type MistakeForm = { id: number | null; subjectId: string; code: string; name: string; description: string; isActive: boolean };

const PANEL = 'rounded-[10px] border border-[#e0ddd6] bg-white shadow-sm';
const emptySubject: SubjectForm = { id: null, name: '', code: '', isActive: true };
const emptyTopic: TopicForm = { id: null, subjectId: '', parentId: '', grade: '', name: '', description: '', sortOrder: '0', isActive: true };
const emptySkill: SkillForm = { id: null, topicId: '', name: '', description: '', sortOrder: '0', isActive: true };
const emptyMistake: MistakeForm = { id: null, subjectId: '', code: '', name: '', description: '', isActive: true };

export default function AdminCatalogPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('subjects');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [mistakes, setMistakes] = useState<MistakeType[]>([]);
  const [subjectForm, setSubjectForm] = useState<SubjectForm>(emptySubject);
  const [topicForm, setTopicForm] = useState<TopicForm>(emptyTopic);
  const [skillForm, setSkillForm] = useState<SkillForm>(emptySkill);
  const [mistakeForm, setMistakeForm] = useState<MistakeForm>(emptyMistake);

  useEffect(() => {
    let active = true;
    getCachedAuthUser()
      .then((item) => {
        if (!active) return;
        setUser(item);
        setLoadingUser(false);
        if (item.role === 'admin') void loadCatalog();
        else setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setLoadingUser(false);
        setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const subjectOptions = useMemo<SelectOption[]>(() => subjects.map((item) => ({ value: item.id, label: item.name })), [subjects]);
  const topicOptions = useMemo<SelectOption[]>(() => topics.map((item) => ({ value: item.id, label: topicLabel(item, subjects) })), [topics, subjects]);
  const parentTopicOptions = useMemo<SelectOption[]>(() => topics
    .filter((item) => !topicForm.id || item.id !== topicForm.id)
    .filter((item) => !topicForm.subjectId || item.subjectId === Number(topicForm.subjectId))
    .map((item) => ({ value: item.id, label: topicLabel(item, subjects) })), [topics, subjects, topicForm.id, topicForm.subjectId]);

  async function loadCatalog() {
    setLoading(true);
    setError(null);
    try {
      const [subjectResult, topicResult, skillResult, mistakeResult] = await Promise.all([
        schoolApi.adminSubjects(),
        schoolApi.adminTopics(),
        schoolApi.adminSkills(),
        schoolApi.adminMistakeTypes(),
      ]);
      setSubjects(subjectResult);
      setTopics(topicResult);
      setSkills(skillResult);
      setMistakes(mistakeResult);
      setTopicForm((current) => ({ ...current, subjectId: current.subjectId || String(subjectResult[0]?.id ?? '') }));
      setMistakeForm((current) => ({ ...current, subjectId: current.subjectId || String(subjectResult[0]?.id ?? '') }));
      setSkillForm((current) => ({ ...current, topicId: current.topicId || String(topicResult[0]?.id ?? '') }));
    } catch {
      setError('Не удалось загрузить каталог. Проверьте backend на :8100 и права admin.');
    } finally {
      setLoading(false);
    }
  }

  async function submitSubject(event: FormEvent) {
    event.preventDefault();
    if (!subjectForm.name.trim()) return setError('Укажите название предмета.');
    await save(async () => {
      const payload = { name: subjectForm.name.trim(), code: subjectForm.code.trim() || null, is_active: subjectForm.isActive };
      if (subjectForm.id) await schoolApi.updateSubject(subjectForm.id, payload);
      else await schoolApi.createSubject(payload);
      setSubjectForm(emptySubject);
    });
  }

  async function submitTopic(event: FormEvent) {
    event.preventDefault();
    if (!topicForm.subjectId || !topicForm.name.trim()) return setError('Укажите предмет и название темы.');
    await save(async () => {
      const payload = {
        subject_id: Number(topicForm.subjectId),
        parent_id: topicForm.parentId ? Number(topicForm.parentId) : null,
        grade: topicForm.grade ? Number(topicForm.grade) : null,
        name: topicForm.name.trim(),
        description: topicForm.description.trim(),
        sort_order: Number(topicForm.sortOrder || 0),
        is_active: topicForm.isActive,
      };
      if (topicForm.id) await schoolApi.updateTopic(topicForm.id, payload);
      else await schoolApi.createTopic(payload);
      setTopicForm({ ...emptyTopic, subjectId: topicForm.subjectId });
    });
  }

  async function submitSkill(event: FormEvent) {
    event.preventDefault();
    if (!skillForm.topicId || !skillForm.name.trim()) return setError('Укажите тему и название навыка.');
    await save(async () => {
      const payload = {
        topic_id: Number(skillForm.topicId),
        name: skillForm.name.trim(),
        description: skillForm.description.trim(),
        sort_order: Number(skillForm.sortOrder || 0),
        is_active: skillForm.isActive,
      };
      if (skillForm.id) await schoolApi.updateSkill(skillForm.id, payload);
      else await schoolApi.createSkill(payload);
      setSkillForm({ ...emptySkill, topicId: skillForm.topicId });
    });
  }

  async function submitMistake(event: FormEvent) {
    event.preventDefault();
    if (!mistakeForm.subjectId || !mistakeForm.name.trim()) return setError('Укажите предмет и название ошибки.');
    await save(async () => {
      const payload = {
        subject_id: Number(mistakeForm.subjectId),
        code: mistakeForm.code.trim() || null,
        name: mistakeForm.name.trim(),
        description: mistakeForm.description.trim(),
        is_active: mistakeForm.isActive,
      };
      if (mistakeForm.id) await schoolApi.updateMistakeType(mistakeForm.id, payload);
      else await schoolApi.createMistakeType(payload);
      setMistakeForm({ ...emptyMistake, subjectId: mistakeForm.subjectId });
    });
  }

  async function save(action: () => Promise<void>) {
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      await action();
      await loadCatalog();
      setNotice('Каталог обновлен.');
    } catch {
      setError('Не удалось сохранить запись. Проверьте уникальность названия/кода и права admin.');
    } finally {
      setSaving(false);
    }
  }

  if (loadingUser || loading) {
    return <Shell><div className={`${PANEL} p-5 text-[14px] text-[#73726c]`}>Загрузка каталога...</div></Shell>;
  }

  if (user?.role !== 'admin') {
    return (
      <Shell>
        <section className={`${PANEL} p-6`}>
          <div className="flex items-start gap-3">
            <Shield className="mt-1 h-5 w-5 text-[#8a5b00]" />
            <div>
              <h1 className="text-[24px] font-semibold">Доступ только для admin</h1>
              <p className="mt-2 text-[14px] leading-6 text-[#73726c]">Войдите admin-аккаунтом, чтобы редактировать системный учебный каталог.</p>
              <Link href="/students" className="mt-5 inline-flex h-10 items-center rounded-[8px] bg-[#1a1a18] px-4 text-[13px] font-medium text-white">Вернуться в кабинет</Link>
            </div>
          </div>
        </section>
      </Shell>
    );
  }

  return (
    <Shell>
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.5px] text-[#73726c]">TutorTrack admin</p>
          <h1 className="text-[26px] font-semibold leading-tight">Учебный каталог</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/students" className="inline-flex h-10 items-center rounded-[8px] border border-[#d8d4ca] bg-white px-4 text-[13px] font-medium text-[#1a1a18]">Кабинет</Link>
          <LogoutButton />
        </div>
      </header>

      {error ? <Alert tone="error" text={error} /> : null}
      {notice ? <Alert tone="success" text={notice} /> : null}

      <section className="grid gap-3 sm:grid-cols-4">
        <Stat icon={<BookOpen className="h-4 w-4" />} label="предметов" value={subjects.length} />
        <Stat icon={<Layers className="h-4 w-4" />} label="тем" value={topics.length} />
        <Stat icon={<ListChecks className="h-4 w-4" />} label="навыков" value={skills.length} />
        <Stat icon={<XCircle className="h-4 w-4" />} label="типов ошибок" value={mistakes.length} />
      </section>

      <nav className={`${PANEL} flex flex-wrap gap-2 p-2`} aria-label="Разделы каталога">
        <TabButton active={tab === 'subjects'} onClick={() => setTab('subjects')} label="Предметы" />
        <TabButton active={tab === 'topics'} onClick={() => setTab('topics')} label="Темы" />
        <TabButton active={tab === 'skills'} onClick={() => setTab('skills')} label="Навыки" />
        <TabButton active={tab === 'mistakes'} onClick={() => setTab('mistakes')} label="Ошибки" />
      </nav>

      {tab === 'subjects' ? (
        <section className="grid gap-4 lg:grid-cols-[380px_1fr]">
          <PanelTitle title={subjectForm.id ? 'Редактировать предмет' : 'Новый предмет'} />
          <form onSubmit={(event) => void submitSubject(event)} className={`${PANEL} space-y-4 p-5 lg:col-start-1 lg:row-start-2`}>
            <Field label="Название"><input className="input" value={subjectForm.name} onChange={(event) => setSubjectForm({ ...subjectForm, name: event.target.value })} /></Field>
            <Field label="Код"><input className="input" value={subjectForm.code} onChange={(event) => setSubjectForm({ ...subjectForm, code: event.target.value })} placeholder="math" /></Field>
            <Toggle checked={subjectForm.isActive} onChange={(isActive) => setSubjectForm({ ...subjectForm, isActive })} />
            <FormActions saving={saving} editing={Boolean(subjectForm.id)} onCancel={() => setSubjectForm(emptySubject)} />
          </form>
          <ItemsTable title="Предметы" items={subjects.map((item) => ({
            id: item.id,
            title: item.name,
            subtitle: item.code,
            active: item.isActive,
            meta: 'системный',
            onEdit: () => setSubjectForm({ id: item.id, name: item.name, code: item.code, isActive: item.isActive }),
          }))} />
        </section>
      ) : null}

      {tab === 'topics' ? (
        <section className="grid gap-4 lg:grid-cols-[380px_1fr]">
          <PanelTitle title={topicForm.id ? 'Редактировать тему' : 'Новая тема'} />
          <form onSubmit={(event) => void submitTopic(event)} className={`${PANEL} space-y-4 p-5 lg:col-start-1 lg:row-start-2`}>
            <Field label="Предмет"><Select value={topicForm.subjectId} options={subjectOptions} onChange={(subjectId) => setTopicForm({ ...topicForm, subjectId, parentId: '' })} /></Field>
            <Field label="Родительская тема"><Select value={topicForm.parentId} options={parentTopicOptions} onChange={(parentId) => setTopicForm({ ...topicForm, parentId })} emptyLabel="Без родителя" /></Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Класс"><input className="input" type="number" min={1} max={11} value={topicForm.grade} onChange={(event) => setTopicForm({ ...topicForm, grade: event.target.value })} /></Field>
              <Field label="Сортировка"><input className="input" type="number" value={topicForm.sortOrder} onChange={(event) => setTopicForm({ ...topicForm, sortOrder: event.target.value })} /></Field>
            </div>
            <Field label="Название"><input className="input" value={topicForm.name} onChange={(event) => setTopicForm({ ...topicForm, name: event.target.value })} /></Field>
            <Field label="Описание"><textarea className="textarea" value={topicForm.description} onChange={(event) => setTopicForm({ ...topicForm, description: event.target.value })} /></Field>
            <Toggle checked={topicForm.isActive} onChange={(isActive) => setTopicForm({ ...topicForm, isActive })} />
            <FormActions saving={saving} editing={Boolean(topicForm.id)} onCancel={() => setTopicForm({ ...emptyTopic, subjectId: topicForm.subjectId })} />
          </form>
          <ItemsTable title="Темы" items={topics.map((item) => ({
            id: item.id,
            title: item.name,
            subtitle: topicSubtitle(item, subjects, topics),
            active: item.isActive,
            meta: item.isSystem ? 'системная' : 'личная',
            onEdit: () => setTopicForm({
              id: item.id,
              subjectId: String(item.subjectId),
              parentId: item.parentId ? String(item.parentId) : '',
              grade: item.grade ? String(item.grade) : '',
              name: item.name,
              description: item.description,
              sortOrder: String(item.sortOrder),
              isActive: item.isActive,
            }),
          }))} />
        </section>
      ) : null}

      {tab === 'skills' ? (
        <section className="grid gap-4 lg:grid-cols-[380px_1fr]">
          <PanelTitle title={skillForm.id ? 'Редактировать навык' : 'Новый навык'} />
          <form onSubmit={(event) => void submitSkill(event)} className={`${PANEL} space-y-4 p-5 lg:col-start-1 lg:row-start-2`}>
            <Field label="Тема"><Select value={skillForm.topicId} options={topicOptions} onChange={(topicId) => setSkillForm({ ...skillForm, topicId })} /></Field>
            <Field label="Сортировка"><input className="input" type="number" value={skillForm.sortOrder} onChange={(event) => setSkillForm({ ...skillForm, sortOrder: event.target.value })} /></Field>
            <Field label="Название"><input className="input" value={skillForm.name} onChange={(event) => setSkillForm({ ...skillForm, name: event.target.value })} /></Field>
            <Field label="Описание"><textarea className="textarea" value={skillForm.description} onChange={(event) => setSkillForm({ ...skillForm, description: event.target.value })} /></Field>
            <Toggle checked={skillForm.isActive} onChange={(isActive) => setSkillForm({ ...skillForm, isActive })} />
            <FormActions saving={saving} editing={Boolean(skillForm.id)} onCancel={() => setSkillForm({ ...emptySkill, topicId: skillForm.topicId })} />
          </form>
          <ItemsTable title="Навыки" items={skills.map((item) => ({
            id: item.id,
            title: item.name,
            subtitle: topicLabel(topics.find((topic) => topic.id === item.topicId), subjects),
            active: item.isActive,
            meta: item.isSystem ? 'системный' : 'личный',
            onEdit: () => setSkillForm({
              id: item.id,
              topicId: String(item.topicId),
              name: item.name,
              description: item.description,
              sortOrder: String(item.sortOrder),
              isActive: item.isActive,
            }),
          }))} />
        </section>
      ) : null}

      {tab === 'mistakes' ? (
        <section className="grid gap-4 lg:grid-cols-[380px_1fr]">
          <PanelTitle title={mistakeForm.id ? 'Редактировать тип ошибки' : 'Новый тип ошибки'} />
          <form onSubmit={(event) => void submitMistake(event)} className={`${PANEL} space-y-4 p-5 lg:col-start-1 lg:row-start-2`}>
            <Field label="Предмет"><Select value={mistakeForm.subjectId} options={subjectOptions} onChange={(subjectId) => setMistakeForm({ ...mistakeForm, subjectId })} /></Field>
            <Field label="Код"><input className="input" value={mistakeForm.code} onChange={(event) => setMistakeForm({ ...mistakeForm, code: event.target.value })} placeholder="calculation" /></Field>
            <Field label="Название"><input className="input" value={mistakeForm.name} onChange={(event) => setMistakeForm({ ...mistakeForm, name: event.target.value })} /></Field>
            <Field label="Описание"><textarea className="textarea" value={mistakeForm.description} onChange={(event) => setMistakeForm({ ...mistakeForm, description: event.target.value })} /></Field>
            <Toggle checked={mistakeForm.isActive} onChange={(isActive) => setMistakeForm({ ...mistakeForm, isActive })} />
            <FormActions saving={saving} editing={Boolean(mistakeForm.id)} onCancel={() => setMistakeForm({ ...emptyMistake, subjectId: mistakeForm.subjectId })} />
          </form>
          <ItemsTable title="Типы ошибок" items={mistakes.map((item) => ({
            id: item.id,
            title: item.name,
            subtitle: `${subjectName(item.subjectId, subjects)} · ${item.code}`,
            active: item.isActive,
            meta: item.isSystem ? 'системный' : 'личный',
            onEdit: () => setMistakeForm({
              id: item.id,
              subjectId: String(item.subjectId),
              code: item.code,
              name: item.name,
              description: item.description,
              isActive: item.isActive,
            }),
          }))} />
        </section>
      ) : null}

      <style jsx>{`
        .input{height:40px;width:100%;border:1px solid #d8d4ca;border-radius:8px;padding:0 12px;font-size:14px;background:white}
        .textarea{min-height:88px;width:100%;border:1px solid #d8d4ca;border-radius:8px;padding:10px 12px;font-size:14px;background:white;resize:vertical}
      `}</style>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[#f5f4f0] px-4 py-5 text-[#1a1a18] sm:px-6">
      <div className="mx-auto max-w-7xl space-y-5">{children}</div>
    </main>
  );
}

function PanelTitle({ title }: { title: string }) {
  return <h2 className="text-[18px] font-semibold lg:col-start-1">{title}</h2>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1 block text-[12px] font-medium text-[#73726c]">{label}</span>{children}</label>;
}

function Select({ value, options, onChange, emptyLabel = 'Выберите' }: { value: string; options: SelectOption[]; onChange: (value: string) => void; emptyLabel?: string }) {
  return (
    <select className="input" value={value} onChange={(event) => onChange(event.target.value)}>
      <option value="">{emptyLabel}</option>
      {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
    </select>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-[13px] text-[#4b4a45]">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      Активна
    </label>
  );
}

function FormActions({ saving, editing, onCancel }: { saving: boolean; editing: boolean; onCancel: () => void }) {
  return (
    <div className="flex gap-2">
      <button disabled={saving} className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-[8px] bg-[#1a1a18] px-4 text-[13px] font-medium text-white disabled:opacity-50">
        <Plus className="h-4 w-4" /> {saving ? 'Сохранение...' : editing ? 'Сохранить' : 'Создать'}
      </button>
      {editing ? <button type="button" onClick={onCancel} className="h-10 rounded-[8px] border border-[#d8d4ca] bg-white px-4 text-[13px] font-medium">Отмена</button> : null}
    </div>
  );
}

function TabButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return <button onClick={onClick} className={`h-9 rounded-[8px] px-4 text-[13px] font-medium ${active ? 'bg-[#1a1a18] text-white' : 'text-[#4b4a45] hover:bg-[#f5f4f0]'}`}>{label}</button>;
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className={`${PANEL} p-4`}>
      <div className="flex items-center gap-2 text-[#73726c]">{icon}<span className="text-[11px] uppercase tracking-[0.4px]">{label}</span></div>
      <div className="mt-2 text-[24px] font-semibold">{value}</div>
    </div>
  );
}

function Alert({ tone, text }: { tone: 'error' | 'success'; text: string }) {
  const Icon = tone === 'success' ? CheckCircle2 : XCircle;
  const classes = tone === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-amber-200 bg-amber-50 text-amber-800';
  return <div className={`flex gap-2 rounded-[8px] border px-4 py-3 text-[13px] ${classes}`}><Icon className="mt-0.5 h-4 w-4 shrink-0" />{text}</div>;
}

function ItemsTable({ title, items }: { title: string; items: Array<{ id: number; title: string; subtitle: string; active: boolean; meta: string; onEdit: () => void }> }) {
  return (
    <section className={`${PANEL} overflow-hidden lg:col-start-2 lg:row-span-2`}>
      <div className="border-b border-[#e0ddd6] px-5 py-4">
        <h2 className="text-[18px] font-semibold">{title}</h2>
      </div>
      <div className="divide-y divide-[#eeeae2]">
        {items.map((item) => (
          <div key={item.id} className="grid gap-3 px-5 py-4 sm:grid-cols-[1fr_auto] sm:items-center">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate text-[14px] font-medium">{item.title}</h3>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${item.active ? 'bg-[#e1f5ee] text-[#0f6e56]' : 'bg-[#eeeae2] text-[#73726c]'}`}>
                  {item.active ? 'активна' : 'выключена'}
                </span>
                <span className="rounded-full bg-[#f5f4f0] px-2 py-0.5 text-[11px] text-[#73726c]">{item.meta}</span>
              </div>
              <p className="mt-1 truncate text-[12px] text-[#73726c]">{item.subtitle}</p>
            </div>
            <button onClick={item.onEdit} className="inline-flex h-9 items-center justify-center gap-2 rounded-[8px] border border-[#d8d4ca] bg-white px-3 text-[13px] font-medium">
              <Edit2 className="h-4 w-4" /> Редактировать
            </button>
          </div>
        ))}
        {items.length === 0 ? <div className="px-5 py-8 text-[13px] text-[#73726c]">Записей пока нет.</div> : null}
      </div>
    </section>
  );
}

function subjectName(subjectId: number, subjects: Subject[]) {
  return subjects.find((subject) => subject.id === subjectId)?.name ?? `Предмет #${subjectId}`;
}

function topicLabel(topic: Topic | undefined, subjects: Subject[]) {
  if (!topic) return 'Тема не найдена';
  const grade = topic.grade ? `${topic.grade} класс · ` : '';
  return `${subjectName(topic.subjectId, subjects)} · ${grade}${topic.name}`;
}

function topicSubtitle(topic: Topic, subjects: Subject[], topics: Topic[]) {
  const parent = topic.parentId ? topics.find((item) => item.id === topic.parentId)?.name : null;
  const parts = [subjectName(topic.subjectId, subjects), topic.grade ? `${topic.grade} класс` : null, parent ? `родитель: ${parent}` : null].filter(Boolean);
  return parts.join(' · ');
}
