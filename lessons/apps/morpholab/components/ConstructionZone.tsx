// components/ConstructionZone.tsx
'use client';

import { useDroppable } from '@dnd-kit/core';
import { motion, AnimatePresence } from 'framer-motion';
import { Morpheme } from '../types/morphology';
import MorphemeCard from './MorphemeCard';

interface ConstructionZoneProps {
  construction: Morpheme[];
  onRemoveMorpheme: (index: number) => void;
}

export default function ConstructionZone({ construction, onRemoveMorpheme }: ConstructionZoneProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'construction-zone',
  });

  const word = construction.map(m => m.text === '∅' ? '' : m.text).join('');

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-2xl p-8 shadow-2xl min-h-[200px]"
    >
      <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">
        🔨 Рабочая зона
      </h3>

      <div
        ref={setNodeRef}
        className={`
          border-4 border-dashed rounded-xl p-6 min-h-[120px]
          flex items-center justify-center gap-2 flex-wrap
          transition-all
          ${isOver ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-gray-50'}
        `}
      >
        <AnimatePresence mode="popLayout">
          {construction.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-gray-400 text-center"
            >
              <p className="text-lg">Перетащи морфемы сюда</p>
              <p className="text-sm mt-2">или нажми на них</p>
            </motion.div>
          ) : (
            construction.map((morpheme, index) => (
              <motion.div
                key={`${morpheme.id}-${index}`}
                layout
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                className="group relative"
              >
                <MorphemeCard
                  morpheme={morpheme}
                  isInConstruction
                  onRemove={() => onRemoveMorpheme(index)}
                />
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Word Preview */}
      {construction.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 text-center"
        >
          <p className="text-sm text-gray-600 mb-2">Собранное слово:</p>
          <p className="text-4xl font-bold text-purple-600">
            {word || '...'}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            {construction.length} {construction.length === 1 ? 'морфема' : construction.length < 5 ? 'морфемы' : 'морфем'}
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
