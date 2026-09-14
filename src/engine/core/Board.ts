/**
 * Board — manages grid state and cell operations
 * Responsible for grid dimensions, cell queries, and block placement validation
 */

import { Grid, GridDimensions, CellState, PlacedBlock } from '../types/game.types';

export class Board {
  private cells: CellState[][];
  readonly width: number;
  readonly height: number;

  constructor(width: number, height: number, initialCells?: CellState[][]) {
    this.width = width;
    this.height = height;

    if (initialCells) {
      if (initialCells.length !== height || initialCells[0].length !== width) {
        throw new Error(`Initial cells dimensions [${initialCells.length}x${initialCells[0].length}] do not match [${height}x${width}]`);
      }
      this.cells = initialCells.map((row) => [...row]);
    } else {
      this.cells = Array.from({ length: height }, () =>
        Array(width).fill('empty')
      );
    }
  }

  /**
   * Get current grid state
   */
  getGrid(): Grid {
    return {
      cells: this.cells.map((row) => [...row]),
      width: this.width,
      height: this.height,
    };
  }

  /**
   * Get cell state at position
   */
  getCell(x: number, y: number): CellState | null {
    if (!this.isInBounds(x, y)) return null;
    return this.cells[y][x];
  }

  /**
   * Check if position is within bounds
   */
  isInBounds(x: number, y: number): boolean {
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }

  /**
   * Check if cell is placeable (empty and not blocked)
   */
  isPlaceable(x: number, y: number): boolean {
    const cell = this.getCell(x, y);
    return cell === 'empty';
  }

  /**
   * Check if all cells in a list are placeable
   */
  areCellsPlaceable(cells: readonly [number, number][]): boolean {
    return cells.every(([x, y]) => this.isPlaceable(x, y));
  }

  /**
   * Check if a block can be placed at given position
   */
  canPlaceBlock(block: PlacedBlock): boolean {
    return this.areCellsPlaceable(block.cells);
  }

  /**
   * Place block on board
   */
  placeBlock(block: PlacedBlock): void {
    if (!this.canPlaceBlock(block)) {
      throw new Error(`Cannot place block at [${block.x}, ${block.y}]`);
    }

    for (const [x, y] of block.cells) {
      if (this.isInBounds(x, y)) {
        this.cells[y][x] = 'filled';
      }
    }
  }

  /**
   * Remove block from board
   */
  removeBlock(block: PlacedBlock): void {
    for (const [x, y] of block.cells) {
      if (this.isInBounds(x, y) && this.cells[y][x] === 'filled') {
        this.cells[y][x] = 'empty';
      }
    }
  }

  /**
   * Set cell state
   */
  setCellState(x: number, y: number, state: CellState): boolean {
    if (!this.isInBounds(x, y)) return false;
    this.cells[y][x] = state;
    return true;
  }

  /**
   * Set multiple cells
   */
  setCellStates(updates: Array<[number, number, CellState]>): void {
    for (const [x, y, state] of updates) {
      this.setCellState(x, y, state);
    }
  }

  /**
   * Block cells (set as obstacles)
   */
  blockCells(cells: readonly [number, number][]): void {
    for (const [x, y] of cells) {
      this.setCellState(x, y, 'blocked');
    }
  }

  /**
   * Clear specific cells
   */
  clearCells(cells: readonly [number, number][]): void {
    for (const [x, y] of cells) {
      this.setCellState(x, y, 'empty');
    }
  }

  /**
   * Check if row is complete
   */
  isRowComplete(row: number): boolean {
    if (row < 0 || row >= this.height) return false;
    return this.cells[row].every((cell) => cell === 'filled');
  }

  /**
   * Check if column is complete
   */
  isColumnComplete(col: number): boolean {
    if (col < 0 || col >= this.width) return false;
    return this.cells.every((row) => row[col] === 'filled');
  }

  /**
   * Get all complete rows
   */
  getCompleteRows(): number[] {
    const rows: number[] = [];
    for (let y = 0; y < this.height; y++) {
      if (this.isRowComplete(y)) {
        rows.push(y);
      }
    }
    return rows;
  }

  /**
   * Get all complete columns
   */
  getCompleteColumns(): number[] {
    const cols: number[] = [];
    for (let x = 0; x < this.width; x++) {
      if (this.isColumnComplete(x)) {
        cols.push(x);
      }
    }
    return cols;
  }

  /**
   * Get all cells that would be cleared by current placement
   */
  getCellsToClear(): [number, number][] {
    const cells: [number, number][] = [];

    // Collect cells from complete rows
    for (const row of this.getCompleteRows()) {
      for (let x = 0; x < this.width; x++) {
        cells.push([x, row]);
      }
    }

    // Collect cells from complete columns
    for (const col of this.getCompleteColumns()) {
      for (let y = 0; y < this.height; y++) {
        // Avoid duplicates
        if (!cells.some(([x, y_]) => x === col && y_ === y)) {
          cells.push([col, y]);
        }
      }
    }

    return cells;
  }

  /**
   * Get number of lines (rows + columns) that would be cleared
   */
  getLinesClearedCount(): number {
    return this.getCompleteRows().length + this.getCompleteColumns().length;
  }

  /**
   * Clear completed lines
   */
  clearLines(): number {
    const rows = this.getCompleteRows();
    const cols = this.getCompleteColumns();

    const uniqueCells = new Set<string>();

    // Add row cells
    for (const row of rows) {
      for (let x = 0; x < this.width; x++) {
        uniqueCells.add(`${x},${row}`);
      }
    }

    // Add column cells
    for (const col of cols) {
      for (let y = 0; y < this.height; y++) {
        uniqueCells.add(`${col},${y}`);
      }
    }

    // Clear cells
    for (const key of uniqueCells) {
      const [x, y] = key.split(',').map(Number);
      this.cells[y][x] = 'empty';
    }

    return uniqueCells.size;
  }

  /**
   * Count empty cells
   */
  getEmptyCellCount(): number {
    let count = 0;
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (this.cells[y][x] === 'empty') {
          count++;
        }
      }
    }
    return count;
  }

  /**
   * Check if any valid placements remain
   */
  hasValidPlacement(blockShapes: readonly (readonly [number, number][])[]) {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        for (const shape of blockShapes) {
          const block: PlacedBlock = {
            blockId: 'test',
            shapeId: 'test',
            color: '',
            cells: shape.map(([dx, dy]) => [x + dx, y + dy] as [number, number]),
            x,
            y,
            rotations: 0,
            mirrored: false,
          };
          if (this.canPlaceBlock(block)) {
            return true;
          }
        }
      }
    }
    return false;
  }

  /**
   * Reset board (clear all cells)
   */
  reset(): void {
    this.cells = Array.from({ length: this.height }, () =>
      Array(this.width).fill('empty')
    );
  }

  /**
   * Create a copy of this board
   */
  clone(): Board {
    return new Board(this.width, this.height, this.cells);
  }

  /**
   * Get debug string representation
   */
  toString(): string {
    const chars = this.cells.map((row) =>
      row
        .map((cell) => {
          if (cell === 'empty') return '·';
          if (cell === 'filled') return '█';
          if (cell === 'blocked') return '■';
          return '?';
        })
        .join('')
    );
    return chars.join('\n');
  }
}
