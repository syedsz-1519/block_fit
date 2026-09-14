/**
 * GameManager — orchestrates game lifecycle and mode transitions
 * Responsible for: game initialization, mode switching, move validation, state updates
 * Emits events for UI to listen to and react
 */

import { EventBus } from './EventBus';
import { GameState } from '../core/GameState';
import { Board } from '../core/Board';
import { Block } from '../core/Block';
import { Grid, type LinesClearedResult } from '../core/Grid';
import { Scoring } from '../core/Scoring';
import { GameValidator } from '../utils/validation';
import {
  GameMode,
  LevelConfig,
  BlockShape,
  PlacedBlock,
  GameStatus,
  GameContext,
  GameResult,
  Hint,
} from '../types/game.types';
import {
  BlockPlacedEvent,
  LinesClearedEvent,
  ComboTriggeredEvent,
  GameOverEvent,
  GameStartedEvent,
  ScoreChangedEvent,
  GridUpdatedEvent,
  TrayRefreshedEvent,
  ValidationFailedEvent,
} from '../types/events.types';

export interface GameManagerConfig {
  eventBus: EventBus;
  scoring: Scoring;
}

export class GameManager {
  private eventBus: EventBus;
  private scoring: Scoring;
  private currentState: GameState | null = null;
  private status: GameStatus = 'idle';
  private isPaused = false;
  private gameStartTime = 0;
  private pauseStartTime = 0;
  private pausedDuration = 0;
  private moveHistory: PlacedBlock[] = [];
  private lastComboTime = 0;
  private comboResetThreshold = 2000; // ms

  constructor(config: GameManagerConfig) {
    this.eventBus = config.eventBus;
    this.scoring = config.scoring;
  }

  /**
   * Initialize new game from level config
   */
  initializeGame(config: LevelConfig): void {
    if (this.status === 'playing') {
      console.warn('[GameManager] Cannot start game while one is in progress');
      return;
    }

    // Create initial board
    const board = new Board(config.gridWidth, config.gridHeight);
    board.blockCells(config.blockedCells);

    // Create initial state
    this.currentState = GameState.initial(
      config.mode as GameMode,
      board.getGrid(),
      config.availableBlocks.slice(0, 3), // First 3 blocks in tray
      config.id
    );

    // Reset state
    this.status = 'playing';
    this.isPaused = false;
    this.gameStartTime = Date.now();
    this.pausedDuration = 0;
    this.moveHistory = [];
    this.lastComboTime = 0;

    // Emit started event
    this.eventBus.emit<GameStartedEvent>({
      type: 'game:started',
      levelId: config.id,
      mode: config.mode,
      timestamp: Date.now(),
    });
  }

  /**
   * Attempt to place a block
   */
  placeBlock(block: PlacedBlock, shapeId?: string): boolean {
    if (!this.currentState) {
      this.eventBus.emit<ValidationFailedEvent>({
        type: 'game:validationFailed',
        reason: 'Game not initialized',
        attemptedBlock: block,
        timestamp: Date.now(),
      });
      return false;
    }

    // Create board from current state
    const board = new Board(
      this.currentState.grid.width,
      this.currentState.grid.height,
      this.currentState.grid.cells
    );

    // Validate placement
    const validationResult = GameValidator.validatePlacement(block, board);
    if (!validationResult.valid) {
      this.eventBus.emit<ValidationFailedEvent>({
        type: 'game:validationFailed',
        reason: validationResult.errors[0],
        attemptedBlock: block,
        timestamp: Date.now(),
      });
      return false;
    }

    // Place block
    board.placeBlock(block);
    this.moveHistory.push(block);

    // Check for line clears
    const lineResult = Grid.detectCompleteLines(board);
    let scoreGain = Grid.calculateClearScore(
      lineResult.lineCount,
      Grid.getComboMultiplier(this.currentState.combo)
    );

    // Update combo
    let newCombo = this.currentState.combo;
    if (lineResult.lineCount > 0) {
      newCombo = Grid.calculateCombo(this.currentState.combo, lineResult.lineCount);
      this.lastComboTime = Date.now();
    } else {
      // Check if combo should reset
      if (Date.now() - this.lastComboTime > this.comboResetThreshold) {
        newCombo = 0;
      }
    }

    // Update state
    const newState = this.currentState
      .withPlacedBlocks([...this.currentState.placedBlocks, block])
      .withGrid(board.getGrid())
      .afterMove(scoreGain);

    this.currentState = newState;

    // Emit block placed event
    this.eventBus.emit<BlockPlacedEvent>({
      type: 'game:blockPlaced',
      block,
      scoreGained: scoreGain,
      timestamp: Date.now(),
    });

    // Emit lines cleared event if any
    if (lineResult.lineCount > 0) {
      board.clearLines();
      this.currentState = this.currentState
        .withGrid(board.getGrid())
        .afterLinesClear(lineResult.lineCount, scoreGain, newCombo);

      this.eventBus.emit<LinesClearedEvent>({
        type: 'game:linesCleared',
        lineCount: lineResult.lineCount,
        scoreGained: scoreGain,
        comboMultiplier: Grid.getComboMultiplier(newCombo),
        isCombo: newCombo > 1,
        timestamp: Date.now(),
      });

      // Emit combo event if combo increased
      if (newCombo > 1 && newCombo !== this.currentState.combo - 1) {
        this.eventBus.emit<ComboTriggeredEvent>({
          type: 'game:comboTriggered',
          comboCount: newCombo,
          multiplier: Grid.getComboMultiplier(newCombo),
          scoreGained: scoreGain,
          timestamp: Date.now(),
        });
      }
    }

    return true;
  }

  /**
   * Remove block from board (undo)
   */
  removeBlock(block: PlacedBlock): boolean {
    if (!this.currentState) return false;

    const board = new Board(
      this.currentState.grid.width,
      this.currentState.grid.height,
      this.currentState.grid.cells
    );

    board.removeBlock(block);
    this.currentState = this.currentState.withGrid(board.getGrid());

    this.moveHistory = this.moveHistory.filter((b) => b !== block);

    return true;
  }

  /**
   * Update elapsed time
   */
  updateTime(): void {
    if (!this.currentState || this.status !== 'playing' || this.isPaused) {
      return;
    }

    const elapsed = Math.floor((Date.now() - this.gameStartTime - this.pausedDuration) / 1000);
    this.currentState = this.currentState.withElapsedTime(elapsed);
  }

  /**
   * Pause game
   */
  pauseGame(): void {
    if (!this.currentState || this.status !== 'playing' || this.isPaused) {
      return;
    }

    this.isPaused = true;
    this.pauseStartTime = Date.now();

    this.eventBus.emit({
      type: 'game:paused',
      elapsedSeconds: this.currentState.elapsedSeconds,
      timestamp: Date.now(),
    });
  }

  /**
   * Resume game
   */
  resumeGame(): void {
    if (!this.currentState || this.status !== 'playing' || !this.isPaused) {
      return;
    }

    this.isPaused = false;
    this.pausedDuration += Date.now() - this.pauseStartTime;

    this.eventBus.emit({
      type: 'game:resumed',
      timestamp: Date.now(),
    });
  }

  /**
   * End game
   */
  endGame(completed: boolean = true): GameResult | null {
    if (!this.currentState) return null;

    const stats = this.currentState.getStats();
    const result: GameResult = {
      levelId: this.currentState.levelId,
      mode: this.currentState.mode,
      stats,
      completed,
      stars: stats.stars,
      newHighScore: false, // Would be determined by backend
    };

    this.status = 'completed';

    this.eventBus.emit<GameOverEvent>({
      type: 'game:gameOver',
      result,
      finalStats: stats,
      timestamp: Date.now(),
    });

    return result;
  }

  /**
   * Check game over condition
   */
  checkGameOver(blockShapes: readonly BlockShape[]): boolean {
    if (!this.currentState) return false;

    const board = new Board(
      this.currentState.grid.width,
      this.currentState.grid.height,
      this.currentState.grid.cells
    );

    const shapes = blockShapes.map((b) => b.cells);
    return !Grid.isPlayable(board, shapes);
  }

  /**
   * Get current game context
   */
  getContext(): GameContext {
    return {
      status: this.status,
      mode: this.currentState?.mode ?? 'endless',
      snapshot: this.currentState?.toSnapshot() ?? null!,
      stats: this.currentState?.getStats() ?? null!,
      isPaused: this.isPaused,
      canUndo: this.moveHistory.length > 0,
      canRedo: false, // TODO: implement redo
      elapsedTime: this.currentState?.elapsedSeconds ?? 0,
    };
  }

  /**
   * Get hint for current position
   */
  getHint(level: 1 | 2 | 3 = 1): Hint | null {
    if (!this.currentState) return null;

    const board = new Board(
      this.currentState.grid.width,
      this.currentState.grid.height,
      this.currentState.grid.cells
    );

    const trayBlock = this.currentState.blocksTray[0];
    if (!trayBlock) return null;

    const placement = Grid.findBestPlacement(board, trayBlock.cells, 'center');
    if (!placement) return null;

    const hint: Hint = {
      level,
    };

    if (level >= 1) {
      // Show area
      hint.area = {
        x: placement.x,
        y: placement.y,
        width: 3,
        height: 3,
      };
    }

    if (level >= 2) {
      // Show exact placement
      hint.placement = Block.createPlaced(
        trayBlock.id,
        trayBlock,
        placement.x,
        placement.y
      );
    }

    if (level >= 3) {
      // Show next blocks
      hint.nextBlocks = this.currentState.blocksTray.slice(1, 4);
    }

    return hint;
  }

  /**
   * Rotate block in tray
   */
  rotateBlockInTray(blockIndex: number, clockwise: boolean = true): PlacedBlock | null {
    if (!this.currentState || blockIndex >= this.currentState.blocksTray.length) {
      return null;
    }

    const block = this.currentState.blocksTray[blockIndex];
    const placedBlock = Block.createPlaced(block.id, block, 0, 0);

    return clockwise
      ? Block.rotate(placedBlock, true)
      : Block.rotate(placedBlock, false);
  }

  /**
   * Mirror block in tray
   */
  mirrorBlockInTray(blockIndex: number): PlacedBlock | null {
    if (!this.currentState || blockIndex >= this.currentState.blocksTray.length) {
      return null;
    }

    const block = this.currentState.blocksTray[blockIndex];
    const placedBlock = Block.createPlaced(block.id, block, 0, 0);

    return Block.mirror(placedBlock);
  }

  /**
   * Get current state (for testing/debugging)
   */
  getState(): GameState | null {
    return this.currentState;
  }

  /**
   * Get game status
   */
  getStatus(): GameStatus {
    return this.status;
  }

  /**
   * Reset game
   */
  reset(): void {
    this.currentState = null;
    this.status = 'idle';
    this.isPaused = false;
    this.gameStartTime = 0;
    this.pauseStartTime = 0;
    this.pausedDuration = 0;
    this.moveHistory = [];
    this.lastComboTime = 0;
  }
}
