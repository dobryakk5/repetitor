// components/LevelSelector.tsx
'use client';
export default function LevelSelector({ levels, currentLevel, onSelectLevel }: any) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-2xl">
      <h3 className="text-lg font-bold text-gray-800 mb-3">🎯 Уровни</h3>
      <div className="grid grid-cols-5 gap-2">
        {levels.map((level: any, index: number) => (
          <button
            key={level.id}
            onClick={() => onSelectLevel(index)}
            className={`
              p-2 rounded-lg font-bold transition-all
              ${index === currentLevel 
                ? 'bg-purple-500 text-white shadow-lg scale-110' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }
            `}
          >
            {index + 1}
          </button>
        ))}
      </div>
    </div>
  );
}
