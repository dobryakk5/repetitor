// data/morphemes.ts
import { Morpheme } from '../types/morphology';

export const PREFIXES: Morpheme[] = [
  {
    id: 'prefix_po',
    text: 'по',
    type: 'prefix',
    meaning: 'начало действия',
    canAttachLeft: [],
    canAttachRight: ['root'],
    shape: 'arrow',
    color: '#3B82F6' // blue
  },
  {
    id: 'prefix_za',
    text: 'за',
    type: 'prefix',
    meaning: 'начало или завершение',
    canAttachLeft: [],
    canAttachRight: ['root'],
    shape: 'arrow',
    color: '#3B82F6'
  },
  {
    id: 'prefix_pere',
    text: 'пере',
    type: 'prefix',
    meaning: 'повтор или изменение',
    canAttachLeft: [],
    canAttachRight: ['root'],
    shape: 'arrow',
    color: '#3B82F6'
  },
  {
    id: 'prefix_pro',
    text: 'про',
    type: 'prefix',
    meaning: 'движение через',
    canAttachLeft: [],
    canAttachRight: ['root'],
    shape: 'arrow',
    color: '#3B82F6'
  },
  {
    id: 'prefix_vy',
    text: 'вы',
    type: 'prefix',
    meaning: 'движение наружу',
    canAttachLeft: [],
    canAttachRight: ['root'],
    shape: 'arrow',
    color: '#3B82F6'
  }
];

export const ROOTS: Morpheme[] = [
  {
    id: 'root_let',
    text: 'лет',
    type: 'root',
    meaning: 'летать',
    canAttachLeft: ['prefix'],
    canAttachRight: ['suffix', 'ending'],
    shape: 'rectangle',
    color: '#10B981' // green
  },
  {
    id: 'root_pis',
    text: 'пис',
    type: 'root',
    meaning: 'писать',
    canAttachLeft: ['prefix'],
    canAttachRight: ['suffix', 'ending'],
    shape: 'rectangle',
    color: '#10B981'
  },
  {
    id: 'root_hod',
    text: 'ход',
    type: 'root',
    meaning: 'ходить',
    canAttachLeft: ['prefix'],
    canAttachRight: ['suffix', 'ending'],
    shape: 'rectangle',
    color: '#10B981'
  },
  {
    id: 'root_uch',
    text: 'уч',
    type: 'root',
    meaning: 'учить',
    canAttachLeft: ['prefix'],
    canAttachRight: ['suffix', 'ending'],
    shape: 'rectangle',
    color: '#10B981'
  },
  {
    id: 'root_chit',
    text: 'чит',
    type: 'root',
    meaning: 'читать',
    canAttachLeft: ['prefix'],
    canAttachRight: ['suffix', 'ending'],
    shape: 'rectangle',
    color: '#10B981'
  },
  {
    id: 'root_stro',
    text: 'стро',
    type: 'root',
    meaning: 'строить',
    canAttachLeft: ['prefix'],
    canAttachRight: ['suffix', 'ending'],
    shape: 'rectangle',
    color: '#10B981'
  }
];

export const SUFFIXES: Morpheme[] = [
  {
    id: 'suffix_tel',
    text: 'тель',
    type: 'suffix',
    meaning: 'профессия, деятель',
    canAttachLeft: ['root'],
    canAttachRight: ['ending'],
    shape: 'trapezoid',
    color: '#F59E0B' // amber
  },
  {
    id: 'suffix_ik',
    text: 'ик',
    type: 'suffix',
    meaning: 'уменьшительное',
    canAttachLeft: ['root'],
    canAttachRight: ['ending'],
    shape: 'trapezoid',
    color: '#F59E0B'
  },
  {
    id: 'suffix_chik',
    text: 'чик',
    type: 'suffix',
    meaning: 'профессия',
    canAttachLeft: ['root'],
    canAttachRight: ['ending'],
    shape: 'trapezoid',
    color: '#F59E0B'
  },
  {
    id: 'suffix_a',
    text: 'а',
    type: 'suffix',
    meaning: 'действие',
    canAttachLeft: ['root'],
    canAttachRight: ['ending'],
    shape: 'trapezoid',
    color: '#F59E0B'
  },
  {
    id: 'suffix_k',
    text: 'к',
    type: 'suffix',
    meaning: 'результат действия',
    canAttachLeft: ['root'],
    canAttachRight: ['ending'],
    shape: 'trapezoid',
    color: '#F59E0B'
  }
];

export const ENDINGS: Morpheme[] = [
  {
    id: 'ending_null',
    text: '∅',
    type: 'ending',
    meaning: 'нулевое окончание',
    canAttachLeft: ['root', 'suffix'],
    canAttachRight: [],
    shape: 'circle',
    color: '#EF4444' // red
  },
  {
    id: 'ending_a',
    text: 'а',
    type: 'ending',
    meaning: 'жен.род, ед.число',
    canAttachLeft: ['root', 'suffix'],
    canAttachRight: [],
    shape: 'circle',
    color: '#EF4444'
  },
  {
    id: 'ending_u',
    text: 'у',
    type: 'ending',
    meaning: 'вин.падеж',
    canAttachLeft: ['root', 'suffix'],
    canAttachRight: [],
    shape: 'circle',
    color: '#EF4444'
  },
  {
    id: 'ending_om',
    text: 'ом',
    type: 'ending',
    meaning: 'твор.падеж',
    canAttachLeft: ['root', 'suffix'],
    canAttachRight: [],
    shape: 'circle',
    color: '#EF4444'
  },
  {
    id: 'ending_i',
    text: 'и',
    type: 'ending',
    meaning: 'мн.число',
    canAttachLeft: ['root', 'suffix'],
    canAttachRight: [],
    shape: 'circle',
    color: '#EF4444'
  },
  {
    id: 'ending_e',
    text: 'е',
    type: 'ending',
    meaning: 'ср.род / пр.падеж',
    canAttachLeft: ['root', 'suffix'],
    canAttachRight: [],
    shape: 'circle',
    color: '#EF4444'
  }
];

// Словарь правильных слов
export const VALID_WORDS: Record<string, { meaning: string; morphemes: string[] }> = {
  'учитель': {
    meaning: 'Человек, который учит',
    morphemes: ['уч', 'и', 'тель', '∅']
  },
  'полет': {
    meaning: 'Процесс полёта',
    morphemes: ['по', 'лет', '∅']
  },
  'перелет': {
    meaning: 'Полёт с одного места в другое',
    morphemes: ['пере', 'лет', '∅']
  },
  'переписчик': {
    meaning: 'Человек, который переписывает',
    morphemes: ['пере', 'пис', 'чик', '∅']
  },
  'проход': {
    meaning: 'Место для прохода',
    morphemes: ['про', 'ход', '∅']
  },
  'выход': {
    meaning: 'Место для выхода',
    morphemes: ['вы', 'ход', '∅']
  },
  'писатель': {
    meaning: 'Человек, который пишет',
    morphemes: ['пис', 'а', 'тель', '∅']
  },
  'читатель': {
    meaning: 'Человек, который читает',
    morphemes: ['чит', 'а', 'тель', '∅']
  },
  'строитель': {
    meaning: 'Человек, который строит',
    morphemes: ['стро', 'и', 'тель', '∅']
  },
  'походка': {
    meaning: 'Манера ходить',
    morphemes: ['по', 'ход', 'к', 'а']
  },
  'запись': {
    meaning: 'То, что записано',
    morphemes: ['за', 'пис', '∅']
  },
  'полетом': {
    meaning: 'Процесс полёта (твор.падеж)',
    morphemes: ['по', 'лет', 'ом']
  }
};

export const ALL_MORPHEMES = [...PREFIXES, ...ROOTS, ...SUFFIXES, ...ENDINGS];
