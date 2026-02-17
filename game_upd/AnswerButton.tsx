'use client'

import { useState } from 'react'

interface Props {
  answer: string
  accent: string
  labelReveal?: string
  labelHide?: string
}

export function AnswerButton({ answer, accent, labelReveal = '✨ Ответ', labelHide = '🙈 Скрыть' }: Props) {
  const [shown, setShown] = useState(false)

  return (
    <>
      <button
        onClick={() => setShown(v => !v)}
        style={{
          fontFamily: "'Playfair Display', serif",
          fontStyle: 'italic',
          fontSize: '0.75rem',
          padding: '0.28rem 0.8rem',
          border: `1.5px solid ${accent}`,
          borderRadius: 2,
          background: shown ? accent : 'transparent',
          color: shown ? '#fdfaf4' : accent,
          cursor: 'pointer',
          transition: 'all 0.15s',
        }}
      >
        {shown ? labelHide : labelReveal}
      </button>

      {shown && (
        <div
          className="slide-down"
          style={{
            marginTop: '0.6rem',
            padding: '0.6rem 0.85rem',
            background: `${accent}12`,
            borderLeft: `3px solid ${accent}`,
            borderRadius: '0 3px 3px 0',
          }}
        >
          <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: '0.8rem', color: accent }}>
            Ответ:{' '}
          </span>
          <span style={{ fontSize: '0.88rem', lineHeight: 1.6, color: '#1a1208' }}>{answer}</span>
        </div>
      )}
    </>
  )
}
