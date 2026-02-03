// components/ResultModal.tsx
'use client';
import { motion } from 'framer-motion';

export default function ResultModal({ isCorrect, word, message, onClose, onNextLevel, isLastLevel }: any) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl"
      >
        <div className="text-center">
          <div className="text-6xl mb-4">
            {isCorrect ? '🎉' : '😕'}
          </div>
          <h2 className="text-3xl font-bold mb-4 text-gray-800">
            {isCorrect ? 'Отлично!' : 'Попробуй еще раз'}
          </h2>
          {word && (
            <p className="text-2xl font-bold text-purple-600 mb-4">{word}</p>
          )}
          <p className="text-gray-700 mb-6">{message}</p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-xl font-bold"
            >
              Закрыть
            </button>
            {isCorrect && !isLastLevel && (
              <button
                onClick={onNextLevel}
                className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold"
              >
                Следующий уровень →
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
