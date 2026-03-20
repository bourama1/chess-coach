import { useCallback } from 'react'

const GROQ_CONFIG = {
  url: 'https://api.groq.com/openai/v1/chat/completions',
  model: 'llama-3.3-70b-versatile',
}

export function useGroq() {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY

  const explain = useCallback(async ({ fen, lastMove, score, pv, moveHistory, turn }) => {
    if (!apiKey) {
      console.warn('Groq API Key (VITE_GROQ_API_KEY) is missing in environment.')
      return null
    }

    const pvString = pv && pv.length > 0 ? pv.join(' ') : 'none'
    const scoreText = score === null ? '0.00 (Equal)' :
      score > 0 ? `+${score.toFixed(2)} (White is winning)` :
      score < 0 ? `${score.toFixed(2)} (Black is winning)` : '0.00 (Equal)'

    const lastMoves = moveHistory.slice(-8).join(', ')

    // A more sophisticated prompt that asks for tactical and positional reasoning
    const prompt = `You are a Grandmaster Chess Coach. Analyze the student's last move with high precision.

[Current Game State]
FEN: ${fen}
Last Move: ${lastMove}
Recent History: ${lastMoves}
Current Evaluation: ${scoreText}
Best Engine Continuation: ${pvString}
Whose turn it is now: ${turn === 'w' ? 'White' : 'Black'}

[Your Task]
Provide a sophisticated, concise (max 3-4 sentences) coaching insight.
1. EVALUATE: Classify the move ${lastMove} (e.g., Brilliant, Great, Solid, Inaccuracy, or Blunder) based on the evaluation and the position.
2. TACTICS/STRATEGY: Identify exactly what ${lastMove} accomplishes. Does it create a fork, pin, or skewer? Does it improve piece activity, control the center, or weaken the king's safety?
3. THE "WHY": Explain the logic behind the engine's suggested line (${pvString}) in relation to the move just played.
4. ADVICE: Give a specific, high-level tip for the side now to move.

[Style Guide]
- Use professional chess terminology (e.g., "zwischenzug", "outpost", "prophylaxis", "pawn structure").
- Be authoritative yet encouraging.
- Avoid generic advice; be specific to this exact FEN.`

    try {
      const response = await fetch(GROQ_CONFIG.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: GROQ_CONFIG.model,
          max_tokens: 250,
          temperature: 0.3,
          messages: [
            { 
              role: 'system', 
              content: 'You are an expert Grandmaster Chess Coach. You provide deep, precise, and concise tactical and positional analysis of chess moves.' 
            },
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
