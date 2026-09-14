/**
 * InputHandler — normalizes input from multiple sources
 * Converts touch, mouse, keyboard, and gesture input into unified game commands
 */

import { EventBus } from './EventBus';
import { Block } from '../core/Block';
import { PlacedBlock, BlockShape, InputPoint, InputType } from '../types/game.types';

export interface InputCommand {
  type: 'place' | 'rotate' | 'mirror' | 'move' | 'pause' | 'resume' | 'hint' | 'undo';
  blockId?: string;
  data?: unknown;
}

export interface GestureRecognizer {
  type: 'drag' | 'tap' | 'rotate' | 'swipe';
  startPoint: InputPoint;
  currentPoint: InputPoint;
  pressure?: number;
  angle?: number;
}

export class InputHandler {
  private eventBus: EventBus;
  private gridWidth: number;
  private gridHeight: number;
  private cellSize: number;
  private dragStartPoint: InputPoint | null = null;
  private currentDragBlock: PlacedBlock | null = null;
  private dragThreshold = 10; // pixels
  private rotateThreshold = 30; // degrees
  private touchIds = new Map<number, InputPoint>();

  constructor(
    eventBus: EventBus,
    gridWidth: number,
    gridHeight: number,
    cellSize: number = 40
  ) {
    this.eventBus = eventBus;
    this.gridWidth = gridWidth;
    this.gridHeight = gridHeight;
    this.cellSize = cellSize;
  }

  /**
   * Convert screen coordinates to grid coordinates
   */
  screenToGrid(screenX: number, screenY: number): { x: number; y: number } {
    return {
      x: Math.floor(screenX / this.cellSize),
      y: Math.floor(screenY / this.cellSize),
    };
  }

  /**
   * Convert grid coordinates to screen coordinates
   */
  gridToScreen(gridX: number, gridY: number): { x: number; y: number } {
    return {
      x: gridX * this.cellSize,
      y: gridY * this.cellSize,
    };
  }

  /**
   * Handle mouse/touch down
   */
  handlePointerDown(
    screenX: number,
    screenY: number,
    pointerId: number = 0,
    type: InputType = 'mouse'
  ): void {
    const point: InputPoint = {
      type,
      x: screenX,
      y: screenY,
      timestamp: Date.now(),
    };

    this.touchIds.set(pointerId, point);
    this.dragStartPoint = point;
  }

  /**
   * Handle mouse/touch move
   */
  handlePointerMove(
    screenX: number,
    screenY: number,
    pointerId: number = 0
  ): InputCommand | null {
    if (!this.dragStartPoint) return null;

    const currentPoint: InputPoint = {
      type: this.dragStartPoint.type,
      x: screenX,
      y: screenY,
      timestamp: Date.now(),
    };

    this.touchIds.set(pointerId, currentPoint);

    // Check if drag threshold exceeded
    const distance = Math.hypot(
      currentPoint.x - this.dragStartPoint.x,
      currentPoint.y - this.dragStartPoint.y
    );

    if (distance < this.dragThreshold) {
      return null; // Still in tap zone
    }

    // Calculate grid position
    const gridPos = this.screenToGrid(screenX, screenY);

    return {
      type: 'move',
      data: {
        gridX: gridPos.x,
        gridY: gridPos.y,
        screenX,
        screenY,
      },
    };
  }

  /**
   * Handle mouse/touch up
   */
  handlePointerUp(pointerId: number = 0): InputCommand | null {
    const startPoint = this.dragStartPoint;
    const endPoint = this.touchIds.get(pointerId);

    this.touchIds.delete(pointerId);

    if (!startPoint || !endPoint) {
      this.dragStartPoint = null;
      return null;
    }

    const distance = Math.hypot(
      endPoint.x - startPoint.x,
      endPoint.y - startPoint.y
    );

    this.dragStartPoint = null;

    // Tap
    if (distance < this.dragThreshold) {
      const gridPos = this.screenToGrid(startPoint.x, startPoint.y);
      return {
        type: 'place',
        data: { gridX: gridPos.x, gridY: gridPos.y },
      };
    }

    // Drag
    const gridStart = this.screenToGrid(startPoint.x, startPoint.y);
    const gridEnd = this.screenToGrid(endPoint.x, endPoint.y);

    return {
      type: 'move',
      data: {
        startX: gridStart.x,
        startY: gridStart.y,
        endX: gridEnd.x,
        endY: gridEnd.y,
      },
    };
  }

  /**
   * Handle keyboard input
   */
  handleKeyDown(key: string): InputCommand | null {
    switch (key.toLowerCase()) {
      case 'arrowup':
      case 'w':
        return { type: 'rotate', data: { clockwise: true } };
      case 'arrowdown':
      case 's':
        return { type: 'rotate', data: { clockwise: false } };
      case 'arrowleft':
      case 'a':
        return { type: 'move', data: { dx: -1, dy: 0 } };
      case 'arrowright':
      case 'd':
        return { type: 'move', data: { dx: 1, dy: 0 } };
      case 'm':
        return { type: 'mirror' };
      case 'h':
        return { type: 'hint' };
      case 'u':
      case 'z':
        return { type: 'undo' };
      case 'p':
      case ' ':
        return { type: 'pause' };
      case 'enter':
        return { type: 'place' };
      default:
        return null;
    }
  }

  /**
   * Recognize rotation gesture (two-finger rotate)
   */
  recognizeRotation(
    touchId1: number,
    touchId2: number
  ): { angle: number } | null {
    const touch1 = this.touchIds.get(touchId1);
    const touch2 = this.touchIds.get(touchId2);

    if (!touch1 || !touch2) return null;

    const angle = Math.atan2(
      touch2.y - touch1.y,
      touch2.x - touch1.x
    ) * (180 / Math.PI);

    return { angle };
  }

  /**
   * Recognize swipe gesture
   */
  recognizeSwipe(pointerId: number): { direction: string; speed: number } | null {
    const startPoint = this.dragStartPoint;
    const endPoint = this.touchIds.get(pointerId);

    if (!startPoint || !endPoint) return null;

    const dx = endPoint.x - startPoint.x;
    const dy = endPoint.y - startPoint.y;
    const distance = Math.hypot(dx, dy);
    const time = endPoint.timestamp - startPoint.timestamp;
    const speed = distance / time;

    // Determine direction
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    let direction = 'unknown';

    if (angle > -45 && angle < 45) direction = 'right';
    else if (angle >= 45 && angle < 135) direction = 'down';
    else if (angle >= 135 || angle < -135) direction = 'left';
    else if (angle >= -135 && angle < -45) direction = 'up';

    return { direction, speed };
  }

  /**
   * Get pending input commands (batch process)
   */
  getPendingCommands(): InputCommand[] {
    // This would be called each frame to collect all pending input
    // Implementation depends on input queue management
    return [];
  }

  /**
   * Clear input state
   */
  clear(): void {
    this.dragStartPoint = null;
    this.currentDragBlock = null;
    this.touchIds.clear();
  }

  /**
   * Update grid parameters
   */
  setGridSize(width: number, height: number, cellSize: number): void {
    this.gridWidth = width;
    this.gridHeight = height;
    this.cellSize = cellSize;
  }

  /**
   * Clamp position to grid bounds
   */
  clampToGrid(gridX: number, gridY: number): { x: number; y: number } {
    return {
      x: Math.max(0, Math.min(gridX, this.gridWidth - 1)),
      y: Math.max(0, Math.min(gridY, this.gridHeight - 1)),
    };
  }

  /**
   * Check if position is within grid
   */
  isWithinGrid(gridX: number, gridY: number): boolean {
    return gridX >= 0 && gridX < this.gridWidth && gridY >= 0 && gridY < this.gridHeight;
  }

  /**
   * Predict block drop position (preview)
   */
  predictDropPosition(
    block: BlockShape,
    gridX: number,
    gridY: number
  ): { x: number; y: number } {
    // Simple gravity: find lowest position
    let dropY = gridY;

    while (dropY + 1 < this.gridHeight) {
      dropY++;
    }

    return {
      x: Math.max(0, Math.min(gridX, this.gridWidth - 1)),
      y: dropY,
    };
  }

  /**
   * Validate command
   */
  validateCommand(command: InputCommand): boolean {
    if (!command || !command.type) return false;

    switch (command.type) {
      case 'place':
        return command.data && typeof command.data === 'object';
      case 'rotate':
      case 'mirror':
      case 'hint':
      case 'undo':
      case 'pause':
      case 'resume':
        return true;
      case 'move':
        return command.data && typeof command.data === 'object';
      default:
        return false;
    }
  }
}
