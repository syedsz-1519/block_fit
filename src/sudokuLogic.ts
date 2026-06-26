export enum SudokuColor {
  Red = 'Red',
  Blue = 'Blue',
  Green = 'Green',
  Yellow = 'Yellow',
  Purple = 'Purple',
  Orange = 'Orange'
}

export type SudokuCellState = 'empty' | 'fixed' | 'placed' | 'invalid';

export const SUDOKU_COLOR_MAP: Record<SudokuColor, string> = {
  [SudokuColor.Red]: '#E84C3D',
  [SudokuColor.Blue]: '#4A90D9',
  [SudokuColor.Green]: '#2ECC71',
  [SudokuColor.Yellow]: '#F1C40F',
  [SudokuColor.Purple]: '#9B59B6',
  [SudokuColor.Orange]: '#E67E22'
};

// Light versions for empty/unfilled cells when showing color hints
export const SUDOKU_COLOR_HINTS_MAP: Record<SudokuColor, string> = {
  [SudokuColor.Red]: 'rgba(232, 76, 61, 0.15)',
  [SudokuColor.Blue]: 'rgba(74, 144, 217, 0.15)',
  [SudokuColor.Green]: 'rgba(46, 204, 113, 0.15)',
  [SudokuColor.Yellow]: 'rgba(241, 196, 15, 0.15)',
  [SudokuColor.Purple]: 'rgba(155, 89, 182, 0.15)',
  [SudokuColor.Orange]: 'rgba(230, 126, 34, 0.15)'
};

export interface ColorBlockShape {
  id: string;
  cells: number[][]; // Each cell coordinate [x, y]
  cellColors: SudokuColor[]; // Corresponding color for each cell
  name: string;
}

export class SudokuGridData {
  public static readonly GRID_SIZE = 6;
  public static readonly REGION_WIDTH = 2;
  public static readonly REGION_HEIGHT = 3;

  public solutionGrid: (SudokuColor | null)[][];
  public cellStates: SudokuCellState[][];
  public playerGrid: (SudokuColor | null)[][];

  constructor() {
    this.solutionGrid = Array.from({ length: 6 }, () => Array(6).fill(null));
    this.cellStates = Array.from({ length: 6 }, () => Array(6).fill('empty'));
    this.playerGrid = Array.from({ length: 6 }, () => Array(6).fill(null));
  }

  // Helper bounds checker
  public IsInBounds(x: number, y: number): boolean {
    return x >= 0 && x < 6 && y >= 0 && y < 6;
  }

  // Clone grid data
  public clone(): SudokuGridData {
    const next = new SudokuGridData();
    next.solutionGrid = this.solutionGrid.map(row => [...row]);
    next.cellStates = this.cellStates.map(row => [...row]);
    next.playerGrid = this.playerGrid.map(row => [...row]);
    return next;
  }

  public IsValidPlacement(x: number, y: number, color: SudokuColor): boolean {
    if (!this.IsInBounds(x, y)) return false;

    // Check row constraint (same row y, different col x)
    for (let col = 0; col < 6; col++) {
      if (col !== x && this.playerGrid[y][col] === color) {
        return false;
      }
    }

    // Check column constraint (same col x, different row y)
    for (let r = 0; r < 6; r++) {
      if (r !== y && this.playerGrid[r][x] === color) {
        return false;
      }
    }

    // Check 2x3 region constraint
    const regionIndex = this.GetRegionIndex(x, y);
    const { startX, startY } = this.GetRegionStart(regionIndex);
    for (let r = startY; r < startY + 3; r++) {
      for (let col = startX; col < startX + 2; col++) {
        if ((col !== x || r !== y) && this.playerGrid[r][col] === color) {
          return false;
        }
      }
    }

    return true;
  }

  public IsRowComplete(row: number): boolean {
    const colors = new Set<SudokuColor>();
    for (let col = 0; col < 6; col++) {
      const c = this.playerGrid[row][col];
      if (c === null) return false;
      colors.add(c);
    }
    return colors.size === 6;
  }

  public IsColumnComplete(col: number): boolean {
    const colors = new Set<SudokuColor>();
    for (let row = 0; row < 6; row++) {
      const c = this.playerGrid[row][col];
      if (c === null) return false;
      colors.add(c);
    }
    return colors.size === 6;
  }

  public IsRegionComplete(regionIndex: number): boolean {
    const { startX, startY } = this.GetRegionStart(regionIndex);
    const colors = new Set<SudokuColor>();
    for (let y = startY; y < startY + 3; y++) {
      for (let x = startX; x < startX + 2; x++) {
        const c = this.playerGrid[y][x];
        if (c === null) return false;
        colors.add(c);
      }
    }
    return colors.size === 6;
  }

  public IsGridComplete(): boolean {
    // Check if everything is filled and valid
    for (let r = 0; r < 6; r++) {
      if (!this.IsRowComplete(r)) return false;
    }
    for (let c = 0; c < 6; c++) {
      if (!this.IsColumnComplete(c)) return false;
    }
    for (let reg = 0; reg < 6; reg++) {
      if (!this.IsRegionComplete(reg)) return false;
    }
    return true;
  }

  public GetRegionIndex(x: number, y: number): number {
    return Math.floor(y / 3) * 3 + Math.floor(x / 2);
  }

  public GetRegionStart(regionIndex: number): { startX: number; startY: number } {
    const regY = Math.floor(regionIndex / 3);
    const regX = regionIndex % 3;
    return { startX: regX * 2, startY: regY * 3 };
  }

  public GenerateValidSolution(): void {
    // Clear first
    this.solutionGrid = Array.from({ length: 6 }, () => Array(6).fill(null));
    this.SolveBacktracking(0, 0);
  }

  private SolveBacktracking(x: number, y: number): boolean {
    if (y === 6) return true;
    
    let nextX = x + 1;
    let nextY = y;
    if (nextX >= 6) {
      nextX = 0;
      nextY = y + 1;
    }

    const colors: SudokuColor[] = Object.values(SudokuColor);
    
    // Shuffle colors to get randomized grids
    for (let i = colors.length - 1; i > 0; i--) {
      const r = Math.floor(Math.random() * (i + 1));
      const temp = colors[i];
      colors[i] = colors[r];
      colors[r] = temp;
    }

    for (const color of colors) {
      if (this.IsValidInSolutionGrid(x, y, color)) {
        this.solutionGrid[y][x] = color;
        if (this.SolveBacktracking(nextX, nextY)) {
          return true;
        }
        this.solutionGrid[y][x] = null;
      }
    }

    return false;
  }

  private IsValidInSolutionGrid(x: number, y: number, color: SudokuColor): boolean {
    // Check row
    for (let col = 0; col < 6; col++) {
      if (col !== x && this.solutionGrid[y][col] === color) return false;
    }
    // Check col
    for (let row = 0; row < 6; row++) {
      if (row !== y && this.solutionGrid[row][x] === color) return false;
    }
    // Check region
    const regionIndex = this.GetRegionIndex(x, y);
    const { startX, startY } = this.GetRegionStart(regionIndex);
    for (let r = startY; r < startY + 3; r++) {
      for (let col = startX; col < startX + 2; col++) {
        if ((col !== x || r !== y) && this.solutionGrid[r][col] === color) return false;
      }
    }
    return true;
  }

  public SetDifficulty(diff: 'Easy' | 'Medium' | 'Hard' | 'Expert'): void {
    this.GenerateValidSolution();

    let keepCount = 20;
    switch (diff) {
      case 'Easy': keepCount = 20; break;
      case 'Medium': keepCount = 14; break;
      case 'Hard': keepCount = 8; break;
      case 'Expert': keepCount = 4; break;
    }

    this.playerGrid = Array.from({ length: 6 }, () => Array(6).fill(null));
    this.cellStates = Array.from({ length: 6 }, () => Array(6).fill('empty'));

    // Select random positions to keep
    const cells: { x: number; y: number }[] = [];
    for (let y = 0; y < 6; y++) {
      for (let x = 0; x < 6; x++) {
        cells.push({ x, y });
      }
    }

    // Shuffle cells
    for (let i = cells.length - 1; i > 0; i--) {
      const r = Math.floor(Math.random() * (i + 1));
      const temp = cells[i];
      cells[i] = cells[r];
      cells[r] = temp;
    }

    for (let i = 0; i < keepCount; i++) {
      const cell = cells[i];
      const color = this.solutionGrid[cell.y][cell.x];
      this.playerGrid[cell.y][cell.x] = color;
      this.cellStates[cell.y][cell.x] = 'fixed';
    }
  }
}

export interface SudokuValidationError {
  type: 'OutOfBounds' | 'Overlap' | 'SudokuConflict';
  x: number;
  y: number;
  color?: SudokuColor;
}

export class SudokuValidationResult {
  public isValid: boolean = true;
  public errors: SudokuValidationError[] = [];

  public addError(type: 'OutOfBounds' | 'Overlap' | 'SudokuConflict', x: number, y: number, color?: SudokuColor) {
    this.isValid = false;
    this.errors.push({ type, x, y, color });
  }
}

export class SudokuValidator {
  public static ValidateDrag(
    block: ColorBlockShape,
    originX: number,
    originY: number,
    grid: SudokuGridData
  ): SudokuValidationResult {
    const result = new SudokuValidationResult();

    for (let i = 0; i < block.cells.length; i++) {
      const [ox, oy] = block.cells[i];
      const targetX = originX + ox;
      const targetY = originY + oy;

      // Check bounds
      if (!grid.IsInBounds(targetX, targetY)) {
        result.addError('OutOfBounds', targetX, targetY);
        continue;
      }

      // Check overlap
      const state = grid.cellStates[targetY][targetX];
      if (state === 'placed' || state === 'fixed') {
        result.addError('Overlap', targetX, targetY);
        continue;
      }

      // Check Sudoku color constraint
      const blockColor = block.cellColors[i];
      if (!grid.IsValidPlacement(targetX, targetY, blockColor)) {
        result.addError('SudokuConflict', targetX, targetY, blockColor);
      }
    }

    return result;
  }
}
