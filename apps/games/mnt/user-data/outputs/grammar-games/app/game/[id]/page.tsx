'use client';

import Link from 'next/link';
import { games, sections, gameTypeLabels, gameTypeEmojis } from '../../data/games';
import { useState } from 'react';
import { notFound } from 'next/navigation';

interface Props {
  params: { id: string };
}

export default function GamePage({ params }: Props) {
  const game = games.find(g => g.id === params.id);
  if (!game) notFound();

  const section = sections.find(s => s.id === game.section);
  const sectionColors = {
    phonetics: { accent: '#8B1A1A', bg: '#fef5ee', light: '#fff8f4' },
    morphology: { accent: '#1A2A8B', bg: '#eef1fe', light: '#f4f6ff' },
    lexics: { accent: '#1A5A2A', bg: '#eefef3', light: '#f4fef6' },
  };
  const colors = sectionColors[game.section as keyof typeof sectionColors];

  return (
    <main style={{ minHeight: '100vh', background: '#f5ead8' }}>
      {/* Nav */}
      <div style={{
        background: '#1a1208',
        padding: '0.75rem 2rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        borderBottom: '2px solid #8B1A1A',
      }}>
        <Link href="/" style={{
          color: '#c4a882',
          textDecoration: 'none',
          fontSize: '0.85rem',
          fontFamily: "'Playfair Display', serif",
          fontStyle: 'italic',
          display: 'flex',
          alignItems: 'center',
          gap: '0.3rem',
        }}>
          ← Все игры
        </Link>
        <span style={{ color: '#5a3e28' }}>›</span>
        <span style={{ color: '#8a6a44', fontSize: '0.85rem' }}>{section?.emoji} {game.sectionTitle}</span>
        <span style={{ color: '#5a3e28' }}>›</span>
        <span style={{ color: '#c4a882', fontSize: '0.85rem', fontFamily: "'Playfair Display', serif" }}>{game.title}</span>
      </div>

      {/* Header */}
      <header style={{
        background: `linear-gradient(180deg, ${colors.accent}22 0%, transparent 100%)`,
        borderBottom: '1px solid #e0cba8',
        padding: '2.5rem 2rem',
        maxWidth: 800,
        margin: '0 auto',
      }}>
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <span style={{
            background: colors.bg,
            color: colors.accent,
            fontSize: '0.72rem',
            fontFamily: "'Playfair Display', serif",
            fontStyle: 'italic',
            padding: '3px 10px',
            border: `1px solid ${colors.accent}44`,
            borderRadius: 2,
          }}>
            {section?.emoji} {game.sectionTitle}
          </span>
          <span style={{
            background: '#1a12080d',
            color: '#5a3e28',
            fontSize: '0.72rem',
            fontFamily: "'Martel', serif",
            padding: '3px 10px',
            borderRadius: 2,
            border: '1px solid #e0cba8',
          }}>
            {gameTypeEmojis[game.type]} {gameTypeLabels[game.type]}
          </span>
          <span style={{
            background: '#1a12080d',
            color: '#8a6a44',
            fontSize: '0.72rem',
            fontFamily: "'Martel', serif",
            padding: '3px 10px',
            borderRadius: 2,
            border: '1px solid #e0cba8',
          }}>
            {game.source}
          </span>
        </div>

        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 'clamp(1.6rem, 4vw, 2.5rem)',
          color: '#1a1208',
          marginBottom: '0.75rem',
          lineHeight: 1.2,
        }}>
          {game.title}
        </h1>
        <p style={{
          color: '#5a3e28',
          fontFamily: "'Martel', serif",
          fontSize: '1rem',
          lineHeight: 1.7,
          fontStyle: 'italic',
        }}>
          {game.description}
        </p>
      </header>

      {/* Content */}
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '2rem' }}>
        <GameContent game={game} colors={colors} />
      </div>

      {/* Related games */}
      <RelatedGames currentId={game.id} section={game.section} />

      <footer style={{
        background: '#1a1208',
        color: '#8a6a44',
        textAlign: 'center',
        padding: '1.5rem',
        fontSize: '0.8rem',
        fontFamily: "'Martel', serif",
        borderTop: '4px solid #8B1A1A',
        marginTop: '3rem',
      }}>
        <p>Занимательная грамматика · А. Т. Арсирий, Г. М. Дмитриева · 1963</p>
      </footer>
    </main>
  );
}

function GameContent({ game, colors }: { game: any; colors: any }) {
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const [allRevealed, setAllRevealed] = useState(false);

  const toggle = (i: number) => {
    setRevealed(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  const cardStyle = {
    background: 'linear-gradient(145deg, #fdfaf4 0%, #f8f2e4 100%)',
    border: '1px solid #e0cba8',
    borderRadius: 4,
    padding: '1.5rem',
    marginBottom: '1.5rem',
    boxShadow: '0 2px 12px rgba(26,18,8,0.07)',
  };

  const { instructions, items, riddles, quiz, crossword, charades } = game.content;

  return (
    <div className="fade-in">
      {/* Instructions */}
      {instructions && (
        <div style={{ ...cardStyle, borderLeft: `4px solid ${colors.accent}` }}>
          <h2 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: '1rem',
            color: colors.accent,
            marginBottom: '0.6rem',
            fontStyle: 'italic',
          }}>
            📋 Правила игры
          </h2>
          <p style={{ color: '#3d2b1f', lineHeight: 1.75, fontFamily: "'Martel', serif", fontSize: '0.95rem' }}>
            {instructions}
          </p>
        </div>
      )}

      {/* Items / Questions */}
      {items && items.length > 0 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.3rem', color: '#1a1208' }}>
              Задания
            </h2>
            <button
              onClick={() => {
                if (allRevealed) {
                  setRevealed(new Set());
                } else {
                  setRevealed(new Set(items.map((_: any, i: number) => i)));
                }
                setAllRevealed(!allRevealed);
              }}
              style={{
                padding: '0.35rem 0.9rem',
                border: `1.5px solid ${colors.accent}`,
                background: 'transparent',
                color: colors.accent,
                cursor: 'pointer',
                fontFamily: "'Playfair Display', serif",
                fontStyle: 'italic',
                fontSize: '0.8rem',
                borderRadius: 2,
              }}
            >
              {allRevealed ? 'Скрыть ответы' : 'Показать все'}
            </button>
          </div>
          {items.map((item: any, i: number) => (
            <div key={i} style={cardStyle}>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <span style={{
                  background: colors.accent,
                  color: '#fdfaf4',
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.8rem',
                  fontFamily: "'Playfair Display', serif",
                  fontWeight: 700,
                  flexShrink: 0,
                  marginTop: 2,
                }}>
                  {i + 1}
                </span>
                <div style={{ flex: 1 }}>
                  <p style={{
                    color: '#1a1208',
                    fontFamily: "'Martel', serif",
                    fontSize: '0.95rem',
                    lineHeight: 1.7,
                    marginBottom: item.hint || item.answer ? '0.75rem' : 0,
                  }}>
                    {item.question}
                  </p>

                  {item.hint && (
                    <p style={{
                      color: '#8a6a44',
                      fontFamily: "'Martel', serif",
                      fontSize: '0.85rem',
                      lineHeight: 1.6,
                      fontStyle: 'italic',
                      marginBottom: '0.5rem',
                    }}>
                      💡 Подсказка: {item.hint}
                    </p>
                  )}

                  {item.answer && (
                    <div>
                      <button
                        onClick={() => toggle(i)}
                        style={{
                          padding: '0.35rem 0.9rem',
                          border: `1.5px solid ${colors.accent}`,
                          background: revealed.has(i) ? colors.accent : 'transparent',
                          color: revealed.has(i) ? '#fdfaf4' : colors.accent,
                          cursor: 'pointer',
                          fontFamily: "'Playfair Display', serif",
                          fontStyle: 'italic',
                          fontSize: '0.78rem',
                          borderRadius: 2,
                          transition: 'all 0.2s',
                          marginTop: '0.25rem',
                        }}
                      >
                        {revealed.has(i) ? '🙈 Скрыть' : '✨ Ответ'}
                      </button>

                      {revealed.has(i) && (
                        <div className="answer-reveal" style={{
                          marginTop: '0.75rem',
                          padding: '0.75rem 1rem',
                          background: `${colors.accent}12`,
                          borderLeft: `3px solid ${colors.accent}`,
                          borderRadius: '0 4px 4px 0',
                        }}>
                          <p style={{
                            color: '#1a1208',
                            fontFamily: "'Martel', serif",
                            fontSize: '0.9rem',
                            lineHeight: 1.65,
                          }}>
                            <strong style={{ fontFamily: "'Playfair Display', serif", color: colors.accent }}>Ответ: </strong>
                            {item.answer}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Riddles */}
      {riddles && riddles.length > 0 && (
        <div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.3rem', color: '#1a1208', marginBottom: '1rem' }}>
            🔮 Загадки
          </h2>
          {riddles.map((r: any, i: number) => (
            <RiddleCard key={i} riddle={r} index={i} colors={colors} />
          ))}
        </div>
      )}

      {/* Charades */}
      {charades && charades.length > 0 && (
        <div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.3rem', color: '#1a1208', marginBottom: '1rem' }}>
            🎭 Шарады
          </h2>
          {charades.map((c: any, i: number) => (
            <CharadeCard key={i} charade={c} index={i} colors={colors} />
          ))}
        </div>
      )}

      {/* Quiz */}
      {quiz && quiz.length > 0 && (
        <div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.3rem', color: '#1a1208', marginBottom: '1rem' }}>
            ❓ Вопросы викторины
          </h2>
          <QuizComponent questions={quiz} colors={colors} />
        </div>
      )}

      {/* Crossword */}
      {crossword && (
        <CrosswordComponent crossword={crossword} colors={colors} />
      )}
    </div>
  );
}

function RiddleCard({ riddle, index, colors }: { riddle: any; index: number; colors: any }) {
  const [shown, setShown] = useState(false);
  return (
    <div style={{
      background: 'linear-gradient(145deg, #fdfaf4 0%, #f8f2e4 100%)',
      border: '1px solid #e0cba8',
      borderRadius: 4,
      padding: '1.5rem',
      marginBottom: '1.25rem',
      boxShadow: '0 2px 12px rgba(26,18,8,0.07)',
    }}>
      <div style={{
        fontFamily: "'IM Fell English', serif",
        fontSize: '1rem',
        lineHeight: 1.8,
        color: '#2d1f0e',
        fontStyle: 'italic',
        borderLeft: `3px solid ${colors.accent}44`,
        paddingLeft: '1rem',
        marginBottom: '1rem',
        whiteSpace: 'pre-line',
      }}>
        {riddle.text}
      </div>
      <button
        onClick={() => setShown(!shown)}
        style={{
          padding: '0.35rem 0.9rem',
          border: `1.5px solid ${colors.accent}`,
          background: shown ? colors.accent : 'transparent',
          color: shown ? '#fdfaf4' : colors.accent,
          cursor: 'pointer',
          fontFamily: "'Playfair Display', serif",
          fontStyle: 'italic',
          fontSize: '0.78rem',
          borderRadius: 2,
          transition: 'all 0.2s',
        }}
      >
        {shown ? '🙈 Скрыть' : '✨ Отгадка'}
      </button>
      {shown && (
        <div className="answer-reveal" style={{
          marginTop: '0.75rem',
          padding: '0.75rem 1rem',
          background: `${colors.accent}12`,
          borderLeft: `3px solid ${colors.accent}`,
          borderRadius: '0 4px 4px 0',
        }}>
          <strong style={{ fontFamily: "'Playfair Display', serif", color: colors.accent }}>Ответ: </strong>
          <span style={{ fontFamily: "'Martel', serif", fontSize: '0.9rem' }}>{riddle.answer}</span>
        </div>
      )}
    </div>
  );
}

function CharadeCard({ charade, index, colors }: { charade: any; index: number; colors: any }) {
  const [shown, setShown] = useState(false);
  return (
    <div style={{
      background: 'linear-gradient(145deg, #fdfaf4 0%, #f8f2e4 100%)',
      border: '1px solid #e0cba8',
      borderRadius: 4,
      padding: '1.5rem',
      marginBottom: '1.25rem',
      boxShadow: '0 2px 12px rgba(26,18,8,0.07)',
    }}>
      <pre style={{
        fontFamily: "'IM Fell English', serif",
        fontSize: '1rem',
        lineHeight: 1.9,
        color: '#2d1f0e',
        fontStyle: 'italic',
        whiteSpace: 'pre-wrap',
        margin: 0,
        borderLeft: `3px solid ${colors.accent}44`,
        paddingLeft: '1rem',
        marginBottom: '1rem',
      }}>
        {charade.verse}
      </pre>
      <button
        onClick={() => setShown(!shown)}
        style={{
          padding: '0.35rem 0.9rem',
          border: `1.5px solid ${colors.accent}`,
          background: shown ? colors.accent : 'transparent',
          color: shown ? '#fdfaf4' : colors.accent,
          cursor: 'pointer',
          fontFamily: "'Playfair Display', serif",
          fontStyle: 'italic',
          fontSize: '0.78rem',
          borderRadius: 2,
          transition: 'all 0.2s',
        }}
      >
        {shown ? '🙈 Скрыть' : '🔑 Разгадка'}
      </button>
      {shown && (
        <div className="answer-reveal" style={{
          marginTop: '0.75rem',
          padding: '0.75rem 1rem',
          background: `${colors.accent}12`,
          borderLeft: `3px solid ${colors.accent}`,
          borderRadius: '0 4px 4px 0',
        }}>
          <strong style={{ fontFamily: "'Playfair Display', serif", color: colors.accent }}>Ответ: </strong>
          <span style={{ fontFamily: "'Martel', serif" }}>{charade.answer}</span>
        </div>
      )}
    </div>
  );
}

function QuizComponent({ questions, colors }: { questions: any[]; colors: any }) {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Set<number>>(new Set());
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const reveal = (i: number) => {
    if (!answers.has(i)) {
      setAnswers(prev => new Set([...prev, i]));
    }
  };

  return (
    <div>
      {questions.map((q: any, i: number) => (
        <div key={i} style={{
          background: 'linear-gradient(145deg, #fdfaf4 0%, #f8f2e4 100%)',
          border: '1px solid #e0cba8',
          borderRadius: 4,
          padding: '1.25rem',
          marginBottom: '1rem',
          boxShadow: '0 2px 8px rgba(26,18,8,0.06)',
        }}>
          <p style={{
            fontFamily: "'Martel', serif",
            fontSize: '0.95rem',
            lineHeight: 1.7,
            color: '#1a1208',
            marginBottom: '0.75rem',
          }}>
            <span style={{
              display: 'inline-block',
              background: colors.accent,
              color: '#fdfaf4',
              width: 22,
              height: 22,
              borderRadius: '50%',
              textAlign: 'center',
              lineHeight: '22px',
              fontSize: '0.75rem',
              marginRight: '0.5rem',
              fontFamily: "'Playfair Display', serif",
              fontWeight: 700,
            }}>{i + 1}</span>
            {q.question}
          </p>
          <button
            onClick={() => reveal(i)}
            style={{
              padding: '0.3rem 0.8rem',
              border: `1.5px solid ${colors.accent}`,
              background: answers.has(i) ? colors.accent : 'transparent',
              color: answers.has(i) ? '#fdfaf4' : colors.accent,
              cursor: 'pointer',
              fontFamily: "'Playfair Display', serif",
              fontStyle: 'italic',
              fontSize: '0.78rem',
              borderRadius: 2,
              transition: 'all 0.2s',
            }}
          >
            {answers.has(i) ? '✓ Показан' : '💡 Ответ'}
          </button>
          {answers.has(i) && (
            <div className="answer-reveal" style={{
              marginTop: '0.75rem',
              padding: '0.65rem 0.9rem',
              background: `${colors.accent}12`,
              borderLeft: `3px solid ${colors.accent}`,
              borderRadius: '0 4px 4px 0',
            }}>
              <span style={{ fontFamily: "'Martel', serif", fontSize: '0.88rem', color: '#1a1208', lineHeight: 1.65 }}>
                <strong style={{ color: colors.accent }}>Ответ: </strong>{q.answer}
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function CrosswordComponent({ crossword, colors }: { crossword: any; colors: any }) {
  const [shownAcross, setShownAcross] = useState<Set<number>>(new Set());
  const [shownDown, setShownDown] = useState<Set<number>>(new Set());

  return (
    <div>
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.3rem', color: '#1a1208', marginBottom: '1.5rem' }}>
        📝 Кроссворд
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* По горизонтали */}
        <div>
          <h3 style={{
            fontFamily: "'Playfair Display', serif",
            fontStyle: 'italic',
            color: colors.accent,
            fontSize: '1rem',
            marginBottom: '0.75rem',
            borderBottom: `2px solid ${colors.accent}33`,
            paddingBottom: '0.4rem',
          }}>
            По горизонтали
          </h3>
          {crossword.across.map((clue: any) => (
            <CrosswordClueItem
              key={clue.number}
              clue={clue}
              shown={shownAcross.has(clue.number)}
              onToggle={() => setShownAcross(prev => {
                const next = new Set(prev);
                next.has(clue.number) ? next.delete(clue.number) : next.add(clue.number);
                return next;
              })}
              colors={colors}
            />
          ))}
        </div>

        {/* По вертикали */}
        <div>
          <h3 style={{
            fontFamily: "'Playfair Display', serif",
            fontStyle: 'italic',
            color: colors.accent,
            fontSize: '1rem',
            marginBottom: '0.75rem',
            borderBottom: `2px solid ${colors.accent}33`,
            paddingBottom: '0.4rem',
          }}>
            По вертикали
          </h3>
          {crossword.down.map((clue: any) => (
            <CrosswordClueItem
              key={clue.number}
              clue={clue}
              shown={shownDown.has(clue.number)}
              onToggle={() => setShownDown(prev => {
                const next = new Set(prev);
                next.has(clue.number) ? next.delete(clue.number) : next.add(clue.number);
                return next;
              })}
              colors={colors}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function CrosswordClueItem({ clue, shown, onToggle, colors }: any) {
  return (
    <div style={{
      display: 'flex',
      gap: '0.5rem',
      alignItems: 'flex-start',
      marginBottom: '0.6rem',
      padding: '0.5rem',
      background: shown ? `${colors.accent}10` : 'transparent',
      borderRadius: 3,
      transition: 'background 0.2s',
    }}>
      <span style={{
        background: colors.accent,
        color: '#fdfaf4',
        width: 20,
        height: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '0.7rem',
        fontWeight: 700,
        borderRadius: 2,
        flexShrink: 0,
        marginTop: 2,
      }}>
        {clue.number}
      </span>
      <div style={{ flex: 1 }}>
        <p style={{ fontFamily: "'Martel', serif", fontSize: '0.82rem', color: '#3d2b1f', margin: 0, lineHeight: 1.5 }}>
          {clue.clue}
        </p>
        {shown && (
          <p className="answer-reveal" style={{
            fontFamily: "'Playfair Display', serif",
            fontStyle: 'italic',
            fontSize: '0.85rem',
            color: colors.accent,
            fontWeight: 700,
            margin: '0.25rem 0 0',
          }}>
            {clue.answer}
          </p>
        )}
      </div>
      <button
        onClick={onToggle}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: '0.9rem',
          padding: '2px',
          opacity: 0.7,
        }}
        title={shown ? 'Скрыть' : 'Показать ответ'}
      >
        {shown ? '🙈' : '👁'}
      </button>
    </div>
  );
}

function RelatedGames({ currentId, section }: { currentId: string; section: string }) {
  const related = games.filter(g => g.section === section && g.id !== currentId).slice(0, 3);
  if (!related.length) return null;

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 2rem 2rem' }}>
      <h2 style={{
        fontFamily: "'Playfair Display', serif",
        fontSize: '1.2rem',
        color: '#1a1208',
        marginBottom: '1rem',
        borderTop: '1px solid #e0cba8',
        paddingTop: '1.5rem',
      }}>
        Другие игры из этого раздела
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
        {related.map(g => (
          <Link key={g.id} href={`/game/${g.id}`} style={{
            textDecoration: 'none',
            background: 'linear-gradient(145deg, #fdfaf4 0%, #f8f2e4 100%)',
            border: '1px solid #e0cba8',
            borderRadius: 4,
            padding: '1rem',
            display: 'block',
            color: 'inherit',
            transition: 'transform 0.15s, box-shadow 0.15s',
          }}
          className="game-card-hover"
          >
            <p style={{ fontSize: '0.7rem', color: '#8a6a44', fontFamily: "'Martel', serif", marginBottom: '0.3rem' }}>
              {gameTypeEmojis[g.type]} {gameTypeLabels[g.type]}
            </p>
            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: '0.95rem', color: '#1a1208', lineHeight: 1.3 }}>
              {g.title}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
