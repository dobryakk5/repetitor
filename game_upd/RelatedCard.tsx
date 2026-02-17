'use client'

import Link from 'next/link'
import { GAME_TYPES } from '@/data/types'
import type { Game } from '@/data/types'

export function RelatedCard({ game }: { game: Game }) {
  return (
    <Link
      href={`/game/${game.id}`}
      style={{
        textDecoration: 'none', color: 'inherit',
        background: 'linear-gradient(145deg, #fdfaf4 0%, #f8f2e3 100%)',
        border: '1px solid #e0cba8', borderRadius: 4,
        padding: '0.85rem', display: 'block',
        transition: 'transform 0.15s, box-shadow 0.15s',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLElement
        el.style.transform = 'translateY(-2px)'
        el.style.boxShadow = '0 5px 16px rgba(26,18,8,0.1)'
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement
        el.style.transform = ''
        el.style.boxShadow = ''
      }}
    >
      <p style={{ fontSize: '0.65rem', color: '#8a6a44', marginBottom: '0.2rem' }}>
        {GAME_TYPES[game.type].emoji} {GAME_TYPES[game.type].label}
      </p>
      <p style={{ fontFamily: "'Playfair Display', serif", fontSize: '0.88rem', lineHeight: 1.3, color: '#1a1208' }}>
        {game.title}
      </p>
    </Link>
  )
}
