import { AnswerButton } from './AnswerButton'
import type { QuizQuestion } from './types'

interface Props {
  questions: QuizQuestion[]
  accent: string
}

export function QuizList({ questions, accent }: Props) {
  return (
    <section>
      <h2
        style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: '1.15rem',
          color: '#1a1208',
          marginBottom: '1rem',
        }}
      >
        Викторина
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
        {questions.map((q, i) => (
          <div
            key={i}
            style={{
              background: 'linear-gradient(145deg, #fdfaf4 0%, #f8f2e3 100%)',
              border: '1px solid #e0cba8',
              borderRadius: 4,
              padding: '1rem 1.15rem',
              boxShadow: '0 2px 8px rgba(26,18,8,0.06)',
            }}
          >
            <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
              <div
                style={{
                  background: accent,
                  color: '#fdfaf4',
                  width: 26,
                  height: 26,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.72rem',
                  fontFamily: "'Playfair Display', serif",
                  fontWeight: 700,
                  flexShrink: 0,
                  marginTop: 2,
                }}
              >
                {i + 1}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '0.9rem', lineHeight: 1.65, color: '#1a1208', marginBottom: '0.55rem' }}>
                  {q.question}
                </p>
                <AnswerButton answer={q.answer} accent={accent} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
