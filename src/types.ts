export type CellState = 'empty' | 'filled' | 'blocked';

export interface BlockShape {
  id: string;
  // Cell offsets relative to the anchor cell (0,0)
  cells: number[][];
  color: string; // Tailwind class color or hex
  name: string;
  cellColors?: string[]; // SudokuColors matching cells
  originalCells?: number[][];
}

export interface PlacedBlock {
  blockId: string;
  shapeId: string;
  name?: string; // display name — optional for backwards compat
  color: string;
  cells: number[][]; // actual grid coordinates
  x: number; // grid column anchor
  y: number; // grid row anchor
  rotations: number;
  mirrored: boolean;
  cellColors?: string[]; // SudokuColors matching cells
  originalCells?: number[][];
}

export interface LevelConfig {
  id: number;
  name: string;
  gridWidth: number;
  gridHeight: number;
  blockedCells: number[][]; // coordinates that are blocked (e.g. gray obstacles)
  availableBlocks: Omit<BlockShape, 'id'>[]; // shapes to be placed
  parMoves: number;
  parTime: number; // in seconds
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Expert' | 'Master';
  hintSequence?: { blockIndex: number; x: number; y: number; rotations: number; mirrored: boolean }[]; // Predefined solution coordinates for hints
}

export interface PlayerProfile {
  levelProgress: { [levelId: number]: { stars: number; moves: number; time: number; completed: boolean } };
  currentLevel: number;
  hintsRemaining: number;
  isSubscribed: boolean;
  theme: 'light' | 'dark' | 'neon' | 'sunset' | 'retro';
  soundEnabled: boolean;
  musicEnabled?: boolean;
  soundscape?: 'zen' | 'cosmic' | 'nature';
  colorblindMode?: boolean;
  hapticEnabled?: boolean;
  difficultySetting?: 'Easy' | 'Medium' | 'Hard';
  syncCode?: string;
  userId?: string;
  username: string;
}

export interface LeaderboardEntry {
  username: string;
  levelId: number;
  stars: number;
  moves: number;
  time: number;
  timestamp: string;
}
