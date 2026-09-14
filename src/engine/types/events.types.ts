/**
 * Event system types — defines all game events and their payloads
 * Used by EventBus for pub/sub communication between systems
 */

import {
  GameSnapshot,
  GameStats,
  PlacedBlock,
  BlockShape,
  Grid,
  GameResult,
  Hint,
  LeaderboardEntry,
} from './game.types';

// ─── Event Payload Unions ───────────────────────────────────────────────────

export interface GameStartedEvent {
  type: 'game:started';
  levelId: number;
  mode: string;
  timestamp: number;
}

export interface BlockPlacedEvent {
  type: 'game:blockPlaced';
  block: PlacedBlock;
  scoreGained: number;
  timestamp: number;
}

export interface LinesClearedEvent {
  type: 'game:linesCleared';
  lineCount: number;
  scoreGained: number;
  comboMultiplier: number;
  isCombo: boolean;
  timestamp: number;
}

export interface ComboTriggeredEvent {
  type: 'game:comboTriggered';
  comboCount: number;
  multiplier: number;
  scoreGained: number;
  timestamp: number;
}

export interface GameOverEvent {
  type: 'game:gameOver';
  result: GameResult;
  finalStats: GameStats;
  timestamp: number;
}

export interface GamePausedEvent {
  type: 'game:paused';
  elapsedSeconds: number;
  timestamp: number;
}

export interface GameResumedEvent {
  type: 'game:resumed';
  timestamp: number;
}

export interface MoveUndoneEvent {
  type: 'game:moveUndone';
  snapshot: GameSnapshot;
  timestamp: number;
}

export interface MoveRedoneEvent {
  type: 'game:moveRedone';
  snapshot: GameSnapshot;
  timestamp: number;
}

export interface HintRequestedEvent {
  type: 'game:hintRequested';
  level: 1 | 2 | 3;
  cost: number;
  hint?: Hint;
  timestamp: number;
}

export interface ScoreChangedEvent {
  type: 'game:scoreChanged';
  newScore: number;
  delta: number;
  reason: string;
  timestamp: number;
}

export interface GridUpdatedEvent {
  type: 'game:gridUpdated';
  grid: Grid;
  timestamp: number;
}

export interface TrayRefreshedEvent {
  type: 'game:trayRefreshed';
  blocks: BlockShape[];
  timestamp: number;
}

export interface ValidationFailedEvent {
  type: 'game:validationFailed';
  reason: string;
  attemptedBlock: PlacedBlock;
  timestamp: number;
}

export interface ProfileLoadedEvent {
  type: 'profile:loaded';
  userId: string;
  username: string;
  timestamp: number;
}

export interface ProfileSavedEvent {
  type: 'profile:saved';
  userId: string;
  timestamp: number;
}

export interface AchievementUnlockedEvent {
  type: 'achievement:unlocked';
  id: string;
  name: string;
  icon: string;
  timestamp: number;
}

export interface StreakUpdatedEvent {
  type: 'streak:updated';
  current: number;
  previousBest: number;
  isNewRecord: boolean;
  timestamp: number;
}

export interface LeaderboardUpdatedEvent {
  type: 'leaderboard:updated';
  entries: LeaderboardEntry[];
  playerRank?: number;
  timestamp: number;
}

export interface AudioPlayedEvent {
  type: 'audio:played';
  soundId: string;
  volume: number;
  timestamp: number;
}

export interface SettingsChangedEvent {
  type: 'settings:changed';
  key: string;
  value: unknown;
  timestamp: number;
}

export interface ErrorOccurredEvent {
  type: 'error:occurred';
  error: Error;
  context: string;
  timestamp: number;
}

// ─── Event Union Type ───────────────────────────────────────────────────────

export type GameEvent =
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

// ─── Event Handler Types ───────────────────────────────────────────────────

export type EventHandler<T extends GameEvent = GameEvent> = (event: T) => void | Promise<void>;

export type EventFilter<T extends GameEvent = GameEvent> = (event: T) => boolean;

// ─── Event Listener Registry ───────────────────────────────────────────────

export interface EventListener<T extends GameEvent = GameEvent> {
  id: string;
  event: T['type'];
  handler: EventHandler<T>;
  filter?: EventFilter<T>;
  once?: boolean;
}

export interface EventListenerRegistry {
  listeners: Map<string, EventListener[]>;
  add<T extends GameEvent>(
    eventType: T['type'],
    handler: EventHandler<T>,
    filter?: EventFilter<T>,
    once?: boolean
  ): string;
  remove(id: string): boolean;
  clear(eventType?: string): void;
  getListeners(eventType?: string): EventListener[];
}
