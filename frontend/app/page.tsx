import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  Calculator,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  GraduationCap,
  Leaf,
  PenLine,
  Sparkles,
  Target,
  Users,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Вспомнить всё — летняя программа для 5–6 классов',
  description:
    'Летняя онлайн-программа по математике и русскому языку для учеников 5–6 классов: повторение, работа с пробелами и подготовка к сентябрю.',
};

const audience = [
  {
    icon: Sparkles,
    title: 'Многое забылось',
    text: 'Вернем основные темы и поможем ребенку снова почувствовать опору в знаниях.',
  },
  {
    icon: Calculator,
    title: 'Есть пробелы по математике',
    text: 'Разберем трудные места и потренируем базовые действия до уверенного навыка.',
  },
  {
    icon: PenLine,
    title: 'Ошибки в русском',
    text: 'Поработаем с орфографией, пунктуацией, письмом и пониманием правил.',
  },
  {
    icon: Leaf,
    title: 'Нужен мягкий старт',
    text: 'Сохраним учебный ритм, чтобы сентябрь не стал резким переходом.',
  },
];

const reasons = [
  'Знания забываются без практики, а короткое повторение помогает сохранить навык.',
  'Математика строится по цепочке, поэтому старые пробелы быстро мешают новым темам.',
  'Русский язык требует регулярности: грамотность закрепляется только через практику.',
  'Летом проще спокойно разобрать слабые места без давления контрольных и домашних заданий.',
  'Ребенку легче начать сентябрь, если он уже видит, что снова справляется.',
  'Регулярные занятия возвращают уверенность без ощущения, что лето превратилось в школу.',
];

const practice = [
  {
    icon: Calculator,
    title: 'Математика',
    text: 'Повторяем ключевые темы 5–6 классов, вычисления, задачи и логику рассуждений.',
  },
  {
    icon: BookOpen,
    title: 'Русский язык',
    text: 'Закрепляем орфографию, пунктуацию, грамотное письмо и работу с правилами.',
  },
  {
    icon: FileText,
    title: 'Работа с текстом',
    text: 'Учимся понимать основную мысль, выделять ключевые слова, пересказывать и писать.',
  },
  {
    icon: Target,
    title: 'Учебная привычка',
    text: 'Сохраняем легкий учебный ритм без перегрузки и гонки за оценками.',
  },
];

const formats = [
  {
    label: 'Русский язык',
    title: 'Летние чаты грамотности',
    description: 'Разбираемся с нюансами русской орфографии и пунктуации в формате Telegram-чата по классам.',
    details: ['9 июня - 30 августа', 'Telegram-чат до 10 человек', 'карточки, аудио, задания и обратная связь'],
    price: '7 000 ₽',
    note: 'при оплате до 4.06.26 - 6 000 ₽',
  },
  {
    label: 'Работа с текстом',
    title: 'Мини-группа по работе с текстом',
    description: 'Для учеников 3–4, 5–6 и 7–8 классов: понимание текста, главное, пересказ и письменная мысль.',
    details: ['9 июня - 20 июля', '3 встречи в неделю по 60–80 минут', 'мини-группа до 6 человек'],
    price: '17 000 ₽',
    note: 'при оплате до 4.06.26 - 15 000 ₽',
  },
];

const gallery = [
  {
    src: '/images/landing/math-practice.png',
    title: 'Практика по математике',
    text: 'Повторяем вычисления, решаем задачи и тренируем базовые навыки в спокойном темпе.',
  },
  {
    src: '/images/landing/russian-reading.png',
    title: 'Русский и работа с текстом',
    text: 'Учимся читать внимательнее, понимать главную мысль, пересказывать и писать увереннее.',
  },
  {
    src: '/images/landing/online-group.png',
    title: 'Онлайн и мини-группы',
    text: 'Живое общение с преподавателем, обратная связь и комфортный формат для летних занятий.',
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#f7f8ff] text-[#1f2937]">
      <header className="sticky top-0 z-20 border-b border-[#e5e7eb]/80 bg-[#f7f8ff]/90 backdrop-blur">
        <div className="mx-auto flex min-h-[68px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3 text-[16px] font-extrabold text-[#4756ce]">
            <span className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#5f6eea] text-white shadow-sm">
              <CheckCircle2 className="h-5 w-5" />
            </span>
            <span>Вспомнить всё</span>
          </Link>
          <nav className="flex items-center gap-2 text-[14px] font-semibold text-[#4b5563]" aria-label="Основная навигация">
            <Link href="/tracking" className="rounded-[8px] px-3 py-2 hover:bg-white">
              Трекинг
            </Link>
            <Link href="/training" className="rounded-[8px] bg-[#1f2937] px-4 py-2 text-white shadow-sm">
              Тренировка
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.08fr_0.92fr] lg:px-8 lg:py-20">
        <div>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-[#fff4df] px-4 py-2 text-[14px] font-bold text-[#9a5b00]">
            <GraduationCap className="h-4 w-4" />
            Летняя онлайн-программа для 5–6 классов
          </div>
          <h1 className="max-w-4xl text-[42px] font-extrabold leading-[0.98] tracking-[-1px] text-[#111827] sm:text-[58px] lg:text-[72px]">
            Вспомнить всё по математике и русскому
          </h1>
          <p className="mt-6 max-w-2xl text-[18px] leading-8 text-[#6b7280] sm:text-[21px]">
            Спокойное летнее повторение без перегрузки: закрываем пробелы, возвращаем учебный ритм и помогаем ребенку увереннее начать новый учебный год.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a href="#formats" className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#5f6eea] px-6 text-[15px] font-bold text-white shadow-[0_12px_28px_rgba(95,110,234,0.28)]">
              Выбрать формат <ArrowRight className="h-4 w-4" />
            </a>
            <Link href="/training" className="inline-flex h-12 items-center justify-center rounded-full bg-white px-6 text-[15px] font-bold text-[#4756ce] shadow-sm">
              Открыть тренировку
            </Link>
          </div>
          <div className="mt-7 flex flex-wrap gap-2 text-[14px] font-semibold text-[#6b7280]">
            {['Онлайн', 'Мини-группы', 'Мягкий летний темп'].map((item) => (
              <span key={item} className="rounded-full border border-[#e5e7eb] bg-white px-4 py-2">
                {item}
              </span>
            ))}
          </div>
        </div>

        <aside className="rounded-[28px] border border-[#e5e7eb] bg-white p-3 shadow-[0_18px_50px_rgba(31,41,55,0.12)]">
          <div className="rounded-[24px] bg-[linear-gradient(160deg,#eef3ff_0%,#f7f3ff_56%,#fff6e6_100%)] p-5 sm:p-7">
            <img
              src="/images/landing/hero-online-study.png"
              alt="Школьник занимается онлайн по математике и русскому языку"
              className="aspect-[4/3] w-full rounded-[20px] object-cover shadow-[0_14px_34px_rgba(95,110,234,0.18)]"
            />
            <div className="mt-5 rounded-[20px] border border-white/80 bg-white/75 p-5">
              <h2 className="text-[20px] font-extrabold text-[#4756ce]">Что делает программа</h2>
              <p className="mt-2 text-[15px] leading-6 text-[#4b5563]">Помогает ребенку не начинать сентябрь с ощущения, что “все забыл”.</p>
              <div className="mt-4 grid gap-3">
                {['повторяем ключевые темы 5–6 классов', 'разбираем слабые места без спешки', 'тренируем счет, письмо, чтение и работу с текстом'].map((item) => (
                  <div key={item} className="flex gap-3 text-[14px] text-[#374151]">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#10b981]" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <MiniStat value="15–30" label="минут короткой практики" />
              <MiniStat value="3" label="встречи в неделю" />
              <MiniStat value="до 6" label="человек в группе" />
            </div>
          </div>
        </aside>
      </section>

      <Section eyebrow="Для кого" title="Кому подойдет программа" text="Для школьников, которые закончили 5 или 6 класс и хотят за лето спокойно повторить математику и русский язык.">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {audience.map((item) => (
            <FeatureCard key={item.title} {...item} />
          ))}
        </div>
      </Section>

      <Section eyebrow="Почему летом" title="Повторение помогает войти в сентябрь спокойнее" text="За лето знания постепенно забываются. Короткие регулярные занятия помогают сохранить навык и закрыть слабые места без давления.">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {reasons.map((reason, index) => (
            <article key={reason} className="rounded-[18px] border border-[#e5e7eb] bg-white p-5 shadow-sm">
              <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-full bg-[#5f6eea] text-[14px] font-extrabold text-white">
                {index + 1}
              </div>
              <p className="text-[15px] leading-6 text-[#4b5563]">{reason}</p>
            </article>
          ))}
        </div>
      </Section>

      <section className="bg-white">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-14 sm:px-6 lg:grid-cols-[0.88fr_1.12fr] lg:px-8 lg:py-20">
          <div className="rounded-[28px] bg-[#4756ce] p-7 text-white shadow-[0_18px_50px_rgba(31,41,55,0.12)] sm:p-9">
            <h2 className="text-[32px] font-extrabold leading-tight sm:text-[44px]">Что будем делать</h2>
            <p className="mt-4 text-[17px] leading-7 text-white/85">
              Занятия построены так, чтобы ребенок не просто “прошел темы”, а вспомнил материал, разобрал ошибки и начал применять знания увереннее.
            </p>
            <Link href="/training" className="mt-7 inline-flex h-12 items-center justify-center rounded-full bg-white px-6 text-[15px] font-bold text-[#4756ce]">
              Перейти в тренировку
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {practice.map((item) => (
              <FeatureCard key={item.title} {...item} />
            ))}
          </div>
        </div>
      </section>

      <Section eyebrow="Как проходят занятия" title="Спокойный формат, живая практика и онлайн-общение" text="Наглядные блоки показывают, как выглядит обучение: индивидуальная практика, работа с текстом и мини-группы онлайн.">
        <div className="grid gap-5 md:grid-cols-3">
          {gallery.map((item) => (
            <article key={item.title} className="overflow-hidden rounded-[22px] border border-[#e5e7eb] bg-white shadow-sm">
              <img src={item.src} alt="" className="aspect-square w-full object-cover" />
              <div className="p-5">
                <h3 className="text-[19px] font-extrabold text-[#111827]">{item.title}</h3>
                <p className="mt-2 text-[14px] leading-6 text-[#6b7280]">{item.text}</p>
              </div>
            </article>
          ))}
        </div>
      </Section>

      <Section id="formats" eyebrow="Форматы" title="Выберите подходящий формат" text="Можно выбрать короткую тренировку грамотности в Telegram-чате или более глубокую работу с текстом в мини-группе.">
        <div className="grid gap-5 lg:grid-cols-2">
          {formats.map((format) => (
            <article key={format.title} className="flex flex-col rounded-[22px] border border-[#e5e7eb] bg-white p-6 shadow-sm">
              <span className="mb-4 w-fit rounded-full bg-[#f2edff] px-3 py-1 text-[13px] font-extrabold text-[#4756ce]">{format.label}</span>
              <h3 className="text-[24px] font-extrabold text-[#111827]">{format.title}</h3>
              <p className="mt-3 text-[15px] leading-6 text-[#6b7280]">{format.description}</p>
              <div className="my-5 grid gap-3 border-y border-[#e5e7eb] py-5">
                {format.details.map((detail) => (
                  <div key={detail} className="flex gap-3 text-[14px] text-[#4b5563]">
                    <ClipboardCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#10b981]" />
                    <span>{detail}</span>
                  </div>
                ))}
              </div>
              <div className="mt-auto rounded-[18px] bg-[#fff4df] p-4">
                <strong className="text-[28px] text-[#8a5200]">{format.price}</strong>
                <span className="block text-[14px] text-[#9a5b00]">{format.note}</span>
              </div>
            </article>
          ))}
        </div>
      </Section>

      <section className="bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8 lg:py-20">
          <div>
            <p className="text-[13px] font-extrabold uppercase tracking-[0.08em] text-[#4756ce]">Преподаватели</p>
            <h2 className="mt-2 text-[32px] font-extrabold leading-tight text-[#111827] sm:text-[44px]">Занятия ведут онлайн-преподаватели</h2>
            <p className="mt-4 text-[17px] leading-7 text-[#6b7280]">
              Главная задача - помочь ребенку понять материал, увидеть свои ошибки и научиться действовать самостоятельно.
            </p>
          </div>
          <div className="grid gap-4">
            <TeacherCard name="Елена Игоревна" text="Онлайн-репетитор по математике и русскому языку. Помогает ученикам 5–6 классов повторить материал и подготовиться к новому учебному году без лишнего стресса." />
            <TeacherCard name="Анна Александровна" text="Нейропедагог и преподаватель русского языка. В основе занятий - работа с целым текстом: понимание, запоминание, пересказ и письменное выражение мысли." />
          </div>
        </div>
      </section>

      <section className="px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-7xl rounded-[28px] bg-[#1f2937] p-7 text-white sm:p-10 lg:p-12">
          <h2 className="max-w-3xl text-[32px] font-extrabold leading-tight sm:text-[44px]">Помогите ребенку начать учебный год увереннее</h2>
          <p className="mt-4 max-w-2xl text-[17px] leading-7 text-white/75">
            Лето можно провести с пользой и без перегрузки. А все прежние тесты, игры и тренажеры теперь доступны в отдельном разделе.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link href="/training" className="inline-flex h-12 items-center justify-center rounded-full bg-white px-6 text-[15px] font-bold text-[#1f2937]">
              Открыть тренировку
            </Link>
            <Link href="/tracking" className="inline-flex h-12 items-center justify-center rounded-full border border-white/40 px-6 text-[15px] font-bold text-white">
              Перейти в трекинг
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#e5e7eb] bg-white px-4 py-7 text-center text-[13px] text-[#6b7280] sm:px-6">
        Вспомнить всё. Летняя программа по математике и русскому языку.
      </footer>
    </main>
  );
}

function Section({
  id,
  eyebrow,
  title,
  text,
  children,
}: {
  id?: string;
  eyebrow: string;
  title: string;
  text: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
      <div className="mb-8 max-w-3xl">
        <p className="text-[13px] font-extrabold uppercase tracking-[0.08em] text-[#4756ce]">{eyebrow}</p>
        <h2 className="mt-2 text-[32px] font-extrabold leading-tight text-[#111827] sm:text-[44px]">{title}</h2>
        <p className="mt-4 text-[17px] leading-7 text-[#6b7280]">{text}</p>
      </div>
      {children}
    </section>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof Sparkles;
  title: string;
  text: string;
}) {
  return (
    <article className="rounded-[20px] border border-[#e5e7eb] bg-white p-6 shadow-sm">
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-[16px] bg-[#eaf0ff] text-[#4756ce]">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-[20px] font-extrabold text-[#111827]">{title}</h3>
      <p className="mt-2 text-[15px] leading-6 text-[#6b7280]">{text}</p>
    </article>
  );
}

function MiniStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-[16px] bg-white/75 p-4 text-center">
      <strong className="block text-[24px] font-extrabold text-[#4756ce]">{value}</strong>
      <span className="text-[12px] leading-4 text-[#6b7280]">{label}</span>
    </div>
  );
}

function TeacherCard({ name, text }: { name: string; text: string }) {
  return (
    <article className="grid gap-4 rounded-[20px] border border-[#e5e7eb] bg-white p-5 shadow-sm sm:grid-cols-[48px_1fr]">
      <div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-[#eaf0ff] text-[#4756ce]">
        <Users className="h-6 w-6" />
      </div>
      <div>
        <h3 className="text-[20px] font-extrabold text-[#111827]">{name}</h3>
        <p className="mt-2 text-[15px] leading-6 text-[#6b7280]">{text}</p>
      </div>
    </article>
  );
}
