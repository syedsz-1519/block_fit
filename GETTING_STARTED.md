# 🚀 Getting Started with Block Fit

Visual step-by-step guide to get the game running and playing!

---

## The Fastest Way (5 Minutes)

```
┌─────────────────────────────────────────────────────────────┐
│                    FASTEST SETUP PATH                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Step 1: Open VS Code                                      │
│  ─────────────────────────────────────────────────────────  │
│  • Go to: c:\Users\admin\Desktop\block\block_fit           │
│  • Right-click → Open with Code                             │
│  • Or: code .                                               │
│                                                             │
│  ⏱️  Takes: 10 seconds                                       │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Step 2: Open Terminal                                     │
│  ─────────────────────────────────────────────────────────  │
│  • Press: Ctrl + ~                                          │
│  • Or: Terminal → New Terminal (menu)                       │
│  • A terminal panel opens at bottom                         │
│                                                             │
│  ⏱️  Takes: 5 seconds                                        │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Step 3: Install Dependencies                              │
│  ─────────────────────────────────────────────────────────  │
│  $ npm install                                              │
│                                                             │
│  Waits for downloading packages...                          │
│  ✓ Complete!                                                │
│                                                             │
│  ⏱️  Takes: 2-3 minutes                                      │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Step 4: Start Dev Server                                  │
│  ─────────────────────────────────────────────────────────  │
│  $ npm run dev                                              │
│                                                             │
│  ✓ Local: http://localhost:5173                             │
│  ✓ press h to show help                                     │
│                                                             │
│  ⏱️  Takes: 30 seconds                                       │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Step 5: Open Browser                                      │
│  ─────────────────────────────────────────────────────────  │
│  • Click the link in terminal                               │
│  • Or open: http://localhost:5173                           │
│  • 🎮 Block Fit loads!                                      │
│                                                             │
│  ⏱️  Takes: 10 seconds                                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘

Total Time: ~5-6 minutes
Difficulty: ⭐ Very Easy
```

---

## What Happens When You Run It

```
Terminal Output
═══════════════════════════════════════════════════════════

$ npm run dev

> tsx server.ts

  VITE v6.2.3  ready in 234 ms

  ➜  Local:   http://localhost:5173/
  ➜  press h to show help

[Keep this terminal open]
```

```
Browser Shows
═══════════════════════════════════════════════════════════

┌─────────────────────────────────────┐
│          🧩 BLOCK FIT               │
│     Premium Puzzle Game              │
├─────────────────────────────────────┤
│                                     │
│           [Play]                    │
│           [Settings]                │
│           [Leaderboard]             │
│           [About]                   │
│                                     │
└─────────────────────────────────────┘

Click "Play" to choose a game mode!
```

---

## Game Modes at a Glance

```
┌──────────────────────────────────────────────────────────────┐
│                    SELECT GAME MODE                          │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  🏰 CAMPAIGN                    ⚡ SPEEDRUN                   │
│  ├─ Story-driven              ├─ Race against clock         │
│  ├─ 50+ levels                ├─ Personal bests            │
│  ├─ 5 worlds                  ├─ Global leaderboard        │
│  └─ Unlock cosmetics          └─ Ghost replays             │
│                                                              │
│  📅 DAILY CHALLENGE            🎨 SUDOKU HYBRID             │
│  ├─ One puzzle/day            ├─ Sudoku + blocks           │
│  ├─ Compete globally          ├─ No color repeats          │
│  ├─ Build streaks             ├─ 3 difficulties            │
│  └─ Share scores              └─ Brain teaser              │
│                                                              │
│  🆕 ENDLESS                                                  │
│  ├─ Classic puzzle                                           │
│  ├─ 10×10 grid                                               │
│  ├─ Play forever                                             │
│  └─ High score race                                          │
│                                                              │
└──────────────────────────────────────────────────────────────┘

Choose one and START PLAYING!
```

---

## Gameplay Loop

```
┌─────────────────┐
│   Start Game    │
└────────┬────────┘
         │
         ▼
┌──────────────────────────┐
│  See the game board      │
│  (8x8 grid)              │
│  [Empty cells]           │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│  Block tray below        │
│  3 blocks waiting        │
│  to be placed            │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│  Drag block to grid      │
│  Place on cells          │
│  ← Score increases! →    │
└────────┬─────────────────┘
         │
         ▼
    Check: Did I complete
         │ any rows/columns?
         │
    ┌────┴────┐
    │          │
   YES        NO
    │          │
    ▼          ▼
┌────────┐ ┌──────────┐
│ CLEAR! │ │Get ready │
│+Points │ │ for next │
│+ Combo │ │  block   │
└────┬───┘ └────┬─────┘
     │          │
     └────┬─────┘
          │
          ▼
    ┌───────────────┐
    │  Game Over?   │
    └────┬──────────┘
         │
    ┌────┴───────┐
    │             │
   YES           NO
    │             │
    ▼             ▼
┌─────────┐    ▲
│ Results │    │
│ Stars   │    │ Go back
│ Score   │    │ to block
│ Time    │    │ tray
└─────────┘    │
               └───────
```

---

## File Structure Visual

```
Block Fit Project Structure
═════════════════════════════════════════════════════════════

📁 block_fit/
├── 📁 src/
│   ├── 📁 engine/  ⭐ NEW GAME ENGINE
│   │   ├── 📁 core/
│   │   │   ├── Board.ts     (Grid management)
│   │   │   ├── Block.ts     (Block transformations)
│   │   │   ├── GameState.ts (Immutable state)
│   │   │   ├── Grid.ts      (Line detection)
│   │   │   └── Scoring.ts   (Score calculation)
│   │   │
│   │   ├── 📁 systems/
│   │   │   ├── EventBus.ts     (Event system)
│   │   │   ├── GameManager.ts  (Game orchestration)
│   │   │   ├── InputHandler.ts (Input normalization)
│   │   │   └── HistoryManager.ts (Undo/redo)
│   │   │
│   │   ├── 📁 types/
│   │   │   ├── game.types.ts   (Type definitions)
│   │   │   └── events.types.ts (Event types)
│   │   │
│   │   ├── 📁 utils/
│   │   │   ├── validation.ts   (Validators)
│   │   │   └── geometry.ts     (Math utilities)
│   │   │
│   │   └── index.ts (Exports)
│   │
│   ├── 📁 components/
│   │   ├── GameBoard.tsx
│   │   ├── BlockTray.tsx
│   │   └── ...
│   │
│   ├── App.tsx           (Main component)
│   ├── main.tsx          (Entry point)
│   └── index.css         (Styles)
│
├── 📁 api/              ⭐ ORGANIZED API
│   ├── 📁 auth/         (Authentication)
│   ├── 📁 profiles/     (User data)
│   ├── 📁 leaderboards/ (Rankings)
│   ├── 📁 challenges/   (Daily puzzles)
│   ├── 📁 sync/         (Cross-device)
│   ├── 📁 lib/          (Utilities)
│   └── health.ts        (Health check)
│
├── 📁 public/           (Static assets)
├── 📁 docs/             (Documentation)
├── package.json         (Dependencies)
├── vite.config.ts       (Build config)
└── tsconfig.json        (TypeScript config)

⭐ = New architecture additions
```

---

## What You Can Do Now

```
🎮 GAMEPLAY
═════════════════════════════════════════════════════════════

After the game loads:

1️⃣  Pick a game mode (Campaign, Speedrun, Daily, etc.)

2️⃣  Play the game!
    • Drag blocks onto the grid
    • Complete rows/columns to clear them
    • Earn points and stars
    • Complete the level or achieve high score

3️⃣  Check your progress
    • Level progress tracking
    • Personal best scores
    • Star ratings
    • Streak counter

4️⃣  Explore features
    • Settings (sound, graphics, accessibility)
    • Leaderboards (global rankings)
    • Profile (stats, achievements)
    • Different game modes


🛠️ DEVELOPMENT
═════════════════════════════════════════════════════════════

The new architecture supports:

• Hot Module Reloading (HMR)
  - Edit code, see changes instantly
  - No page refresh needed
  - Game state persists

• TypeScript Support
  - Full type checking
  - IDE autocomplete
  - Better error messages

• Component Reloading
  - Edit React components
  - Instant feedback
  - Preserve app state

• CSS/Tailwind Changes
  - Live style updates
  - No rebuild needed
  - Real-time preview
```

---

## Keyboard Shortcuts

```
⌨️  GAMEPLAY CONTROLS
═════════════════════════════════════════════════════════════

Arrow Keys      Move block
R / ↑           Rotate block clockwise
Shift + R / ↓   Rotate counter-clockwise
M               Mirror block horizontally
H               Show hint
U / Z           Undo last move
P / Space       Pause/Resume game
Esc             Return to menu


🎮 BROWSER DEVELOPER TOOLS
═════════════════════════════════════════════════════════════

F12             Open Developer Tools
Ctrl + Shift + I Open Inspector
Ctrl + Shift + J Open Console
Ctrl + Shift + R Hard refresh (clear cache)
Ctrl + Shift + K Open Console tab
```

---

## Terminal Tips

```
💡 USEFUL TERMINAL COMMANDS
═════════════════════════════════════════════════════════════

npm run dev           Start development server
npm run build         Create production build
npm run preview       Preview production build locally
npm run lint          Check TypeScript for errors
npm run clean         Remove build artifacts
npm cache clean       Clear npm cache
npm install           Install dependencies
npm update            Update packages


🛑 STOPPING THE SERVER
═════════════════════════════════════════════════════════════

In terminal, press:     Ctrl + C

The server stops and terminal is ready for new commands.
To restart: npm run dev
```

---

## If Something Goes Wrong

```
❌ TROUBLESHOOTING FLOWCHART
═════════════════════════════════════════════════════════════

Problem?
   │
   ▼
Port 5173 in use?
   ├─ YES: Kill the process or change port
   │       Close any other running dev servers
   │
   └─ NO: Continue...
        │
        ▼
   npm install failed?
   ├─ YES: Run: npm cache clean --force
   │       Then: npm install
   │
   └─ NO: Continue...
        │
        ▼
   Browser shows blank?
   ├─ YES: Wait 10-15 seconds
   │       Ctrl + Shift + R (hard refresh)
   │       Check console (F12)
   │
   └─ NO: Continue...
        │
        ▼
   Getting JavaScript errors?
   ├─ YES: Check terminal for TypeScript errors
   │       Run: npm run lint
   │
   └─ NO: Game should be working!
          If not, restart everything:
          1. Stop server (Ctrl + C)
          2. npm install
          3. npm run dev
```

---

## Success Indicators

```
✅ YOU'LL KNOW IT'S WORKING WHEN:
═════════════════════════════════════════════════════════════

Terminal shows:
  ✓ VITE v6.2.3 ready
  ✓ Local: http://localhost:5173/
  ✓ No error messages

Browser shows:
  ✓ Block Fit splash screen
  ✓ Main menu with options
  ✓ Can click buttons
  ✓ Can see colors/animations

Gameplay works:
  ✓ Can drag blocks
  ✓ Grid shows blocks placing
  ✓ Score increases
  ✓ Sound plays (if enabled)
  ✓ Smooth 60 FPS animation

🎉 READY TO PLAY!
```

---

## Next Steps

```
After You're Playing:
═════════════════════════════════════════════════════════════

1. Explore all game modes
   - Try Campaign mode first (easier)
   - Progress to harder modes
   - Check leaderboards

2. Read the documentation
   - ARCHITECTURE.md (system design)
   - TYPES_REFERENCE.md (type system)
   - DESIGN_PATTERNS.md (patterns used)

3. Check out the code
   - src/engine/ (game logic)
   - src/App.tsx (UI component)
   - api/ (backend routes)

4. Customize settings
   - Change theme
   - Toggle sound
   - Enable accessibility features
   - Adjust difficulty

5. Try different browsers
   - Chrome (recommended)
   - Firefox
   - Edge
   - Safari (macOS)
```

---

## Quick Reference Card

```
┌──────────────────────────────────────────────────────────┐
│              BLOCK FIT QUICK REFERENCE                   │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  PROJECT PATH: c:\Users\admin\Desktop\block\block_fit   │
│  DEV URL: http://localhost:5173                         │
│  TERMINAL: Ctrl + ~ (in VS Code)                        │
│                                                          │
│  SETUP:                                                  │
│  $ npm install  (1 time only)                            │
│  $ npm run dev  (every time you want to play)            │
│                                                          │
│  STOP:                                                   │
│  Ctrl + C in terminal                                    │
│                                                          │
│  RELOAD:                                                 │
│  Ctrl + Shift + R (browser)                              │
│                                                          │
│  HELP:                                                   │
│  Read: QUICK_START.md                                    │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## 🎉 You're Ready!

Everything is set up and ready to go. The game is complete, the architecture is professional, and you can start playing right now.

**Follow the steps above and enjoy Block Fit!** 🧩

```
          🧩 BLOCK FIT 🧩
         
      Have Fun Playing!
      
     Made with ❤️ & TypeScript
```
