import type { Metadata } from 'next';
import Link from 'next/link';
import {
  BookOpen,
  Dice5,
  FileText,
  FlaskConical,
  Home,
  PenTool,
  SpellCheck,
  Trophy,
  Volume2,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Тренировка — тесты по русскому языку',
  description: 'Тесты, игры и тренажеры по русскому языку для учеников.',
};

const tests = [
  {
    icon: FileText,
    title: 'Разбор предложения',
    description: 'Определите части речи и члены предложения в 12 вариантах.',
    status: 'Не начато',
    href: '/apps/sentence_check.html',
  },
  {
    icon: FlaskConical,
    title: 'МорфоЛаб',
    description: 'Собирайте слова из морфем в игровой форме.',
    status: 'Новое',
    href: '/apps/morpholab/index.html',
  },
  {
    icon: Dice5,
    title: 'Занимательная грамматика',
    description: 'Сборник игр, загадок и викторин по фонетике, морфологии и лексике.',
    status: '26 игр',
    href: '/apps/games/index.html',
  },
  {
    icon: Volume2,
    title: 'Фонетическая лаборатория',
    description: 'Изучайте звуки, алфавит и выполняйте фонетические задания.',
    status: 'Новое',
    href: '/apps/phonetic-lab.html',
  },
  {
    icon: SpellCheck,
    title: 'Занимательная фонетика',
    description: 'Большой набор игр по ударению, буквам, звукам, Ъ/Ь и словесным превращениям.',
    status: '30 игр',
    href: '/apps/fonetika.html',
  },
  {
    icon: BookOpen,
    title: 'Безударные гласные',
    description: 'Тренажер по проверяемым и словарным словам с выбором буквы и самопроверкой.',
    status: '2 режима',
    href: '/apps/безударные_гласные.html',
  },
];

const upcoming = [
  {
    icon: PenTool,
    title: 'Орфография',
    description: 'Проверьте знание правил написания слов.',
  },
  {
    icon: FileText,
    title: 'Пунктуация',
    description: 'Расставьте знаки препинания правильно.',
  },
  {
    icon: BookOpen,
    title: 'Лексика',
    description: 'Подберите синонимы и антонимы к словам.',
  },
];

export default function TrainingPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(135deg,#667eea_0%,#764ba2_100%)] px-4 py-6 text-[#1f2937] sm:py-10">
      <div className="mx-auto max-w-5xl rounded-[20px] bg-white p-5 shadow-[0_20px_60px_rgba(0,0,0,0.28)] sm:p-10 lg:p-12">
        <header className="mb-9 text-center">
          <div className="mb-5 flex justify-center">
            <Link href="/" className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[#f8f9ff] px-4 text-[14px] font-bold text-[#667eea] hover:bg-[#e8ecff]">
              <Home className="h-4 w-4" />
              На главную
            </Link>
          </div>
          <h1 className="text-[34px] font-extrabold text-[#667eea] sm:text-[42px]">Тренировка</h1>
          <p className="mt-3 text-[16px] text-[#6b7280]">Тесты, игры и тренажеры по русскому языку</p>
        </header>

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3" aria-label="Доступные тренажеры">
          {tests.map((test) => (
            <TrainingCard key={test.title} {...test} />
          ))}
          {upcoming.map((test) => (
            <UpcomingCard key={test.title} {...test} />
          ))}
        </section>

        <section className="mt-10 rounded-[15px] bg-[#f8f9ff] p-6 sm:p-8">
          <div className="mb-5 flex items-center justify-center gap-2 text-center text-[24px] font-extrabold text-[#667eea]">
            <Trophy className="h-6 w-6" />
            Таблица лидеров
          </div>
          <div className="rounded-[12px] border border-dashed border-[#d7dcff] bg-white px-5 py-10 text-center text-[15px] italic text-[#9ca3af]">
            Пока нет результатов. Пройдите первый тест.
          </div>
        </section>
      </div>
    </main>
  );
}

function TrainingCard({
  icon: Icon,
  title,
  description,
  status,
  href,
}: {
  icon: typeof FileText;
  title: string;
  description: string;
  status: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group relative block overflow-hidden rounded-[15px] border-2 border-[#e5e7eb] bg-[linear-gradient(135deg,#f8f9ff_0%,#e8ecff_100%)] p-6 text-inherit transition hover:-translate-y-1 hover:border-[#667eea] hover:shadow-[0_10px_30px_rgba(102,126,234,0.28)]"
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#667eea,#764ba2)] opacity-0 transition group-hover:opacity-100" />
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-[16px] bg-white text-[#667eea] shadow-sm">
        <Icon className="h-7 w-7" />
      </div>
      <h2 className="text-center text-[20px] font-bold text-[#2c3e50]">{title}</h2>
      <p className="mt-3 text-center text-[14px] leading-6 text-[#6b7280]">{description}</p>
      <div className="mt-5 border-t border-[#e5e7eb] pt-4 text-center text-[13px] font-semibold text-[#667eea]">{status}</div>
    </Link>
  );
}

function UpcomingCard({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof FileText;
  title: string;
  description: string;
}) {
  return (
    <div className="relative block overflow-hidden rounded-[15px] border-2 border-[#e5e7eb] bg-[linear-gradient(135deg,#f8f9ff_0%,#e8ecff_100%)] p-6 opacity-60">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-[16px] bg-white text-[#667eea] shadow-sm">
        <Icon className="h-7 w-7" />
      </div>
      <h2 className="text-center text-[20px] font-bold text-[#2c3e50]">{title}</h2>
      <p className="mt-3 text-center text-[14px] leading-6 text-[#6b7280]">{description}</p>
      <div className="mt-5 border-t border-[#e5e7eb] pt-4 text-center text-[13px] text-[#9ca3af]">Скоро...</div>
    </div>
  );
}
