/**
 * Immutable game state representation
 * Snapshots represent a single point in time during gameplay
 * All modifications return new GameState instances
 */

import {
  GameSnapshot,
  GameStats,
  PlacedBlock,
  BlockShape,
  Grid,
  CellState,
  GameMode,
} from '../types/game.types';

export class GameState {
  readonly mode: GameMode;
  readonly grid: Grid;
  readonly blocksTray: BlockShape[];
  readonly placedBlocks: PlacedBlock[];
  readonly score: number;
  readonly moves: number;
  readonly linesCleared: number;
  readonly combo: number;
  readonly maxCombo: number;
  readonly timestamp: number;
  readonly levelId?: number;
  readonly isGameOver: boolean;
  readonly elapsedSeconds: number;

  constructor(
    mode: GameMode,
    grid: Grid,
    blocksTray: BlockShape[],
    placedBlocks: PlacedBlock[],
    score: number,
    moves: number,
    linesCleared: number,
    combo: number,
    maxCombo: number,
    isGameOver: boolean,
    elapsedSeconds: number,
    timestamp: number,
    levelId?: number
  ) {
    this.mode = mode;
    this.grid = grid;
    this.blocksTray = blocksTray;
    this.placedBlocks = placedBlocks;
    this.score = score;
    this.moves = moves;
    this.linesCleared = linesCleared;
    this.combo = combo;
    this.maxCombo = maxCombo;
    this.isGameOver = isGameOver;
    this.elapsedSeconds = elapsedSeconds;
    this.timestamp = timestamp;
    this.levelId = levelId;
  }

  /**
   * Create a new GameState with updated grid
   */
  withGrid(grid: Grid): GameState {
    return new GameState(
      this.mode,
      grid,
      this.blocksTray,
      this.placedBlocks,
      this.score,
      this.moves,
      this.linesCleared,
      this.combo,
      this.maxCombo,
      this.isGameOver,
      this.elapsedSeconds,
      Date.now(),
      this.levelId
    );
  }

  /**
   * Create a new GameState with updated tray
   */
  withTray(blocksTray: BlockShape[]): GameState {
    return new GameState(
      this.mode,
      this.grid,
      blocksTray,
      this.placedBlocks,
      this.score,
      this.moves,
      this.linesCleared,
      this.combo,
      this.maxCombo,
      this.isGameOver,
      this.elapsedSeconds,
      Date.now(),
      this.levelId
    );
  }

  /**
   * Create a new GameState with updated placed blocks
   */
  withPlacedBlocks(placedBlocks: PlacedBlock[]): GameState {
    return new GameState(
      this.mode,
      this.grid,
      this.blocksTray,
      placedBlocks,
      this.score,
      this.moves,
      this.linesCleared,
      this.combo,
      this.maxCombo,
      this.isGameOver,
      this.elapsedSeconds,
      Date.now(),
      this.levelId
    );
  }

  /**
   * Create a new GameState with updated score
   */
  withScore(score: number): GameState {
    return new GameState(
      this.mode,
      this.grid,
      this.blocksTray,
      this.placedBlocks,
      score,
      this.moves,
      this.linesCleared,
      this.combo,
      this.maxCombo,
      this.isGameOver,
      this.elapsedSeconds,
      Date.now(),
      this.levelId
    );
  }

  /**
   * Create a new GameState after a move
   */
  afterMove(scoreGain: number): GameState {
    return new GameState(
      this.mode,
      this.grid,
      this.blocksTray,
      this.placedBlocks,
      this.score + scoreGain,
      this.moves + 1,
      this.linesCleared,
      this.combo,
      this.maxCombo,
      this.isGameOver,
      this.elapsedSeconds,
      Date.now(),
      this.levelId
    );
  }

  /**
   * Create a new GameState after lines are cleared
   */
  afterLinesClear(linesCount: number, scoreGain: number, newCombo: number): GameState {
    return new GameState(
      this.mode,
      this.grid,
      this.blocksTray,
      this.placedBlocks,
      this.score + scoreGain,
      this.moves,
      this.linesCleared + linesCount,
      newCombo,
      Math.max(this.maxCombo, newCombo),
      this.isGameOver,
      this.elapsedSeconds,
      Date.now(),
      this.levelId
    );
  }

  /**
   * Create a new GameState with game over flag
   */
  withGameOver(isGameOver: boolean): GameState {
    return new GameState(
      this.mode,
      this.grid,
      this.blocksTray,
      this.placedBlocks,
      this.score,
      this.moves,
      this.linesCleared,
      this.combo,
      this.maxCombo,
      isGameOver,
      this.elapsedSeconds,
      Date.now(),
      this.levelId
    );
  }

  /**
   * Create a new GameState with updated elapsed time
   */
  withElapsedTime(seconds: number): GameState {
    return new GameState(
      this.mode,
      this.grid,
      this.blocksTray,
      this.placedBlocks,
      this.score,
      this.moves,
      this.linesCleared,
      this.combo,
      this.maxCombo,
      this.isGameOver,
      seconds,
      Date.now(),
      this.levelId
    );
  }

  /**
   * Create a new GameState with all updates at once
   */
  withUpdates(updates: Partial<{
    grid: Grid;
    tray: BlockShape[];
    placed: PlacedBlock[];
    score: number;
    moves: number;
    linesCleared: number;
    combo: number;
    maxCombo: number;
    isGameOver: boolean;
    elapsedSeconds: number;
  }>): GameState {
    return new GameState(
      this.mode,
      updates.grid ?? this.grid,
      updates.tray ?? this.blocksTray,
      updates.placed ?? this.placedBlocks,
      updates.score ?? this.score,
      updates.moves ?? this.moves,
      updates.linesCleared ?? this.linesCleared,
      updates.combo ?? this.combo,
      updates.maxCombo ?? this.maxCombo,
      updates.isGameOver ?? this.isGameOver,
      updates.elapsedSeconds ?? this.elapsedSeconds,
      Date.now(),
      this.levelId
    );
  }

  /**
   * Convert to snapshot for serialization/storage
   */
  toSnapshot(): GameSnapshot {
    return {
      mode: this.mode,
      grid: this.grid,
      blocksTray: this.blocksTray,
      placedBlocks: this.placedBlocks,
      score: this.score,
      moves: this.moves,
      linesCleared: this.linesCleared,
      combo: this.combo,
      timestamp: this.timestamp,
      levelId: this.levelId,
      isGameOver: this.isGameOver,
    };
  }

  /**
   * Calculate current stats
   */
  getStats(): GameStats {
    return {
      score: this.score,
      moves: this.moves,
      linesCleared: this.linesCleared,
      combo: this.combo,
      maxCombo: this.maxCombo,
      elapsedSeconds: this.elapsedSeconds,
      stars: this.calculateStars(),
    };
  }

  /**
   * Calculate star rating (placeholder — should be overridden by mode-specific logic)
   */
  private calculateStars(): number {
    // Simple heuristic: 3 stars for efficient play
    if (this.moves <= this.linesCleared + 2) return 3;
    if (this.moves <= this.linesCleared + 5) return 2;
    return 1;
  }

  /**
   * Create GameState from snapshot
   */
  static fromSnapshot(snapshot: GameSnapshot, elapsedSeconds: number = 0): GameState {
    return new GameState(
      snapshot.mode,
      snapshot.grid,
      snapshot.blocksTray,
      snapshot.placedBlocks,
      snapshot.score,
      snapshot.moves,
      snapshot.linesCleared,
      snapshot.combo,
      0, // maxCombo unknown from snapshot
      snapshot.isGameOver,
      elapsedSeconds,
      snapshot.timestamp,
      snapshot.levelId
    );
  }

  /**
   * Create initial GameState for a level
   */
  static initial(
    mode: GameMode,
    grid: Grid,
    initialTray: BlockShape[],
    levelId?: number
  ): GameState {
    return new GameState(
      mode,
      grid,
      initialTray,
      [],
      0,
      0,
      0,
      0,
      0,
      false,
      0,
      Date.now(),
      levelId
    );
  }
}
