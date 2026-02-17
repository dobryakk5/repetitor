import { AnswerButton } from './AnswerButton'
import type { Riddle } from './types'

interface Props {
  riddles: Riddle[]
  accent: string
}

export function RiddlesList({ riddles, accent }: Props) {
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
        Загадки
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
        {riddles.map((riddle, i) => (
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
            <p
              style={{
                fontSize: '0.9rem',
                lineHeight: 1.65,
                color: '#1a1208',
                whiteSpace: 'pre-line',
                marginBottom: '0.6rem',
              }}
            >
              {riddle.text}
            </p>
            <AnswerButton answer={riddle.answer} accent={accent} />
          </div>
        ))}
      </div>
    </section>
  )
}
