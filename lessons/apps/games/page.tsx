import { notFound } from 'next/navigation'
import Link from 'next/link'
import { games, getGame, getRelated } from './games'
import { SECTIONS } from './types'
import { SectionBadge, TypeBadge } from './Badges'
import { ItemsList }     from './ItemsList'
import { RiddlesList }   from './RiddlesList'
import { QuizList }      from './QuizList'
import { CrosswordView } from './CrosswordView'
import { RelatedCard }   from './RelatedCard'

// Pre-generate all game pages at build time
export async function generateStaticParams() {
  return games.map(g => ({ id: g.id }))
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const game = getGame(id)
  if (!game) return {}
  return {
    title: `${game.title} — Занимательная Грамматика`,
    description: game.description,
  }
}

export default async function GamePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const game = getGame(id)
  if (!game) notFound()

  const sec     = SECTIONS[game.section]
  const related = getRelated(game.id, game.section)

  return (
    <main style={{ minHeight: '100vh' }}>

      {/* ── Breadcrumb nav ── */}
      <nav style={{
        background: '#1a1208',
        padding: '0.65rem 1.5rem',
        display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap',
        borderBottom: '2px solid #8B1A1A',
      }}>
        <Link href="/" style={{
          color: '#c4a882', textDecoration: 'none',
          fontSize: '0.82rem', fontFamily: "'Playfair Display', serif", fontStyle: 'italic',
        }}>
          ← Все игры
        </Link>
        <span style={{ color: '#5a3e28' }}>›</span>
        <span style={{ color: '#8a6a44', fontSize: '0.78rem' }}>{sec.emoji} {game.sectionTitle}</span>
        <span style={{ color: '#5a3e28' }}>›</span>
        <span style={{ color: '#c4a882', fontSize: '0.78rem', fontFamily: "'Playfair Display', serif" }}>
          {game.title}
        </span>
      </nav>

      {/* ── Page header ── */}
      <header style={{
        maxWidth: 780, margin: '0 auto',
        padding: '1.75rem 1.5rem 1.4rem',
        borderBottom: '1px solid #e0cba8',
      }}>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.85rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <SectionBadge section={game.section} />
          <TypeBadge type={game.type} />
          <span style={{ fontSize: '0.65rem', color: '#b8956a', fontStyle: 'italic' }}>{game.source}</span>
        </div>

        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 'clamp(1.5rem, 4vw, 2.1rem)',
          color: '#1a1208', lineHeight: 1.2,
          marginBottom: '0.5rem',
        }}>
          {game.title}
        </h1>

        <p style={{ color: '#5a3e28', fontSize: '0.9rem', fontStyle: 'italic', lineHeight: 1.65 }}>
          {game.description}
        </p>
      </header>

      {/* ── Game content ── */}
      <div className="fade-up" style={{
        maxWidth: 780, margin: '0 auto',
        padding: '1.5rem',
        display: 'flex', flexDirection: 'column', gap: '2rem',
      }}>
        {game.items   && <ItemsList     items={game.items}       accent={sec.accent} />}
        {game.riddles && <RiddlesList   riddles={game.riddles}   accent={sec.accent} />}
        {game.quiz    && <QuizList      questions={game.quiz}    accent={sec.accent} />}
        {game.crossword && <CrosswordView crossword={game.crossword} accent={sec.accent} />}
      </div>

      {/* ── Related games ── */}
      {related.length > 0 && (
        <aside style={{
          maxWidth: 780, margin: '0 auto',
          padding: '0 1.5rem 2.5rem',
          borderTop: '1px solid #e0cba8',
          paddingTop: '1.5rem',
        }}>
          <h3 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: '0.95rem', color: '#1a1208',
            marginBottom: '0.85rem',
          }}>
            Другие игры из раздела «{game.sectionTitle}»
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '0.75rem',
          }}>
            {related.map(g => <RelatedCard key={g.id} game={g} />)}
          </div>
        </aside>
      )}

      <footer style={{
        background: '#1a1208', color: '#6a5035',
        textAlign: 'center', padding: '1.25rem',
        fontSize: '0.75rem', fontFamily: "'Martel', serif",
        borderTop: '4px solid #8B1A1A', marginTop: '1rem',
      }}>
        Занимательная грамматика
      </footer>
    </main>
  )
}
