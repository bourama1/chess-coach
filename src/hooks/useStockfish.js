import { useEffect, useRef, useCallback, useState } from 'react'

export function useStockfish() {
  const workerRef = useRef(null)
  const resolveRef = useRef(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Use stockfish from CDN via a blob worker wrapper
    const workerCode = `
      importScripts('https://cdn.jsdelivr.net/npm/stockfish.js@10.0.2/stockfish.js');
      
      var stockfish = STOCKFISH();
      stockfish.onmessage = function(msg) {
        postMessage(msg);
      };
      
      onmessage = function(e) {
        stockfish.postMessage(e.data);
      };
    `
    const blob = new Blob([workerCode], { type: 'application/javascript' })
    const worker = new Worker(URL.createObjectURL(blob))

    worker.onmessage = (e) => {
      const line = e.data
      if (line === 'uciok') {
        worker.postMessage('isready')
      } else if (line === 'readyok') {
        setReady(true)
      } else if (resolveRef.current) {
        resolveRef.current(line)
      }
    }

    worker.postMessage('uci')
    workerRef.current = worker

    return () => {
      worker.terminate()
    }
  }, [])

  const evaluate = useCallback((fen, depth = 16) => {
    return new Promise((resolve) => {
      if (!workerRef.current) return resolve(null)

      // Stockfish returns score relative to the side to move.
      // We need to know who is moving to normalize to "positive = white better".
      const turn = fen.split(' ')[1] // 'w' or 'b'

      let bestMove = null
      let score = null
      let pv = []

      const handler = (e) => {
        const line = e.data

        if (typeof line === 'string') {
          if (line.startsWith('info depth')) {
            const depthMatch = line.match(/depth (\d+)/)
            const scoreMatch = line.match(/score (cp|mate) (-?\d+)/)
            const pvMatch = line.match(/ pv (.+)/)
            const currentDepth = depthMatch ? parseInt(depthMatch[1]) : 0

            if (currentDepth >= 1 && scoreMatch && pvMatch) {
              const scoreType = scoreMatch[1]
              let scoreVal = parseInt(scoreMatch[2])
              
              // Normalize score: if it's black's turn, negate the score 
              // so that positive ALWAYS means white is better.
              if (turn === 'b') {
                scoreVal = -scoreVal
              }

              score = scoreType === 'cp' ? scoreVal / 100 : (scoreVal > 0 ? 999 : -999)
              pv = pvMatch[1].trim().split(' ').slice(0, 5)
            }
          }

          if (line.startsWith('bestmove')) {
            workerRef.current.removeEventListener('message', handler)
            bestMove = line.split(' ')[1]
            resolve({ bestMove, score, pv })
            resolveRef.current = null
          }
        }
      }

      workerRef.current.addEventListener('message', handler)
      workerRef.current.postMessage('position fen ' + fen)
      workerRef.current.postMessage(`go depth ${depth}`)
    })
  }, [])

  return { evaluate, ready }
}
