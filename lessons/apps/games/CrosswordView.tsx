'use client'

import { useMemo, useState } from 'react'
import type { Crossword } from './types'

interface Props {
  crossword: Crossword
  accent: string
}

export function CrosswordView({ crossword, accent }: Props) {
  const [showAnswers, setShowAnswers] = useState(false)
  const total = useMemo(() => crossword.across.length + crossword.down.length, [crossword])

  return (
    <section>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.15rem', color: '#1a1208' }}>
          Кроссворд
        </h2>
        <button
          onClick={() => setShowAnswers(v => !v)}
          style={{
            fontFamily: "'Playfair Display', serif",
            fontStyle: 'italic',
            fontSize: '0.72rem',
            padding: '0.22rem 0.7rem',
            border: `1.5px solid ${accent}`,
            borderRadius: 2,
            background: showAnswers ? accent : 'transparent',
            color: showAnswers ? '#fdfaf4' : accent,
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
        >
          {showAnswers ? 'Скрыть ответы' : 'Показать ответы'}
        </button>
      </div>

      <div
        style={{
          background: 'linear-gradient(145deg, #fdfaf4 0%, #f8f2e3 100%)',
          border: '1px solid #e0cba8',
          borderRadius: 4,
          padding: '1rem 1.15rem',
          boxShadow: '0 2px 8px rgba(26,18,8,0.06)',
          marginBottom: '1rem',
          color: '#8a6a44',
          fontSize: '0.78rem',
        }}
      >
        Подсказок: {total}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.9rem' }}>
        <CrosswordColumn title="По горизонтали" clues={crossword.across} showAnswers={showAnswers} accent={accent} />
        <CrosswordColumn title="По вертикали" clues={crossword.down} showAnswers={showAnswers} accent={accent} />
      </div>
    </section>
  )
}

function CrosswordColumn({
  title,
  clues,
  showAnswers,
  accent,
}: {
  title: string
  clues: Crossword['across']
  showAnswers: boolean
  accent: string
}) {
  return (
    <div
      style={{
        background: 'linear-gradient(145deg, #fdfaf4 0%, #f8f2e3 100%)',
        border: '1px solid #e0cba8',
        borderRadius: 4,
        padding: '1rem 1.15rem',
        boxShadow: '0 2px 8px rgba(26,18,8,0.06)',
      }}
    >
      <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '0.95rem', marginBottom: '0.65rem', color: '#1a1208' }}>
        {title}
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
        {clues.map((clue) => (
          <div key={`${title}-${clue.number}`}>
            <p style={{ color: '#1a1208', fontSize: '0.85rem', lineHeight: 1.55 }}>
              <strong style={{ color: accent }}>{clue.number}.</strong> {clue.clue}
            </p>
            {showAnswers && (
              <p style={{ color: '#5a3e28', fontSize: '0.8rem', marginTop: '0.15rem' }}>
                Ответ: <strong>{clue.answer}</strong>
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
