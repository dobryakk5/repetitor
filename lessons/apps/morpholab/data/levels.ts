// data/levels.ts
import { Level } from '../types/morphology';
import { ROOTS, ENDINGS, SUFFIXES, PREFIXES } from './morphemes';

export const LEVELS: Level[] = [
  // Уровень 1: Только корень + окончание
  {
    id: 1,
    title: 'Основы',
    description: 'Собери простое слово из корня и окончания',
    targetMeaning: 'Процесс полёта',
    targetWord: 'полет',
    availableMorphemes: [
      PREFIXES.find(m => m.id === 'prefix_po')!,
      ROOTS.find(m => m.id === 'root_let')!,
      ENDINGS.find(m => m.id === 'ending_null')!,
    ],
    difficulty: 'easy',
    maxMorphemes: 3,
    hints: [
      'Начни с приставки',
      'Добавь корень, связанный с полётом',
      'Закончи нулевым окончанием'
    ]
  },

  // Уровень 2: Корень + суффикс + окончание
  {
    id: 2,
    title: 'Профессия',
    description: 'Собери слово, обозначающее профессию',
    targetMeaning: 'Человек, который учит',
    targetWord: 'учитель',
    availableMorphemes: [
      ROOTS.find(m => m.id === 'root_uch')!,
      SUFFIXES.find(m => m.id === 'suffix_tel')!,
      ENDINGS.find(m => m.id === 'ending_null')!,
      // Лишние для усложнения
      SUFFIXES.find(m => m.id === 'suffix_ik')!,
      ENDINGS.find(m => m.id === 'ending_a')!,
    ],
    difficulty: 'easy',
    maxMorphemes: 3,
    hints: [
      'Корень связан с учёбой',
      'Суффикс обозначает профессию',
      'Нулевое окончание'
    ]
  },

  // Уровень 3: Приставка + корень + суффикс + окончание
  {
    id: 3,
    title: 'Сложное слово',
    description: 'Собери слово из 4 частей',
    targetMeaning: 'Человек, который переписывает',
    targetWord: 'переписчик',
    availableMorphemes: [
      PREFIXES.find(m => m.id === 'prefix_pere')!,
      PREFIXES.find(m => m.id === 'prefix_po')!,
      ROOTS.find(m => m.id === 'root_pis')!,
      SUFFIXES.find(m => m.id === 'suffix_chik')!,
      SUFFIXES.find(m => m.id === 'suffix_tel')!,
      ENDINGS.find(m => m.id === 'ending_null')!,
      ENDINGS.find(m => m.id === 'ending_a')!,
    ],
    difficulty: 'medium',
    maxMorphemes: 4,
    hints: [
      'Приставка означает повтор',
      'Корень - писать',
      'Суффикс профессии',
      'Мужской род'
    ]
  },

  // Уровень 4: Свободное составление
  {
    id: 4,
    title: 'Строитель',
    description: 'Собери название профессии',
    targetMeaning: 'Человек, который строит',
    targetWord: 'строитель',
    availableMorphemes: [
      ROOTS.find(m => m.id === 'root_stro')!,
      ROOTS.find(m => m.id === 'root_uch')!,
      SUFFIXES.find(m => m.id === 'suffix_tel')!,
      SUFFIXES.find(m => m.id === 'suffix_chik')!,
      ENDINGS.find(m => m.id === 'ending_null')!,
      ENDINGS.find(m => m.id === 'ending_i')!,
    ],
    difficulty: 'medium',
    maxMorphemes: 3,
    hints: [
      'Корень - строить',
      'Суффикс профессии (-тель)',
      'Единственное число'
    ]
  },

  // Уровень 5: Множество вариантов
  {
    id: 5,
    title: 'Место для выхода',
    description: 'Собери слово, означающее место',
    targetMeaning: 'Место для выхода',
    targetWord: 'выход',
    availableMorphemes: [
      PREFIXES.find(m => m.id === 'prefix_vy')!,
      PREFIXES.find(m => m.id === 'prefix_pro')!,
      ROOTS.find(m => m.id === 'root_hod')!,
      ROOTS.find(m => m.id === 'root_let')!,
      ENDINGS.find(m => m.id === 'ending_null')!,
      ENDINGS.find(m => m.id === 'ending_a')!,
    ],
    difficulty: 'easy',
    maxMorphemes: 3,
    hints: [
      'Приставка - движение наружу',
      'Корень - ходить',
      'Мужской род'
    ]
  },

  // Уровень 6: Читатель
  {
    id: 6,
    title: 'Любитель книг',
    description: 'Собери слово о человеке, который читает',
    targetMeaning: 'Человек, который читает',
    targetWord: 'читатель',
    availableMorphemes: [
      ROOTS.find(m => m.id === 'root_chit')!,
      ROOTS.find(m => m.id === 'root_pis')!,
      SUFFIXES.find(m => m.id === 'suffix_a')!,
      SUFFIXES.find(m => m.id === 'suffix_tel')!,
      SUFFIXES.find(m => m.id === 'suffix_ik')!,
      ENDINGS.find(m => m.id === 'ending_null')!,
      ENDINGS.find(m => m.id === 'ending_i')!,
    ],
    difficulty: 'medium',
    maxMorphemes: 4,
    hints: [
      'Корень - читать',
      'Суффикс действия (-а-)',
      'Суффикс профессии (-тель)',
      'Единственное число'
    ]
  },

  // Уровень 7: С падежом
  {
    id: 7,
    title: 'Творительный падеж',
    description: 'Собери слово в творительном падеже',
    targetMeaning: 'Полётом (чем?)',
    targetWord: 'полетом',
    availableMorphemes: [
      PREFIXES.find(m => m.id === 'prefix_po')!,
      PREFIXES.find(m => m.id === 'prefix_pere')!,
      ROOTS.find(m => m.id === 'root_let')!,
      ENDINGS.find(m => m.id === 'ending_null')!,
      ENDINGS.find(m => m.id === 'ending_om')!,
      ENDINGS.find(m => m.id === 'ending_a')!,
    ],
    difficulty: 'hard',
    maxMorphemes: 3,
    hints: [
      'Приставка начала действия',
      'Корень - лететь',
      'Окончание творительного падежа (-ом)'
    ]
  },

  // Уровень 8: Сложный с суффиксом
  {
    id: 8,
    title: 'Манера ходьбы',
    description: 'Собери слово, означающее манеру',
    targetMeaning: 'Манера ходить',
    targetWord: 'походка',
    availableMorphemes: [
      PREFIXES.find(m => m.id === 'prefix_po')!,
      PREFIXES.find(m => m.id === 'prefix_za')!,
      ROOTS.find(m => m.id === 'root_hod')!,
      ROOTS.find(m => m.id === 'root_pis')!,
      SUFFIXES.find(m => m.id === 'suffix_k')!,
      SUFFIXES.find(m => m.id === 'suffix_ik')!,
      ENDINGS.find(m => m.id === 'ending_a')!,
      ENDINGS.find(m => m.id === 'ending_null')!,
    ],
    difficulty: 'hard',
    maxMorphemes: 4,
    hints: [
      'Приставка начала действия',
      'Корень - ходить',
      'Суффикс результата (-к-)',
      'Женский род'
    ]
  },

  // Уровень 9: Свободный выбор из большого набора
  {
    id: 9,
    title: 'Запись',
    description: 'Собери слово о том, что записано',
    targetMeaning: 'То, что записано',
    targetWord: 'запись',
    availableMorphemes: [
      PREFIXES.find(m => m.id === 'prefix_za')!,
      PREFIXES.find(m => m.id === 'prefix_po')!,
      PREFIXES.find(m => m.id === 'prefix_pere')!,
      ROOTS.find(m => m.id === 'root_pis')!,
      ROOTS.find(m => m.id === 'root_let')!,
      SUFFIXES.find(m => m.id === 'suffix_k')!,
      ENDINGS.find(m => m.id === 'ending_null')!,
      ENDINGS.find(m => m.id === 'ending_a')!,
      ENDINGS.find(m => m.id === 'ending_i')!,
    ],
    difficulty: 'medium',
    maxMorphemes: 3,
    hints: [
      'Приставка завершения',
      'Корень - писать',
      'Женский род'
    ]
  },

  // Уровень 10: Финальный челлендж
  {
    id: 10,
    title: 'Мастер-класс',
    description: 'Собери любое правильное слово!',
    availableMorphemes: [
      ...PREFIXES.slice(0, 3),
      ...ROOTS.slice(0, 4),
      ...SUFFIXES.slice(0, 3),
      ...ENDINGS.slice(0, 4),
    ],
    difficulty: 'hard',
    maxMorphemes: 5,
    hints: [
      'Любое правильное слово из доступных морфем',
      'Проверь логику соединения',
      'Помни о грамматических правилах'
    ]
  }
];
