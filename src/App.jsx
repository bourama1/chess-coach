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

      const data = { bestMove: result.bestMove, score: result.score, pv: result.pv }
      setEngineData(data)
      setIsThinkingEngine(false)

      // Highlight best move squares
      if (result.bestMove && result.bestMove.length >= 4) {
        const from = result.bestMove.slice(0, 2)
        const to = result.bestMove.slice(2, 4)
        setHighlightSquares({
          [from]: { background: 'rgba(200,146,42,0.25)', borderRadius: '3px' },
          [to]: { background: 'rgba(200,146,42,0.4)', borderRadius: '3px' },
        })
      }

      // AI explanation
      if (hasKey) {
        setIsThinkingAI(true)
        const g = gameRef.current
        try {
          const text = await explain({
            fen,
            bestMove: result.bestMove,
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

    // Handle promotion
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
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      padding: '20px',
    }}>
      {/* Header */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        paddingBottom: '16px',
        borderBottom: '1px solid var(--border)',
      }}>
        <div>
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: '26px',
            fontWeight: '600',
            color: 'var(--accent-ivory)',
            letterSpacing: '0.01em',
          }}>
            Chess Coach
          </h1>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Stockfish {engineReady ? (
              <span style={{ color: 'var(--success)' }}>● ready</span>
            ) : (
              <span style={{ color: 'var(--accent-amber)', animation: 'pulse-amber 1.2s infinite' }}>● loading</span>
            )}
            {hasKey && <span style={{ marginLeft: '12px', color: 'var(--success)' }}>● Groq AI active</span>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <IconButton onClick={() => setBoardOrientation(o => o === 'white' ? 'black' : 'white')} title="Flip board">
            ⇅
          </IconButton>
          <IconButton onClick={handleUndo} title="Undo" disabled={moveHistory.length === 0}>
            ↩
          </IconButton>
          <IconButton onClick={handleReset} title="New game">
            ⟳
          </IconButton>
          <IconButton onClick={handleExportPGN} title="Export PGN" disabled={moveHistory.length === 0}>
            ↓PGN
          </IconButton>
        </div>
      </header>

      {/* Main layout */}
      <div style={{
        display: 'flex',
        gap: '20px',
        flex: 1,
        alignItems: 'flex-start',
        flexWrap: 'wrap',
      }}>
        {/* Eval bar + Board */}
        <div style={{
          display: 'flex',
          gap: '12px',
          alignItems: 'flex-start',
          flex: '0 0 auto',
        }}>
          <EvalBar
            score={engineData?.score ?? null}
            isThinking={isThinkingEngine}
          />
          <div style={{
            width: 'min(520px, calc(100vw - 120px))',
            boxShadow: '0 12px 48px rgba(0,0,0,0.5)',
            borderRadius: '6px',
            overflow: 'hidden',
            border: '2px solid var(--border-light)',
          }}>
            <Chessboard
              position={game.fen()}
              onPieceDrop={onDrop}
              boardOrientation={boardOrientation}
              customSquareStyles={highlightSquares}
              customDarkSquareStyle={{ backgroundColor: '#4a3d2e' }}
              customLightSquareStyle={{ backgroundColor: '#c8b89a' }}
              animationDuration={180}
            />
          </div>
        </div>

        {/* Sidebar */}
        <div style={{
          flex: '1 1 280px',
          minWidth: '260px',
          maxWidth: '340px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}>
          {/* Turn indicator */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 14px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
          }}>
            <div style={{
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              background: game.turn() === 'w' ? 'var(--eval-white)' : '#1a1714',
              border: '2px solid var(--border-light)',
              boxShadow: game.turn() === 'w' ? '0 0 10px rgba(232,224,208,0.3)' : 'none',
              flexShrink: 0,
            }} />
            <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
              {gameStatus === 'playing' || gameStatus === 'check'
                ? `${game.turn() === 'w' ? 'White' : 'Black'} to move`
                : gameStatus === 'checkmate'
                ? `${game.turn() === 'w' ? 'Black' : 'White'} wins`
                : 'Game over'}
            </span>
            <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: '11px' }}>
              Move {Math.ceil(moveHistory.length / 2) || 1}
            </span>
          </div>

          {/* Move history */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '12px',
          }}>
            <div style={{
              fontSize: '10px',
              color: 'var(--text-muted)',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              marginBottom: '10px',
            }}>
              Move History
            </div>
            <MoveHistory
              history={moveHistory}
              currentIndex={currentMoveIndex}
            />
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
        </div>
      </div>

      {/* Footer */}
      <footer style={{
        marginTop: '24px',
        paddingTop: '16px',
        borderTop: '1px solid var(--border)',
        fontSize: '11px',
        color: 'var(--text-muted)',
        display: 'flex',
        justifyContent: 'space-between',
      }}>
        <span>chess.js · react-chessboard · Stockfish.js · Groq AI</span>
        <span>drag pieces to move</span>
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
        borderRadius: '6px',
        color: disabled ? 'var(--text-muted)' : 'var(--text-secondary)',
        padding: '7px 12px',
        fontSize: '13px',
        transition: 'all 0.15s',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
      }}
      onMouseEnter={e => { if (!disabled) { e.target.style.borderColor = 'var(--border-light)'; e.target.style.color = 'var(--text-primary)' }}}
      onMouseLeave={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.color = disabled ? 'var(--text-muted)' : 'var(--text-secondary)' }}
    >
      {children}
    </button>
  )
}
