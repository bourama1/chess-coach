import React from 'react'

function EngineInfo({ bestMove, score, pv }) {
  if (!bestMove) return null

  const scoreColor = score > 0.5 ? '#8db88d' : score < -0.5 ? '#b88d8d' : 'var(--text-secondary)'
  const scoreText = score >= 999 ? 'Mate' : score <= -999 ? 'Mate' :
    score > 0 ? `+${score.toFixed(2)}` : score < 0 ? score.toFixed(2) : '0.00'

  return (
    <div style={{
      background: 'var(--bg-deep)',
      border: '1px solid var(--border)',
      borderRadius: '6px',
      padding: '12px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
    }}>
      <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
        Engine Analysis
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Best: </span>
          <span style={{
            color: 'var(--accent-amber-bright)',
            fontWeight: '500',
            fontSize: '14px',
          }}>
            {bestMove}
          </span>
        </div>
        <span style={{ color: scoreColor, fontSize: '13px', fontWeight: '500' }}>
          {scoreText}
        </span>
      </div>
      {pv && pv.length > 0 && (
        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          <span style={{ color: 'var(--text-muted)' }}>Line: </span>
          <span style={{ color: 'var(--text-secondary)' }}>{pv.slice(0, 5).join(' ')}</span>
        </div>
      )}
    </div>
  )
}

function SkeletonLine({ width = '100%' }) {
  return (
    <div style={{
      height: '12px',
      borderRadius: '3px',
      width,
      background: 'linear-gradient(90deg, var(--bg-card) 25%, var(--bg-hover) 50%, var(--bg-card) 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.5s infinite',
    }} />
  )
}

export default function CoachPanel({ engineData, explanation, isThinkingEngine, isThinkingAI, error, gameStatus }) {
  const isActive = engineData?.bestMove

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      animation: 'fadeInUp 0.4s ease-out',
    }}>
      {/* Game status banner */}
      {gameStatus && gameStatus !== 'playing' && (
        <div style={{
          background: gameStatus === 'checkmate' ? 'rgba(200,64,64,0.15)' : 'rgba(200,146,42,0.12)',
          border: `1px solid ${gameStatus === 'checkmate' ? 'var(--danger)' : 'var(--accent-amber-dim)'}`,
          borderRadius: '6px',
          padding: '10px 14px',
          fontSize: '13px',
          color: gameStatus === 'checkmate' ? '#e88080' : 'var(--accent-amber-bright)',
          textAlign: 'center',
          fontWeight: '500',
        }}>
          {gameStatus === 'checkmate' && '♚ Checkmate'}
          {gameStatus === 'stalemate' && '⊘ Stalemate — Draw'}
          {gameStatus === 'draw' && '½ Draw'}
          {gameStatus === 'check' && '⚡ Check!'}
        </div>
      )}

      {/* Engine section */}
      {isThinkingEngine ? (
        <div style={{
          background: 'var(--bg-deep)',
          border: '1px solid var(--border)',
          borderRadius: '6px',
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}>
          <div style={{ fontSize: '10px', color: 'var(--accent-amber)', letterSpacing: '0.1em', textTransform: 'uppercase', animation: 'pulse-amber 1.2s infinite' }}>
            Engine thinking...
          </div>
          <SkeletonLine width="60%" />
          <SkeletonLine width="80%" />
        </div>
      ) : isActive ? (
        <EngineInfo {...engineData} />
      ) : (
        <div style={{
          background: 'var(--bg-deep)',
          border: '1px solid var(--border)',
          borderRadius: '6px',
          padding: '16px',
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: '12px',
        }}>
          Make a move to see analysis
        </div>
      )}

      {/* AI Coach explanation */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '6px',
        padding: '14px',
        minHeight: '100px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          fontSize: '10px',
          color: 'var(--text-muted)',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          marginBottom: '10px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span>Coach Insight</span>
          <span style={{
            color: 'var(--accent-amber-dim)',
            fontSize: '10px',
          }}>Groq AI</span>
        </div>

        {error ? (
          <div style={{ color: '#e88080', fontSize: '12px' }}>
            ⚠ {error}
          </div>
        ) : isThinkingAI ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '11px', color: 'var(--accent-amber)', animation: 'pulse-amber 1.2s infinite' }}>
              Analyzing position...
            </div>
            <SkeletonLine />
            <SkeletonLine width="90%" />
            <SkeletonLine width="75%" />
          </div>
        ) : explanation ? (
          <p style={{
            color: 'var(--text-primary)',
            fontSize: '13px',
            lineHeight: '1.7',
            fontFamily: "'Playfair Display', serif",
            fontStyle: 'italic',
          }}>
            {explanation}
          </p>
        ) : (
          <p style={{ color: 'var(--text-muted)', fontSize: '12px', fontStyle: 'italic' }}>
            {isActive ? 'Waiting for coach...' : 'Play a move to receive coaching.'}
          </p>
        )}
      </div>
    </div>
  )
}
