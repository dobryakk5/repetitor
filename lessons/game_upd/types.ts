export type Section = 'phonetics' | 'morphology' | 'lexics'
export type GameType = 'game' | 'riddle' | 'puzzle' | 'quiz' | 'crossword'

export interface Game {
  id: string
  title: string
  type: GameType
  section: Section
  sectionTitle: string
  topic: string
  description: string
  source: string
  items?: Item[]
  riddles?: Riddle[]
  quiz?: QuizQuestion[]
  crossword?: Crossword
}

export interface Item {
  question: string
  answer?: string
  hint?: string
}

export interface Riddle {
  text: string
  answer: string
}

export interface QuizQuestion {
  question: string
  answer: string
}

export interface Crossword {
  across: CrosswordClue[]
  down: CrosswordClue[]
}

export interface CrosswordClue {
  number: number
  clue: string
  answer: string
}

export const SECTIONS: Record<Section, { title: string; emoji: string; accent: string; light: string }> = {
  phonetics:  { title: 'Фонетика',   emoji: '🔤', accent: '#8B1A1A', light: '#fff4f0' },
  morphology: { title: 'Морфология', emoji: '📚', accent: '#1A2A8B', light: '#f0f2ff' },
  lexics:     { title: 'Лексика',    emoji: '📖', accent: '#1A5A2A', light: '#f0fff3' },
}

export const GAME_TYPES: Record<GameType, { label: string; emoji: string }> = {
  game:      { label: 'Игра',         emoji: '🎮' },
  riddle:    { label: 'Загадка',      emoji: '🔮' },
  puzzle:    { label: 'Головоломка',  emoji: '🧩' },
  quiz:      { label: 'Викторина',    emoji: '❓' },
  crossword: { label: 'Кроссворд',   emoji: '📝' },
}
