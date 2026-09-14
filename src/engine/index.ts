/**
 * Block Fit Game Engine
 * Core game logic, systems, and utilities
 * Framework-agnostic and fully testable
 */

// ─── Types ────────────────────────────────────────────────────────────────

export * from './types/game.types';
export * from './types/events.types';

// ─── Core Game Objects ────────────────────────────────────────────────────

export { GameState } from './core/GameState';
export { Board } from './core/Board';
export { Block } from './core/Block';
export { Grid, type LinesClearedResult } from './core/Grid';
export { Scoring, DEFAULT_SCORING_RULES, getPerformanceBadges } from './core/Scoring';

// ─── Systems ──────────────────────────────────────────────────────────────

export { EventBus, eventBus } from './systems/EventBus';
export { GameManager, type GameManagerConfig } from './systems/GameManager';
export { InputHandler, type InputCommand, type GestureRecognizer } from './systems/InputHandler';
export { HistoryManager } from './systems/HistoryManager';

// ─── Utilities ────────────────────────────────────────────────────────────

export { GameValidator } from './utils/validation';
export { Geometry } from './utils/geometry';
