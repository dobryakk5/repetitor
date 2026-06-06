// app/page.tsx (НОВЫЙ - заменит существующий page.tsx)
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import { LEVELS } from '../data/levels';
import { Morpheme, WordConstruction } from '../types/morphology';
import { VALID_WORDS } from '../data/morphemes';
import MorphemeCard from '../components/MorphemeCard';
import ConstructionZone from '../components/ConstructionZone';
import MorphemeLibrary from '../components/MorphemeLibrary';
import LevelSelector from '../components/LevelSelector';
import GameHeader from '../components/GameHeader';
import ResultModal from '../components/ResultModal';
import MorphemeAnalysisGame from '../components/MorphemeAnalysisGame';
import MorphemeAnalysisLevel2 from '../components/MorphemeAnalysisLevel2';

type GameMode = 'menu' | 'build' | 'analyze' | 'analyze2';

// Компонент игры "Собрать морфемки" (исходная игра)
function BuildGame() {
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
  const [construction, setConstruction] = useState<Morpheme[]>([]);
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [resultData, setResultData] = useState<{
    isCorrect: boolean;
    word: string;
    message: string;
  } | null>(null);
  const [activeMorpheme, setActiveMorpheme] = useState<Morpheme | null>(null);
  const [showHints, setShowHints] = useState(false);

  const currentLevel = LEVELS[currentLevelIndex];

  const canConnect = (morpheme: Morpheme, position: number): boolean => {
    if (construction.length === 0) {
      return morpheme.type === 'prefix' || morpheme.type === 'root';
    }

    if (position === 0) {
      return morpheme.type === 'prefix' && 
             construction[0].canAttachLeft.includes(morpheme.type);
    }

    if (position === construction.length) {
      const lastMorpheme = construction[construction.length - 1];
      return lastMorpheme.canAttachRight.includes(morpheme.type);
    }

    const leftMorpheme = construction[position - 1];
    const rightMorpheme = construction[position];
    
    return leftMorpheme.canAttachRight.includes(morpheme.type) &&
           morpheme.canAttachRight.includes(rightMorpheme.type);
  };

  const checkWord = (): WordConstruction => {
    const word = construction.map(m => m.text === '∅' ? '' : m.text).join('');
    const validWord = VALID_WORDS[word];
    
    if (validWord) {
      return {
        morphemes: construction,
        isValid: true,
        word: word,
        meaning: validWord.meaning,
        explanation: `✅ Правильно! ${word} = ${validWord.meaning}`
      };
    }

    if (currentLevel.targetWord && word === currentLevel.targetWord) {
      return {
        morphemes: construction,
        isValid: true,
        word: word,
        meaning: currentLevel.targetMeaning,
        explanation: `🎉 Отлично! Ты собрал правильное слово!`
      };
    }

    return {
      morphemes: construction,
      isValid: false,
      word: word,
      explanation: `❌ "${word}" - такого слова не существует. Попробуй еще раз!`
    };
  };

  const handleDragStart = (event: DragStartEvent) => {
    const morpheme = currentLevel.availableMorphemes.find(
      m => m.id === event.active.id
    );
    setActiveMorpheme(morpheme || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveMorpheme(null);
    
    const { active, over } = event;
    
    if (!over) return;

    const morpheme = currentLevel.availableMorphemes.find(
      m => m.id === active.id
    );

    if (!morpheme) return;

    if (over.id === 'construction-zone') {
      if (canConnect(morpheme, construction.length)) {
        setConstruction([...construction, morpheme]);
      }
    }

    if (typeof over.id === 'string' && over.id.startsWith('slot-')) {
      const position = parseInt(over.id.replace('slot-', ''));
      if (canConnect(morpheme, position)) {
        const newConstruction = [...construction];
        newConstruction.splice(position, 0, morpheme);
        setConstruction(newConstruction);
      }
    }
  };

  const handleRemoveMorpheme = (index: number) => {
    const newConstruction = construction.filter((_, i) => i !== index);
    setConstruction(newConstruction);
  };

  const handleCheck = () => {
    if (construction.length === 0) {
      setResultData({
        isCorrect: false,
        word: '',
        message: 'Собери слово из морфем!'
      });
      setShowResult(true);
      return;
    }

    const result = checkWord();
    setAttempts(attempts + 1);

    setResultData({
      isCorrect: result.isValid,
      word: result.word || '',
      message: result.explanation || ''
    });
    setShowResult(true);

    if (result.isValid) {
      setScore(score + 100 * (currentLevelIndex + 1));
    }
  };

  const handleNextLevel = () => {
    if (currentLevelIndex < LEVELS.length - 1) {
      setCurrentLevelIndex(currentLevelIndex + 1);
      setConstruction([]);
      setShowResult(false);
      setResultData(null);
    }
  };

  const handleReset = () => {
    setConstruction([]);
    setShowResult(false);
    setResultData(null);
  };

  const handleLevelSelect = (levelIndex: number) => {
    setCurrentLevelIndex(levelIndex);
    setConstruction([]);
    setShowResult(false);
    setResultData(null);
  };

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="min-h-screen bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 p-4">
        <div className="max-w-7xl mx-auto">
          <GameHeader 
            score={score}
            attempts={attempts}
            currentLevel={currentLevelIndex + 1}
            totalLevels={LEVELS.length}
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            <div className="lg:col-span-1 space-y-4">
              <LevelSelector
                levels={LEVELS}
                currentLevel={currentLevelIndex}
                onSelectLevel={handleLevelSelect}
              />

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl p-6 shadow-2xl"
              >
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  {currentLevel.title}
                </h2>
                <p className="text-gray-600 mb-4">
                  {currentLevel.description}
                </p>
                {currentLevel.targetMeaning && (
                  <div className="bg-purple-100 rounded-lg p-4 mb-4">
                    <p className="text-sm text-purple-700 font-medium">
                      Цель:
                    </p>
                    <p className="text-purple-900 font-bold">
                      {currentLevel.targetMeaning}
                    </p>
                  </div>
                )}
              </motion.div>
            </div>

            <div className="lg:col-span-2 space-y-4">
              <ConstructionZone
                construction={construction}
                onRemoveMorpheme={handleRemoveMorpheme}
              />

              <div className="flex gap-4 justify-center">
                <button
                  onClick={handleCheck}
                  disabled={construction.length === 0}
                  className="px-8 py-4 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 
                           text-white rounded-xl font-bold text-lg shadow-lg 
                           transform transition hover:scale-105 disabled:hover:scale-100"
                >
                  ✓ Проверить
                </button>
                <button
                  onClick={handleReset}
                  className="px-8 py-4 bg-red-500 hover:bg-red-600 
                           text-white rounded-xl font-bold text-lg shadow-lg 
                           transform transition hover:scale-105"
                >
                  ↻ Сброс
                </button>
              </div>

              <MorphemeLibrary morphemes={currentLevel.availableMorphemes} />
            </div>
          </div>
        </div>

        <DragOverlay>
          {activeMorpheme && (
            <div className="opacity-50">
              <MorphemeCard morpheme={activeMorpheme} isDragging />
            </div>
          )}
        </DragOverlay>

        {showResult && resultData && (
          <ResultModal
            isCorrect={resultData.isCorrect}
            word={resultData.word}
            message={resultData.message}
            onClose={() => setShowResult(false)}
            onNextLevel={handleNextLevel}
            isLastLevel={currentLevelIndex === LEVELS.length - 1}
          />
        )}
      </div>
    </DndContext>
  );
}

// Главный компонент с меню
export default function MorphoLabMain() {
  const [gameMode, setGameMode] = useState<GameMode>('menu');

  if (gameMode === 'build') {
    return (
      <div>
        <button
          onClick={() => setGameMode('menu')}
          className="fixed top-4 left-4 z-50 px-6 py-3 bg-white hover:bg-gray-100 text-gray-800 rounded-xl font-bold shadow-lg transition-all hover:scale-105"
        >
          ← Назад в меню
        </button>
        <BuildGame />
      </div>
    );
  }

  if (gameMode === 'analyze') {
    return (
      <div>
        <button
          onClick={() => setGameMode('menu')}
          className="fixed top-4 left-4 z-50 px-6 py-3 bg-white hover:bg-gray-100 text-gray-800 rounded-xl font-bold shadow-lg transition-all hover:scale-105"
        >
          ← Назад в меню
        </button>
        <MorphemeAnalysisGame />
      </div>
    );
  }

  if (gameMode === 'analyze2') {
    return (
      <div>
        <button
          onClick={() => setGameMode('menu')}
          className="fixed top-4 left-4 z-50 px-6 py-3 bg-white hover:bg-gray-100 text-gray-800 rounded-xl font-bold shadow-lg transition-all hover:scale-105"
        >
          ← Назад в меню
        </button>
        <MorphemeAnalysisLevel2 />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-orange-500 p-4 flex items-center justify-center">
      <div className="max-w-4xl w-full">
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-6xl font-bold text-white mb-4">
            🧪 МорфоЛаб
          </h1>
          <p className="text-2xl text-white/90">
            Интерактивная платформа для изучения морфологии
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            whileHover={{ scale: 1.05, y: -10 }}
            onClick={() => setGameMode('analyze')}
            className="bg-white rounded-3xl p-8 shadow-2xl cursor-pointer transform transition-all"
          >
            <div className="text-6xl mb-4 text-center">🔍</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">
              Разбор: Уровень 1
            </h2>
            <p className="text-gray-600 text-center mb-6 text-sm">
              Определяй части готового слова! Нажимай на каждую морфему и выбирай её тип.
            </p>
            <div className="flex justify-center gap-2 mb-6 flex-wrap">
              <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-lg text-xs font-medium">
                Блоки
              </span>
              <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-medium">
                12 слов
              </span>
            </div>
            <button className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl font-bold text-base shadow-lg transition-all">
              Начать →
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            whileHover={{ scale: 1.05, y: -10 }}
            onClick={() => setGameMode('analyze2')}
            className="bg-white rounded-3xl p-8 shadow-2xl cursor-pointer transform transition-all"
          >
            <div className="text-6xl mb-4 text-center">✨</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">
              Разбор: Уровень 2
            </h2>
            <p className="text-gray-600 text-center mb-6 text-sm">
              Выделяй буквы сам! Кликай на буквы по порядку и группируй их в морфемы.
            </p>
            <div className="flex justify-center gap-2 mb-6 flex-wrap">
              <span className="px-3 py-1 bg-pink-100 text-pink-700 rounded-lg text-xs font-medium">
                По буквам
              </span>
              <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-xs font-medium">
                12 слов
              </span>
            </div>
            <button className="w-full py-3 bg-gradient-to-r from-indigo-500 to-pink-600 hover:from-indigo-600 hover:to-pink-700 text-white rounded-xl font-bold text-base shadow-lg transition-all">
              Начать →
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            whileHover={{ scale: 1.05, y: -10 }}
            onClick={() => setGameMode('build')}
            className="bg-white rounded-3xl p-8 shadow-2xl cursor-pointer transform transition-all"
          >
            <div className="text-6xl mb-4 text-center">🧩</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">
              Угадай слово: Уровень 3
            </h2>
            <p className="text-gray-600 text-center mb-6 text-sm">
              Собирай слово по смыслу! Перетаскивай морфемы и угадывай правильный ответ.
            </p>
            <div className="flex justify-center gap-2 mb-6 flex-wrap">
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium">
                Drag & Drop
              </span>
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-medium">
                Угадай слово
              </span>
            </div>
            <button className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl font-bold text-base shadow-lg transition-all">
              Начать →
            </button>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center text-white/80"
        >
          <p className="text-lg">
            Выбери уровень, чтобы начать изучение морфологии русского языка!
          </p>
        </motion.div>
      </div>
    </div>
  );
}
