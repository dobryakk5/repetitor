// components/GameHeader.tsx
'use client';
export default function GameHeader({ score, attempts, currentLevel, totalLevels }: any) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-2xl">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          🧪 МорфоЛаб
        </h1>
        <div className="flex gap-6">
          <div className="text-center">
            <p className="text-sm text-gray-600">Очки</p>
            <p className="text-2xl font-bold text-purple-600">{score}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Попытки</p>
            <p className="text-2xl font-bold text-orange-600">{attempts}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Уровень</p>
            <p className="text-2xl font-bold text-green-600">{currentLevel}/{totalLevels}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
