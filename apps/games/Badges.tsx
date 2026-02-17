import type { GameType, Section } from './types'
import { GAME_TYPES, SECTIONS } from './types'

interface SectionBadgeProps {
  section: Section
}

interface TypeBadgeProps {
  type: GameType
}

export function SectionBadge({ section }: SectionBadgeProps) {
  const s = SECTIONS[section]
  return (
    <span
      style={{
        background: s.light,
        color: s.accent,
        fontSize: '0.68rem',
        fontFamily: "'Playfair Display', serif",
        fontStyle: 'italic',
        padding: '2px 7px',
        borderRadius: 2,
        border: `1px solid ${s.accent}33`,
      }}
    >
      {s.emoji} {s.title}
    </span>
  )
}

export function TypeBadge({ type }: TypeBadgeProps) {
  const t = GAME_TYPES[type]
  return (
    <span
      style={{
        color: '#8a6a44',
        fontSize: '0.68rem',
        fontFamily: "'Martel', serif",
      }}
    >
      {t.emoji} {t.label}
    </span>
  )
}
