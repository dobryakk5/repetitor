// components/MorphemeAnalysisGame.tsx
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Слова для разбора с правильными ответами
const WORDS_TO_ANALYZE = [
  {
    id: 1,
    word: 'подснежник',
    morphemes: [
      { text: 'под', type: 'prefix', meaning: 'приставка' },
      { text: 'снеж', type: 'root', meaning: 'корень' },
      { text: 'ник', type: 'suffix', meaning: 'суффикс' }
    ]
  },
  {
    id: 2,
    word: 'перелесок',
    morphemes: [
      { text: 'пере', type: 'prefix', meaning: 'приставка' },
      { text: 'лес', type: 'root', meaning: 'корень' },
      { text: 'ок', type: 'suffix', meaning: 'суффикс' }
    ]
  },
  {
    id: 3,
    word: 'пришкольный',
    morphemes: [
      { text: 'при', type: 'prefix', meaning: 'приставка' },
      { text: 'школь', type: 'root', meaning: 'корень' },
      { text: 'н', type: 'suffix', meaning: 'суффикс' },
      { text: 'ый', type: 'ending', meaning: 'окончание' }
    ]
  },
  {
    id: 4,
    word: 'домик',
    morphemes: [
      { text: 'дом', type: 'root', meaning: 'корень' },
      { text: 'ик', type: 'suffix', meaning: 'суффикс' }
    ]
  },
  {
    id: 5,
    word: 'заморозки',
    morphemes: [
      { text: 'за', type: 'prefix', meaning: 'приставка' },
      { text: 'мороз', type: 'root', meaning: 'корень' },
      { text: 'к', type: 'suffix', meaning: 'суффикс' },
      { text: 'и', type: 'ending', meaning: 'окончание' }
    ]
  },
  {
    id: 6,
    word: 'рыбак',
    morphemes: [
      { text: 'рыб', type: 'root', meaning: 'корень' },
      { text: 'ак', type: 'suffix', meaning: 'суффикс' }
    ]
  },
  {
    id: 7,
    word: 'беззаботный',
    morphemes: [
      { text: 'без', type: 'prefix', meaning: 'приставка' },
      { text: 'забот', type: 'root', meaning: 'корень' },
      { text: 'н', type: 'suffix', meaning: 'суффикс' },
      { text: 'ый', type: 'ending', meaning: 'окончание' }
    ]
  },
  {
    id: 8,
    word: 'листочек',
    morphemes: [
      { text: 'лист', type: 'root', meaning: 'корень' },
      { text: 'оч', type: 'suffix', meaning: 'суффикс' },
      { text: 'ек', type: 'suffix', meaning: 'суффикс' }
    ]
  },
  {
    id: 9,
    word: 'переписка',
    morphemes: [
      { text: 'пере', type: 'prefix', meaning: 'приставка' },
      { text: 'пис', type: 'root', meaning: 'корень' },
      { text: 'к', type: 'suffix', meaning: 'суффикс' },
      { text: 'а', type: 'ending', meaning: 'окончание' }
    ]
  },
  {
    id: 10,
    word: 'садовник',
    morphemes: [
      { text: 'сад', type: 'root', meaning: 'корень' },
      { text: 'ов', type: 'suffix', meaning: 'суффикс' },
      { text: 'ник', type: 'suffix', meaning: 'суффикс' }
    ]
  },
  {
    id: 11,
    word: 'прибрежный',
    morphemes: [
      { text: 'при', type: 'prefix', meaning: 'приставка' },
      { text: 'береж', type: 'root', meaning: 'корень' },
      { text: 'н', type: 'suffix', meaning: 'суффикс' },
      { text: 'ый', type: 'ending', meaning: 'окончание' }
    ]
  },
  {
    id: 12,
    word: 'грибной',
    morphemes: [
      { text: 'гриб', type: 'root', meaning: 'корень' },
      { text: 'н', type: 'suffix', meaning: 'суффикс' },
      { text: 'ой', type: 'ending', meaning: 'окончание' }
    ]
  }
];

// Типы морфем для выбора
const MORPHEME_TYPES = [
  { 
    type: 'prefix', 
    label: 'Приставка', 
    color: '#3B82F6',
    icon: '→'
  },
  { 
    type: 'root', 
    label: 'Корень', 
    color: '#10B981',
    icon: '■'
  },
  { 
    type: 'suffix', 
    label: 'Суффикс', 
    color: '#F59E0B',
    icon: '▲'
  },
  { 
    type: 'ending', 
    label: 'Окончание', 
    color: '#EF4444',
    icon: '●'
  }
];

type MorphemeAnswer = {
  selectedType: string | null;
  isCorrect: boolean | null;
};

export default function MorphemeAnalysisGame() {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [answers, setAnswers] = useState<MorphemeAnswer[]>([]);
  const [selectedMorphemeIndex, setSelectedMorphemeIndex] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [wrongAnswerType, setWrongAnswerType] = useState<string | null>(null);

  const currentWord = WORDS_TO_ANALYZE[currentWordIndex];

  // Инициализация ответов для текущего слова
  if (answers.length !== currentWord.morphemes.length) {
    setAnswers(currentWord.morphemes.map(() => ({ selectedType: null, isCorrect: null })));
  }

  const handleMorphemeClick = (index: number) => {
    // Если морфема уже проверена, не даем ее выбрать снова
    if (answers[index]?.isCorrect !== null) return;
    setSelectedMorphemeIndex(index);
  };

  const handleTypeSelect = (type: string) => {
    if (selectedMorphemeIndex === null) return;

    const correctType = currentWord.morphemes[selectedMorphemeIndex].type;
    const isCorrect = type === correctType;

    const newAnswers = [...answers];
    newAnswers[selectedMorphemeIndex] = {
      selectedType: type,
      isCorrect: isCorrect
    };
    setAnswers(newAnswers);

    if (isCorrect) {
      setScore(score + 10);
      setSelectedMorphemeIndex(null);
    } else {
      // Неправильный ответ - запускаем анимацию исчезновения кнопки
      setWrongAnswerType(type);
      
      // Через секунду сбрасываем всё
      setTimeout(() => {
        setAnswers([]);
        setSelectedMorphemeIndex(null);
        setWrongAnswerType(null);
      }, 1000);
    }
  };

  const handleNextWord = () => {
    if (currentWordIndex < WORDS_TO_ANALYZE.length - 1) {
      setCurrentWordIndex(currentWordIndex + 1);
      setAnswers([]);
      setSelectedMorphemeIndex(null);
    }
  };

  const isWordComplete = answers.every(a => a.isCorrect === true);
  const allAnswered = answers.every(a => a.selectedType !== null);

  const getMorphemeColor = (index: number) => {
    const answer = answers[index];
    const morpheme = currentWord.morphemes[index];
    
    if (answer?.isCorrect === true) {
      const typeColor = MORPHEME_TYPES.find(t => t.type === morpheme.type)?.color;
      return typeColor;
    } else if (answer?.isCorrect === false) {
      return '#EF4444';
    } else if (selectedMorphemeIndex === index) {
      return '#A78BFA';
    }
    
    return '#E5E7EB';
  };

  const getMorphemeBorderColor = (index: number) => {
    if (selectedMorphemeIndex === index) return '#7C3AED';
    return 'transparent';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 p-4">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 shadow-2xl mb-6"
        >
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              🔍 Разобрать морфемки
            </h1>
            <div className="flex gap-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">Очки</p>
                <p className="text-2xl font-bold text-purple-600">{score}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Слово</p>
                <p className="text-2xl font-bold text-blue-600">
                  {currentWordIndex + 1}/{WORDS_TO_ANALYZE.length}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl p-8 shadow-2xl mb-6"
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            Разбери слово по составу
          </h2>

          <div className="mb-8">
            <p className="text-center text-gray-600 mb-4">Слово:</p>
            <div className="flex justify-center items-center gap-1 flex-wrap">
              {currentWord.morphemes.map((morpheme, index) => (
                <motion.button
                  key={index}
                  onClick={() => handleMorphemeClick(index)}
                  disabled={answers[index]?.isCorrect !== null}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  whileHover={answers[index]?.isCorrect === null ? { scale: 1.05 } : {}}
                  whileTap={answers[index]?.isCorrect === null ? { scale: 0.95 } : {}}
                  transition={{ delay: index * 0.1 }}
                  className="relative px-6 py-4 rounded-xl font-bold text-2xl transition-all"
                  style={{
                    backgroundColor: getMorphemeColor(index),
                    border: `4px solid ${getMorphemeBorderColor(index)}`,
                    color: answers[index]?.selectedType ? 'white' : '#1F2937',
                    cursor: answers[index]?.isCorrect !== null ? 'default' : 'pointer'
                  }}
                >
                  {morpheme.text}
                  
                  {answers[index]?.isCorrect === true && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg"
                    >
                      ✓
                    </motion.span>
                  )}
                  {answers[index]?.isCorrect === false && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg"
                    >
                      ✗
                    </motion.span>
                  )}
                </motion.button>
              ))}
            </div>
          </div>

          <div className="text-center mb-6">
            {selectedMorphemeIndex !== null ? (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-lg text-purple-600 font-medium"
              >
                Выбери тип морфемы "{currentWord.morphemes[selectedMorphemeIndex].text}"
              </motion.p>
            ) : (
              <p className="text-lg text-gray-600">
                Нажми на морфему, чтобы определить её тип
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {MORPHEME_TYPES.map((type) => (
              <motion.button
                key={type.type}
                onClick={() => handleTypeSelect(type.type)}
                disabled={selectedMorphemeIndex === null}
                animate={{
                  opacity: wrongAnswerType === type.type ? [1, 1, 0] : 1,
                  scale: wrongAnswerType === type.type ? [1, 1.1, 0.8, 0] : 1
                }}
                transition={{
                  duration: 1,
                  times: wrongAnswerType === type.type ? [0, 0.3, 0.7, 1] : [0, 1]
                }}
                whileHover={selectedMorphemeIndex !== null && wrongAnswerType !== type.type ? { scale: 1.05 } : {}}
                whileTap={selectedMorphemeIndex !== null && wrongAnswerType !== type.type ? { scale: 0.95 } : {}}
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
            {isWordComplete && currentWordIndex < WORDS_TO_ANALYZE.length - 1 && (
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
                <p className="text-green-600">Все морфемы определены правильно!</p>
              </motion.div>
            )}
            {allAnswered && !isWordComplete && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mt-6 bg-orange-100 border-4 border-orange-500 rounded-xl p-6 text-center"
              >
                <div className="text-4xl mb-2">🤔</div>
                <p className="text-xl font-bold text-orange-700">Есть ошибки</p>
                <p className="text-orange-600">Попробуй еще раз!</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Final Result */}
        {currentWordIndex === WORDS_TO_ANALYZE.length - 1 && isWordComplete && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl p-8 shadow-2xl text-center text-white"
          >
            <div className="text-6xl mb-4">🏆</div>
            <h2 className="text-3xl font-bold mb-2">Поздравляем!</h2>
            <p className="text-xl mb-4">Все слова разобраны!</p>
            <p className="text-2xl font-bold">Итоговый счёт: {score} очков</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
