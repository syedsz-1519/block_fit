// Shared Daily Challenge generation + solution validation logic.
// Extracted from server.ts so it can be imported by BOTH:
//   - server.ts (local dev / Cloud Run style persistent server)
//   - api/daily-challenge/*.ts (Vercel serverless functions)
// This is deterministic (seeded by date string), so it never needs to be
// cached/stored in memory — calling it twice with the same date always
// produces the identical layout.

export interface GeneratedBlock {
  cells: number[][];
  color: string;
  name: string;
}

export interface DailyChallengeLevel {
  id: number;
  name: string;
  gridWidth: number;
  gridHeight: number;
  blockedCells: number[][];
  availableBlocks: GeneratedBlock[];
  parMoves: number;
  parTime: number;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Expert' | 'Master';
  hintSequence: { blockIndex: number; x: number; y: number; rotations: number; mirrored: boolean }[];
}

export interface LeaderboardEntry {
  username: string;
  levelId: number;
  stars: number;
  moves: number;
  time: number;
  timestamp: string;
}

/**
 * Minimal shape expected from the client when validating a submitted solution.
 * Only the fields actually checked server-side need to be present.
 */
export interface PlacedBlockSubmission {
  blockId: string;
  cells: [number, number][];
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

export function normalizeOffsets(cells: number[][]): number[][] {
  const minX = Math.min(...cells.map((c) => c[0]));
  const minY = Math.min(...cells.map((c) => c[1]));
  return cells.map((c) => [c[0] - minX, c[1] - minY]);
}

export function rotateOffsets(cells: number[][], rotations: number): number[][] {
  let current = [...cells];
  const r = ((rotations % 4) + 4) % 4;
  for (let i = 0; i < r; i++) {
    current = current.map(([cx, cy]) => [-cy, cx]);
  }
  return normalizeOffsets(current);
}

export function mirrorOffsets(cells: number[][], mirrored: boolean): number[][] {
  if (!mirrored) return cells;
  const current = cells.map(([cx, cy]) => [-cx, cy]);
  return normalizeOffsets(current);
}

export function generateDailyChallenge(dateStr: string): DailyChallengeLevel {
  const rng = seededRandom(dateStr);
  const sizeChoice = rng();

  let activeWidth = 4;
  let activeHeight = 4;
  let difficulty: DailyChallengeLevel['difficulty'] = 'Medium';

  if (sizeChoice < 0.33) {
    activeWidth = 4;
    activeHeight = 4;
    difficulty = 'Easy';
  } else if (sizeChoice < 0.66) {
    activeWidth = 5;
    activeHeight = 5;
    difficulty = 'Medium';
  } else {
    activeWidth = 6;
    activeHeight = 6;
    difficulty = 'Hard';
  }

  const gridWidth = activeWidth;
  const gridHeight = activeHeight;

  const blockedCells: number[][] = [];
  const assigned = Array.from({ length: gridHeight }, () => Array(gridWidth).fill(false));

  const blockedCount = Math.floor(rng() * 3);
  for (let i = 0; i < blockedCount; i++) {
    const rx = Math.floor(rng() * gridWidth);
    const ry = Math.floor(rng() * gridHeight);
    if (!assigned[ry][rx]) {
      assigned[ry][rx] = true;
      blockedCells.push([rx, ry]);
    }
  }

  const colors = [
    'bg-sage border-b-3 border-sage-dark shadow-sm',
    'bg-coral border-b-3 border-coral-dark shadow-sm',
    'bg-mustard border-b-3 border-mustard-dark shadow-sm',
    'bg-teal border-b-3 border-teal-dark shadow-sm',
    'bg-lavender border-b-3 border-lavender-dark shadow-sm',
    'bg-[#5c6ac4] border-b-3 border-[#3f4eae] shadow-sm',
    'bg-[#ec4899] border-b-3 border-[#be185d] shadow-sm',
    'bg-[#10b981] border-b-3 border-[#047857] shadow-sm',
    'bg-[#f59e0b] border-b-3 border-[#b45309] shadow-sm',
    'bg-[#0ea5e9] border-b-3 border-[#0369a1] shadow-sm',
    'bg-[#8b5cf6] border-b-3 border-[#6d28d9] shadow-sm',
  ];

  const blockNames = ['Mono', 'Domino', 'Tromino', 'Tetromino', 'Pentomino'];

  const availableBlocks: GeneratedBlock[] = [];
  const hintSequence: DailyChallengeLevel['hintSequence'] = [];
  let blockCounter = 0;

  for (let y = 0; y < gridHeight; y++) {
    for (let x = 0; x < gridWidth; x++) {
      if (assigned[y][x]) continue;

      const blockCells: [number, number][] = [[x, y]];
      assigned[y][x] = true;

      const targetSize = Math.floor(rng() * 4) + 2;

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

  const parMoves = shuffledBlocks.length;
  const parTime = shuffledBlocks.length * 20;

  return {
    id: 9999,
    name: `Daily Challenge - ${dateStr}`,
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

// Deterministic "bot" scores for a given date — recomputed on every call
// (cheap, pure function), so no in-memory cache is needed anymore.
export function getDailyBotScores(dateStr: string): LeaderboardEntry[] {
  const rng = seededRandom(dateStr + '-competitors');
  const botNames = ['ZenSlicer', 'GridRider', 'Tessellator', 'Symmetric', 'ShapeShifter', 'HexaGuru'];
  const shuffledBots = [...botNames].sort(() => rng() - 0.5);
  const level = generateDailyChallenge(dateStr);
  const botScores: LeaderboardEntry[] = [];

  for (let i = 0; i < 3; i++) {
    const botName = shuffledBots[i];
    const moves = level.parMoves + Math.floor(rng() * 3);
    const time = level.parTime - 15 + Math.floor(rng() * 30);
    const stars = moves <= level.parMoves ? 3 : moves <= level.parMoves + 2 ? 2 : 1;

    botScores.push({
      username: botName,
      levelId: 9999,
      stars,
      moves,
      time: Math.max(5, time),
      timestamp: new Date().toISOString(),
    });
  }

  return botScores.sort((a, b) => {
    if (b.stars !== a.stars) return b.stars - a.stars;
    if (a.moves !== b.moves) return a.moves - b.moves;
    return a.time - b.time;
  });
}

export function validateSolution(level: DailyChallengeLevel, placedBlocks: PlacedBlockSubmission[]): boolean {
  if (placedBlocks.length !== level.availableBlocks.length) {
    return false;
  }

  const occupied = Array.from({ length: level.gridHeight }, () => Array<boolean>(level.gridWidth).fill(false));

  for (const [bx, by] of level.blockedCells) {
    if (bx >= 0 && bx < level.gridWidth && by >= 0 && by < level.gridHeight) {
      occupied[by][bx] = true;
    }
  }

  for (const pb of placedBlocks) {
    const match = pb.blockId.match(/block_(\d+)/);
    if (!match) return false;
    const blockIndex = parseInt(match[1], 10);
    if (isNaN(blockIndex) || blockIndex < 0 || blockIndex >= level.availableBlocks.length) {
      return false;
    }

    const originalBlock = level.availableBlocks[blockIndex];

    for (const [cx, cy] of pb.cells) {
      if (cx < 0 || cx >= level.gridWidth || cy < 0 || cy >= level.gridHeight) {
        return false;
      }
      if (occupied[cy][cx]) {
        return false;
      }
      occupied[cy][cx] = true;
    }

    const minX = Math.min(...pb.cells.map((c) => c[0]));
    const minY = Math.min(...pb.cells.map((c) => c[1]));
    const relativePlaced = pb.cells.map(([cx, cy]) => [cx - minX, cy - minY]);

    let isValidTransformation = false;
    for (let rot = 0; rot < 4; rot++) {
      for (const mir of [false, true]) {
        let trans = rotateOffsets(originalBlock.cells, rot);
        trans = mirrorOffsets(trans, mir);

        if (trans.length === relativePlaced.length) {
          const matchCount = trans.filter(([tx, ty]) => relativePlaced.some(([px, py]) => px === tx && py === ty)).length;
          if (matchCount === trans.length) {
            isValidTransformation = true;
            break;
          }
        }
      }
      if (isValidTransformation) break;
    }

    if (!isValidTransformation) {
      return false;
    }
  }

  for (let r = 0; r < level.gridHeight; r++) {
    for (let c = 0; c < level.gridWidth; c++) {
      if (!occupied[r][c]) {
        return false;
      }
    }
  }

  return true;
}
