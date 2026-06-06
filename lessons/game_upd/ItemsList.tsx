'use client'

import { useState } from 'react'
import { AnswerButton } from './AnswerButton'
import type { Item } from '@/data/types'

interface Props {
  items: Item[]
  accent: string
}

export function ItemsList({ items, accent }: Props) {
  const [showAll, setShowAll] = useState(false)

  return (
    <section>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.15rem', color: '#1a1208' }}>
          Задания
        </h2>
        <button
          onClick={() => setShowAll(v => !v)}
          style={{
            fontFamily: "'Playfair Display', serif",
            fontStyle: 'italic',
            fontSize: '0.72rem',
            padding: '0.22rem 0.7rem',
            border: `1.5px solid ${accent}`,
            borderRadius: 2,
            background: showAll ? accent : 'transparent',
            color: showAll ? '#fdfaf4' : accent,
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
        >
          {showAll ? 'Скрыть всё' : 'Показать все'}
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
        {items.map((item, i) => (
          <ItemCard key={i} item={item} index={i} accent={accent} forceShow={showAll} />
        ))}
      </div>
    </section>
  )
}

function ItemCard({ item, index, accent, forceShow }: { item: Item; index: number; accent: string; forceShow: boolean }) {
  return (
    <div style={{
      background: 'linear-gradient(145deg, #fdfaf4 0%, #f8f2e3 100%)',
      border: '1px solid #e0cba8',
      borderRadius: 4,
      padding: '1rem 1.15rem',
      boxShadow: '0 2px 8px rgba(26,18,8,0.06)',
    }}>
      <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
        {/* Number bubble */}
        <div style={{
          background: accent,
          color: '#fdfaf4',
          width: 26, height: 26,
          borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.72rem',
          fontFamily: "'Playfair Display', serif",
          fontWeight: 700,
          flexShrink: 0,
          marginTop: 2,
        }}>
          {index + 1}
        </div>

        <div style={{ flex: 1 }}>
          <p style={{ fontSize: '0.9rem', lineHeight: 1.65, color: '#1a1208', marginBottom: '0.55rem', whiteSpace: 'pre-line' }}>
            {item.question}
          </p>
          {item.hint && (
            <p style={{ fontSize: '0.78rem', color: '#8a6a44', fontStyle: 'italic', lineHeight: 1.5, marginBottom: '0.5rem' }}>
              💡 {item.hint}
            </p>
          )}
          {item.answer && (
            forceShow
              ? (
                <div style={{
                  padding: '0.6rem 0.85rem',
                  background: `${accent}12`,
                  borderLeft: `3px solid ${accent}`,
                  borderRadius: '0 3px 3px 0',
                }}>
                  <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: '0.8rem', color: accent }}>Ответ: </span>
                  <span style={{ fontSize: '0.88rem', lineHeight: 1.6, color: '#1a1208' }}>{item.answer}</span>
                </div>
              )
              : <AnswerButton answer={item.answer} accent={accent} />
          )}
        </div>
      </div>
    </div>
  )
}
