import React from 'react'

export default function EvalBar({ score, isThinking }) {
  // score: centipawn value from white's perspective, clamped
  const clamp = (v, min, max) => Math.min(max, Math.max(min, v))
  
  // Convert score to percentage (50% = equal, 0% = black winning, 100% = white winning)
  const toPercent = (s) => {
    if (s === null || s === undefined) return 50
    if (s >= 999) return 96
    if (s <= -999) return 4
    // Sigmoid-like mapping: ±3 pawns ≈ ±40%
    const pct = 50 + (Math.atan(s * 0.4) / Math.PI) * 100
    return clamp(pct, 4, 96)
  }

  const whitePct = toPercent(score)
  const blackPct = 100 - whitePct

  const formatScore = (s) => {
    if (s === null || s === undefined) return '0.00'
    if (s >= 999) return 'M'
    if (s <= -999) return 'M'
    return Math.abs(s).toFixed(2)
  }

  const winner = score === null ? null : score > 0.1 ? 'white' : score < -0.1 ? 'black' : null

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '8px',
      userSelect: 'none',
    }}>
      {/* Score label */}
      <div style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: '11px',
        color: isThinking ? 'var(--accent-amber)' : 'var(--text-secondary)',
        letterSpacing: '0.05em',
        animation: isThinking ? 'pulse-amber 1.2s ease-in-out infinite' : 'none',
        minHeight: '16px',
      }}>
        {isThinking ? 'thinking...' : score !== null ? (
          <span style={{ color: score > 0.1 ? 'var(--eval-white)' : score < -0.1 ? 'var(--text-muted)' : 'var(--text-secondary)' }}>
            {score > 0 ? '+' : score < 0 ? '-' : ''}{formatScore(score)}
          </span>
        ) : '—'}
      </div>

      {/* Bar */}
      <div style={{
        width: '28px',
        height: '320px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '4px',
        overflow: 'hidden',
        position: 'relative',
      }}>
        {/* Black segment (top) */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: `${blackPct}%`,
          background: 'linear-gradient(180deg, #0e0d0b 0%, #1a1714 100%)',
          transition: 'height 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
        }} />
        {/* White segment (bottom) */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: `${whitePct}%`,
          background: 'linear-gradient(180deg, #c8c0b0 0%, #e8e0d0 100%)',
          transition: 'height 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
        }} />
        {/* Center line */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: 0,
          right: 0,
          height: '1px',
          background: 'var(--border-light)',
          transform: 'translateY(-50%)',
          opacity: 0.5,
        }} />
      </div>

      {/* W/B labels */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px',
        fontSize: '10px',
        color: 'var(--text-muted)',
        letterSpacing: '0.08em',
      }}>
        <span style={{ color: winner === 'white' ? 'var(--text-primary)' : 'var(--text-muted)' }}>W</span>
        <span style={{ color: winner === 'black' ? 'var(--text-primary)' : 'var(--text-muted)' }}>B</span>
      </div>
    </div>
  )
}
