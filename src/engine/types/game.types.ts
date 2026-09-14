/**
 * Core game domain types — framework agnostic
 * These types define all game concepts and are used throughout the engine
 */

// ─── Grid & Cell ───────────────────────────────────────────────────────────

export type CellState = 'empty' | 'filled' | 'blocked';

export interface GridCell {
  x: number;
  y: number;
  state: CellState;
  blockId?: string; // Which block occupies this cell (if filled)
}

export interface GridDimensions {
  width: number;
  height: number;
}

export interface Grid {
  cells: CellState[][];
  width: number;
  height: number;
}

// ─── Blocks & Shapes ───────────────────────────────────────────────────────

/** Relative offset from anchor point [x, y] */
export type CellOffset = readonly [number, number];

export interface BlockShape {
  id: string;
  name: string;
  color: string;
  cells: CellOffset[];
  /** Original cells before transformations (for undo/redo) */
  originalCells?: CellOffset[];
}

export interface PlacedBlock {
  blockId: string;
  shapeId: string;
  color: string;
  /** Grid coordinates of all cells occupied by this block */
  cells: [number, number][];
  /** Anchor point (top-left of bounding box) */
  x: number;
  y: number;
  /** Number of 90° rotations applied */
  rotations: number;
  /** Whether block is mirrored horizontally */
  mirrored: boolean;
}

export interface BlockPlacement {
  block: PlacedBlock;
  isValid: boolean;
  reason?: string;
}

// ─── Game Modes ───────────────────────────────────────────────────────────

export type GameMode = 'campaign' | 'endless' | 'daily' | 'speedrun' | 'sudoku';

export interface ModeConfig {
  mode: GameMode;
  gridWidth: number;
  gridHeight: number;
  blockedCells: [number, number][];
  availableBlocks: BlockShape[];
  par?: {
    moves: number;
    time: number;
  };
}

// ─── Game State ───────────────────────────────────────────────────────────

export interface GameSnapshot {
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

export interface GameStats {
  score: number;
  moves: number;
  linesCleared: number;
  combo: number;
  maxCombo: number;
  elapsedSeconds: number;
  stars: number;
}

export interface GameResult {
  levelId?: number;
  mode: GameMode;
  stats: GameStats;
  completed: boolean;
  stars: number;
  newHighScore: boolean;
}

// ─── Level Configuration ───────────────────────────────────────────────────

export interface LevelConfig {
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
  order?: number;
}

export interface HintStep {
  blockIndex: number;
  x: number;
  y: number;
  rotations: number;
  mirrored: boolean;
}

// ─── Sudoku Hybrid ────────────────────────────────────────────────────────

export enum SudokuColor {
  Red = 'Red',
  Blue = 'Blue',
  Green = 'Green',
  Yellow = 'Yellow',
  Purple = 'Purple',
  Orange = 'Orange',
}

export interface ColorBlockShape extends BlockShape {
  cellColors: SudokuColor[];
}

export type SudokuCellState = 'empty' | 'fixed' | 'placed' | 'invalid';

export interface SudokuGrid {
  solution: (SudokuColor | null)[][];
  playerGrid: (SudokuColor | null)[][];
  cellStates: SudokuCellState[][];
}

// ─── Input & Interaction ───────────────────────────────────────────────────

export type InputType = 'touch' | 'mouse' | 'keyboard' | 'gesture';

export interface InputPoint {
  type: InputType;
  x: number;
  y: number;
  timestamp: number;
}

export interface BlockDragInput {
  blockId: string;
  startPoint: InputPoint;
  currentPoint: InputPoint;
  gridX: number;
  gridY: number;
}

export interface BlockRotateInput {
  blockId: string;
  rotations: number;
}

export interface BlockMirrorInput {
  blockId: string;
  mirrored: boolean;
}

// ─── Scoring ──────────────────────────────────────────────────────────────

export interface ScoreBreakdown {
  baseScore: number;
  linesCleared: number;
  comboMultiplier: number;
  timeBonus: number;
  total: number;
}

export interface StarRating {
  stars: number;
  reason: 'moves' | 'time' | 'perfect';
  movesThreshold?: number;
  timeThreshold?: number;
}

// ─── History & Undo/Redo ───────────────────────────────────────────────────

export interface GameMove {
  type: 'place' | 'clear' | 'undo';
  blockId: string;
  placement?: PlacedBlock;
  timestamp: number;
  scoreAfter: number;
}

export interface GameHistory {
  moves: GameMove[];
  snapshots: GameSnapshot[];
  currentIndex: number;
}

// ─── AI & Hints ───────────────────────────────────────────────────────────

export interface HintLevel {
  level: 1 | 2 | 3;
  name: 'Gentle Nudge' | 'Strong Hint' | 'Full Solution';
  cost: number;
  maxReveals: number;
}

export interface Hint {
  level: 1 | 2 | 3;
  area?: { x: number; y: number; width: number; height: number };
  placement?: PlacedBlock;
  nextBlocks?: BlockShape[];
}

export interface AIPlacement {
  placement: PlacedBlock;
  score: number;
  reasoning: string;
}

// ─── Game Status ───────────────────────────────────────────────────────────

export type GameStatus = 'idle' | 'playing' | 'paused' | 'completed' | 'gameOver' | 'loading';

export interface GameContext {
  status: GameStatus;
  mode: GameMode;
  snapshot: GameSnapshot;
  stats: GameStats;
  isPaused: boolean;
  canUndo: boolean;
  canRedo: boolean;
  elapsedTime: number;
}

// ─── Leaderboard ───────────────────────────────────────────────────────────

export interface LeaderboardEntry {
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

export interface LeaderboardResult {
  entries: LeaderboardEntry[];
  playerRank?: number;
  playerBestScore?: number;
  totalPlayers: number;
}
