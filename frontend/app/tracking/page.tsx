import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  CheckCircle2,
  ClipboardList,
  FileText,
  LineChart,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'TutorTrack — трекинг прогресса учеников',
  description:
    'Кабинет репетитора для фиксации уроков, тем, ошибок, домашних заданий, динамики прогресса и отчетов для родителей.',
};

const features = [
  {
    icon: UsersRound,
    title: 'Ученики в одном месте',
    text: 'Карточки учеников, цели обучения, история занятий и домашние задания без отдельных таблиц.',
  },
  {
    icon: BookOpenCheck,
    title: 'Урок фиксируется по темам',
    text: 'После занятия отмечаются темы, навыки, точность, самостоятельность и типичные ошибки.',
  },
  {
    icon: LineChart,
    title: 'Прогресс считается автоматически',
    text: 'Система показывает сильные темы, слабые места и динамику по каждому ученику.',
  },
  {
    icon: ClipboardList,
    title: 'Домашние задания под контролем',
    text: 'Активные задания можно связывать с темами и отслеживать по состоянию выполнения.',
  },
  {
    icon: FileText,
    title: 'Отчеты для родителей',
    text: 'Понятный отчет объясняет, что получилось, где ошибки повторяются и что делать дальше.',
  },
  {
    icon: ShieldCheck,
    title: 'Доступ разделен',
    text: 'Каждый репетитор видит только своих учеников, уроки, аналитику и личный каталог.',
  },
];

const metrics = [
  ['68/100', 'общий прогресс'],
  ['+12', 'динамика за месяц'],
  ['3', 'темы требуют внимания'],
  ['2 мин', 'на короткий отчет'],
];

const workflow = [
  'Добавьте ученика и цель обучения.',
  'После урока внесите темы, навыки, оценки и ошибки.',
  'Проверьте аналитику: прогресс, слабые темы, повторяющиеся ошибки.',
  'Сформируйте отчет и покажите родителю понятную картину работы.',
];

export default function TrackingLandingPage() {
  return (
    <main className="min-h-screen bg-[#f5f4f0] text-[#1a1a18]">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 text-[15px] font-semibold">
          <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#1a1a18] text-white">
            <Sparkles className="h-4 w-4" />
          </span>
          TutorTrack
        </Link>
        <nav className="flex items-center gap-2 text-[13px]">
          <Link href="/" className="rounded-[8px] px-3 py-2 font-medium text-[#4b4a45] hover:bg-white">
            Курс
          </Link>
          <Link href="/training" className="rounded-[8px] px-3 py-2 font-medium text-[#4b4a45] hover:bg-white">
            Тренировка
          </Link>
          <Link href="/login" className="rounded-[8px] bg-[#1a1a18] px-4 py-2 font-medium text-white shadow-sm">
            Войти
          </Link>
        </nav>
      </header>

      <section className="mx-auto grid max-w-7xl gap-10 px-4 pb-16 pt-8 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:pb-20 lg:pt-14">
        <div className="flex flex-col justify-center">
          <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-[#d8d4ca] bg-white px-3 py-1 text-[12px] font-medium text-[#5f5d56] shadow-sm">
            <BarChart3 className="h-3.5 w-3.5" />
            Кабинет для частного репетитора и небольшой команды
          </div>
          <h1 className="max-w-3xl text-[42px] font-semibold leading-[1.05] tracking-[-1px] sm:text-[56px] lg:text-[64px]">
            Понятная аналитика прогресса учеников после каждого урока
          </h1>
          <p className="mt-6 max-w-2xl text-[17px] leading-7 text-[#5f5d56] sm:text-[18px]">
            TutorTrack помогает фиксировать уроки, видеть слабые темы, отслеживать повторяющиеся ошибки и готовить отчеты для родителей без ручных таблиц.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/register" className="inline-flex h-12 items-center justify-center gap-2 rounded-[10px] bg-[#1a1a18] px-6 text-[14px] font-medium text-white shadow-sm">
              Создать аккаунт <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/login" className="inline-flex h-12 items-center justify-center rounded-[10px] border border-[#d8d4ca] bg-white px-6 text-[14px] font-medium text-[#1a1a18] shadow-sm">
              Войти в кабинет
            </Link>
          </div>
          <p className="mt-4 text-[12px] text-[#73726c]">
            Сценарий: регистрация - ученики - новый урок - аналитика - отчет.
          </p>
        </div>

        <div className="rounded-[22px] border border-[#dedad2] bg-white p-4 shadow-[0_24px_80px_rgba(40,38,30,0.12)]">
          <div className="rounded-[18px] bg-[#f5f4f0] p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.5px] text-[#73726c]">Карточка ученика</p>
                <h2 className="mt-1 text-[24px] font-semibold">Анна, 7 класс</h2>
                <p className="mt-1 text-[13px] text-[#73726c]">Цель: подтянуть дроби и проценты за 2 месяца</p>
              </div>
              <span className="rounded-full bg-[#e1f5ee] px-3 py-1 text-[12px] font-medium text-[#0f6e56]">активна</span>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-4">
              {metrics.map(([value, label]) => (
                <div key={label} className="rounded-[14px] bg-white p-3 shadow-sm">
                  <div className="text-[22px] font-semibold">{value}</div>
                  <div className="mt-1 text-[11px] leading-4 text-[#73726c]">{label}</div>
                </div>
              ))}
            </div>

            <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_0.82fr]">
              <div className="rounded-[16px] bg-white p-4 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-[14px] font-semibold">Динамика прогресса</h3>
                  <span className="text-[12px] font-medium text-[#0f6e56]">+12 за месяц</span>
                </div>
                <div className="flex h-36 items-end gap-2">
                  {[34, 46, 42, 55, 61, 68, 72].map((height, index) => (
                    <div key={index} className="flex h-full flex-1 items-end rounded-t-[8px] bg-[#efece5]">
                      <div className="w-full rounded-t-[8px] bg-[#1a1a18]" style={{ height: `${height}%` }} />
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex justify-between text-[11px] text-[#73726c]">
                  <span>Май</span>
                  <span>Июнь</span>
                </div>
              </div>

              <div className="space-y-3">
                <InfoList title="Сильные темы" items={['Десятичные дроби', 'Проценты']} tone="green" />
                <InfoList title="Требуют внимания" items={['Сложение дробей', 'Задачи с дробями']} tone="amber" />
                <InfoList title="Повторяющиеся ошибки" items={['НОК', 'Вычисления', 'Невнимательность']} tone="red" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-[#e0ddd6] bg-white">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 py-8 sm:grid-cols-3 sm:px-6 lg:px-8">
          <ValuePoint title="Меньше ручной рутины" text="Не нужно держать прогресс в памяти или собирать отчеты из заметок." />
          <ValuePoint title="Больше прозрачности" text="Родителю проще понять результат и ближайший план занятий." />
          <ValuePoint title="Фокус на повторении" text="Сервис показывает не только оценки, но и причины ошибок." />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="mb-9 max-w-2xl">
          <p className="text-[12px] font-medium uppercase tracking-[0.7px] text-[#73726c]">Возможности</p>
          <h2 className="mt-2 text-[34px] font-semibold tracking-[-0.8px] sm:text-[42px]">Что входит в трекинг</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <article key={feature.title} className="rounded-[18px] border border-[#e0ddd6] bg-white p-5 shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#f5f4f0]">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-[17px] font-semibold">{feature.title}</h3>
                <p className="mt-2 text-[14px] leading-6 text-[#5f5d56]">{feature.text}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="bg-[#1a1a18] text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.8fr_1fr] lg:px-8 lg:py-20">
          <div>
            <p className="text-[12px] font-medium uppercase tracking-[0.7px] text-[#b7b3aa]">Как работает</p>
            <h2 className="mt-2 text-[34px] font-semibold tracking-[-0.8px] sm:text-[42px]">От урока до отчета - один цикл</h2>
            <p className="mt-4 text-[16px] leading-7 text-[#d6d1c7]">
              TutorTrack не заменяет методику репетитора. Он помогает не потерять факты: что проходили, где ученик справился сам, где ошибался и что нужно повторить.
            </p>
          </div>
          <div className="grid gap-3">
            {workflow.map((step, index) => (
              <div key={step} className="flex gap-4 rounded-[16px] border border-white/10 bg-white/[0.06] p-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-[13px] font-semibold text-[#1a1a18]">
                  {index + 1}
                </div>
                <p className="pt-1 text-[15px] leading-6 text-[#f5f4f0]">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="rounded-[24px] border border-[#e0ddd6] bg-white p-7 text-center shadow-sm sm:p-10 lg:p-12">
          <h2 className="mx-auto max-w-3xl text-[32px] font-semibold leading-tight tracking-[-0.8px] sm:text-[42px]">
            Начните вести прогресс учеников в системе, а не в разрозненных заметках
          </h2>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/register" className="inline-flex h-12 items-center justify-center gap-2 rounded-[10px] bg-[#1a1a18] px-6 text-[14px] font-medium text-white shadow-sm">
              Попробовать TutorTrack <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/login" className="inline-flex h-12 items-center justify-center rounded-[10px] border border-[#d8d4ca] bg-white px-6 text-[14px] font-medium text-[#1a1a18]">
              Уже есть аккаунт
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function ValuePoint({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-[14px] bg-[#f5f4f0] p-4">
      <h3 className="text-[15px] font-semibold">{title}</h3>
      <p className="mt-1 text-[13px] leading-5 text-[#5f5d56]">{text}</p>
    </div>
  );
}

function InfoList({ title, items, tone }: { title: string; items: string[]; tone: 'green' | 'amber' | 'red' }) {
  const toneClass = {
    green: 'bg-[#e1f5ee] text-[#0f6e56]',
    amber: 'bg-[#fff3d6] text-[#8a5b00]',
    red: 'bg-[#ffe8e2] text-[#9c3321]',
  }[tone];

  return (
    <div className="rounded-[16px] bg-white p-4 shadow-sm">
      <h3 className="text-[13px] font-semibold">{title}</h3>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.map((item) => (
          <span key={item} className={`rounded-full px-3 py-1 text-[11px] font-medium ${toneClass}`}>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
