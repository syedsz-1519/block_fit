/**
 * Grid — manages grid operations and line clearing
 * Responsible for row/column detection, scoring calculation, and board state management
 */

import { Board } from './Board';
import { ScoreBreakdown, StarRating } from '../types/game.types';

export interface LinesClearedResult {
  cellsCleared: [number, number][];
  rowsCleared: number[];
  columnsCleared: number[];
  lineCount: number;
  cellCount: number;
}

export class Grid {
  /**
   * Detect which lines (rows/columns) are complete
   */
  static detectCompleteLines(board: Board): LinesClearedResult {
    const rowsCleared = board.getCompleteRows();
    const columnsCleared = board.getCompleteColumns();

    // Collect unique cells
    const uniqueCells = new Set<string>();

    for (const row of rowsCleared) {
      for (let x = 0; x < board.width; x++) {
        uniqueCells.add(`${x},${row}`);
      }
    }

    for (const col of columnsCleared) {
      for (let y = 0; y < board.height; y++) {
        uniqueCells.add(`${col},${y}`);
      }
    }

    const cellsCleared = Array.from(uniqueCells).map((key) => {
      const [x, y] = key.split(',').map(Number);
      return [x, y] as [number, number];
    });

    return {
      cellsCleared,
      rowsCleared,
      columnsCleared,
      lineCount: rowsCleared.length + columnsCleared.length,
      cellCount: cellsCleared.length,
    };
  }

  /**
   * Calculate score for clearing lines
   */
  static calculateClearScore(
    lineCount: number,
    comboMultiplier: number = 1,
    gridSize: number = 64
  ): number {
    if (lineCount === 0) return 0;

    // Base: 100 points per line
    const baseScore = lineCount * 100;

    // Bonus for multiple lines
    const lineBonus = lineCount > 1 ? (lineCount - 1) * 50 : 0;

    // Combo multiplier
    const multiplied = (baseScore + lineBonus) * comboMultiplier;

    return Math.round(multiplied);
  }

  /**
   * Calculate block placement score
   */
  static calculatePlacementScore(
    cellsPlaced: number,
    difficulty: 'Easy' | 'Medium' | 'Hard' | 'Expert' | 'Master' = 'Medium'
  ): number {
    const difficultyMultiplier = {
      Easy: 1,
      Medium: 1.5,
      Hard: 2,
      Expert: 2.5,
      Master: 3,
    };

    return Math.round(cellsPlaced * 10 * difficultyMultiplier[difficulty]);
  }

  /**
   * Calculate total score breakdown
   */
  static calculateScoreBreakdown(
    cellsPlaced: number,
    lineCount: number,
    comboCount: number,
    timeBonus: number = 0,
    difficulty: 'Easy' | 'Medium' | 'Hard' | 'Expert' | 'Master' = 'Medium'
  ): ScoreBreakdown {
    const baseScore = this.calculatePlacementScore(cellsPlaced, difficulty);
    const clearScore = this.calculateClearScore(lineCount, Math.max(1, comboCount), 64);
    const total = baseScore + clearScore + Math.round(timeBonus);

    return {
      baseScore,
      linesCleared: clearScore,
      comboMultiplier: Math.max(1, comboCount),
      timeBonus,
      total,
    };
  }

  /**
   * Calculate star rating based on performance
   */
  static calculateStars(
    moves: number,
    time: number,
    parMoves: number,
    parTime: number
  ): StarRating {
    // 3 stars: within par moves AND time
    if (moves <= parMoves && time <= parTime) {
      return {
        stars: 3,
        reason: 'perfect',
      };
    }

    // 2 stars: within par for at least one
    if ((moves <= parMoves * 1.2 && time <= parTime) ||
        (moves <= parMoves && time <= parTime * 1.2)) {
      return {
        stars: 2,
        reason: moves <= parMoves ? 'time' : 'moves',
        movesThreshold: Math.ceil(parMoves * 1.2),
        timeThreshold: Math.ceil(parTime * 1.2),
      };
    }

    // 1 star: within 50% worse than par
    if (moves <= parMoves * 1.5 || time <= parTime * 1.5) {
      return {
        stars: 1,
        reason: moves <= parMoves * 1.5 ? 'moves' : 'time',
        movesThreshold: Math.ceil(parMoves * 1.5),
        timeThreshold: Math.ceil(parTime * 1.5),
      };
    }

    // 0 stars: worse than 50% of par
    return {
      stars: 0,
      reason: 'moves',
      movesThreshold: Math.ceil(parMoves * 1.5),
      timeThreshold: Math.ceil(parTime * 1.5),
    };
  }

  /**
   * Calculate combo progression
   */
  static calculateCombo(
    previousCombo: number,
    linesCleared: number
  ): number {
    if (linesCleared === 0) {
      return 0; // Reset combo
    }

    if (previousCombo === 0) {
      return 1; // Start new combo
    }

    return previousCombo + 1; // Increment combo
  }

  /**
   * Get combo multiplier
   */
  static getComboMultiplier(combo: number): number {
    if (combo === 0) return 1;
    if (combo === 1) return 1;
    if (combo === 2) return 1.5;
    if (combo === 3) return 2;
    if (combo === 4) return 2.5;
    if (combo === 5) return 3;
    // Diminishing returns after 5
    return 3 + (combo - 5) * 0.1;
  }

  /**
   * Check if grid is still playable
   */
  static isPlayable(
    board: Board,
    blockShapes: readonly (readonly [number, number][])[],
    minFreeCells: number = 1
  ): boolean {
    const emptyCells = board.getEmptyCellCount();
    if (emptyCells < minFreeCells) {
      return false;
    }

    // Check if any block can be placed
    return board.hasValidPlacement(blockShapes);
  }

  /**
   * Get grid efficiency (cells used / total cells)
   */
  static getEfficiency(
    board: Board,
    filledCells: number
  ): { percentage: number; efficiency: 'low' | 'medium' | 'high' | 'perfect' } {
    const totalCells = board.width * board.height;
    const percentage = Math.round((filledCells / totalCells) * 100);

    let efficiency: 'low' | 'medium' | 'high' | 'perfect';
    if (percentage < 25) efficiency = 'low';
    else if (percentage < 50) efficiency = 'medium';
    else if (percentage < 80) efficiency = 'high';
    else efficiency = 'perfect';

    return { percentage, efficiency };
  }

  /**
   * Simulate line clearing and return new board state
   */
  static simulateClearing(board: Board): Board {
    const clonedBoard = board.clone();
    clonedBoard.clearLines();
    return clonedBoard;
  }

  /**
   * Get number of moves to clear all cells (heuristic)
   */
  static estimateMoveCount(filledCellCount: number): number {
    // Rough heuristic: average block size is ~3 cells
    return Math.ceil(filledCellCount / 3);
  }

  /**
   * Get next spawn position for blocks (center top)
   */
  static getSpawnPosition(
    gridWidth: number,
    gridHeight: number,
    blockWidth: number,
    blockHeight: number
  ): { x: number; y: number } {
    return {
      x: Math.max(0, Math.floor((gridWidth - blockWidth) / 2)),
      y: Math.max(0, Math.floor((gridHeight - blockHeight) / 2)),
    };
  }

  /**
   * Find best placement for a block (greedy — top-left priority)
   */
  static findBestPlacement(
    board: Board,
    blockCells: readonly [number, number][],
    strategy: 'top-left' | 'center' | 'bottom-right' = 'top-left'
  ): { x: number; y: number } | null {
    for (let y = 0; y < board.height; y++) {
      for (let x = 0; x < board.width; x++) {
        let canPlace = true;
        for (const [dx, dy] of blockCells) {
          if (!board.isPlaceable(x + dx, y + dy)) {
            canPlace = false;
            break;
          }
        }

        if (canPlace) {
          return { x, y };
        }
      }
    }

    return null;
  }

  /**
   * Get gravity-applied position (drop to bottom)
   */
  static getGravityPosition(
    board: Board,
    blockCells: readonly [number, number][],
    startX: number,
    startY: number
  ): { x: number; y: number } {
    let dropY = startY;

    while (dropY + 1 < board.height) {
      let canDrop = true;
      for (const [dx, dy] of blockCells) {
        if (!board.isPlaceable(startX + dx, dropY + 1 + dy)) {
          canDrop = false;
          break;
        }
      }

      if (!canDrop) break;
      dropY++;
    }

    return { x: startX, y: dropY };
  }
}
