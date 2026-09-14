# Block Fit — Architecture Documentation

## Current State Analysis

### What's Well Organized ✅
- **API Routes**: Clear separation by feature (auth, daily-challenge, speedrun, leaderboard, sync)
- **Libraries**: Utility functions extracted (validation, rate limiting, security, CORS)
- **Types**: Centralized in `src/types.ts`
- **Components**: Basic component separation (SudokuGridRenderer, VictoryParticles)

### What Needs Restructuring 🔄
- **Game Logic**: Scattered across App.tsx (1000+ lines), levels.ts, sudokuLogic.ts, sound.ts
- **State Management**: Monolithic component state, no clear state flow
- **Domain Separation**: No clear boundaries between game, UI, services
- **Game Systems**: Missing GameManager, event system, input handling
- **Testability**: Logic tightly coupled to React components

---

## Proposed Architecture

### Layer 1: Core Game Engine (Domain Logic — Framework Agnostic)

```
src/engine/
├── core/
│   ├── Board.ts              # Grid state, cell management
│   ├── Block.ts              # Block shape, transformations, placement validation
│   ├── Grid.ts               # Grid operations, line detection, clearing
│   ├── Scoring.ts            # Score calculation, star system, combos
│   └── GameState.ts          # Immutable game state snapshots
│
├── modes/
│   ├── CampaignMode.ts       # Campaign-specific logic
│   ├── EndlessMode.ts        # Endless mode rules
│   ├── DailyMode.ts          # Daily challenge logic
│   ├── SpeedrunMode.ts       # Speedrun timer, ghost tracking
│   └── SudokuMode.ts         # Sudoku color validation
│
├── systems/
│   ├── GameManager.ts        # Game lifecycle, mode orchestration
│   ├── InputHandler.ts       # Normalized input (touch, keyboard, gesture)
│   ├── EventBus.ts           # Publish/subscribe event system
│   └── HistoryManager.ts     # Undo/redo, replay tracking
│
├── ai/
│   ├── HintGenerator.ts      # Hint computation
│   └── BlockPlacer.ts        # AI placement logic
│
└── types/
    ├── game.types.ts         # All game-domain interfaces
    └── events.types.ts       # Event definitions
```

### Layer 2: Game Utilities & Helpers (Pure Functions)

```
src/utils/
├── math/
│   ├── geometry.ts           # Rotation, mirroring, normalization
│   └── grid.ts               # Grid queries, pathfinding
│
├── procedural/
│   ├── seeding.ts            # Seeded RNG
│   ├── levelGenerator.ts     # Procedural level creation
│   └── dailyChallenge.ts     # Daily puzzle generation
│
├── serialization/
│   ├── save.ts               # Profile/game save encoding
│   └── replay.ts             # Replay recording/playback
│
└── validators/
    ├── block.ts              # Block placement validation
    └── grid.ts               # Grid completion validation
```

### Layer 3: Services (Side Effects & External APIs)

```
src/services/
├── backend/
│   ├── supabaseClient.ts     # Supabase initialization
│   ├── profileApi.ts         # Profile CRUD
│   ├── leaderboardApi.ts     # Leaderboard queries
│   ├── dailyApi.ts           # Daily challenge API
│   └── syncApi.ts            # Cross-device sync
│
├── audio/
│   ├── SoundManager.ts       # Audio playback, volume control
│   └── SoundLibrary.ts       # Sound asset registry
│
├── storage/
│   ├── LocalStorage.ts       # Browser storage wrapper
│   └── ProfilePersistence.ts # Profile save/load
│
└── analytics/
    └── telemetry.ts          # Event tracking (future)
```

### Layer 4: UI Components (React)

```
src/components/
├── screens/
│   ├── SplashScreen.tsx
│   ├── MainMenu.tsx
│   ├── LevelSelect.tsx
│   ├── GameplayScreen.tsx    # Main gameplay orchestrator
│   ├── LeaderboardScreen.tsx
│   ├── SettingsScreen.tsx
│   └── ProfileScreen.tsx
│
├── game/
│   ├── GameBoard.tsx         # Rendered board
│   ├── BlockTray.tsx         # Next blocks preview
│   ├── GridCell.tsx          # Individual cell
│   ├── BlockSprite.tsx       # Block visual
│   └── GameHUD.tsx           # Score, timer, hints
│
├── ui/
│   ├── Button.tsx
│   ├── Modal.tsx
│   ├── Panel.tsx
│   ├── Card.tsx
│   └── Animations.tsx        # Reusable animation components
│
└── common/
    ├── SudokuGridRenderer.tsx
    ├── VictoryParticles.tsx
    ├── LeaderboardTable.tsx
    └── AchievementBadge.tsx
```

### Layer 5: App Entry Point & Routing

```
src/
├── App.tsx                   # Screen routing, global context
├── main.tsx                  # React DOM entry
├── index.css                 # Global styles
├── constants.ts              # Game constants (grid sizes, par values, etc.)
└── config.ts                 # Configuration (API endpoints, feature flags)
```

### Backend Structure

```
api/
├── auth/                     # Authentication routes
│   ├── signup.ts
│   ├── login.ts
│   ├── google.ts
│   └── callback.ts
│
├── profiles/                 # User profile management
│   ├── load.ts
│   ├── save.ts
│   └── delete.ts
│
├── leaderboards/             # Leaderboard queries
│   ├── campaign.ts
│   ├── speedrun.ts
│   ├── daily.ts
│   └── sudoku.ts
│
├── challenges/               # Daily challenge
│   ├── index.ts
│   └── submit.ts
│
├── sync/                     # Cross-device sync
│   ├── generate.ts
│   ├── load.ts
│   └── save.ts
│
└── health.ts                 # Health check
```

---

## Data Flow

### Game Loop
```
Input Event
    ↓
InputHandler (normalize)
    ↓
GameManager (validate, compute)
    ↓
EventBus (publish game events)
    ↓
GameState (immutable snapshot)
    ↓
React Components (subscribe, re-render)
    ↓
UI Update
```

### State Updates
```
User Input
    ↓
InputHandler.process()
    ↓
GameManager.update()
    ↓
Board/Grid/Scoring (pure functions)
    ↓
EventBus.emit('blockPlaced', ...)
    ↓
Components listening to events
    ↓
React setState (triggers re-render)
```

### Save/Load Flow
```
GameState
    ↓
ProfilePersistence.serialize()
    ↓
LocalStorage OR ProfileApi.save()
    ↓
Supabase DB
    ↓
(On load) ProfileApi.load()
    ↓
ProfilePersistence.deserialize()
    ↓
GameState reconstruction
```

---

## Key Principles

### 1. **Separation of Concerns**
- Game logic lives in `engine/` — framework agnostic, fully testable
- React components only handle rendering and user interaction
- Services handle side effects (API, storage, audio)

### 2. **Pure Functions**
- All game logic is deterministic and immutable
- Board/Grid/Block operations return new state, never mutate
- Supports replay, undo, and predictable testing

### 3. **Event-Driven Architecture**
- Game systems communicate via EventBus
- Components subscribe to relevant events
- Decouples gameplay systems from UI

### 4. **Single Responsibility**
- Each module has one clear purpose
- Board handles grid, Block handles shapes, Scoring handles points
- GameManager orchestrates, doesn't implement

### 5. **Type Safety**
- All game entities have clear interfaces
- Shared types in `engine/types/`
- Event signatures define contracts

---

## Module Responsibilities

| Module | Responsibility |
|--------|-----------------|
| **Board** | Grid cell state, dimensions, queries |
| **Block** | Shape definition, rotation, validation |
| **Grid** | Line detection, clearing, line count |
| **Scoring** | Points, stars, combos, multipliers |
| **GameState** | Immutable snapshot of game + metadata |
| **GameManager** | Orchestration, mode switching, lifecycle |
| **InputHandler** | Normalized input from any source |
| **EventBus** | Pub/sub event system |
| **HistoryManager** | Undo/redo, move history |
| **HintGenerator** | Compute optimal placements |
| **SoundManager** | Audio playback, volume, soundscapes |
| **ProfileApi** | Server profile CRUD |
| **LeaderboardApi** | Score submissions, rank queries |
| **LocalStorage** | Browser persistence wrapper |

---

## Migration Path

1. Extract types into `engine/types/`
2. Create Board, Block, Grid, Scoring modules
3. Build GameManager and EventBus
4. Refactor App.tsx to use GameManager
5. Break App into screen components
6. Extract service layers
7. Create UI component library
8. Migrate API routes to new backend structure

---

## Benefits

✅ **Testability**: Game logic decoupled from React  
✅ **Reusability**: Engine can be ported to Unity/other platforms  
✅ **Maintainability**: Clear module boundaries  
✅ **Scalability**: Easy to add new modes, systems  
✅ **Performance**: Pure functions allow memoization, caching  
✅ **Collaboration**: Clear file organization for team development  
