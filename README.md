# Chess Coach ♟️

A React chess application featuring real-time Stockfish engine analysis and AI-powered move explanations via **Groq**.

## Tech Stack
- **React 18** + Vite
- **Groq (Llama 3.3 70B)** — Ultra-fast, human-friendly move explanations
- **Stockfish.js** — WebAssembly chess engine (client-side analysis)
- **chess.js** — Move validation and game logic
- **react-chessboard** — Interactive board UI

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory and add your Groq API key:
```env
VITE_GROQ_API_KEY=your_groq_api_key_here
```
*Get your free API key at [console.groq.com](https://console.groq.com/keys).*

### 3. Start development server
```bash
npm run dev
```

### 4. Open in browser
Navigate to `http://localhost:5173`

## Project Structure
```
src/
├── App.jsx                  # Main application, game state
├── index.css                # Global styles + CSS variables
├── hooks/
│   ├── useStockfish.js      # Stockfish WASM worker hook
│   └── useGroq.js           # Groq AI explanation hook
└── components/
    ├── EvalBar.jsx           # Centipawn advantage bar
    ├── MoveHistory.jsx       # PGN move list
    └── CoachPanel.jsx        # Engine + AI sidebar
```

## Features
- **Full Move Validation**: Powered by `chess.js` (v1.3+).
- **Real-time Eval Bar**: Visualizes centipawn advantage and mate detection with normalized scoring.
- **Stockfish Engine**: Depth-16 analysis performed locally in your browser via WebAssembly.
- **Grandmaster AI Coaching**: Sophisticated, tactical explanations of every move (from 'Brilliant' to 'Blunder') using Groq's high-speed Llama 3.3 inference.
- **Responsive Professional UI**: Elegant, dark-themed interface with flexible layouts for desktop and mobile.
- **Undo & Reset**: Easily backtrack or start fresh with keyboard-friendly controls.
- **Flip Board**: Toggle between White and Black perspectives instantly.
- **PGN Export**: Download your game history for further study.

## Security Note
Your Groq API key is stored in your environment (`.env`) and accessed via Vite's `import.meta.env`. For production deployments, ensure you set these variables in your hosting provider's dashboard (e.g., Vercel, Netlify) and consider a backend proxy if you need to hide the key from the client-side network tab.

## Extending the App
- **Opening Explorer**: Integrate the Lichess API to show common opening lines.
- **Puzzle Mode**: Load tactical puzzles for daily training.
- **Analysis Graph**: Add a chart showing evaluation history throughout the game.
- **Customizable Depth**: Allow users to adjust engine thinking time.
