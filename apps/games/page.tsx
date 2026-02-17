'use client';

import Link from 'next/link';
import { games, sections, gameTypeLabels, gameTypeEmojis } from './data/games';
import { useState } from 'react';

export default function Home() {
  const [activeSection, setActiveSection] = useState<string>('all');
  const [activeType, setActiveType] = useState<string>('all');

  const filtered = games.filter(g => {
    const sectionOk = activeSection === 'all' || g.section === activeSection;
    const typeOk = activeType === 'all' || g.type === activeType;
    return sectionOk && typeOk;
  });

  const sectionColors = {
    phonetics: { accent: '#8B1A1A', bg: '#fef5ee', label: '#6d1515' },
    morphology: { accent: '#1A2A8B', bg: '#eef1fe', label: '#162278' },
    lexics: { accent: '#1A5A2A', bg: '#eefef3', label: '#154820' },
  };

  return (
    <main style={{ minHeight: '100vh', background: '#f5ead8' }}>
      {/* ===== HERO ===== */}
      <header style={{
        background: 'linear-gradient(180deg, #1a1208 0%, #2d1f0e 100%)',
        padding: '3rem 2rem',
        textAlign: 'center',
        borderBottom: '4px solid #8B1A1A',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative background pattern */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `radial-gradient(circle at 20% 50%, rgba(139,26,26,0.15) 0%, transparent 60%), 
                            radial-gradient(circle at 80% 50%, rgba(139,100,26,0.1) 0%, transparent 60%)`,
        }} />

        <div style={{ position: 'relative', maxWidth: 700, margin: '0 auto' }}>
          <p style={{
            color: '#b8956a',
            fontFamily: "'IM Fell English', serif",
            fontStyle: 'italic',
            fontSize: '0.85rem',
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            marginBottom: '1rem',
          }}>
            А. Т. Арсирий · Г. М. Дмитриева · 1963
          </p>
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            color: '#fdfaf4',
            fontSize: 'clamp(2rem, 5vw, 3.5rem)',
            lineHeight: 1.15,
            marginBottom: '0.75rem',
            fontWeight: 700,
          }}>
            Занимательная
            <br />
            <span style={{ color: '#c9905a' }}>Грамматика</span>
          </h1>
          <div className="ornament">❧ ✦ ❧</div>
          <p style={{
            color: '#c4a882',
            fontSize: '1.05rem',
            fontFamily: "'Martel', serif",
            fontWeight: 300,
            lineHeight: 1.7,
            maxWidth: 500,
            margin: '0 auto',
          }}>
            Интерактивный сборник игр, загадок и шарад
            <br />по русскому языку для учеников и учителей
          </p>

          <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', marginTop: '2rem', flexWrap: 'wrap' }}>
            {sections.map(s => {
              const count = games.filter(g => g.section === s.id).length;
              return (
                <div key={s.id} style={{
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: 4,
                  padding: '0.6rem 1.2rem',
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: '1.5rem' }}>{s.emoji}</div>
                  <div style={{ color: '#fdfaf4', fontSize: '0.85rem', fontFamily: "'Playfair Display', serif" }}>{s.title}</div>
                  <div style={{ color: '#b8956a', fontSize: '0.75rem' }}>{count} игр</div>
                </div>
              );
            })}
          </div>
        </div>
      </header>

      {/* ===== FILTERS ===== */}
      <div style={{
        background: '#e8d5b0',
        borderBottom: '1px solid #d4c09a',
        padding: '1rem 2rem',
        display: 'flex',
        gap: '2rem',
        alignItems: 'center',
        flexWrap: 'wrap',
        justifyContent: 'center',
      }}>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.75rem', fontFamily: "'Playfair Display', serif", fontStyle: 'italic', color: '#5a3e28', letterSpacing: '0.08em' }}>РАЗДЕЛ:</span>
          {[{ id: 'all', title: 'Все' }, ...sections].map(s => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              style={{
                padding: '0.3rem 0.8rem',
                border: '1.5px solid',
                borderColor: activeSection === s.id ? '#8B1A1A' : '#c4a882',
                background: activeSection === s.id ? '#8B1A1A' : 'transparent',
                color: activeSection === s.id ? '#fdfaf4' : '#5a3e28',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontFamily: "'Martel', serif",
                borderRadius: 2,
                transition: 'all 0.15s',
              }}
            >
              {'emoji' in s ? `${s.emoji} ` : ''}{s.title}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.75rem', fontFamily: "'Playfair Display', serif", fontStyle: 'italic', color: '#5a3e28', letterSpacing: '0.08em' }}>ТИП:</span>
          {[{ id: 'all', label: 'Все', emoji: '📋' }, 
            ...Object.entries(gameTypeLabels).map(([id, label]) => ({ id, label, emoji: gameTypeEmojis[id as keyof typeof gameTypeEmojis] }))
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveType(t.id)}
              style={{
                padding: '0.3rem 0.8rem',
                border: '1.5px solid',
                borderColor: activeType === t.id ? '#8B1A1A' : '#c4a882',
                background: activeType === t.id ? '#8B1A1A' : 'transparent',
                color: activeType === t.id ? '#fdfaf4' : '#5a3e28',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontFamily: "'Martel', serif",
                borderRadius: 2,
                transition: 'all 0.15s',
              }}
            >
              {t.emoji} {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ===== GAME GRID ===== */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '2.5rem 2rem' }}>
        <p style={{ color: '#8a6a44', fontSize: '0.85rem', marginBottom: '1.5rem', fontStyle: 'italic', textAlign: 'center' }}>
          Найдено {filtered.length} {filtered.length === 1 ? 'игра' : filtered.length < 5 ? 'игры' : 'игр'}
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '1.5rem',
        }}>
          {filtered.map(game => {
            const sec = sectionColors[game.section as keyof typeof sectionColors];
            return (
              <Link href={`/game/${game.id}`} key={game.id} style={{ textDecoration: 'none', color: 'inherit' }}>
                <article className="game-card-hover" style={{
                  background: 'linear-gradient(145deg, #fdfaf4 0%, #f8f2e4 100%)',
                  borderRadius: 4,
                  overflow: 'hidden',
                  border: '1px solid #e0cba8',
                  boxShadow: '0 2px 12px rgba(26,18,8,0.08)',
                  height: '100%',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                }}>
                  {/* Top accent bar */}
                  <div style={{ height: 4, background: `linear-gradient(90deg, ${sec.accent}, ${sec.accent}aa)` }} />

                  <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    {/* Meta */}
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{
                        background: sec.bg,
                        color: sec.label,
                        fontSize: '0.68rem',
                        fontFamily: "'Playfair Display', serif",
                        fontStyle: 'italic',
                        padding: '2px 7px',
                        borderRadius: 2,
                        border: `1px solid ${sec.accent}33`,
                      }}>
                        {sections.find(s => s.id === game.section)?.emoji} {game.sectionTitle}
                      </span>
                      <span style={{
                        color: '#8a6a44',
                        fontSize: '0.68rem',
                        fontFamily: "'Martel', serif",
                      }}>
                        {gameTypeEmojis[game.type]} {gameTypeLabels[game.type]}
                      </span>
                    </div>

                    {/* Title */}
                    <h2 style={{
                      fontFamily: "'Playfair Display', serif",
                      fontSize: '1.15rem',
                      fontWeight: 700,
                      color: '#1a1208',
                      marginBottom: '0.5rem',
                      lineHeight: 1.3,
                      flex: 1,
                    }}>
                      {game.title}
                    </h2>

                    {/* Topic */}
                    <p style={{
                      color: '#8a6a44',
                      fontSize: '0.75rem',
                      fontFamily: "'Martel', serif",
                      letterSpacing: '0.05em',
                      marginBottom: '0.5rem',
                    }}>
                      {game.topic}
                    </p>

                    {/* Description */}
                    <p style={{
                      color: '#3d2b1f',
                      fontSize: '0.85rem',
                      lineHeight: 1.6,
                      fontFamily: "'Martel', serif",
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}>
                      {game.description}
                    </p>

                    {/* Footer */}
                    <div style={{
                      marginTop: '1rem',
                      paddingTop: '0.75rem',
                      borderTop: '1px solid #e0cba8',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}>
                      <span style={{
                        color: sec.accent,
                        fontSize: '0.8rem',
                        fontFamily: "'Playfair Display', serif",
                        fontStyle: 'italic',
                      }}>
                        Играть →
                      </span>
                      <span style={{
                        color: '#b8956a',
                        fontSize: '0.7rem',
                        fontFamily: "'Martel', serif",
                      }}>
                        {game.source}
                      </span>
                    </div>
                  </div>
                </article>
              </Link>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#8a6a44' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📜</div>
            <p style={{ fontFamily: "'Playfair Display', serif", fontStyle: 'italic' }}>
              По выбранным критериям ничего не найдено
            </p>
          </div>
        )}
      </section>

      {/* Footer */}
      <footer style={{
        background: '#1a1208',
        color: '#8a6a44',
        textAlign: 'center',
        padding: '2rem',
        fontSize: '0.8rem',
        fontFamily: "'Martel', serif",
        borderTop: '4px solid #8B1A1A',
      }}>
        <div className="ornament" style={{ opacity: 0.4 }}>✦ ✦ ✦</div>
        <p>Материалы по занимательной грамматике русского языка · А. Т. Арсирий, Г. М. Дмитриева</p>
        <p style={{ marginTop: '0.25rem', opacity: 0.6 }}>Учпедгиз, Москва, 1963 · Часть первая</p>
      </footer>
    </main>
  );
}
