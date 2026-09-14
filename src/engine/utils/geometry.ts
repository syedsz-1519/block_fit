/**
 * Geometry utilities — geometric operations and transformations
 * Pure utility functions for coordinate calculations
 */

import { CellOffset } from '../types/game.types';

export class Geometry {
  /**
   * Distance between two points
   */
  static distance(x1: number, y1: number, x2: number, y2: number): number {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Manhattan distance (grid-based)
   */
  static manhattanDistance(x1: number, y1: number, x2: number, y2: number): number {
    return Math.abs(x2 - x1) + Math.abs(y2 - y1);
  }

  /**
   * Check if point is within bounding box
   */
  static pointInBox(
    px: number,
    py: number,
    boxX: number,
    boxY: number,
    boxW: number,
    boxH: number
  ): boolean {
    return px >= boxX && px < boxX + boxW && py >= boxY && py < boxY + boxH;
  }

  /**
   * Check if two boxes overlap
   */
  static boxesOverlap(
    x1: number,
    y1: number,
    w1: number,
    h1: number,
    x2: number,
    y2: number,
    w2: number,
    h2: number
  ): boolean {
    return (
      x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2
    );
  }

  /**
   * Snap point to grid
   */
  static snapToGrid(
    x: number,
    y: number,
    gridSize: number = 1
  ): { x: number; y: number } {
    return {
      x: Math.round(x / gridSize) * gridSize,
      y: Math.round(y / gridSize) * gridSize,
    };
  }

  /**
   * Calculate bounding box for cells
   */
  static getBoundingBox(
    cells: readonly [number, number][]
  ): { minX: number; minY: number; maxX: number; maxY: number; width: number; height: number } {
    if (cells.length === 0) {
      return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
    }

    let minX = cells[0][0];
    let maxX = cells[0][0];
    let minY = cells[0][1];
    let maxY = cells[0][1];

    for (const [x, y] of cells) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }

    return {
      minX,
      minY,
      maxX,
      maxY,
      width: maxX - minX + 1,
      height: maxY - minY + 1,
    };
  }

  /**
   * Get cell offset from position
   */
  static getCellOffsets(
    cells: readonly [number, number][],
    anchorX: number,
    anchorY: number
  ): CellOffset[] {
    return cells.map(([x, y]) => [x - anchorX, y - anchorY] as CellOffset);
  }

  /**
   * Apply offset to cells
   */
  static applyOffset(
    cells: readonly [number, number][],
    dx: number,
    dy: number
  ): [number, number][] {
    return cells.map(([x, y]) => [x + dx, y + dy] as [number, number]);
  }

  /**
   * Center cells around origin
   */
  static centerCells(cells: readonly [number, number][]): [number, number][] {
    const bbox = this.getBoundingBox(cells);
    const centerX = Math.floor(bbox.width / 2);
    const centerY = Math.floor(bbox.height / 2);

    return cells.map(([x, y]) => [
      x - bbox.minX - centerX,
      y - bbox.minY - centerY,
    ] as [number, number]);
  }

  /**
   * Get cells between two points (Bresenham line)
   */
  static getLineBresenham(
    x0: number,
    y0: number,
    x1: number,
    y1: number
  ): [number, number][] {
    const cells: [number, number][] = [];
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;

    let x = x0;
    let y = y0;

    while (true) {
      cells.push([x, y]);

      if (x === x1 && y === y1) break;

      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        x += sx;
      }
      if (e2 < dx) {
        err += dx;
        y += sy;
      }
    }

    return cells;
  }

  /**
   * Get all cells in a circle (Manhattan distance)
   */
  static getCircle(
    cx: number,
    cy: number,
    radius: number
  ): [number, number][] {
    const cells: [number, number][] = [];

    for (let x = cx - radius; x <= cx + radius; x++) {
      for (let y = cy - radius; y <= cy + radius; y++) {
        if (this.manhattanDistance(cx, cy, x, y) <= radius) {
          cells.push([x, y]);
        }
      }
    }

    return cells;
  }

  /**
   * Get all cells in a rectangle
   */
  static getRectangle(
    x: number,
    y: number,
    width: number,
    height: number,
    filled: boolean = true
  ): [number, number][] {
    const cells: [number, number][] = [];

    if (filled) {
      for (let py = y; py < y + height; py++) {
        for (let px = x; px < x + width; px++) {
          cells.push([px, py]);
        }
      }
    } else {
      // Only edges
      for (let px = x; px < x + width; px++) {
        cells.push([px, y]);
        cells.push([px, y + height - 1]);
      }
      for (let py = y + 1; py < y + height - 1; py++) {
        cells.push([x, py]);
        cells.push([x + width - 1, py]);
      }
    }

    return cells;
  }

  /**
   * Reflect cells across vertical axis
   */
  static reflectVertical(cells: readonly [number, number][]): [number, number][] {
    const bbox = this.getBoundingBox(cells);
    return cells.map(([x, y]) => [
      bbox.maxX - (x - bbox.minX),
      y,
    ] as [number, number]);
  }

  /**
   * Reflect cells across horizontal axis
   */
  static reflectHorizontal(cells: readonly [number, number][]): [number, number][] {
    const bbox = this.getBoundingBox(cells);
    return cells.map(([x, y]) => [
      x,
      bbox.maxY - (y - bbox.minY),
    ] as [number, number]);
  }

  /**
   * Rotate cells 90° around center
   */
  static rotateAroundCenter(
    cells: readonly [number, number][],
    clockwise: boolean = true
  ): [number, number][] {
    const bbox = this.getBoundingBox(cells);
    const centerX = bbox.minX + bbox.width / 2;
    const centerY = bbox.minY + bbox.height / 2;

    return cells.map(([x, y]) => {
      const px = x - centerX;
      const py = y - centerY;

      if (clockwise) {
        return [
          centerX + py,
          centerY - px,
        ] as [number, number];
      } else {
        return [
          centerX - py,
          centerY + px,
        ] as [number, number];
      }
    });
  }

  /**
   * Get adjacent cells (4-direction)
   */
  static getAdjacentCells(x: number, y: number): [number, number][] {
    return [
      [x + 1, y],
      [x - 1, y],
      [x, y + 1],
      [x, y - 1],
    ] as [number, number][];
  }

  /**
   * Get adjacent cells (8-direction)
   */
  static getAdjacentCells8(x: number, y: number): [number, number][] {
    return [
      [x + 1, y],
      [x - 1, y],
      [x, y + 1],
      [x, y - 1],
      [x + 1, y + 1],
      [x - 1, y - 1],
      [x + 1, y - 1],
      [x - 1, y + 1],
    ] as [number, number][];
  }

  /**
   * Flood fill connected cells
   */
  static floodFill(
    startCells: readonly [number, number][],
    isValidCell: (x: number, y: number) => boolean,
    maxCells: number = 100
  ): [number, number][] {
    const visited = new Set<string>();
    const toVisit: [number, number][] = [...startCells];
    const result: [number, number][] = [];

    while (toVisit.length > 0 && result.length < maxCells) {
      const [x, y] = toVisit.shift()!;
      const key = `${x},${y}`;

      if (visited.has(key)) continue;
      visited.add(key);

      if (!isValidCell(x, y)) continue;

      result.push([x, y]);

      // Add adjacent cells
      for (const [nx, ny] of this.getAdjacentCells(x, y)) {
        if (!visited.has(`${nx},${ny}`)) {
          toVisit.push([nx, ny]);
        }
      }
    }

    return result;
  }

  /**
   * Check if cells form a connected shape
   */
  static isConnected(cells: readonly [number, number][]): boolean {
    if (cells.length === 0) return true;
    if (cells.length === 1) return true;

    const cellSet = new Set(cells.map((c) => `${c[0]},${c[1]}`));
    const visited = new Set<string>();
    const queue: [number, number][] = [cells[0]];
    let connectedCount = 0;

    while (queue.length > 0) {
      const [x, y] = queue.shift()!;
      const key = `${x},${y}`;

      if (visited.has(key)) continue;
      visited.add(key);
      connectedCount++;

      for (const [nx, ny] of this.getAdjacentCells(x, y)) {
        const nkey = `${nx},${ny}`;
        if (cellSet.has(nkey) && !visited.has(nkey)) {
          queue.push([nx, ny]);
        }
      }
    }

    return connectedCount === cells.length;
  }
}
