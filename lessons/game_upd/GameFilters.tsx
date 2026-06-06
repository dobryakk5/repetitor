'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { Game, Section, GameType } from '@/data/types'
import { SECTIONS, GAME_TYPES } from '@/data/types'
import { SectionBadge, TypeBadge } from './Badges'

interface Props {
  games: Game[]
}

export function GameFilters({ games }: Props) {
  const [section, setSection] = useState<Section | 'all'>('all')
  const [type, setType]       = useState<GameType | 'all'>('all')

  const filtered = games.filter(g =>
    (section === 'all' || g.section === section) &&
    (type    === 'all' || g.type    === type)
  )

  return (
    <>
      {/* Filter bar */}
      <div style={{
        background: '#e8d5b0',
        borderBottom: '1px solid #d4c09a',
        padding: '0.85rem 1.5rem',
        display: 'flex', gap: '1.25rem', flexWrap: 'wrap',
        justifyContent: 'center', alignItems: 'center',
      }}>
        <FilterGroup label="РАЗДЕЛ">
          <Pill active={section === 'all'} onClick={() => setSection('all')}>📋 Все</Pill>
          {(Object.entries(SECTIONS) as [Section, typeof SECTIONS[Section]][]).map(([id, s]) => (
            <Pill key={id} active={section === id} onClick={() => setSection(id)}>
              {s.emoji} {s.title}
            </Pill>
          ))}
        </FilterGroup>

        <FilterGroup label="ТИП">
          <Pill active={type === 'all'} onClick={() => setType('all')}>📋 Все</Pill>
          {(Object.entries(GAME_TYPES) as [GameType, typeof GAME_TYPES[GameType]][]).map(([id, t]) => (
            <Pill key={id} active={type === id} onClick={() => setType(id)}>
              {t.emoji} {t.label}
            </Pill>
          ))}
        </FilterGroup>
      </div>

      {/* Count */}
      <p style={{ textAlign: 'center', color: '#8a6a44', fontSize: '0.78rem', fontStyle: 'italic', margin: '1.25rem 0 0.5rem' }}>
        {filtered.length} {filtered.length === 1 ? 'игра' : filtered.length < 5 ? 'игры' : 'игр'}
      </p>

      {/* Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '1.1rem',
        padding: '0.5rem 1.5rem 2.5rem',
        maxWidth: 1100,
        margin: '0 auto',
      }}>
        {filtered.map(g => <GameCard key={g.id} game={g} />)}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#8a6a44' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>📜</div>
          <p style={{ fontFamily: "'Playfair Display', serif", fontStyle: 'italic' }}>
            По выбранным фильтрам ничего не найдено
          </p>
        </div>
      )}
    </>
  )
}

// ── Sub-components ────────────────────────────────────────

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', flexWrap: 'wrap' }}>
      <span style={{
        fontSize: '0.65rem', color: '#6a4828',
        letterSpacing: '0.12em',
        fontFamily: "'Playfair Display', serif", fontStyle: 'italic',
        marginRight: '0.1rem',
      }}>
        {label}:
      </span>
      {children}
    </div>
  )
}

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '0.22rem 0.6rem',
        border: `1.5px solid ${active ? '#8B1A1A' : '#c4a882'}`,
        background: active ? '#8B1A1A' : 'transparent',
        color: active ? '#fdfaf4' : '#5a3e28',
        cursor: 'pointer',
        fontSize: '0.72rem',
        fontFamily: "'Martel', serif",
        borderRadius: 2,
        transition: 'all 0.12s',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </button>
  )
}

function GameCard({ game }: { game: Game }) {
  const sec = SECTIONS[game.section]

  return (
    <Link href={`/game/${game.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'flex' }}>
      <article style={{
        background: 'linear-gradient(145deg, #fdfaf4 0%, #f8f2e3 100%)',
        border: '1px solid #e0cba8',
        borderRadius: 4,
        overflow: 'hidden',
        boxShadow: '0 2px 10px rgba(26,18,8,0.07)',
        display: 'flex', flexDirection: 'column',
        width: '100%',
        transition: 'transform 0.18s, box-shadow 0.18s',
        cursor: 'pointer',
      }}
        onMouseEnter={e => {
          ;(e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)'
          ;(e.currentTarget as HTMLElement).style.boxShadow = '0 8px 28px rgba(26,18,8,0.13)'
        }}
        onMouseLeave={e => {
          ;(e.currentTarget as HTMLElement).style.transform = ''
          ;(e.currentTarget as HTMLElement).style.boxShadow = '0 2px 10px rgba(26,18,8,0.07)'
        }}
      >
        {/* Top accent bar */}
        <div style={{ height: 4, background: `linear-gradient(90deg, ${sec.accent}, ${sec.accent}99)` }} />

        <div style={{ padding: '1rem 1.1rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          {/* Badges */}
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <SectionBadge section={game.section} />
            <TypeBadge type={game.type} />
          </div>

          {/* Title */}
          <h2 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: '1.05rem', fontWeight: 700,
            color: '#1a1208', lineHeight: 1.3,
            flex: 1,
          }}>
            {game.title}
          </h2>

          {/* Topic */}
          <p style={{ fontSize: '0.7rem', color: '#8a6a44', letterSpacing: '0.03em' }}>
            {game.topic}
          </p>

          {/* Description */}
          <p style={{
            fontSize: '0.8rem', color: '#3d2b1f', lineHeight: 1.5,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {game.description}
          </p>

          {/* Footer */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            paddingTop: '0.6rem', marginTop: 'auto',
            borderTop: '1px solid #e8d5b0',
          }}>
            <span style={{ fontFamily: "'Playfair Display', serif", fontStyle: 'italic', fontSize: '0.78rem', color: sec.accent }}>
              Играть →
            </span>
            <span style={{ fontSize: '0.65rem', color: '#b8956a' }}>{game.source}</span>
          </div>
        </div>
      </article>
    </Link>
  )
}
