# Block Fit — Complete Types Reference

This document provides a comprehensive guide to all types used throughout Block Fit, organized by domain and layer.

## Table of Contents

1. [Type Organization](#type-organization)
2. [Game Engine Types](#game-engine-types)
3. [API Contract Types](#api-contract-types)
4. [React Component Types](#react-component-types)
5. [Type Relationships](#type-relationships)
6. [Discriminated Unions](#discriminated-unions)
7. [Generic Patterns](#generic-patterns)

---

## Type Organization

### Layer 1: Game Engine (`src/engine/`)
Core game logic types — framework agnostic, fully testable

```
engine/
├── types/
│   ├── game.types.ts      # Domain entities (Board, Block, GameState, etc.)
│   └── events.types.ts    # Event system (GameEvent union, handlers)
├── core/                  # Use game types
├── systems/               # Use game types
└── utils/                 # Pure utility functions
```

### Layer 2: API Contracts (`api/`)
Communication contracts between client and server

```
api/
├── types.ts               # Request/response types
└── lib/                   # Uses game types + API types
```

### Layer 3: React Components (`src/`)
UI types — depends on engine and API types

```
src/
├── engine/                # Re-exports engine types
├── services/              # Uses API types
└── components/            # Uses React component types
```

---

## Game Engine Types

### Board & Grid (`engine/types/game.types.ts`)

#### Cell State
```typescript
type CellState = 'empty' | 'filled' | 'blocked';

interface GridCell {
  x: number;
  y: number;
  state: CellState;
  blockId?: string;
}

interface Grid {
  cells: CellState[][];
  width: number;
  height: number;
}
```

**Usage:** Board operations, line detection, state queries

---

### Blocks & Shapes

#### Shape Definition
```typescript
type CellOffset = readonly [number, number];

interface BlockShape {
  id: string;
  name: string;
  color: string;
  cells: CellOffset[];
  originalCells?: CellOffset[];  // Pre-transformation
}
```

#### Placed Block (Active Instance)
```typescript
interface PlacedBlock {
  blockId: string;
  shapeId: string;
  color: string;
  cells: [number, number][];     // Absolute grid coordinates
  x: number;                      // Anchor point
  y: number;
  rotations: number;              // 0-3 (90° increments)
  mirrored: boolean;
}
```

**Relationship:**
- `BlockShape` = immutable template
- `PlacedBlock` = instance + transformations (rotations, mirror, position)

**Usage Pattern:**
```typescript
// Template
const shape: BlockShape = { id: 'T', cells: [[0,0], [1,0], [2,0], [1,1]], ... };

// Instance
const placed = Block.createPlaced('block1', shape, 3, 2, 1, false);
// → PlacedBlock with cells calculated at [3,2] with 1 rotation
```

---

### Game State & Snapshots

#### Immutable State Container
```typescript
class GameState {
  readonly mode: GameMode;
  readonly grid: Grid;
  readonly blocksTray: BlockShape[];
  readonly placedBlocks: PlacedBlock[];
  readonly score: number;
  readonly moves: number;
  readonly linesCleared: number;
  readonly combo: number;
  readonly maxCombo: number;
  readonly elapsedSeconds: number;
  readonly isGameOver: boolean;
  
  // Builder methods return new instances
  withGrid(grid: Grid): GameState
  afterMove(scoreGain: number): GameState
  afterLinesClear(...): GameState
}
```

#### Snapshot (Serializable)
```typescript
interface GameSnapshot {
  mode: GameMode;
  grid: Grid;
  blocksTray: BlockShape[];
  placedBlocks: PlacedBlock[];
  score: number;
  moves: number;
  linesCleared: number;
  combo: number;
  timestamp: number;
  levelId?: number;
  isGameOver: boolean;
}
```

**Key Difference:**
- `GameState` = live object with methods, in-memory only
- `GameSnapshot` = plain data, serializable, storable

---

### Game Modes

```typescript
type GameMode = 'campaign' | 'endless' | 'daily' | 'speedrun' | 'sudoku';

interface ModeConfig {
  mode: GameMode;
  gridWidth: number;
  gridHeight: number;
  blockedCells: [number, number][];
  availableBlocks: BlockShape[];
  par?: { moves: number; time: number };
}

interface LevelConfig {
  id: number;
  name: string;
  mode: GameMode;
  gridWidth: number;
  gridHeight: number;
  blockedCells: [number, number][];
  availableBlocks: BlockShape[];
  parMoves: number;
  parTime: number;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Expert' | 'Master';
  hintSequence?: HintStep[];
  world?: number;
}
```

---

### Scoring

#### Star Ratings
```typescript
interface StarRating {
  stars: number;              // 0-3
  reason: 'moves' | 'time' | 'perfect';
  movesThreshold?: number;
  timeThreshold?: number;
}
```

#### Score Calculation
```typescript
interface ScoreBreakdown {
  baseScore: number;
  linesCleared: number;
  comboMultiplier: number;
  timeBonus: number;
  total: number;
}
```

#### Game Results
```typescript
interface GameStats {
  score: number;
  moves: number;
  linesCleared: number;
  combo: number;
  maxCombo: number;
  elapsedSeconds: number;
  stars: number;
}

interface GameResult {
  levelId?: number;
  mode: GameMode;
  stats: GameStats;
  completed: boolean;
  stars: number;
  newHighScore: boolean;
}
```

---

### Sudoku Hybrid

```typescript
enum SudokuColor {
  Red = 'Red',
  Blue = 'Blue',
  Green = 'Green',
  Yellow = 'Yellow',
  Purple = 'Purple',
  Orange = 'Orange',
}

interface ColorBlockShape extends BlockShape {
  cellColors: SudokuColor[];
}

interface SudokuGrid {
  solution: (SudokuColor | null)[][];
  playerGrid: (SudokuColor | null)[][];
  cellStates: SudokuCellState[][];
}

type SudokuCellState = 'empty' | 'fixed' | 'placed' | 'invalid';
```

---

### Input & Interaction

```typescript
type InputType = 'touch' | 'mouse' | 'keyboard' | 'gesture';

interface InputPoint {
  type: InputType;
  x: number;
  y: number;
  timestamp: number;
}

interface BlockDragInput {
  blockId: string;
  startPoint: InputPoint;
  currentPoint: InputPoint;
  gridX: number;
  gridY: number;
}

interface BlockRotateInput {
  blockId: string;
  rotations: number;
}
```

---

### Hints & AI

```typescript
interface Hint {
  level: 1 | 2 | 3;
  area?: { x: number; y: number; width: number; height: number };
  placement?: PlacedBlock;
  nextBlocks?: BlockShape[];
}

interface AIPlacement {
  placement: PlacedBlock;
  score: number;
  reasoning: string;
}
```

---

### Leaderboards

```typescript
interface LeaderboardEntry {
  rank: number;
  username: string;
  userId?: string;
  levelId: number;
  mode: GameMode;
  stars: number;
  moves: number;
  time: number;
  score: number;
  timestamp: string;
  isPlayerEntry: boolean;
}

interface LeaderboardResult {
  entries: LeaderboardEntry[];
  playerRank?: number;
  playerBestScore?: number;
  totalPlayers: number;
}
```

---

## Event System Types

### Event Discriminated Union

```typescript
type GameEvent =
  | GameStartedEvent
  | BlockPlacedEvent
  | LinesClearedEvent
  | ComboTriggeredEvent
  | GameOverEvent
  | GamePausedEvent
  | GameResumedEvent
  | MoveUndoneEvent
  | MoveRedoneEvent
  | HintRequestedEvent
  | ScoreChangedEvent
  | GridUpdatedEvent
  | TrayRefreshedEvent
  | ValidationFailedEvent
  | ProfileLoadedEvent
  | ProfileSavedEvent
  | AchievementUnlockedEvent
  | StreakUpdatedEvent
  | LeaderboardUpdatedEvent
  | AudioPlayedEvent
  | SettingsChangedEvent
  | ErrorOccurredEvent;
```

### Event Payload Examples

```typescript
interface GameStartedEvent {
  type: 'game:started';
  levelId: number;
  mode: string;
  timestamp: number;
}

interface BlockPlacedEvent {
  type: 'game:blockPlaced';
  block: PlacedBlock;
  scoreGained: number;
  timestamp: number;
}

interface LinesClearedEvent {
  type: 'game:linesCleared';
  lineCount: number;
  scoreGained: number;
  comboMultiplier: number;
  isCombo: boolean;
  timestamp: number;
}
```

### Event Handlers

```typescript
type EventHandler<T extends GameEvent = GameEvent> = 
  (event: T) => void | Promise<void>;

type EventFilter<T extends GameEvent = GameEvent> = 
  (event: T) => boolean;

interface EventListener<T extends GameEvent = GameEvent> {
  id: string;
  event: T['type'];
  handler: EventHandler<T>;
  filter?: EventFilter<T>;
  once?: boolean;
}
```

---

## API Contract Types

### Authentication

```typescript
// Requests
interface SignupRequest {
  email: string;
  password: string;
  username: string;
}

interface LoginRequest {
  email: string;
  password: string;
}

// Responses
interface AuthResponse {
  success: true;
  userId: string;
  email: string;
  username: string;
  token: string;
  profile?: ProfileData;
}
```

### Profile Data

```typescript
interface ProfileData {
  levelProgress: Record<number, LevelProgress>;
  currentLevel: number;
  hintsRemaining: number;
  isSubscribed: boolean;
  theme: 'light' | 'dark' | 'neon' | 'sunset' | 'retro';
  soundEnabled: boolean;
  musicEnabled?: boolean;
  username: string;
  achievementsUnlocked?: string[];
  dailyStreakCount?: number;
}

interface LevelProgress {
  stars: number;
  moves: number;
  time: number;
  completed: boolean;
  completedAt?: string;
}
```

### Score Submission

```typescript
interface ScoreSubmissionRequest {
  levelId: number;
  mode: 'campaign' | 'speedrun' | 'daily' | 'sudoku';
  stars: number;
  moves: number;
  time: number;
  date?: string;
  placement?: Array<{ blockId: string; cells: [number, number][] }>;
}

interface ScoreSubmissionResponse {
  success: true;
  rank: number;
  totalPlayers: number;
  newHighScore: boolean;
  achievements?: string[];
}
```

---

## React Component Types

### Component Props (Higher-Level)

```typescript
// Gameplay screen
interface GameplayScreenProps {
  levelId: number;
  mode: GameMode;
  onComplete: (result: GameResult) => void;
  onQuit: () => void;
}

// Leaderboard view
interface LeaderboardViewProps {
  mode: GameMode;
  levelId?: number;
  onPlayerSelect?: (userId: string) => void;
}

// Settings panel
interface SettingsPanelProps {
  profile: ProfileData;
  onSave: (updates: Partial<ProfileData>) => void;
  onClose: () => void;
}
```

---

## Type Relationships

### Hierarchy Diagram

```
┌─────────────────────────────────────────────┐
│ GameEngine Types (Immutable, Pure)          │
├─────────────────────────────────────────────┤
│                                             │
│  ┌──────────────┐     ┌──────────────────┐  │
│  │ BlockShape   │────▶│ PlacedBlock      │  │
│  │ (template)   │     │ (instance+xform) │  │
│  └──────────────┘     └──────────────────┘  │
│                              △              │
│                              │              │
│                       ┌──────┴──────┐       │
│                       │             │       │
│  ┌──────────────────┐ │ ┌──────────┐┐      │
│  │ GameState        │─┘ │ GameSnap-││      │
│  │ (live object)    │   │ shot     ││      │
│  │ - methods        │   │ (data)   ││      │
│  │ - computed props │   └──────────┘┘      │
│  └──────────────────┘                      │
│                                             │
│  ┌──────────────────┐     ┌──────────────┐  │
│  │ EventBus         │────▶│ GameEvent    │  │
│  │ (pub/sub system) │     │ (union type) │  │
│  └──────────────────┘     └──────────────┘  │
│                                             │
│  ┌──────────────────┐     ┌──────────────┐  │
│  │ Board            │────▶│ Grid         │  │
│  │ (cell state)     │     │ (operations) │  │
│  └──────────────────┘     └──────────────┘  │
│                                             │
└─────────────────────────────────────────────┘
           △          △          △
           │          │          │
      ┌────┴─────┬────┴─┬────────┴─┐
      │          │      │          │
      ▼          ▼      ▼          ▼
┌──────────┐ ┌─────┐ ┌──────┐ ┌────────┐
│ GameMgr  │ │ Sco-│ │Valid-│ │Geom-   │
│ (orchest-│ │ring │ │ator  │ │etry    │
│ ration)  │ │     │ │      │ │        │
└──────────┘ └─────┘ └──────┘ └────────┘
      │
      ▼
┌─────────────────────────────────────────┐
│ API Contract Types                      │
├─────────────────────────────────────────┤
│ - ProfileData (maps to engine types)    │
│ - ScoreSubmission                       │
│ - LeaderboardEntry                      │
│ - AuthResponse                          │
└─────────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────────┐
│ React Component Types                   │
├─────────────────────────────────────────┤
│ - GameplayScreenProps                   │
│ - LeaderboardViewProps                  │
│ - SettingsPanelProps                    │
└─────────────────────────────────────────┘
```

---

## Discriminated Unions

### Game Events (Type-Safe Event Handling)

```typescript
// Pattern: discriminator field ('type') enables type narrowing

function handleEvent(event: GameEvent) {
  switch (event.type) {
    case 'game:blockPlaced': {
      // TypeScript knows this is BlockPlacedEvent
      const scoreGain = event.scoreGained;
      playSound('place');
      break;
    }
    
    case 'game:linesCleared': {
      // TypeScript knows this is LinesClearedEvent
      const bonus = event.comboMultiplier;
      updateCombo(bonus);
      break;
    }
  }
}
```

### Cell States (Discriminated String Literal)

```typescript
type CellState = 'empty' | 'filled' | 'blocked';

// Type guard
function canPlaceHere(cell: CellState): boolean {
  if (cell === 'empty') return true;
  if (cell === 'filled') return false;
  if (cell === 'blocked') return false;
  // Exhaustive check - TypeScript error if missing case
}
```

---

## Generic Patterns

### Event Handler Registry

```typescript
interface EventListenerRegistry {
  listeners: Map<string, EventListener[]>;
  
  add<T extends GameEvent>(
    eventType: T['type'],
    handler: EventHandler<T>,
    filter?: EventFilter<T>,
    once?: boolean
  ): string;
  
  remove(id: string): boolean;
  
  clear(eventType?: string): void;
}

// Usage
bus.add<BlockPlacedEvent>('game:blockPlaced', (event) => {
  // event is typed as BlockPlacedEvent
  console.log(event.scoreGained);
});
```

### Async Event Waiting

```typescript
async function waitForGameOver(): Promise<GameOverEvent | null> {
  const event = await eventBus.waitFor<GameOverEvent>(
    'game:gameOver',
    5000 // 5 second timeout
  );
  
  if (event) {
    console.log(event.result.stats);
  }
}
```

### Type Guards for API Responses

```typescript
function isAuthResponse(obj: any): obj is AuthResponse {
  return obj?.success === true && obj?.userId && obj?.token;
}

function isLeaderboardResponse(obj: any): obj is LeaderboardResponse {
  return obj?.success === true && Array.isArray(obj?.entries);
}

// Usage
const response = await fetch('/api/auth/login').then(r => r.json());

if (isAuthResponse(response)) {
  // response is typed as AuthResponse
  localStorage.setItem('token', response.token);
} else {
  // response is typed as ApiErrorResponse
  console.error(response.error);
}
```

---

## Type Import Patterns

### From Game Engine

```typescript
import type {
  GameState,
  GameSnapshot,
  BlockShape,
  PlacedBlock,
  GameMode,
  GameEvent,
  Hint,
} from 'src/engine';

// Or specific modules
import { GameState } from 'src/engine/core/GameState';
import { GameValidator } from 'src/engine/utils/validation';
```

### From API Contracts

```typescript
import type {
  ProfileData,
  ScoreSubmissionRequest,
  LeaderboardEntry,
} from 'api/types';
```

### In React Components

```typescript
import React from 'react';
import type { GameMode, GameResult } from 'src/engine';

interface GameplayScreenProps {
  mode: GameMode;
  onComplete: (result: GameResult) => void;
}

export const GameplayScreen: React.FC<GameplayScreenProps> = ({ mode, onComplete }) => {
  // ...
};
```

---

## Type Safety Checklist

- ✅ All game entities have explicit interfaces
- ✅ GameState uses immutability (builder pattern)
- ✅ Events use discriminated unions
- ✅ API contracts have type guards
- ✅ No `any` types (except escape hatches)
- ✅ Component props are strongly typed
- ✅ Generic handlers use TypeScript generics
- ✅ Async functions use Promise<T>
- ✅ Validation functions return explicit types
