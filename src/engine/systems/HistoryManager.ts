/**
 * HistoryManager — manages move history and undo/redo functionality
 * Tracks game state snapshots for replay and state recovery
 */

import { GameSnapshot, PlacedBlock, GameMove } from '../types/game.types';

export class HistoryManager {
  private snapshots: GameSnapshot[] = [];
  private moves: GameMove[] = [];
  private currentIndex: number = -1;
  private maxHistory: number = 100;

  /**
   * Add snapshot to history
   */
  addSnapshot(snapshot: GameSnapshot, move?: GameMove): void {
    // Remove any snapshots after current index (redo stack is invalidated)
    if (this.currentIndex < this.snapshots.length - 1) {
      this.snapshots = this.snapshots.slice(0, this.currentIndex + 1);
      this.moves = this.moves.slice(0, this.currentIndex + 1);
    }

    // Add new snapshot
    this.snapshots.push(snapshot);
    if (move) {
      this.moves.push(move);
    }

    this.currentIndex++;

    // Trim history if exceeds max
    if (this.snapshots.length > this.maxHistory) {
      this.snapshots.shift();
      this.moves.shift();
      this.currentIndex--;
    }
  }

  /**
   * Get current snapshot
   */
  getCurrentSnapshot(): GameSnapshot | null {
    if (this.currentIndex < 0 || this.currentIndex >= this.snapshots.length) {
      return null;
    }
    return this.snapshots[this.currentIndex];
  }

  /**
   * Get previous snapshot
   */
  getPreviousSnapshot(): GameSnapshot | null {
    if (this.currentIndex <= 0) {
      return null;
    }
    return this.snapshots[this.currentIndex - 1];
  }

  /**
   * Get next snapshot
   */
  getNextSnapshot(): GameSnapshot | null {
    if (this.currentIndex >= this.snapshots.length - 2) {
      return null;
    }
    return this.snapshots[this.currentIndex + 1];
  }

  /**
   * Undo to previous state
   */
  undo(): GameSnapshot | null {
    if (this.currentIndex <= 0) {
      return null;
    }

    this.currentIndex--;
    return this.snapshots[this.currentIndex];
  }

  /**
   * Redo to next state
   */
  redo(): GameSnapshot | null {
    if (this.currentIndex >= this.snapshots.length - 1) {
      return null;
    }

    this.currentIndex++;
    return this.snapshots[this.currentIndex];
  }

  /**
   * Check if can undo
   */
  canUndo(): boolean {
    return this.currentIndex > 0;
  }

  /**
   * Check if can redo
   */
  canRedo(): boolean {
    return this.currentIndex < this.snapshots.length - 1;
  }

  /**
   * Get move at index
   */
  getMove(index: number): GameMove | null {
    if (index < 0 || index >= this.moves.length) {
      return null;
    }
    return this.moves[index];
  }

  /**
   * Get all moves
   */
  getAllMoves(): GameMove[] {
    return [...this.moves];
  }

  /**
   * Get current move index
   */
  getCurrentMoveIndex(): number {
    return this.currentIndex;
  }

  /**
   * Get history size
   */
  getHistorySize(): number {
    return this.snapshots.length;
  }

  /**
   * Get undo/redo state
   */
  getState(): {
    canUndo: boolean;
    canRedo: boolean;
    currentIndex: number;
    totalSnapshots: number;
  } {
    return {
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
      currentIndex: this.currentIndex,
      totalSnapshots: this.snapshots.length,
    };
  }

  /**
   * Get snapshots in range (for UI display)
   */
  getSnapshotsInRange(start: number, end: number): GameSnapshot[] {
    return this.snapshots.slice(start, end);
  }

  /**
   * Jump to specific snapshot
   */
  jumpToSnapshot(index: number): GameSnapshot | null {
    if (index < 0 || index >= this.snapshots.length) {
      return null;
    }

    this.currentIndex = index;
    return this.snapshots[index];
  }

  /**
   * Clear all history
   */
  clear(): void {
    this.snapshots = [];
    this.moves = [];
    this.currentIndex = -1;
  }

  /**
   * Export history (for saving/sharing)
   */
  export(): {
    snapshots: GameSnapshot[];
    moves: GameMove[];
    currentIndex: number;
  } {
    return {
      snapshots: [...this.snapshots],
      moves: [...this.moves],
      currentIndex: this.currentIndex,
    };
  }

  /**
   * Import history (for loading)
   */
  import(data: {
    snapshots: GameSnapshot[];
    moves: GameMove[];
    currentIndex: number;
  }): void {
    this.snapshots = [...data.snapshots];
    this.moves = [...data.moves];
    this.currentIndex = Math.min(data.currentIndex, this.snapshots.length - 1);
  }

  /**
   * Generate replay data
   */
  generateReplay(): {
    initialSnapshot: GameSnapshot;
    moves: Array<{
      move: GameMove;
      resultingSnapshot: GameSnapshot;
    }>;
  } | null {
    if (this.snapshots.length === 0) {
      return null;
    }

    const replay = {
      initialSnapshot: this.snapshots[0],
      moves: [] as Array<{ move: GameMove; resultingSnapshot: GameSnapshot }>,
    };

    for (let i = 1; i < this.snapshots.length; i++) {
      if (this.moves[i - 1]) {
        replay.moves.push({
          move: this.moves[i - 1],
          resultingSnapshot: this.snapshots[i],
        });
      }
    }

    return replay;
  }

  /**
   * Set max history size
   */
  setMaxHistory(max: number): void {
    this.maxHistory = Math.max(1, max);

    // Trim if necessary
    if (this.snapshots.length > this.maxHistory) {
      const excess = this.snapshots.length - this.maxHistory;
      this.snapshots = this.snapshots.slice(excess);
      this.moves = this.moves.slice(excess);
      this.currentIndex = Math.max(-1, this.currentIndex - excess);
    }
  }

  /**
   * Get debug info
   */
  getDebugInfo(): {
    snapshotCount: number;
    moveCount: number;
    currentIndex: number;
    canUndo: boolean;
    canRedo: boolean;
  } {
    return {
      snapshotCount: this.snapshots.length,
      moveCount: this.moves.length,
      currentIndex: this.currentIndex,
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
    };
  }
}
