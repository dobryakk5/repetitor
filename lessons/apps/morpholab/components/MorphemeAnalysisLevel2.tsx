// components/MorphemeAnalysisLevel2.tsx
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Новые 12 слов для второго уровня
const WORDS_TO_ANALYZE_LEVEL2 = [
  {
    id: 1,
    word: 'походка',
    morphemes: [
      { text: 'по', type: 'prefix', startIndex: 0, endIndex: 1 },
      { text: 'ход', type: 'root', startIndex: 2, endIndex: 4 },
      { text: 'к', type: 'suffix', startIndex: 5, endIndex: 5 },
      { text: 'а', type: 'ending', startIndex: 6, endIndex: 6 }
    ]
  },
  {
    id: 2,
    word: 'выходной',
    morphemes: [
      { text: 'вы', type: 'prefix', startIndex: 0, endIndex: 1 },
      { text: 'ход', type: 'root', startIndex: 2, endIndex: 4 },
      { text: 'н', type: 'suffix', startIndex: 5, endIndex: 5 },
      { text: 'ой', type: 'ending', startIndex: 6, endIndex: 7 }
    ]
  },
  {
    id: 3,
    word: 'учительница',
    morphemes: [
      { text: 'уч', type: 'root', startIndex: 0, endIndex: 1 },
      { text: 'и', type: 'suffix', startIndex: 2, endIndex: 2 },
      { text: 'тель', type: 'suffix', startIndex: 3, endIndex: 6 },
      { text: 'ниц', type: 'suffix', startIndex: 7, endIndex: 9 },
      { text: 'а', type: 'ending', startIndex: 10, endIndex: 10 }
    ]
  },
  {
    id: 4,
    word: 'пересадка',
    morphemes: [
      { text: 'пере', type: 'prefix', startIndex: 0, endIndex: 3 },
      { text: 'сад', type: 'root', startIndex: 4, endIndex: 6 },
      { text: 'к', type: 'suffix', startIndex: 7, endIndex: 7 },
      { text: 'а', type: 'ending', startIndex: 8, endIndex: 8 }
    ]
  },
  {
    id: 5,
    word: 'заплыв',
    morphemes: [
      { text: 'за', type: 'prefix', startIndex: 0, endIndex: 1 },
      { text: 'плыв', type: 'root', startIndex: 2, endIndex: 5 }
    ]
  },
  {
    id: 6,
    word: 'читатели',
    morphemes: [
      { text: 'чит', type: 'root', startIndex: 0, endIndex: 2 },
      { text: 'а', type: 'suffix', startIndex: 3, endIndex: 3 },
      { text: 'тель', type: 'suffix', startIndex: 4, endIndex: 7 },
      { text: 'и', type: 'ending', startIndex: 8, endIndex: 8 }
    ]
  },
  {
    id: 7,
    word: 'безлунный',
    morphemes: [
      { text: 'без', type: 'prefix', startIndex: 0, endIndex: 2 },
      { text: 'лун', type: 'root', startIndex: 3, endIndex: 5 },
      { text: 'н', type: 'suffix', startIndex: 6, endIndex: 6 },
      { text: 'ый', type: 'ending', startIndex: 7, endIndex: 8 }
    ]
  },
  {
    id: 8,
    word: 'грибочек',
    morphemes: [
      { text: 'гриб', type: 'root', startIndex: 0, endIndex: 3 },
      { text: 'оч', type: 'suffix', startIndex: 4, endIndex: 5 },
      { text: 'ек', type: 'suffix', startIndex: 6, endIndex: 7 }
    ]
  },
  {
    id: 9,
    word: 'прилетели',
    morphemes: [
      { text: 'при', type: 'prefix', startIndex: 0, endIndex: 2 },
      { text: 'лет', type: 'root', startIndex: 3, endIndex: 5 },
      { text: 'е', type: 'suffix', startIndex: 6, endIndex: 6 },
      { text: 'л', type: 'suffix', startIndex: 7, endIndex: 7 },
      { text: 'и', type: 'ending', startIndex: 8, endIndex: 8 }
    ]
  },
  {
    id: 10,
    word: 'подводник',
    morphemes: [
      { text: 'под', type: 'prefix', startIndex: 0, endIndex: 2 },
      { text: 'вод', type: 'root', startIndex: 3, endIndex: 5 },
      { text: 'ник', type: 'suffix', startIndex: 6, endIndex: 8 }
    ]
  },
  {
    id: 11,
    word: 'бесшумный',
    morphemes: [
      { text: 'бес', type: 'prefix', startIndex: 0, endIndex: 2 },
      { text: 'шум', type: 'root', startIndex: 3, endIndex: 5 },
      { text: 'н', type: 'suffix', startIndex: 6, endIndex: 6 },
      { text: 'ый', type: 'ending', startIndex: 7, endIndex: 8 }
    ]
  },
  {
    id: 12,
    word: 'цветной',
    morphemes: [
      { text: 'цвет', type: 'root', startIndex: 0, endIndex: 3 },
      { text: 'н', type: 'suffix', startIndex: 4, endIndex: 4 },
      { text: 'ой', type: 'ending', startIndex: 5, endIndex: 6 }
    ]
  }
];

const MORPHEME_TYPES = [
  { type: 'prefix', label: 'Приставка', color: '#3B82F6', icon: '→' },
  { type: 'root', label: 'Корень', color: '#10B981', icon: '■' },
  { type: 'suffix', label: 'Суффикс', color: '#F59E0B', icon: '▲' },
  { type: 'ending', label: 'Окончание', color: '#EF4444', icon: '●' }
];

type LetterState = {
  isSelected: boolean;
  morphemeIndex: number | null; // Индекс морфемы, к которой относится
  isCorrect: boolean | null;
};

export default function MorphemeAnalysisLevel2() {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [letterStates, setLetterStates] = useState<LetterState[]>([]);
  const [selectedLetters, setSelectedLetters] = useState<number[]>([]);
  const [completedMorphemes, setCompletedMorphemes] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [wrongAnswerType, setWrongAnswerType] = useState<string | null>(null);

  const currentWord = WORDS_TO_ANALYZE_LEVEL2[currentWordIndex];
  const letters = currentWord.word.split('');

  // Инициализация состояний букв
  if (letterStates.length !== letters.length) {
    setLetterStates(letters.map(() => ({ isSelected: false, morphemeIndex: null, isCorrect: null })));
  }

  const handleLetterClick = (index: number) => {
    // Если буква уже в правильной морфеме, не трогаем
    if (letterStates[index]?.isCorrect === true) return;

    const newSelectedLetters = [...selectedLetters];
    const letterIndex = newSelectedLetters.indexOf(index);

    if (letterIndex > -1) {
      // Снимаем выделение
      newSelectedLetters.splice(letterIndex, 1);
    } else {
      // Добавляем выделение
      newSelectedLetters.push(index);
    }

    // Сортируем для правильного порядка
    newSelectedLetters.sort((a, b) => a - b);
    setSelectedLetters(newSelectedLetters);
  };

  const handleTypeSelect = (type: string) => {
    if (selectedLetters.length === 0) return;

    // Проверяем, является ли выделение правильной морфемой
    const selectedText = selectedLetters.map(i => letters[i]).join('');
    const startIndex = selectedLetters[0];
    const endIndex = selectedLetters[selectedLetters.length - 1];

    // Ищем соответствующую морфему
    const correctMorpheme = currentWord.morphemes.find(
      m => m.startIndex === startIndex && 
           m.endIndex === endIndex && 
           m.type === type &&
           m.text === selectedText
    );

    if (correctMorpheme) {
      // Правильно!
      const morphemeIndex = currentWord.morphemes.indexOf(correctMorpheme);
      const newLetterStates = [...letterStates];
      
      selectedLetters.forEach(i => {
        newLetterStates[i] = {
          isSelected: false,
          morphemeIndex: morphemeIndex,
          isCorrect: true
        };
      });

      setLetterStates(newLetterStates);
      setCompletedMorphemes([...completedMorphemes, morphemeIndex]);
      setSelectedLetters([]);
      setScore(score + 10);
    } else {
      // Неправильно - анимация исчезновения кнопки и сброс
      setWrongAnswerType(type);

      setTimeout(() => {
        // Сбрасываем всё слово
        setLetterStates(letters.map(() => ({ isSelected: false, morphemeIndex: null, isCorrect: null })));
        setSelectedLetters([]);
        setCompletedMorphemes([]);
        setWrongAnswerType(null);
      }, 1000);
    }
  };

  const handleNextWord = () => {
    if (currentWordIndex < WORDS_TO_ANALYZE_LEVEL2.length - 1) {
      setCurrentWordIndex(currentWordIndex + 1);
      setLetterStates([]);
      setSelectedLetters([]);
      setCompletedMorphemes([]);
    }
  };

  const isWordComplete = completedMorphemes.length === currentWord.morphemes.length;

  const getLetterColor = (index: number) => {
    const state = letterStates[index];
    
    if (state?.isCorrect === true && state.morphemeIndex !== null) {
      // Правильная морфема - цвет её типа
      const morpheme = currentWord.morphemes[state.morphemeIndex];
      return MORPHEME_TYPES.find(t => t.type === morpheme.type)?.color || '#E5E7EB';
    } else if (selectedLetters.includes(index)) {
      // Выделенная буква
      return '#A78BFA';
    }
    
    return '#E5E7EB'; // Серый по умолчанию
  };

  const getLetterBorderColor = (index: number) => {
    if (selectedLetters.includes(index)) return '#7C3AED';
    return 'transparent';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-600 p-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 shadow-2xl mb-6"
        >
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-pink-600 bg-clip-text text-transparent">
              🔍 Разбор по буквам (Уровень 2)
            </h1>
            <div className="flex gap-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">Очки</p>
                <p className="text-2xl font-bold text-purple-600">{score}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Слово</p>
                <p className="text-2xl font-bold text-indigo-600">
                  {currentWordIndex + 1}/{WORDS_TO_ANALYZE_LEVEL2.length}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Main Game Area */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl p-8 shadow-2xl mb-6"
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            Выдели морфему и определи её тип
          </h2>

          {/* Word as Letters */}
          <div className="mb-8">
            <p className="text-center text-gray-600 mb-4">Слово:</p>
            <div className="flex justify-center items-center gap-1 flex-wrap">
              {(() => {
                const elements = [];
                let i = 0;
                
                while (i < letters.length) {
                  const state = letterStates[i];
                  
                  // Если буква в правильной морфеме, показываем весь блок морфемы
                  if (state?.isCorrect === true && state.morphemeIndex !== null) {
                    const morpheme = currentWord.morphemes[state.morphemeIndex];
                    const morphemeType = MORPHEME_TYPES.find(t => t.type === morpheme.type);
                    
                    // Пропускаем, если этот блок уже показали
                    if (i === morpheme.startIndex) {
                      elements.push(
                        <motion.div
                          key={`morpheme-${state.morphemeIndex}`}
                          initial={{ scale: 0.5, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="relative px-6 py-4 rounded-xl font-bold text-2xl text-white shadow-lg"
                          style={{ backgroundColor: morphemeType?.color }}
                        >
                          {morpheme.text}
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg"
                          >
                            ✓
                          </motion.span>
                        </motion.div>
                      );
                    }
                    i++;
                  } else {
                    // Отдельная буква
                    const index = i;
                    elements.push(
                      <motion.button
                        key={`letter-${index}`}
                        onClick={() => handleLetterClick(index)}
                        disabled={state?.isCorrect === true}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        whileHover={state?.isCorrect !== true ? { scale: 1.1 } : {}}
                        whileTap={state?.isCorrect !== true ? { scale: 0.95 } : {}}
                        transition={{ delay: index * 0.05 }}
                        className="relative w-12 h-16 rounded-lg font-bold text-2xl transition-all"
                        style={{
                          backgroundColor: getLetterColor(index),
                          border: `3px solid ${getLetterBorderColor(index)}`,
                          color: selectedLetters.includes(index) ? 'white' : '#1F2937',
                          cursor: state?.isCorrect === true ? 'default' : 'pointer'
                        }}
                      >
                        {letters[index]}
                      </motion.button>
                    );
                    i++;
                  }
                }
                
                return elements;
              })()}
            </div>
          </div>

          {/* Selection Info */}
          <div className="text-center mb-6">
            {selectedLetters.length > 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <p className="text-lg text-purple-600 font-medium mb-2">
                  Выделено: <span className="font-bold">{selectedLetters.map(i => letters[i]).join('')}</span>
                </p>
                <p className="text-sm text-gray-600">
                  Выбери тип морфемы снизу
                </p>
              </motion.div>
            ) : (
              <p className="text-lg text-gray-600">
                Нажимай на буквы, чтобы выделить морфему
              </p>
            )}
          </div>

          {/* Type Selector */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {MORPHEME_TYPES.map((type) => (
              <motion.button
                key={type.type}
                onClick={() => handleTypeSelect(type.type)}
                disabled={selectedLetters.length === 0}
                animate={{
                  opacity: wrongAnswerType === type.type ? [1, 1, 0] : 1,
                  scale: wrongAnswerType === type.type ? [1, 1.1, 0.8, 0] : 1
                }}
                transition={{
                  duration: 1,
                  times: wrongAnswerType === type.type ? [0, 0.3, 0.7, 1] : [0, 1]
                }}
                whileHover={selectedLetters.length > 0 && wrongAnswerType !== type.type ? { scale: 1.05 } : {}}
                whileTap={selectedLetters.length > 0 && wrongAnswerType !== type.type ? { scale: 0.95 } : {}}
                className="p-6 rounded-xl font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                style={{ backgroundColor: type.color }}
              >
                <div className="text-3xl mb-2">{type.icon}</div>
                <div className="text-lg">{type.label}</div>
              </motion.button>
            ))}
          </div>

          {/* Next Word Button */}
          <div className="flex gap-4 justify-center">
            {isWordComplete && currentWordIndex < WORDS_TO_ANALYZE_LEVEL2.length - 1 && (
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                onClick={handleNextWord}
                className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold shadow-lg transition-all hover:scale-105"
              >
                Следующее слово →
              </motion.button>
            )}
          </div>

          {/* Result Message */}
          <AnimatePresence>
            {isWordComplete && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mt-6 bg-green-100 border-4 border-green-500 rounded-xl p-6 text-center"
              >
                <div className="text-4xl mb-2">🎉</div>
                <p className="text-2xl font-bold text-green-700">Отлично!</p>
                <p className="text-green-600">Слово разобрано правильно!</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Final Result */}
        {currentWordIndex === WORDS_TO_ANALYZE_LEVEL2.length - 1 && isWordComplete && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl p-8 shadow-2xl text-center text-white"
          >
            <div className="text-6xl mb-4">🏆</div>
            <h2 className="text-3xl font-bold mb-2">Поздравляем!</h2>
            <p className="text-xl mb-4">Уровень 2 пройден!</p>
            <p className="text-2xl font-bold">Итоговый счёт: {score} очков</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
