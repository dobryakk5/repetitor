// app/page.tsx
'use client';

import { useState } from 'react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import { motion, AnimatePresence } from 'framer-motion';
import { LEVELS } from '../data/levels';
import { Morpheme, WordConstruction } from '../types/morphology';
import { VALID_WORDS } from '../data/morphemes';
import MorphemeCard from '../components/MorphemeCard';
import ConstructionZone from '../components/ConstructionZone';
import MorphemeLibrary from '../components/MorphemeLibrary';
import LevelSelector from '../components/LevelSelector';
import GameHeader from '../components/GameHeader';
import ResultModal from '../components/ResultModal';

export default function MorphoLabGame() {
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

  // Проверка возможности соединения морфем
  const canConnect = (morpheme: Morpheme, position: number): boolean => {
    if (construction.length === 0) {
      // Первая морфема - можно только приставку или корень
      return morpheme.type === 'prefix' || morpheme.type === 'root';
    }

    if (position === 0) {
      // В начало можно только приставку
      return morpheme.type === 'prefix' && 
             construction[0].canAttachLeft.includes(morpheme.type);
    }

    if (position === construction.length) {
      // В конец
      const lastMorpheme = construction[construction.length - 1];
      return lastMorpheme.canAttachRight.includes(morpheme.type);
    }

    // В середину
    const leftMorpheme = construction[position - 1];
    const rightMorpheme = construction[position];
    
    return leftMorpheme.canAttachRight.includes(morpheme.type) &&
           morpheme.canAttachRight.includes(rightMorpheme.type);
  };

  // Проверка собранного слова
  const checkWord = (): WordConstruction => {
    const word = construction.map(m => m.text === '∅' ? '' : m.text).join('');
    const morphemeTexts = construction.map(m => m.text);
    
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

    // Проверяем, есть ли целевое слово для уровня
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

    // Добавление в конструкцию
    if (over.id === 'construction-zone') {
      if (canConnect(morpheme, construction.length)) {
        setConstruction([...construction, morpheme]);
      }
    }

    // Вставка в определенную позицию
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
          {/* Header */}
          <GameHeader 
            score={score}
            attempts={attempts}
            currentLevel={currentLevelIndex + 1}
            totalLevels={LEVELS.length}
          />

          {/* Main Game Area */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            {/* Level Info & Controls */}
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

                <button
                  onClick={() => setShowHints(!showHints)}
                  className="text-sm text-purple-600 hover:text-purple-800 mb-2"
                >
                  {showHints ? '🙈 Скрыть подсказки' : '💡 Показать подсказки'}
                </button>

                <AnimatePresence>
                  {showHints && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-yellow-50 rounded-lg p-4 space-y-2"
                    >
                      {currentLevel.hints?.map((hint, index) => (
                        <p key={index} className="text-sm text-yellow-800">
                          {index + 1}. {hint}
                        </p>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>

            {/* Construction Zone */}
            <div className="lg:col-span-2 space-y-4">
              <ConstructionZone
                construction={construction}
                onRemoveMorpheme={handleRemoveMorpheme}
              />

              {/* Controls */}
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

              {/* Morpheme Library */}
              <MorphemeLibrary morphemes={currentLevel.availableMorphemes} />
            </div>
          </div>
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeMorpheme && (
            <div className="opacity-50">
              <MorphemeCard morpheme={activeMorpheme} isDragging />
            </div>
          )}
        </DragOverlay>

        {/* Result Modal */}
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
