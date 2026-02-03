// types/morphology.ts

export type MorphemeType = 'prefix' | 'root' | 'suffix' | 'ending';

export interface Morpheme {
  id: string;
  text: string;
  type: MorphemeType;
  meaning?: string; // Значение морфемы
  canAttachLeft: MorphemeType[]; // Что может быть слева
  canAttachRight: MorphemeType[]; // Что может быть справа
  shape: 'arrow' | 'rectangle' | 'trapezoid' | 'circle'; // Форма для визуализации
  color: string; // Цвет морфемы
}

export interface WordConstruction {
  morphemes: Morpheme[];
  isValid: boolean;
  word?: string;
  meaning?: string;
  explanation?: string;
}

export interface Level {
  id: number;
  title: string;
  description: string;
  targetWord?: string;
  targetMeaning?: string;
  availableMorphemes: Morpheme[];
  difficulty: 'easy' | 'medium' | 'hard';
  maxMorphemes: number;
  hints?: string[];
}

export interface GameState {
  currentLevel: number;
  score: number;
  wordsCompleted: string[];
  attempts: number;
  construction: Morpheme[];
  mode: 'campaign' | 'exam' | 'hardcore' | 'sandbox';
}

export interface ConnectionPoint {
  type: MorphemeType;
  position: 'left' | 'right';
  accepts: MorphemeType[];
}
