// components/MorphemeLibrary.tsx
'use client';
import { Morpheme } from '../types/morphology';
import MorphemeCard from './MorphemeCard';

export default function MorphemeLibrary({ morphemes }: { morphemes: Morpheme[] }) {
  const groupedMorphemes = {
    prefix: morphemes.filter(m => m.type === 'prefix'),
    root: morphemes.filter(m => m.type === 'root'),
    suffix: morphemes.filter(m => m.type === 'suffix'),
    ending: morphemes.filter(m => m.type === 'ending'),
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-2xl">
      <h3 className="text-xl font-bold text-gray-800 mb-4">📦 Библиотека морфем</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(groupedMorphemes).map(([type, items]) => (
          <div key={type}>
            <p className="text-sm font-semibold text-gray-600 mb-2 capitalize">{type}</p>
            <div className="space-y-2">
              {items.map(morpheme => (
                <MorphemeCard key={morpheme.id} morpheme={morpheme} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
