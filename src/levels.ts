import { LevelConfig, BlockShape } from './types';

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

export const PRESET_LEVELS: LevelConfig[] = [
  {
    id: 1,
    name: "World 1: Beginner",
    gridWidth: 3,
    gridHeight: 3,
    blockedCells: [],
    difficulty: "Easy",
    parMoves: 3,
    parTime: 45,
    availableBlocks: [
      {
        cells: [[0, 0], [1, 0]],
        color: "bg-sage border-b-3 border-[#8ba89a]",
        name: "Domino"
      },
      {
        cells: [[0, 0], [0, 1], [1, 1]],
        color: "bg-coral border-b-3 border-[#c07d72]",
        name: "L-Tromino"
      },
      {
        cells: [[0, 0], [1, 0], [0, 1], [1, 1]],
        color: "bg-mustard border-b-3 border-[#c8a86e]",
        name: "Square-Tetromino"
      }
    ],
    hintSequence: [
      { blockIndex: 0, x: 0, y: 0, rotations: 0, mirrored: false },
      { blockIndex: 1, x: 1, y: 1, rotations: 1, mirrored: false },
      { blockIndex: 2, x: 0, y: 1, rotations: 0, mirrored: false }
    ]
  },
  {
    id: 2,
    name: "World 1: Beginner",
    gridWidth: 4,
    gridHeight: 4,
    blockedCells: [[0, 0], [3, 3]], // Corner obstacles
    difficulty: "Easy",
    parMoves: 4,
    parTime: 60,
    availableBlocks: [
      {
        cells: [[0, 0], [1, 0], [2, 0]],
        color: "bg-teal border-b-3 border-[#71a39f]",
        name: "I-Tromino"
      },
      {
        cells: [[0, 0], [0, 1], [1, 1]],
        color: "bg-coral border-b-3 border-[#c07d72]",
        name: "L-Tromino"
      },
      {
        cells: [[0, 0], [1, 0], [1, 1], [2, 1]],
        color: "bg-lavender border-b-3 border-[#a8a5a1]",
        name: "Z-Tetromino"
      },
      {
        cells: [[0, 0], [1, 0], [1, 1], [0, 1]],
        color: "bg-mustard border-b-3 border-[#c8a86e]",
        name: "Square-Tetromino"
      }
    ],
    hintSequence: [
      { blockIndex: 0, x: 1, y: 0, rotations: 0, mirrored: false },
      { blockIndex: 1, x: 0, y: 1, rotations: 0, mirrored: false },
      { blockIndex: 2, x: 1, y: 2, rotations: 1, mirrored: false },
      { blockIndex: 3, x: 2, y: 1, rotations: 0, mirrored: false }
    ]
  },
  {
    id: 3,
    name: "World 1: Beginner",
    gridWidth: 4,
    gridHeight: 4,
    blockedCells: [[1, 1], [2, 2]],
    difficulty: "Easy",
    parMoves: 4,
    parTime: 70,
    availableBlocks: [
      {
        cells: [[0, 0], [1, 0], [2, 0], [1, 1]],
        color: "bg-sage border-b-3 border-[#8ba89a]",
        name: "T-Tetromino"
      },
      {
        cells: [[0, 0], [1, 0], [2, 0]],
        color: "bg-teal border-b-3 border-[#71a39f]",
        name: "I-Tromino"
      },
      {
        cells: [[0, 0], [0, 1], [1, 1], [2, 1]],
        color: "bg-coral border-b-3 border-[#c07d72]",
        name: "L-Tetromino"
      },
      {
        cells: [[0, 0], [1, 0], [0, 1]],
        color: "bg-lavender border-b-3 border-[#a8a5a1]",
        name: "L-Tromino"
      }
    ],
    hintSequence: [
      { blockIndex: 0, x: 0, y: 0, rotations: 2, mirrored: false },
      { blockIndex: 1, x: 1, y: 3, rotations: 0, mirrored: false },
      { blockIndex: 2, x: 1, y: 0, rotations: 1, mirrored: false },
      { blockIndex: 3, x: 0, y: 2, rotations: 0, mirrored: false }
    ]
  },
  {
    id: 4,
    name: "World 1: Beginner",
    gridWidth: 4,
    gridHeight: 4,
    blockedCells: [],
    difficulty: "Easy",
    parMoves: 4,
    parTime: 80,
    availableBlocks: [
      {
        cells: [[0, 0], [1, 0], [2, 0], [3, 0]],
        color: "bg-teal border-b-3 border-[#71a39f]",
        name: "Long I-Tetromino"
      },
      {
        cells: [[0, 0], [1, 0], [0, 1], [1, 1]],
        color: "bg-mustard border-b-3 border-[#c8a86e]",
        name: "Square-Tetromino"
      },
      {
        cells: [[0, 0], [1, 0], [2, 0], [1, 1]],
        color: "bg-coral border-b-3 border-[#c07d72]",
        name: "T-Tetromino"
      },
      {
        cells: [[0, 0], [1, 0], [1, 1], [2, 1]],
        color: "bg-lavender border-b-3 border-[#a8a5a1]",
        name: "Z-Tetromino"
      }
    ],
    hintSequence: [
      { blockIndex: 0, x: 0, y: 0, rotations: 0, mirrored: false },
      { blockIndex: 1, x: 0, y: 1, rotations: 0, mirrored: false },
      { blockIndex: 2, x: 1, y: 2, rotations: 0, mirrored: false },
      { blockIndex: 3, x: 1, y: 1, rotations: 1, mirrored: false }
    ]
  },
  {
    id: 5,
    name: "World 1: Beginner",
    gridWidth: 4,
    gridHeight: 4,
    blockedCells: [[0, 1], [3, 2]],
    difficulty: "Easy",
    parMoves: 4,
    parTime: 90,
    availableBlocks: [
      {
        cells: [[0, 0], [0, 1], [1, 1], [1, 2]],
        color: "bg-sage border-b-3 border-[#8ba89a]",
        name: "Z-Tetromino"
      },
      {
        cells: [[0, 0], [1, 0], [2, 0], [0, 1]],
        color: "bg-coral border-b-3 border-[#c07d72]",
        name: "J-Tetromino"
      },
      {
        cells: [[0, 0], [1, 0], [2, 0]],
        color: "bg-teal border-b-3 border-[#71a39f]",
        name: "I-Tromino"
      },
      {
        cells: [[0, 0], [0, 1], [1, 1]],
        color: "bg-mustard border-b-3 border-[#c8a86e]",
        name: "L-Tromino"
      }
    ],
    hintSequence: [
      { blockIndex: 0, x: 2, y: 0, rotations: 0, mirrored: false },
      { blockIndex: 1, x: 0, y: 2, rotations: 3, mirrored: false },
      { blockIndex: 2, x: 0, y: 0, rotations: 0, mirrored: false },
      { blockIndex: 3, x: 0, y: 1, rotations: 1, mirrored: false }
    ]
  },
  // World 2: Easy (5x5 Grid)
  {
    id: 6,
    name: "World 2: Easy-Fit",
    gridWidth: 5,
    gridHeight: 5,
    blockedCells: [[2, 2]], // Center blocked
    difficulty: "Medium",
    parMoves: 6,
    parTime: 100,
    availableBlocks: [
      { cells: [[0, 0], [1, 0], [2, 0], [3, 0]], color: "bg-teal border-b-3 border-[#71a39f]", name: "I-Tetromino" },
      { cells: [[0, 0], [1, 0], [2, 0], [0, 1]], color: "bg-coral border-b-3 border-[#c07d72]", name: "L-Tetromino" },
      { cells: [[0, 0], [1, 0], [1, 1], [2, 1]], color: "bg-sage border-b-3 border-[#8ba89a]", name: "Z-Tetromino" },
      { cells: [[0, 0], [1, 0], [0, 1], [1, 1]], color: "bg-mustard border-b-3 border-[#c8a86e]", name: "Square-Tetromino" },
      { cells: [[0, 0], [1, 0], [2, 0], [1, 1]], color: "bg-lavender border-b-3 border-[#a8a5a1]", name: "T-Tetromino" },
      { cells: [[0, 0], [1, 0], [2, 0], [0, 1], [0, 2]], color: "bg-teal border-b-3 border-[#71a39f]", name: "L-Pentomino" }
    ],
    hintSequence: [
      { blockIndex: 0, x: 0, y: 0, rotations: 0, mirrored: false },
      { blockIndex: 1, x: 4, y: 0, rotations: 1, mirrored: false },
      { blockIndex: 2, x: 0, y: 3, rotations: 0, mirrored: false },
      { blockIndex: 3, x: 2, y: 3, rotations: 0, mirrored: false },
      { blockIndex: 4, x: 1, y: 1, rotations: 1, mirrored: false },
      { blockIndex: 5, x: 0, y: 1, rotations: 0, mirrored: false }
    ]
  },
  // Level 16: Matches the exact 6x6 Grid screen in the prompt image!
  {
    id: 16,
    name: "World 3: Geometry Master",
    gridWidth: 6,
    gridHeight: 6,
    blockedCells: [[0, 4], [1, 4], [2, 4], [1, 5]], // Sage & Lavender placements
    difficulty: "Hard",
    parMoves: 8,
    parTime: 120,
    availableBlocks: [
      {
        cells: [[0, 0], [0, 1], [0, 2], [1, 2]],
        color: "bg-[#a8cfbd] border-b-3 border-[#8ba89a]", // Sage
        name: "L-Tetromino"
      },
      {
        cells: [[0, 0], [1, 0], [2, 0], [1, 1]],
        color: "bg-[#c9c6c2] border-b-3 border-[#a8a5a1]", // Lavender
        name: "T-Tetromino"
      },
      {
        cells: [[0, 0], [0, 1], [1, 1], [1, 2], [0, 2]],
        color: "bg-[#e49a8e] border-b-3 border-[#c07d72]", // Coral
        name: "P-Pentomino"
      },
      {
        cells: [[0, 0], [1, 0], [0, 1], [1, 1]],
        color: "bg-[#e6c88e] border-b-3 border-[#c8a86e]", // Mustard
        name: "Square-Tetromino"
      },
      {
        cells: [[0, 0], [1, 0], [2, 0], [3, 0]],
        color: "bg-[#8ec9c4] border-b-3 border-[#71a39f]", // Teal
        name: "I-Tetromino"
      }
    ],
    hintSequence: [
      { blockIndex: 0, x: 4, y: 0, rotations: 0, mirrored: false },
      { blockIndex: 1, x: 0, y: 4, rotations: 0, mirrored: false },
      { blockIndex: 2, x: 1, y: 1, rotations: 0, mirrored: false },
      { blockIndex: 3, x: 0, y: 0, rotations: 0, mirrored: false },
      { blockIndex: 4, x: 3, y: 3, rotations: 1, mirrored: false }
    ]
  }
];

// Add generic levels to complete level count up to 15 + extras
for (let i = 1; i <= 50; i++) {
  if (PRESET_LEVELS.find(l => l.id === i)) continue;
  
  // Dynamically generate standard levels
  const size = i <= 5 ? 4 : i <= 12 ? 5 : 6;
  const numBlocks = i <= 5 ? 4 : i <= 12 ? 5 : 6;
  const blockedCount = Math.floor(Math.random() * 3);
  const blockedCells: [number, number][] = [];
  while (blockedCells.length < blockedCount) {
    const x = Math.floor(Math.random() * size);
    const y = Math.floor(Math.random() * size);
    if (!blockedCells.some(c => c[0] === x && c[1] === y)) {
      blockedCells.push([x, y]);
    }
  }

  // Pre-configured block shapes
  const colors = [
    "bg-sage border-b-3 border-[#8ba89a]",
    "bg-coral border-b-3 border-[#c07d72]",
    "bg-mustard border-b-3 border-[#c8a86e]",
    "bg-teal border-b-3 border-[#71a39f]",
    "bg-lavender border-b-3 border-[#a8a5a1]"
  ];

  const genericShapes: Omit<BlockShape, 'id'>[] = [
    { cells: [[0,0], [1,0], [0,1]], color: colors[0], name: "L-Tromino" },
    { cells: [[0,0], [1,0], [2,0]], color: colors[1], name: "I-Tromino" },
    { cells: [[0,0], [1,0], [0,1], [1,1]], color: colors[2], name: "Square" },
    { cells: [[0,0], [1,0], [2,0], [1,1]], color: colors[3], name: "T-Tetromino" },
    { cells: [[0,0], [0,1], [1,1], [2,1]], color: colors[4], name: "L-Tetromino" },
    { cells: [[0,0], [1,0], [1,1], [2,1]], color: colors[0], name: "Z-Tetromino" }
  ];

  const levelBlocks = genericShapes.slice(0, numBlocks);

  PRESET_LEVELS.push({
    id: i,
    name: i <= 5 ? "World 1: Beginner" : i <= 12 ? "World 2: Challenger" : "World 3: Guru",
    gridWidth: size,
    gridHeight: size,
    blockedCells,
    difficulty: i <= 5 ? "Easy" : i <= 12 ? "Medium" : "Hard",
    parMoves: numBlocks + 2,
    parTime: 60 + size * 15,
    availableBlocks: levelBlocks,
    hintSequence: levelBlocks.map((b, idx) => ({
      blockIndex: idx,
      x: idx % (size - 1),
      y: Math.floor(idx / (size - 1)),
      rotations: idx % 4,
      mirrored: idx % 2 === 0
    }))
  });
}

// Sort presets by level id
PRESET_LEVELS.sort((a, b) => a.id - b.id);
