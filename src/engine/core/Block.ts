/**
 * Block — manages block shapes and transformations
 * Handles rotation, mirroring, placement validation, and shape operations
 */

import { BlockShape, PlacedBlock, CellOffset } from '../types/game.types';

export class Block {
  /**
   * Normalize block offsets so minimum x,y is 0,0
   */
  static normalizeOffsets(cells: readonly CellOffset[]): CellOffset[] {
    if (cells.length === 0) return [];

    const minX = Math.min(...cells.map((c) => c[0]));
    const minY = Math.min(...cells.map((c) => c[1]));

    return cells.map(([x, y]) => [x - minX, y - minY] as CellOffset);
  }

  /**
   * Rotate block offsets 90° clockwise
   */
  static rotateOffsets(cells: readonly CellOffset[], rotations: number): CellOffset[] {
    let current = [...cells];
    const r = ((rotations % 4) + 4) % 4;

    for (let i = 0; i < r; i++) {
      current = current.map(([x, y]) => [-y, x] as CellOffset);
    }

    return this.normalizeOffsets(current);
  }

  /**
   * Mirror block offsets horizontally
   */
  static mirrorOffsets(cells: readonly CellOffset[], mirrored: boolean): CellOffset[] {
    if (!mirrored) return [...cells];

    const current = cells.map(([x, y]) => [-x, y] as CellOffset);
    return this.normalizeOffsets(current);
  }

  /**
   * Get block offsets with all transformations applied
   */
  static getTransformedOffsets(
    originalOffsets: readonly CellOffset[],
    rotations: number,
    mirrored: boolean
  ): CellOffset[] {
    let offsets = [...originalOffsets];

    // Apply mirror first (before rotation)
    if (mirrored) {
      offsets = this.mirrorOffsets(offsets, true);
    }

    // Then apply rotations
    if (rotations > 0) {
      offsets = this.rotateOffsets(offsets, rotations);
    }

    return offsets;
  }

  /**
   * Get absolute coordinates for placed block
   */
  static getAbsoluteCoordinates(
    x: number,
    y: number,
    offsets: readonly CellOffset[]
  ): [number, number][] {
    return offsets.map(([dx, dy]) => [x + dx, y + dy] as [number, number]);
  }

  /**
   * Calculate bounding box of shape
   */
  static getBoundingBox(
    offsets: readonly CellOffset[]
  ): { width: number; height: number; minX: number; minY: number } {
    if (offsets.length === 0) {
      return { width: 0, height: 0, minX: 0, minY: 0 };
    }

    const xs = offsets.map((c) => c[0]);
    const ys = offsets.map((c) => c[1]);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    const maxX = Math.max(...xs);
    const maxY = Math.max(...ys);

    return {
      minX,
      minY,
      width: maxX - minX + 1,
      height: maxY - minY + 1,
    };
  }

  /**
   * Check if two blocks are equivalent (same shape regardless of rotation/mirror)
   */
  static areEquivalent(shape1: BlockShape, shape2: BlockShape): boolean {
    if (shape1.cells.length !== shape2.cells.length) return false;

    // Normalize and compare
    const normalized1 = this.normalizeOffsets(shape1.cells);
    const normalized2 = this.normalizeOffsets(shape2.cells);

    const set1 = new Set(normalized1.map((c) => `${c[0]},${c[1]}`));
    const set2 = new Set(normalized2.map((c) => `${c[0]},${c[1]}`));

    if (set1.size !== set2.size) return false;

    for (const key of set1) {
      if (!set2.has(key)) return false;
    }

    return true;
  }

  /**
   * Get all rotations of a shape
   */
  static getAllRotations(offsets: readonly CellOffset[]): CellOffset[][] {
    const rotations: CellOffset[][] = [];
    let current = [...offsets];

    for (let i = 0; i < 4; i++) {
      const normalized = this.normalizeOffsets(current);
      rotations.push(normalized);
      current = current.map(([x, y]) => [-y, x] as CellOffset);
    }

    return rotations;
  }

  /**
   * Convert placed block to shape definition
   */
  static toShape(block: PlacedBlock, name?: string): BlockShape {
    const transformed = this.getTransformedOffsets(
      block.cells.map(([x, y]) => [x - block.x, y - block.y] as CellOffset),
      block.rotations,
      block.mirrored
    );

    return {
      id: block.shapeId,
      name: name || block.blockId,
      color: block.color,
      cells: transformed,
    };
  }

  /**
   * Create placed block from shape
   */
  static createPlaced(
    blockId: string,
    shape: BlockShape,
    x: number,
    y: number,
    rotations: number = 0,
    mirrored: boolean = false
  ): PlacedBlock {
    const transformedOffsets = this.getTransformedOffsets(
      shape.cells,
      rotations,
      mirrored
    );

    return {
      blockId,
      shapeId: shape.id,
      color: shape.color,
      cells: Block.getAbsoluteCoordinates(x, y, transformedOffsets),
      x,
      y,
      rotations,
      mirrored,
    };
  }

  /**
   * Rotate placed block
   */
  static rotate(block: PlacedBlock, clockwise: boolean = true): PlacedBlock {
    const newRotations = clockwise
      ? (block.rotations + 1) % 4
      : ((block.rotations - 1) + 4) % 4;

    const newOffsets = this.getTransformedOffsets(
      block.cells.map(([x, y]) => [x - block.x, y - block.y] as CellOffset),
      newRotations,
      block.mirrored
    );

    return {
      ...block,
      rotations: newRotations,
      cells: this.getAbsoluteCoordinates(block.x, block.y, newOffsets),
    };
  }

  /**
   * Mirror placed block
   */
  static mirror(block: PlacedBlock): PlacedBlock {
    const newMirrored = !block.mirrored;

    const newOffsets = this.getTransformedOffsets(
      block.cells.map(([x, y]) => [x - block.x, y - block.y] as CellOffset),
      block.rotations,
      newMirrored
    );

    return {
      ...block,
      mirrored: newMirrored,
      cells: this.getAbsoluteCoordinates(block.x, block.y, newOffsets),
    };
  }

  /**
   * Move placed block
   */
  static move(block: PlacedBlock, dx: number, dy: number): PlacedBlock {
    const newX = block.x + dx;
    const newY = block.y + dy;

    const offsets = this.getTransformedOffsets(
      block.cells.map(([x, y]) => [x - block.x, y - block.y] as CellOffset),
      block.rotations,
      block.mirrored
    );

    return {
      ...block,
      x: newX,
      y: newY,
      cells: this.getAbsoluteCoordinates(newX, newY, offsets),
    };
  }

  /**
   * Check if block would be out of bounds
   */
  static isOutOfBounds(
    block: PlacedBlock,
    gridWidth: number,
    gridHeight: number
  ): boolean {
    return block.cells.some(
      ([x, y]) => x < 0 || x >= gridWidth || y < 0 || y >= gridHeight
    );
  }

  /**
   * Clamp block position to be within bounds
   */
  static clampToBounds(
    block: PlacedBlock,
    gridWidth: number,
    gridHeight: number
  ): PlacedBlock {
    const offsets = this.getTransformedOffsets(
      block.cells.map(([x, y]) => [x - block.x, y - block.y] as CellOffset),
      block.rotations,
      block.mirrored
    );

    const bbox = this.getBoundingBox(offsets);

    let newX = block.x;
    let newY = block.y;

    if (newX + bbox.width > gridWidth) {
      newX = gridWidth - bbox.width;
    }
    if (newX < 0) {
      newX = 0;
    }

    if (newY + bbox.height > gridHeight) {
      newY = gridHeight - bbox.height;
    }
    if (newY < 0) {
      newY = 0;
    }

    if (newX === block.x && newY === block.y) {
      return block;
    }

    return {
      ...block,
      x: newX,
      y: newY,
      cells: this.getAbsoluteCoordinates(newX, newY, offsets),
    };
  }
}
