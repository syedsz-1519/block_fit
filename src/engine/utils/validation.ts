/**
 * Validation utilities — game data integrity checks
 * Validates placements, moves, and game state consistency
 */

import { Board } from '../core/Board';
import { Block } from '../core/Block';
import { PlacedBlock, BlockShape, GameSnapshot } from '../types/game.types';
import { GameState } from '../core/GameState';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export class GameValidator {
  /**
   * Validate block placement
   */
  static validatePlacement(
    placement: PlacedBlock,
    board: Board,
    allowOutOfBounds: boolean = false
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check bounds
    if (!allowOutOfBounds) {
      for (const [x, y] of placement.cells) {
        if (!board.isInBounds(x, y)) {
          errors.push(`Cell [${x}, ${y}] is out of bounds [0-${board.width}, 0-${board.height}]`);
        }
      }
    }

    // Check cells are placeable
    for (const [x, y] of placement.cells) {
      if (board.isInBounds(x, y)) {
        const cell = board.getCell(x, y);
        if (cell !== 'empty') {
          errors.push(`Cell [${x}, ${y}] is not empty (${cell})`);
        }
      }
    }

    // Check for duplicates in placement
    const cellSet = new Set<string>();
    for (const [x, y] of placement.cells) {
      const key = `${x},${y}`;
      if (cellSet.has(key)) {
        errors.push(`Duplicate cell [${x}, ${y}] in placement`);
      }
      cellSet.add(key);
    }

    // Warnings
    if (placement.cells.length === 0) {
      warnings.push('Block has no cells');
    }

    if (placement.rotations > 3) {
      warnings.push(`Unusual rotation count: ${placement.rotations}`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate block shape
   */
  static validateBlockShape(shape: BlockShape): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check required fields
    if (!shape.id) errors.push('Block shape missing id');
    if (!shape.name) errors.push('Block shape missing name');
    if (!shape.color) errors.push('Block shape missing color');
    if (!shape.cells || shape.cells.length === 0) {
      errors.push('Block shape has no cells');
    }

    // Check cells are valid offsets
    if (shape.cells) {
      for (let i = 0; i < shape.cells.length; i++) {
        const cell = shape.cells[i];
        if (!Array.isArray(cell) || cell.length !== 2) {
          errors.push(`Cell ${i} is not a valid [x, y] offset`);
        }
        if (typeof cell[0] !== 'number' || typeof cell[1] !== 'number') {
          errors.push(`Cell ${i} coordinates are not numbers`);
        }
      }
    }

    // Check for minimum complexity
    if (shape.cells && shape.cells.length > 10) {
      warnings.push(`Block shape is large: ${shape.cells.length} cells`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate game state consistency
   */
  static validateGameState(state: GameState): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check basic properties
    if (state.score < 0) errors.push('Score is negative');
    if (state.moves < 0) errors.push('Moves is negative');
    if (state.linesCleared < 0) errors.push('Lines cleared is negative');
    if (state.combo < 0) errors.push('Combo is negative');

    // Check grid dimensions
    if (state.grid.width <= 0 || state.grid.height <= 0) {
      errors.push(`Invalid grid dimensions: ${state.grid.width}x${state.grid.height}`);
    }

    // Check grid cell array matches dimensions
    if (state.grid.cells.length !== state.grid.height) {
      errors.push(
        `Grid cell array height (${state.grid.cells.length}) does not match height (${state.grid.height})`
      );
    }

    if (state.grid.cells.length > 0 && state.grid.cells[0].length !== state.grid.width) {
      errors.push(
        `Grid cell array width (${state.grid.cells[0].length}) does not match width (${state.grid.width})`
      );
    }

    // Check placed blocks
    if (state.placedBlocks) {
      for (let i = 0; i < state.placedBlocks.length; i++) {
        const placement = state.placedBlocks[i];
        const result = this.validatePlacement(placement, new Board(state.grid.width, state.grid.height, state.grid.cells), true);
        if (!result.valid) {
          errors.push(`Placed block ${i} is invalid: ${result.errors.join(', ')}`);
        }
      }
    }

    // Warnings
    if (state.moves > 100) {
      warnings.push(`Unusually high move count: ${state.moves}`);
    }

    if (state.elapsedSeconds > 3600) {
      warnings.push(`Game duration over 1 hour: ${state.elapsedSeconds}s`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate move sequence
   */
  static validateMoveSequence(
    previousState: GameState,
    newState: GameState
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check mode didn't change
    if (previousState.mode !== newState.mode) {
      errors.push(`Game mode changed unexpectedly: ${previousState.mode} → ${newState.mode}`);
    }

    // Check level didn't change
    if (previousState.levelId !== newState.levelId) {
      errors.push(`Level ID changed unexpectedly`);
    }

    // Check stats moved in right direction
    if (newState.moves < previousState.moves) {
      warnings.push('Move count decreased (might indicate undo)');
    }

    if (newState.score < previousState.score) {
      errors.push('Score decreased (should never happen)');
    }

    // Check time moved forward
    if (newState.elapsedSeconds < previousState.elapsedSeconds) {
      errors.push('Elapsed time moved backward');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate scored result
   */
  static validateScoredResult(
    moves: number,
    time: number,
    score: number,
    parMoves: number,
    parTime: number
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (moves <= 0) errors.push('Moves must be positive');
    if (time < 0) errors.push('Time cannot be negative');
    if (score < 0) errors.push('Score cannot be negative');
    if (parMoves <= 0) errors.push('Par moves must be positive');
    if (parTime <= 0) errors.push('Par time must be positive');

    // Heuristic: score should be within reasonable bounds
    const maxExpectedScore = moves * parTime * 10; // Very generous upper bound
    if (score > maxExpectedScore) {
      warnings.push(
        `Score ${score} seems unusually high (estimated max ~${maxExpectedScore})`
      );
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Check if block placement matches shape
   */
  static validateBlockPlacementShape(
    placement: PlacedBlock,
    originalShape: BlockShape
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (placement.shapeId !== originalShape.id) {
      errors.push(
        `Shape ID mismatch: ${placement.shapeId} vs ${originalShape.id}`
      );
    }

    if (placement.color !== originalShape.color) {
      warnings.push(
        `Color mismatch: ${placement.color} vs ${originalShape.color}`
      );
    }

    // Check cell count matches
    const transformedCells = Block.getTransformedOffsets(
      originalShape.cells,
      placement.rotations,
      placement.mirrored
    );

    if (transformedCells.length !== placement.cells.length) {
      errors.push(
        `Cell count mismatch: expected ${transformedCells.length}, got ${placement.cells.length}`
      );
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Format validation result as string
   */
  static formatResult(result: ValidationResult, title?: string): string {
    const lines: string[] = [];

    if (title) {
      lines.push(`\n${title}`);
      lines.push('='.repeat(title.length));
    }

    if (result.valid) {
      lines.push('✓ Valid');
    } else {
      lines.push('✗ Invalid');
    }

    if (result.errors.length > 0) {
      lines.push('\nErrors:');
      for (const error of result.errors) {
        lines.push(`  • ${error}`);
      }
    }

    if (result.warnings.length > 0) {
      lines.push('\nWarnings:');
      for (const warning of result.warnings) {
        lines.push(`  ⚠ ${warning}`);
      }
    }

    return lines.join('\n');
  }
}
