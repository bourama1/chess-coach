import React, { useEffect, useRef } from 'react'

export default function MoveHistory({ history, currentIndex, onGoto }) {
  const containerRef = useRef(null)

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [history])

  // Group into pairs
  const pairs = []
  for (let i = 0; i < history.length; i += 2) {
    pairs.push({ white: history[i], black: history[i + 1], moveNum: Math.floor(i / 2) + 1 })
  }

  if (history.length === 0) {
    return (
      <div style={{
        color: 'var(--text-muted)',
        fontSize: '12px',
        textAlign: 'center',
        padding: '24px 0',
        fontStyle: 'italic',
      }}>
        No moves yet
      </div>
    )
  }

  return (
    <div ref={containerRef} style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '2px',
      maxHeight: '200px',
      overflowY: 'auto',
    }}>
      {pairs.map(({ white, black, moveNum }) => (
        <div key={moveNum} style={{
          display: 'grid',
          gridTemplateColumns: '28px 1fr 1fr',
          gap: '4px',
          alignItems: 'center',
        }}>
          <span style={{
            color: 'var(--text-muted)',
            fontSize: '11px',
            textAlign: 'right',
            paddingRight: '4px',
          }}>
            {moveNum}.
          </span>
          {[white, black].map((move, idx) => {
            if (!move) return <div key={idx} />
            const globalIdx = (moveNum - 1) * 2 + idx
            const isActive = globalIdx === currentIndex - 1
            return (
              <button
                key={idx}
                onClick={() => onGoto && onGoto(globalIdx + 1)}
                style={{
                  background: isActive ? 'var(--accent-amber-dim)' : 'transparent',
                  border: isActive ? '1px solid var(--accent-amber)' : '1px solid transparent',
                  borderRadius: '3px',
                  color: isActive ? 'var(--accent-amber-bright)' : 'var(--text-primary)',
                  padding: '2px 6px',
                  fontSize: '12px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontFamily: "'JetBrains Mono', monospace",
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { if (!isActive) e.target.style.background = 'var(--bg-hover)' }}
                onMouseLeave={e => { if (!isActive) e.target.style.background = 'transparent' }}
              >
                {move}
              </button>
            )
          })}
        </div>
      ))}
    </div>
  )
}
