import React, { useState, useCallback, useRef } from 'react'
import { Chess } from 'chess.js'
import { Chessboard } from 'react-chessboard'
import { useStockfish } from './hooks/useStockfish'
import { useGroq } from './hooks/useGroq'
import EvalBar from './components/EvalBar'
import MoveHistory from './components/MoveHistory'
import CoachPanel from './components/CoachPanel'

export default function App() {
  const [game, setGame] = useState(new Chess())
  const [moveHistory, setMoveHistory] = useState([]) // SAN moves
  const [engineData, setEngineData] = useState(null)
  const [explanation, setExplanation] = useState('')
  const [isThinkingEngine, setIsThinkingEngine] = useState(false)
  const [isThinkingAI, setIsThinkingAI] = useState(false)
  const [aiError, setAiError] = useState(null)
  const [gameStatus, setGameStatus] = useState('playing')
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0)
  const [boardOrientation, setBoardOrientation] = useState('white')
  const [highlightSquares, setHighlightSquares] = useState({})

  const gameRef = useRef(game)
  const { evaluate, ready: engineReady } = useStockfish()
  const { explain, hasKey } = useGroq()

  const getGameStatus = (g) => {
    if (g.isCheckmate()) return 'checkmate'
    if (g.isStalemate()) return 'stalemate'
    if (g.isDraw()) return 'draw'
    if (g.isCheck()) return 'check'
    return 'playing'
  }

  const analyzePosition = useCallback(async (fen, san, history) => {
    if (!engineReady) return

    setIsThinkingEngine(true)
    setEngineData(null)
    setExplanation('')
    setAiError(null)

    try {
      const result = await evaluate(fen, 16)
      if (!result) return

      const data = { lastMovePlayed: san, score: result.score, pv: result.pv }
      setEngineData(data)
      setIsThinkingEngine(false)

      if (result.bestMove && result.bestMove.length >= 4) {
        const from = result.bestMove.slice(0, 2)
        const to = result.bestMove.slice(2, 4)
        setHighlightSquares({
          [from]: { background: 'rgba(200,146,42,0.25)', borderRadius: '3px' },
          [to]: { background: 'rgba(200,146,42,0.4)', borderRadius: '3px' },
        })
      }

      if (hasKey) {
        setIsThinkingAI(true)
        const g = gameRef.current
        try {
          const text = await explain({
            fen,
            lastMove: san,
            score: result.score,
            pv: result.pv,
            moveHistory: history,
            turn: g.turn(),
          })
          setExplanation(text || '')
        } catch (err) {
          setAiError(err.message || 'Failed to get AI explanation')
        } finally {
          setIsThinkingAI(false)
        }
      } else {
        setAiError('Missing Groq API Key (VITE_GROQ_API_KEY)')
      }
    } catch (err) {
      console.error('Engine error:', err)
      setIsThinkingEngine(false)
    }
  }, [engineReady, evaluate, explain, hasKey])

  const onDrop = useCallback((sourceSquare, targetSquare, piece) => {
    const gameCopy = new Chess(game.fen())
    let move = null

    const isPromotion =
      (piece === 'wP' && targetSquare[1] === '8') ||
      (piece === 'bP' && targetSquare[1] === '1')

    try {
      move = gameCopy.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: isPromotion ? 'q' : undefined,
      })
    } catch {
      return false
    }

    if (!move) return false

    const newHistory = [...moveHistory, move.san]
    setGame(gameCopy)
    gameRef.current = gameCopy
    setMoveHistory(newHistory)
    setCurrentMoveIndex(newHistory.length)
    setHighlightSquares({})

    const status = getGameStatus(gameCopy)
    setGameStatus(status)

    if (status !== 'checkmate' && status !== 'stalemate' && status !== 'draw') {
      analyzePosition(gameCopy.fen(), move.san, newHistory)
    } else {
      setEngineData(null)
      setExplanation('')
      setIsThinkingEngine(false)
    }

    return true
  }, [game, moveHistory, analyzePosition])

  const handleReset = () => {
    const newGame = new Chess()
    setGame(newGame)
    gameRef.current = newGame
    setMoveHistory([])
    setCurrentMoveIndex(0)
    setEngineData(null)
    setExplanation('')
    setAiError(null)
    setGameStatus('playing')
    setHighlightSquares({})
    setIsThinkingEngine(false)
    setIsThinkingAI(false)
  }

  const handleUndo = () => {
    const gameCopy = new Chess(game.fen())
    gameCopy.undo()
    const newHistory = moveHistory.slice(0, -1)
    setGame(gameCopy)
    gameRef.current = gameCopy
    setMoveHistory(newHistory)
    setCurrentMoveIndex(newHistory.length)
    setEngineData(null)
    setExplanation('')
    setAiError(null)
    setHighlightSquares({})
    setGameStatus(getGameStatus(gameCopy))
  }

  const handleExportPGN = () => {
    const pgn = game.pgn()
    const blob = new Blob([pgn], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `chess-game-${Date.now()}.pgn`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="app-container">
      {/* Header */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '32px',
        paddingBottom: '20px',
        borderBottom: '1px solid var(--border)',
      }}>
        <div>
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: '32px',
            fontWeight: '600',
            color: 'var(--accent-ivory)',
            letterSpacing: '0.02em',
          }}>
            Chess Coach
          </h1>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', gap: '16px' }}>
            <span>Engine: {engineReady ? <b style={{color: 'var(--success)'}}>Ready</b> : <b style={{color: 'var(--accent-amber)'}}>Loading...</b>}</span>
            <span>AI: {hasKey ? <b style={{color: 'var(--success)'}}>Active</b> : <b style={{color: 'var(--danger)'}}>Offline</b>}</span>
          </div>
        </div>
        <div className="header-controls" style={{ display: 'flex', gap: '12px' }}>
          <IconButton onClick={() => setBoardOrientation(o => o === 'white' ? 'black' : 'white')} title="Flip Board">
            ⇅ Flip
          </IconButton>
          <IconButton onClick={handleUndo} title="Undo Move" disabled={moveHistory.length === 0}>
            ↩ Undo
          </IconButton>
          <IconButton onClick={handleReset} title="New Game">
            ⟳ Reset
          </IconButton>
          <IconButton onClick={handleExportPGN} title="Export PGN" disabled={moveHistory.length === 0}>
            ↓ PGN
          </IconButton>
        </div>
      </header>

      {/* Main layout */}
      <main className="main-layout fade-in">
        {/* Board Section */}
        <section className="board-section">
          <EvalBar
            score={engineData?.score ?? null}
            isThinking={isThinkingEngine}
          />
          <div className="board-wrapper">
            <Chessboard
              position={game.fen()}
              onPieceDrop={onDrop}
              boardOrientation={boardOrientation}
              customSquareStyles={highlightSquares}
              customDarkSquareStyle={{ backgroundColor: '#4a3d2e' }}
              customLightSquareStyle={{ backgroundColor: '#c8b89a' }}
              animationDuration={200}
            />
          </div>
        </section>

        {/* Sidebar */}
        <aside className="sidebar">
          {/* Turn Indicator */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '16px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          }}>
            <div style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: game.turn() === 'w' ? 'var(--eval-white)' : '#1a1714',
              border: '2px solid var(--border-light)',
              boxShadow: game.turn() === 'w' ? '0 0 15px rgba(232,224,208,0.4)' : 'none',
              flexShrink: 0,
            }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Current Turn</div>
              <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>
                {gameStatus === 'playing' || gameStatus === 'check'
                  ? `${game.turn() === 'w' ? 'White' : 'Black'} to move`
                  : 'Game Over'}
              </div>
            </div>
            {gameStatus === 'check' && (
              <span style={{ color: 'var(--danger)', fontWeight: 'bold', fontSize: '12px', background: 'rgba(200,64,64,0.1)', padding: '4px 8px', borderRadius: '4px' }}>CHECK</span>
            )}
          </div>

          {/* Move history */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '16px',
            flex: '0 0 auto',
            maxHeight: '300px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}>
            <div style={{
              fontSize: '11px',
              color: 'var(--text-muted)',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              marginBottom: '12px',
              fontWeight: '600',
            }}>
              Move History
            </div>
            <div style={{ overflowY: 'auto', flex: 1 }}>
              <MoveHistory
                history={moveHistory}
                currentIndex={currentMoveIndex}
              />
            </div>
          </div>

          {/* Coach panel */}
          <CoachPanel
            engineData={engineData}
            explanation={explanation}
            isThinkingEngine={isThinkingEngine}
            isThinkingAI={isThinkingAI}
            error={aiError}
            gameStatus={gameStatus !== 'playing' ? gameStatus : null}
          />
        </aside>
      </main>

      {/* Footer */}
      <footer style={{
        marginTop: 'auto',
        paddingTop: '32px',
        paddingBottom: '16px',
        fontSize: '12px',
        color: 'var(--text-muted)',
        display: 'flex',
        justifyContent: 'space-between',
        borderTop: '1px solid var(--border)',
      }}>
        <span>Stockfish 16.1 · Llama 3.3 · Groq AI</span>
        <span>Made with ❤️ for Chess Lovers</span>
      </footer>
    </div>
  )
}

function IconButton({ children, onClick, title, disabled }) {
  return (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        color: disabled ? 'var(--text-muted)' : 'var(--text-secondary)',
        padding: '10px 16px',
        fontSize: '13px',
        fontWeight: '500',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}
      onMouseEnter={e => { if (!disabled) { e.currentTarget.style.borderColor = 'var(--accent-amber-dim)'; e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.transform = 'translateY(-1px)' }}}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = disabled ? 'var(--text-muted)' : 'var(--text-secondary)'; e.currentTarget.style.transform = 'translateY(0)' }}
    >
      {children}
    </button>
  )
}
