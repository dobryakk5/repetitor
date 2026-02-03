// components/MorphemeCard.tsx
'use client';

import { useDraggable } from '@dnd-kit/core';
import { motion } from 'framer-motion';
import { Morpheme } from '../types/morphology';

interface MorphemeCardProps {
  morpheme: Morpheme;
  isDragging?: boolean;
  isInConstruction?: boolean;
  onRemove?: () => void;
}

const typeIcons = {
  prefix: '→',
  root: '■',
  suffix: '▲',
  ending: '●'
};

// SVG пути для пазловых соединений
const getPuzzleShape = (type: string, side: 'left' | 'right') => {
  const baseHeight = 60;
  const width = 80;
  const puzzleSize = 10;
  
  if (type === 'prefix') {
    // Приставка: гладкая слева, выступ справа
    return side === 'right' 
      ? `M ${width} ${baseHeight/2 - puzzleSize} 
         Q ${width + puzzleSize} ${baseHeight/2 - puzzleSize}, ${width + puzzleSize} ${baseHeight/2}
         Q ${width + puzzleSize} ${baseHeight/2 + puzzleSize}, ${width} ${baseHeight/2 + puzzleSize}`
      : '';
  }
  
  if (type === 'root') {
    // Корень: впадина слева, выступ справа
    return side === 'left'
      ? `M 0 ${baseHeight/2 - puzzleSize}
         Q ${-puzzleSize} ${baseHeight/2 - puzzleSize}, ${-puzzleSize} ${baseHeight/2}
         Q ${-puzzleSize} ${baseHeight/2 + puzzleSize}, 0 ${baseHeight/2 + puzzleSize}`
      : `M ${width} ${baseHeight/2 - puzzleSize}
         Q ${width + puzzleSize} ${baseHeight/2 - puzzleSize}, ${width + puzzleSize} ${baseHeight/2}
         Q ${width + puzzleSize} ${baseHeight/2 + puzzleSize}, ${width} ${baseHeight/2 + puzzleSize}`;
  }
  
  if (type === 'suffix') {
    // Суффикс: впадина слева, выступ справа
    return side === 'left'
      ? `M 0 ${baseHeight/2 - puzzleSize}
         Q ${-puzzleSize} ${baseHeight/2 - puzzleSize}, ${-puzzleSize} ${baseHeight/2}
         Q ${-puzzleSize} ${baseHeight/2 + puzzleSize}, 0 ${baseHeight/2 + puzzleSize}`
      : `M ${width} ${baseHeight/2 - puzzleSize}
         Q ${width + puzzleSize} ${baseHeight/2 - puzzleSize}, ${width + puzzleSize} ${baseHeight/2}
         Q ${width + puzzleSize} ${baseHeight/2 + puzzleSize}, ${width} ${baseHeight/2 + puzzleSize}`;
  }
  
  if (type === 'ending') {
    // Окончание: впадина слева, гладкое справа
    return side === 'left'
      ? `M 0 ${baseHeight/2 - puzzleSize}
         Q ${-puzzleSize} ${baseHeight/2 - puzzleSize}, ${-puzzleSize} ${baseHeight/2}
         Q ${-puzzleSize} ${baseHeight/2 + puzzleSize}, 0 ${baseHeight/2 + puzzleSize}`
      : '';
  }
  
  return '';
};

export default function MorphemeCard({ 
  morpheme, 
  isDragging = false,
  isInConstruction = false,
  onRemove 
}: MorphemeCardProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: morpheme.id,
    disabled: isInConstruction
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  const baseHeight = 60;
  const width = 80;
  const puzzleSize = 10;
  
  // Создаём SVG путь для формы пазла
  const createPuzzlePath = () => {
    const leftPuzzle = getPuzzleShape(morpheme.type, 'left');
    const rightPuzzle = getPuzzleShape(morpheme.type, 'right');
    
    let path = `M 0 0 L ${width} 0 `;
    
    // Правая сторона
    if (rightPuzzle) {
      path += rightPuzzle + ` L ${width} ${baseHeight} `;
    } else {
      path += `L ${width} ${baseHeight} `;
    }
    
    // Низ
    path += `L 0 ${baseHeight} `;
    
    // Левая сторона
    if (leftPuzzle) {
      path += leftPuzzle + ` L 0 0 Z`;
    } else {
      path += `L 0 0 Z`;
    }
    
    return path;
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      whileHover={{ scale: isInConstruction ? 1 : 1.05 }}
      whileTap={{ scale: isInConstruction ? 1 : 0.95 }}
      className={`
        relative inline-block
        ${isInConstruction ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'}
        ${isDragging ? 'opacity-50' : 'opacity-100'}
      `}
      style={{ 
        width: `${width + puzzleSize * 2}px`, 
        height: `${baseHeight}px`,
        margin: '0 -10px' // Компенсация для стыковки
      }}
    >
      {/* SVG пазловая форма */}
      <svg 
        width={width + puzzleSize * 2} 
        height={baseHeight} 
        className="absolute inset-0"
        style={{ overflow: 'visible' }}
      >
        <defs>
          <filter id={`shadow-${morpheme.id}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
            <feOffset dx="0" dy="2" result="offsetblur"/>
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.3"/>
            </feComponentTransfer>
            <feMerge>
              <feMergeNode/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        <g transform={`translate(${puzzleSize}, 0)`}>
          <path
            d={createPuzzlePath()}
            fill={morpheme.color}
            stroke={isInConstruction ? '#ffffff' : 'rgba(0,0,0,0.1)'}
            strokeWidth="2"
            filter={`url(#shadow-${morpheme.id})`}
          />
        </g>
      </svg>

      {/* Type Icon */}
      <div className="absolute top-1 left-3 bg-white/90 text-gray-700 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold shadow-sm z-10">
        {typeIcons[morpheme.type]}
      </div>

      {/* Morpheme Text */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
        <span className="text-white font-bold text-xl drop-shadow-md">
          {morpheme.text}
        </span>
      </div>

      {/* Meaning Tooltip */}
      {morpheme.meaning && !isInConstruction && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 
                      bg-gray-900 text-white text-xs rounded-lg px-3 py-2 
                      opacity-0 hover:opacity-100 transition-opacity
                      whitespace-nowrap pointer-events-none z-20">
          {morpheme.meaning}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 
                        border-4 border-transparent border-t-gray-900"></div>
        </div>
      )}

      {/* Remove Button (when in construction) */}
      {isInConstruction && onRemove && (
        <button
          onClick={onRemove}
          className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 
                   text-white rounded-full w-7 h-7 flex items-center justify-center
                   text-lg font-bold shadow-lg transition-all hover:scale-110 z-20"
        >
          ×
        </button>
      )}

      {/* Connection indicators */}
      {isInConstruction && (
        <>
          {/* Left connector dot */}
          {morpheme.canAttachLeft.length > 0 && (
            <div className="absolute left-0 top-1/2 transform -translate-y-1/2
                          w-2 h-2 bg-white rounded-full border-2 border-gray-400 z-10"></div>
          )}
          {/* Right connector dot */}
          {morpheme.canAttachRight.length > 0 && (
            <div className="absolute right-0 top-1/2 transform -translate-y-1/2
                          w-2 h-2 bg-white rounded-full border-2 border-gray-400 z-10"></div>
          )}
        </>
      )}
    </motion.div>
  );
}
