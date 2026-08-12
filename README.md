# 💎 Splenda  

Splenda is a real-time, multiplayer web implementation of the popular board game *Splendor*. Built with a **React/TypeScript** frontend and a **Python/FastAPI** backend, it features real-time WebSocket synchronization, custom CSS 3D animations, and strict server-side rules enforcement.

![Splenda Gameplay](./public/images/logo.png) *(Note: Add a screenshot of your gameplay here!)*

## ✨ Features

- **Real-Time Multiplayer:** Supports 2-4 players with instant state synchronization via WebSockets.
- **Flawless Rules Engine:** Enforces all core Splendor mechanics:
  - Token limits (discarding excess tokens over 10).
  - Purchasing cards using tokens and permanent card bonuses.
  - Reserving cards (blindly from decks or face-up from the board) and taking Gold.
  - Automatic Noble visits.
  - 15-point endgame trigger and tie-breakers.
- **Advanced UI Animations:** Custom queue-based animation engine that safely delays React state updates until cards and tokens finish physically flying across the board.
- **Theme Support:** Toggle between Light and Dark modes. 
- **Responsive Layout:** Dynamically scales opponent boards based on the number of players in the game to ensure everything fits on screen.

## 🛠️ Tech Stack

**Frontend:**
- [React 19](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/)
- Custom CSS (No external component libraries for maximum styling control)
- [React Toastify](https://fkhadra.github.io/react-toastify/) (Notifications)
- [Fireworks-js](https://fireworks.js.org/) (Victory screen)

**Backend:**
- [Python 3](https://www.python.org/)
- [FastAPI](https://fastapi.tiangolo.com/) (WebSockets & Static File Serving)
- [Uvicorn](https://www.uvicorn.org/) (ASGI Server)

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18+ recommended)
- **pnpm** (used for frontend dependencies)
- **Python** (3.8+)

### 1. Install Dependencies

**Frontend:**
```bash
pnpm install

Backend:
code Bash

pip install fastapi uvicorn python-dotenv

2. Run the Application

You can use the provided bash script to start both the frontend and backend simultaneously (Linux/macOS):
code Bash

./splenda.sh

Or start them manually in two separate terminal windows:

Terminal 1 (Backend):
code Bash

python main.py

(The backend runs on http://localhost:3000)

Terminal 2 (Frontend):
code Bash

pnpm run dev

(The frontend usually runs on http://localhost:5173)
📂 Project Structure
code Text

├── main.py                 # FastAPI server and WebSocket manager
├── game.py                 # Core Splendor state machine & game logic
├── data/                   # Python dicts containing card stats and noble requirements
├── public/
│   └── images/             # Static game assets (Cards, tokens, backgrounds)
├── src/
│   ├── components/         # React UI Components (Board, PlayerFooter, Animations)
│   ├── hooks/              # Custom hooks (WebSockets, Animations, Notifications)
│   ├── styles/             # Modular CSS files
│   ├── App.tsx             # Main Game Layout and Logic Controller
│   └── types.ts            # TypeScript interfaces
├── splenda.sh              # Quickstart script
└── package.json            # Frontend dependencies

🧠 Architecture Highlights

    Server-Authoritative: The Python backend is the source of truth. It validates all moves, calculates gold costs, tracks player inventories, and resolves the endgame.

    Race-Condition Protection: WebSockets and animations often fight each other. This app uses a custom locking system (isAwaitingServer) and a queueing mechanism to ensure the user cannot spam-click actions while waiting for the server, and ensures the React DOM doesn't update until flying card animations have finished.

    Optimized Asset Loading: Heavy card and background images are preloaded via the ImagePreloader component before the game starts to prevent visual stuttering.

📜 How to Play

    Enter your name in the Lobby.

    Wait for other players to join (2-4 players total).

    The Host can select the Deck Style and click Start Game.

    Click the "How to Play" button in-game for a full refresher on Splendor rules!

📄 License

This is a fan-made clone of Space Cowboys' board game Splendor. It is intended for educational purposes and personal portfolio use only.
