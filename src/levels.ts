import { LevelConfig } from './types';

// Helper to normalize coordinates so they start at 0,0
export function normalizeOffsets(cells: number[][]): number[][] {
  const minX = Math.min(...cells.map(c => c[0]));
  const minY = Math.min(...cells.map(c => c[1]));
  return cells.map(c => [c[0] - minX, c[1] - minY]);
}

// Rotates offsets 90 deg clockwise
export function rotateOffsets(cells: number[][], rotations: number): number[][] {
  let current = [...cells];
  const r = ((rotations % 4) + 4) % 4;
  for (let i = 0; i < r; i++) {
    current = current.map(([cx, cy]) => [-cy, cx]);
  }
  return normalizeOffsets(current);
}

// Mirrors offsets horizontally
export function mirrorOffsets(cells: number[][], mirrored: boolean): number[][] {
  if (!mirrored) return cells;
  const current = cells.map(([cx, cy]) => [-cx, cy]);
  return normalizeOffsets(current);
}

export function seededRandom(seedStr: string) {
  let h = 1779033703 ^ seedStr.length;
  for (let i = 0; i < seedStr.length; i++) {
    h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let seed = h >>> 0;
  return function () {
    seed = (Math.imul(seed ^ 12345, 1103515245) + 12345) >>> 0;
    return (seed & 0x3fffffff) / 0x40000000;
  };
}

export function generatePresetLevel(id: number): LevelConfig {
  const rng = seededRandom("level-preset-" + id);
  const isHard = id % 4 === 0;

  // Determine grid size based on level ID & difficulty progression
  let size = 4;
  if (id <= 3) {
    size = 3;
  } else if (id === 4) {
    size = 4; // Hard level
  } else if (id <= 7) {
    size = 4;
  } else if (id === 8) {
    size = 5; // Hard level
  } else if (id <= 10) {
    size = 4;
  } else if (id <= 11) {
    size = 5;
  } else if (id === 12) {
    size = 6; // Hard level
  } else if (id <= 15) {
    size = 5;
  } else if (id === 16) {
    size = 6; // Hard level
  } else if (id <= 19) {
    size = 5;
  } else if (id === 20) {
    size = 6; // Hard level
  } else if (id <= 23) {
    size = 5;
  } else if (id === 24) {
    size = 6; // Hard level
  } else if (id <= 27) {
    size = 6;
  } else if (id === 28) {
    size = 7; // Hard level
  } else if (id <= 31) {
    size = 6;
  } else if (id === 32) {
    size = 7; // Hard level
  } else if (id <= 35) {
    size = 6;
  } else if (id === 36) {
    size = 7; // Hard level
  } else if (id <= 39) {
    size = 6;
  } else if (id === 40) {
    size = 7; // Hard level
  } else if (id <= 43) {
    size = 6;
  } else if (id === 44) {
    size = 7; // Hard level
  } else if (id <= 47) {
    size = 6;
  } else if (id === 48) {
    size = 7; // Hard level
  } else {
    size = 7;
  }

  const gridWidth = size;
  const gridHeight = size;

  // Premium colors matching UI specification
  const colors = [
    "bg-sage border-b-3 border-sage-dark shadow-sm",
    "bg-coral border-b-3 border-coral-dark shadow-sm",
    "bg-mustard border-b-3 border-mustard-dark shadow-sm",
    "bg-teal border-b-3 border-teal-dark shadow-sm",
    "bg-lavender border-b-3 border-lavender-dark shadow-sm",
    "bg-[#5c6ac4] border-b-3 border-[#3f4eae] shadow-sm",
    "bg-[#ec4899] border-b-3 border-[#be185d] shadow-sm",
    "bg-[#10b981] border-b-3 border-[#047857] shadow-sm",
    "bg-[#f59e0b] border-b-3 border-[#b45309] shadow-sm",
    "bg-[#0ea5e9] border-b-3 border-[#0369a1] shadow-sm",
    "bg-[#8b5cf6] border-b-3 border-[#6d28d9] shadow-sm",
  ];

  const blockNames = ['Mono', 'Domino', 'Tromino', 'Tetromino', 'Pentomino'];

  // Add random internal blocked obstacle cells (if grid size is large enough)
  let blockedCount = 0;
  if (size === 4) blockedCount = Math.floor(rng() * 2); // 0 or 1
  else if (size === 5) blockedCount = Math.floor(rng() * 2) + 1; // 1 or 2
  else if (size === 6) blockedCount = Math.floor(rng() * 3) + 1; // 1 to 3
  else if (size === 7) blockedCount = Math.floor(rng() * 4) + 1; // 1 to 4

  const blockedCells: number[][] = [];
  const assigned = Array.from({ length: gridHeight }, () => Array(gridWidth).fill(false));

  let placedBlocked = 0;
  for (let attempt = 0; attempt < 15 && placedBlocked < blockedCount; attempt++) {
    const rx = Math.floor(rng() * gridWidth);
    const ry = Math.floor(rng() * gridHeight);
    if (!assigned[ry][rx]) {
      assigned[ry][rx] = true;
      blockedCells.push([rx, ry]);
      placedBlocked++;
    }
  }

  const availableBlocks: any[] = [];
  const hintSequence: any[] = [];
  let blockCounter = 0;

  for (let y = 0; y < gridHeight; y++) {
    for (let x = 0; x < gridWidth; x++) {
      if (assigned[y][x]) continue;

      const blockCells: [number, number][] = [[x, y]];
      assigned[y][x] = true;

      // Determine size of block to grow
      const targetSize = Math.floor(rng() * 3) + 2; // Trominos (3) to Pentominos (5)

      const queue: [number, number][] = [[x, y]];
      while (queue.length > 0 && blockCells.length < targetSize) {
        const [cx, cy] = queue.shift()!;
        const neighbors: [number, number][] = [
          [cx + 1, cy],
          [cx - 1, cy],
          [cx, cy + 1],
          [cx, cy - 1],
        ].sort(() => rng() - 0.5) as [number, number][];

        for (const [nx, ny] of neighbors) {
          if (nx >= 0 && nx < gridWidth && ny >= 0 && ny < gridHeight) {
            if (!assigned[ny][nx] && blockCells.length < targetSize) {
              assigned[ny][nx] = true;
              blockCells.push([nx, ny]);
              queue.push([nx, ny]);
            }
          }
        }
      }

      const minX = Math.min(...blockCells.map((c) => c[0]));
      const minY = Math.min(...blockCells.map((c) => c[1]));
      const relativeCells = blockCells.map(([bx, by]) => [bx - minX, by - minY]);

      const color = colors[blockCounter % colors.length];
      const name = `${blockNames[Math.min(blockCells.length - 1, 4)]}-${blockCounter + 1}`;

      availableBlocks.push({ cells: relativeCells, color, name });
      hintSequence.push({ blockIndex: blockCounter, x: minX, y: minY, rotations: 0, mirrored: false });

      blockCounter++;
    }
  }

  // Shuffle blocks to make it a puzzle
  const blockIndices = Array.from({ length: availableBlocks.length }, (_, i) => i);
  for (let i = blockIndices.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const temp = blockIndices[i];
    blockIndices[i] = blockIndices[j];
    blockIndices[j] = temp;
  }

  const shuffledBlocks = blockIndices.map((idx) => availableBlocks[idx]);
  const shuffledHints = blockIndices
    .map((originalIdx, newIdx) => {
      const originalHint = hintSequence.find((h) => h.blockIndex === originalIdx)!;
      return { blockIndex: newIdx, x: originalHint.x, y: originalHint.y, rotations: originalHint.rotations, mirrored: originalHint.mirrored };
    })
    .sort((a, b) => a.blockIndex - b.blockIndex);

  let difficulty: LevelConfig['difficulty'] = 'Medium';
  if (isHard) {
    difficulty = 'Hard';
  } else if (id <= 15) {
    difficulty = 'Easy';
  } else if (id <= 30) {
    difficulty = 'Medium';
  } else {
    difficulty = 'Hard';
  }

  const worldName =
    id <= 10 ? "World 1: Beginner" :
    id <= 20 ? "World 2: Intermediate" :
    id <= 30 ? "World 3: Advanced" :
    id <= 40 ? "World 4: Expert" :
    "World 5: Master";

  const parMoves = shuffledBlocks.length;
  const parTime = Math.max(30, shuffledBlocks.length * 15 + size * 5);

  return {
    id,
    name: worldName,
    gridWidth,
    gridHeight,
    blockedCells,
    availableBlocks: shuffledBlocks,
    parMoves,
    parTime,
    difficulty,
    hintSequence: shuffledHints,
  };
}

export const PRESET_LEVELS: LevelConfig[] = Array.from({ length: 50 }, (_, i) => generatePresetLevel(i + 1));
