# Block Fit — Design Patterns & Best Practices

This document outlines design patterns used throughout Block Fit for consistency and maintainability.

---

## Table of Contents

1. [Architectural Patterns](#architectural-patterns)
2. [Code Patterns](#code-patterns)
3. [State Management](#state-management)
4. [Type Patterns](#type-patterns)
5. [Testing Patterns](#testing-patterns)
6. [Error Handling](#error-handling)

---

## Architectural Patterns

### 1. Layered Architecture

**Structure:**
```
┌─────────────────────────────────────┐
│ React UI Layer (Components)         │
├─────────────────────────────────────┤
│ Service Layer (API, Storage)        │
├─────────────────────────────────────┤
│ Game Engine Layer (Logic)           │
├─────────────────────────────────────┤
│ Domain Layer (Types, Utilities)     │
└─────────────────────────────────────┘
```

**Benefits:**
- Clear separation of concerns
- Easy to test each layer independently
- Frontend/backend can be developed in parallel
- Engine can be ported to other platforms

**Usage:**
```typescript
// ✅ Good: Engine doesn't depend on React
import { GameManager, GameState } from 'src/engine';

// ❌ Avoid: Engine depending on UI
import { GameplayScreen } from 'src/components';
```

---

### 2. Pub/Sub Event System

**Pattern:** EventBus for decoupled communication

```typescript
// Game logic publishes events
eventBus.emit<LinesClearedEvent>({
  type: 'game:linesCleared',
  lineCount: 2,
  scoreGained: 200,
  comboMultiplier: 1.5,
  isCombo: true,
  timestamp: Date.now(),
});

// UI subscribes to events
const unsubscribe = eventBus.on<LinesClearedEvent>(
  'game:linesCleared',
  (event) => {
    playAnimation('line-clear', event.lineCount);
    playSound('clear');
  }
);
```

**Benefits:**
- Decouples game logic from UI
- Easy to add/remove listeners
- Supports multiple subscribers
- One-time listeners with `.once()`

---

### 3. Immutable State Pattern

**Design:** GameState uses builder pattern instead of mutations

```typescript
// ❌ Mutable (avoid)
const state = new GameState(...);
state.score += 100;
state.moves++;

// ✅ Immutable (preferred)
const newState = currentState
  .withScore(currentState.score + 100)
  .afterMove(scoreGain);
```

**Benefits:**
- Predictable state changes
- Easy undo/redo (just keep snapshots)
- Time-travel debugging
- Safe for concurrent updates

---

### 4. Strategy Pattern for Game Modes

**Example:** Different modes have different rules

```typescript
interface ModeStrategy {
  initialize(config: LevelConfig): GameState;
  onBlockPlace(state: GameState, block: PlacedBlock): GameState;
  onLinesClear(state: GameState, lineCount: number): GameState;
  isGameOver(state: GameState): boolean;
  calculateScore(moves: number, time: number): number;
}

// Campaign mode
class CampaignMode implements ModeStrategy {
  initialize(config: LevelConfig): GameState {
    // Campaign-specific setup
  }
  
  calculateScore(moves: number, time: number): number {
    // Campaign scoring rules
  }
}

// Endless mode
class EndlessMode implements ModeStrategy {
  calculateScore(moves: number, time: number): number {
    // Different scoring rules
  }
}
```

---

### 5. Factory Pattern for Game Objects

**Example:** Creating game entities

```typescript
// Block factory
static createPlaced(
  blockId: string,
  shape: BlockShape,
  x: number,
  y: number,
  rotations: number = 0,
  mirrored: boolean = false
): PlacedBlock {
  const transformedOffsets = this.getTransformedOffsets(
    shape.cells,
    rotations,
    mirrored
  );
  
  return {
    blockId,
    shapeId: shape.id,
    color: shape.color,
    cells: this.getAbsoluteCoordinates(x, y, transformedOffsets),
    x,
    y,
    rotations,
    mirrored,
  };
}

// Usage
const block = Block.createPlaced('b1', myShape, 5, 3);
```

---

## Code Patterns

### 1. Pure Functions

All game logic should be pure (no side effects)

```typescript
// ✅ Pure: deterministic, testable
function calculateScore(
  cellsPlaced: number,
  difficulty: string
): number {
  return cellsPlaced * 10 * difficultyMultiplier[difficulty];
}

// ❌ Impure: depends on global state
let totalScore = 0;
function addScore(points: number): void {
  totalScore += points; // Side effect
}

// ✅ Pure: returns new state, doesn't mutate
function addScore(currentScore: number, points: number): number {
  return currentScore + points;
}
```

**Benefits:**
- Easy to test (just provide inputs, check outputs)
- Predictable behavior
- Can be parallelized
- Time-travel debugging

---

### 2. Error Handling with Result Types

**Pattern:** Instead of throwing, return success/failure

```typescript
// ❌ Throws on error (hard to handle)
function placeBlock(board: Board, block: PlacedBlock): void {
  if (!board.canPlaceBlock(block)) {
    throw new Error('Cannot place block here');
  }
  board.placeBlock(block);
}

// ✅ Returns result object
interface Result<T, E> {
  ok: boolean;
  value?: T;
  error?: E;
}

function placeBlock(board: Board, block: PlacedBlock): Result<void, string> {
  if (!board.canPlaceBlock(block)) {
    return { ok: false, error: 'Invalid placement' };
  }
  
  board.placeBlock(block);
  return { ok: true };
}

// Usage
const result = placeBlock(board, block);
if (result.ok) {
  // Handle success
  updateUI();
} else {
  // Handle error
  showError(result.error);
}
```

---

### 3. Validation Chain Pattern

**Example:** Validate before processing

```typescript
// ✅ Chain validation checks
function isValidMove(placement: PlacedBlock, board: Board): ValidationResult {
  // 1. Check bounds
  if (this.isOutOfBounds(placement, board.width, board.height)) {
    return { valid: false, reason: 'Out of bounds' };
  }
  
  // 2. Check cells available
  if (!board.areCellsPlaceable(placement.cells)) {
    return { valid: false, reason: 'Cells occupied' };
  }
  
  // 3. Check shape is valid
  if (!this.isValidShape(placement)) {
    return { valid: false, reason: 'Invalid shape' };
  }
  
  return { valid: true };
}
```

---

### 4. Builder Pattern

**Used for:** Complex object construction

```typescript
// ✅ Fluent builder for GameState updates
const newState = currentState
  .withGrid(updatedGrid)
  .withPlacedBlocks([...currentState.placedBlocks, newBlock])
  .afterMove(scoreGain)
  .withElapsedTime(seconds);

// ✅ Fluent configuration
const config = new LevelBuilder()
  .setGridSize(8, 8)
  .addBlockedCells([[2, 3], [3, 3]])
  .setDifficulty('Hard')
  .setParMoves(15)
  .setParTime(60)
  .build();
```

---

## State Management

### 1. Centralized Game State

**Pattern:** Single GameManager holds current state

```typescript
class GameManager {
  private currentState: GameState | null = null;
  
  getState(): GameState | null {
    return this.currentState;
  }
  
  placeBlock(block: PlacedBlock): boolean {
    if (!this.currentState) return false;
    
    // Create new state (immutable)
    const newState = this.currentState
      .withPlacedBlocks([...this.currentState.placedBlocks, block])
      .afterMove(scoreGain);
    
    this.currentState = newState;
    
    // Emit event
    this.eventBus.emit<BlockPlacedEvent>({
      type: 'game:blockPlaced',
      block,
      scoreGained: scoreGain,
      timestamp: Date.now(),
    });
    
    return true;
  }
}
```

**Benefits:**
- Single source of truth
- Easy to debug (one place to log state changes)
- Efficient subscribers (all listen to GameManager)

---

### 2. React State Sync with Engine

**Pattern:** Use effects to sync React state with game engine

```typescript
function GameplayScreen() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [gameManager] = useState(() => new GameManager(config));
  
  // Subscribe to game events
  useEffect(() => {
    const unsubscribe = eventBus.on('game:blockPlaced', () => {
      setGameState(gameManager.getState());
    });
    
    return unsubscribe;
  }, [gameManager]);
  
  // Update on interval
  useEffect(() => {
    const interval = setInterval(() => {
      gameManager.updateTime();
      setGameState(gameManager.getState());
    }, 1000);
    
    return () => clearInterval(interval);
  }, [gameManager]);
  
  if (!gameState) return <Loading />;
  
  return (
    <div>
      <Board grid={gameState.grid} />
      <Score score={gameState.score} />
    </div>
  );
}
```

---

### 3. History Management

**Pattern:** HistoryManager tracks snapshots

```typescript
const history = new HistoryManager();

// After each move
history.addSnapshot(currentState.toSnapshot(), {
  type: 'place',
  blockId: block.blockId,
  timestamp: Date.now(),
  scoreAfter: currentState.score,
});

// Undo
if (history.canUndo()) {
  const prevSnapshot = history.undo();
  gameState = GameState.fromSnapshot(prevSnapshot);
  gameManager.setState(gameState);
}

// Redo
if (history.canRedo()) {
  const nextSnapshot = history.redo();
  gameState = GameState.fromSnapshot(nextSnapshot);
  gameManager.setState(gameState);
}
```

---

## Type Patterns

### 1. Discriminated Unions for Events

**Pattern:** Type field enables exhaustive type checking

```typescript
type GameEvent =
  | { type: 'game:started'; levelId: number }
  | { type: 'game:blockPlaced'; block: PlacedBlock; scoreGained: number }
  | { type: 'game:linesCleared'; lineCount: number };

function handleEvent(event: GameEvent) {
  switch (event.type) {
    case 'game:started':
      console.log('Started level', event.levelId);
      break;
    
    case 'game:blockPlaced':
      console.log('Block placed:', event.block.blockId);
      break;
    
    case 'game:linesCleared':
      console.log('Lines cleared:', event.lineCount);
      break;
  }
  // TypeScript error if any case missing
}
```

**Benefits:**
- Type-safe pattern matching
- Compiler enforces exhaustiveness
- Self-documenting event types

---

### 2. Generic Event Handlers

**Pattern:** Strongly-typed event subscriptions

```typescript
type EventHandler<T extends GameEvent = GameEvent> = (event: T) => void;

eventBus.on<BlockPlacedEvent>('game:blockPlaced', (event) => {
  // event is BlockPlacedEvent
  playAnimation(event.block.color);
});

eventBus.on<LinesClearedEvent>('game:linesCleared', (event) => {
  // event is LinesClearedEvent
  updateCombo(event.lineCount);
});
```

---

### 3. Type Guards

**Pattern:** Runtime type narrowing with type guards

```typescript
function isAuthResponse(obj: any): obj is AuthResponse {
  return (
    typeof obj === 'object' &&
    obj.success === true &&
    typeof obj.userId === 'string' &&
    typeof obj.token === 'string'
  );
}

// Usage
const response = await fetch('/api/auth/login').then(r => r.json());

if (isAuthResponse(response)) {
  // TypeScript knows response is AuthResponse
  localStorage.setItem('token', response.token);
} else {
  // TypeScript knows response is something else
  console.error(response.error);
}
```

---

## Testing Patterns

### 1. Pure Function Testing

```typescript
describe('Grid', () => {
  test('detects complete rows', () => {
    const board = new Board(3, 3);
    board.fillRow(0); // Fill entire row
    
    const rows = board.getCompleteRows();
    
    expect(rows).toContain(0);
    expect(rows.length).toBe(1);
  });
  
  test('calculates score correctly', () => {
    const score = Grid.calculateClearScore(2, 1.5, 64);
    
    expect(score).toBeGreaterThan(0);
    expect(score).toEqual(2 * 100 * 1.5); // 300
  });
});
```

---

### 2. Event Testing

```typescript
describe('GameManager', () => {
  test('emits blockPlaced event on valid placement', async () => {
    const manager = new GameManager({ eventBus: new EventBus() });
    manager.initializeGame(levelConfig);
    
    const eventPromise = manager.eventBus.waitFor<BlockPlacedEvent>(
      'game:blockPlaced',
      1000
    );
    
    manager.placeBlock(validBlock);
    
    const event = await eventPromise;
    expect(event).toBeDefined();
    expect(event?.block.blockId).toBe(validBlock.blockId);
  });
});
```

---

### 3. Integration Testing

```typescript
describe('Game Flow', () => {
  test('complete game to victory', async () => {
    const game = new GameManager(config);
    game.initializeGame(easyLevel);
    
    // Place blocks
    game.placeBlock(block1);
    game.placeBlock(block2);
    game.placeBlock(block3);
    
    // Check game completed
    const result = game.endGame(true);
    expect(result?.completed).toBe(true);
    expect(result?.stars).toBeGreaterThanOrEqual(1);
  });
});
```

---

## Error Handling

### 1. Validation Before Processing

```typescript
// Always validate before business logic
function processScoreSubmission(req: ScoreSubmissionRequest): Result<string, string> {
  // Validate each field
  if (!req.levelId || req.levelId < 1) {
    return { ok: false, error: 'Invalid levelId' };
  }
  
  if (!['campaign', 'speedrun', 'daily', 'sudoku'].includes(req.mode)) {
    return { ok: false, error: 'Invalid mode' };
  }
  
  if (req.stars < 0 || req.stars > 3) {
    return { ok: false, error: 'Stars must be 0-3' };
  }
  
  // Process only if valid
  return submitScore(req);
}
```

---

### 2. Graceful Degradation

```typescript
// Don't fail on non-critical errors
function playSound(soundId: string): void {
  try {
    soundManager.play(soundId);
  } catch (err) {
    console.warn(`Failed to play sound ${soundId}:`, err);
    // Game continues without sound
  }
}
```

---

### 3. Error Context

```typescript
// Include context for debugging
async function loadProfile(userId: string): Promise<Result<ProfileData, Error>> {
  try {
    const response = await fetch(`/api/profiles/${userId}`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: Profile fetch failed`);
    }
    
    return { ok: true, value: await response.json() };
  } catch (err) {
    console.error(`[loadProfile] Failed for userId=${userId}:`, err);
    return { ok: false, error: err as Error };
  }
}
```

---

## Summary Checklist

- ✅ Separate concerns into layers
- ✅ Use pub/sub for communication
- ✅ Keep state immutable
- ✅ Write pure functions
- ✅ Validate inputs before processing
- ✅ Use discriminated unions for type safety
- ✅ Implement comprehensive error handling
- ✅ Write testable code
- ✅ Document complex patterns
- ✅ Follow existing patterns for consistency
