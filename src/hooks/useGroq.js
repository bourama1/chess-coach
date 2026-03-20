import { useCallback } from 'react'

const GROQ_CONFIG = {
  url: 'https://api.groq.com/openai/v1/chat/completions',
  model: 'llama-3.3-70b-versatile',
}

export function useGroq() {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY

  const explain = useCallback(async ({ fen, bestMove, score, pv, moveHistory, turn }) => {
    if (!apiKey) {
      console.warn('Groq API Key (VITE_GROQ_API_KEY) is missing in environment.')
      return null
    }

    const pvString = pv && pv.length > 0 ? pv.join(' ') : bestMove
    const scoreText = score === null ? 'equal' :
      score > 0 ? `+${score.toFixed(2)} (White is better)` :
      score < 0 ? `${score.toFixed(2)} (Black is better)` : 'equal'

    const lastMoves = moveHistory.slice(-6).join(', ')

    const prompt = `You are a friendly chess coach analyzing a position.

FEN: ${fen}
It is ${turn === 'w' ? 'White' : 'Black'}'s turn.
Recent moves: ${lastMoves || 'Game just started'}
Engine evaluation: ${scoreText}
Best move: ${bestMove}
Best line (principal variation): ${pvString}

Give a concise, human-friendly explanation in 2-3 sentences covering:
1. Why the engine best move is strong
2. One key threat or strategic theme
3. What the opponent should watch out for

Keep it simple and encouraging. Write naturally as a coach speaking to a student.`

    try {
      const response = await fetch(GROQ_CONFIG.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: GROQ_CONFIG.model,
          max_tokens: 180,
          temperature: 0.7,
          messages: [
            { role: 'system', content: 'You are a concise, encouraging chess coach. Speak directly and clearly.' },
            { role: 'user', content: prompt }
          ]
        })
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.error?.message || `Groq API error: ${response.status}`)
      }

      const data = await response.json()
      return data.choices[0]?.message?.content?.trim() || null
    } catch (err) {
      console.error('Groq error:', err)
      throw err
    }
  }, [apiKey])

  return { explain, hasKey: !!apiKey }
}
