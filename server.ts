import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import signupHandler from "./api/auth/signup";
import loginHandler from "./api/auth/login";
import saveProfileHandler from "./api/auth/save-profile";
import loadProfileHandler from "./api/auth/load-profile";

interface LeaderboardEntry {
  username: string;
  levelId: number;
  stars: number;
  moves: number;
  time: number;
  timestamp: string;
}

interface PlayerProfile {
  levelProgress: any;
  currentLevel: number;
  hintsRemaining: number;
  isSubscribed: boolean;
  theme: string;
  soundEnabled: boolean;
  username: string;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // In-memory databases
  const leaderboard: LeaderboardEntry[] = [
    // Preseed some friendly competitive scores
    { username: "PuzzleZen", levelId: 1, stars: 3, moves: 3, time: 8, timestamp: new Date().toISOString() },
    { username: "BlockMaster", levelId: 1, stars: 3, moves: 3, time: 11, timestamp: new Date().toISOString() },
    { username: "Symmetric", levelId: 1, stars: 3, moves: 3, time: 15, timestamp: new Date().toISOString() },
    { username: "Tessellator", levelId: 16, stars: 3, moves: 8, time: 42, timestamp: new Date().toISOString() },
    { username: "CalmMind", levelId: 16, stars: 3, moves: 9, time: 54, timestamp: new Date().toISOString() }
  ];

  const speedrunLeaderboard: LeaderboardEntry[] = [
    // Preseed speedrun competitive scores
    { username: "FlashGrid", levelId: 1, stars: 3, moves: 3, time: 4, timestamp: new Date().toISOString() },
    { username: "SpeedySymmetry", levelId: 1, stars: 3, moves: 3, time: 6, timestamp: new Date().toISOString() },
    { username: "LightningMind", levelId: 1, stars: 3, moves: 3, time: 8, timestamp: new Date().toISOString() },
    { username: "SonicPuzzle", levelId: 2, stars: 3, moves: 4, time: 9, timestamp: new Date().toISOString() },
    { username: "FlashGrid", levelId: 16, stars: 3, moves: 9, time: 19, timestamp: new Date().toISOString() },
    { username: "QuickFit", levelId: 16, stars: 3, moves: 10, time: 24, timestamp: new Date().toISOString() }
  ];

  const syncProfiles = new Map<string, PlayerProfile>();

  // Helper to generate 6-letter uppercase codes
  function generateSyncCode(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // No easily confused characters like I, O, 0, 1
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  // --- Daily Challenge Helpers & In-Memory Storage ---
  const dailyLeaderboards = new Map<string, LeaderboardEntry[]>();

  function seededRandom(seedStr: string) {
    let h = 1779033703 ^ seedStr.length;
    for (let i = 0; i < seedStr.length; i++) {
      h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353);
      h = h << 13 | h >>> 19;
    }
    let seed = (h >>> 0);
    return function() {
      seed = (Math.imul(seed ^ 12345, 1103515245) + 12345) >>> 0;
      return (seed & 0x3fffffff) / 0x40000000;
    };
  }

  function normalizeOffsets(cells: number[][]): number[][] {
    const minX = Math.min(...cells.map(c => c[0]));
    const minY = Math.min(...cells.map(c => c[1]));
    return cells.map(c => [c[0] - minX, c[1] - minY]);
  }

  function rotateOffsets(cells: number[][], rotations: number): number[][] {
    let current = [...cells];
    const r = ((rotations % 4) + 4) % 4;
    for (let i = 0; i < r; i++) {
      current = current.map(([cx, cy]) => [-cy, cx]);
    }
    return normalizeOffsets(current);
  }

  function mirrorOffsets(cells: number[][], mirrored: boolean): number[][] {
    if (!mirrored) return cells;
    const current = cells.map(([cx, cy]) => [-cx, cy]);
    return normalizeOffsets(current);
  }

  function generateDailyChallenge(dateStr: string) {
    const rng = seededRandom(dateStr);
    const sizeChoice = rng();
    
    // Choose grid dimensions based on day/seed
    let gridWidth = 4;
    let gridHeight = 4;
    let difficulty: 'Easy' | 'Medium' | 'Hard' | 'Expert' | 'Master' = 'Medium';
    
    if (sizeChoice < 0.33) {
      gridWidth = 4;
      gridHeight = 4;
      difficulty = 'Easy';
    } else if (sizeChoice < 0.66) {
      gridWidth = 5;
      gridHeight = 5;
      difficulty = 'Medium';
    } else {
      gridWidth = 6;
      gridHeight = 5;
      difficulty = 'Hard';
    }

    // Decide if there are blocked cells
    const blockedCount = Math.floor(rng() * 3); // 0 to 2 blocked cells
    const blockedCells: number[][] = [];
    const assigned = Array.from({ length: gridHeight }, () => Array(gridWidth).fill(false));
    
    // Pick random coordinates for blocked cells
    for (let i = 0; i < blockedCount; i++) {
      const rx = Math.floor(rng() * gridWidth);
      const ry = Math.floor(rng() * gridHeight);
      if (!assigned[ry][rx]) {
        assigned[ry][rx] = true;
        blockedCells.push([rx, ry]);
      }
    }
    
    const colors = [
      "bg-sage border-b-3 border-[#8ba89a]",
      "bg-coral border-b-3 border-[#c07d72]",
      "bg-mustard border-b-3 border-[#c8a86e]",
      "bg-teal border-b-3 border-[#71a39f]",
      "bg-lavender border-b-3 border-[#a8a5a1]",
      "bg-[#a8cfbd] border-b-3 border-[#8ba89a]",
      "bg-[#e49a8e] border-b-3 border-[#c07d72]",
      "bg-[#e6c88e] border-b-3 border-[#c8a86e]",
      "bg-[#8ec9c4] border-b-3 border-[#71a39f]"
    ];
    
    const blockNames = ["Mono", "Domino", "Tromino", "Tetromino", "Pentomino"];
    
    const availableBlocks: any[] = [];
    const hintSequence: any[] = [];
    let blockCounter = 0;
    
    for (let y = 0; y < gridHeight; y++) {
      for (let x = 0; x < gridWidth; x++) {
        if (assigned[y][x]) continue;
        
        // Start a new block
        const blockCells: [number, number][] = [[x, y]];
        assigned[y][x] = true;
        
        // Target size for this block (between 2 and 5)
        const targetSize = Math.floor(rng() * 4) + 2; 
        
        // BFS/DFS to grow the block
        const queue: [number, number][] = [[x, y]];
        while (queue.length > 0 && blockCells.length < targetSize) {
          const [cx, cy] = queue.shift()!;
          const neighbors: [number, number][] = [
            [cx + 1, cy],
            [cx - 1, cy],
            [cx, cy + 1],
            [cx, cy - 1]
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
        
        // Normalize coordinates
        const minX = Math.min(...blockCells.map(c => c[0]));
        const minY = Math.min(...blockCells.map(c => c[1]));
        const relativeCells = blockCells.map(([bx, by]) => [bx - minX, by - minY]);
        
        const color = colors[blockCounter % colors.length];
        const name = `${blockNames[Math.min(blockCells.length - 1, 4)]}-${blockCounter + 1}`;
        
        availableBlocks.push({
          cells: relativeCells,
          color,
          name
        });
        
        hintSequence.push({
          blockIndex: blockCounter,
          x: minX,
          y: minY,
          rotations: 0,
          mirrored: false
        });
        
        blockCounter++;
      }
    }
    
    // Shuffle blocks
    const blockIndices = Array.from({ length: availableBlocks.length }, (_, i) => i);
    for (let i = blockIndices.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      const temp = blockIndices[i];
      blockIndices[i] = blockIndices[j];
      blockIndices[j] = temp;
    }
    
    const shuffledBlocks = blockIndices.map(idx => availableBlocks[idx]);
    const shuffledHints = blockIndices.map((originalIdx, newIdx) => {
      const originalHint = hintSequence.find(h => h.blockIndex === originalIdx)!;
      return {
        blockIndex: newIdx,
        x: originalHint.x,
        y: originalHint.y,
        rotations: originalHint.rotations,
        mirrored: originalHint.mirrored
      };
    });
    
    shuffledHints.sort((a, b) => a.blockIndex - b.blockIndex);

    const parMoves = shuffledBlocks.length;
    const parTime = shuffledBlocks.length * 20; 
    
    return {
      id: 9999, // Reserved for Daily Challenge
      name: `Daily Challenge - ${dateStr}`,
      gridWidth,
      gridHeight,
      blockedCells,
      availableBlocks: shuffledBlocks,
      parMoves,
      parTime,
      difficulty,
      hintSequence: shuffledHints
    };
  }

  function getDailyLeaderboard(dateStr: string) {
    if (!dailyLeaderboards.has(dateStr)) {
      const rng = seededRandom(dateStr + "-competitors");
      const botNames = ["ZenSlicer", "GridRider", "Tessellator", "Symmetric", "ShapeShifter", "HexaGuru"];
      const botScores: LeaderboardEntry[] = [];
      
      const shuffledBots = [...botNames].sort(() => rng() - 0.5);
      const level = generateDailyChallenge(dateStr);
      
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
          timestamp: new Date().toISOString()
        });
      }
      
      botScores.sort((a, b) => {
        if (b.stars !== a.stars) return b.stars - a.stars;
        if (a.moves !== b.moves) return a.moves - b.moves;
        return a.time - b.time;
      });
      
      dailyLeaderboards.set(dateStr, botScores);
    }
    return dailyLeaderboards.get(dateStr)!;
  }

  function validateSolution(level: any, placedBlocks: any[]): boolean {
    if (placedBlocks.length !== level.availableBlocks.length) {
      return false;
    }

    const occupied = Array.from({ length: level.gridHeight }, () => Array(level.gridWidth).fill(false));

    for (const [bx, by] of level.blockedCells) {
      if (bx >= 0 && bx < level.gridWidth && by >= 0 && by < level.gridHeight) {
        occupied[by][bx] = true;
      }
    }

    for (const pb of placedBlocks) {
      const match = pb.blockId.match(/block_(\d+)/);
      if (!match) return false;
      const blockIndex = parseInt(match[1]);
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

      const minX = Math.min(...pb.cells.map((c: any) => c[0]));
      const minY = Math.min(...pb.cells.map((c: any) => c[1]));
      const relativePlaced = pb.cells.map(([cx, cy]: any) => [cx - minX, cy - minY]);

      let isValidTransformation = false;
      for (let rot = 0; rot < 4; rot++) {
        for (const mir of [false, true]) {
          let trans = rotateOffsets(originalBlock.cells, rot);
          trans = mirrorOffsets(trans, mir);
          
          if (trans.length === relativePlaced.length) {
            const matchCount = trans.filter(([tx, ty]) => 
              relativePlaced.some(([px, py]: any) => px === tx && py === ty)
            ).length;
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

  // --- API Endpoints ---

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // Get Daily Challenge configuration and daily leaderboard
  app.get("/api/daily-challenge", (req, res) => {
    let { date } = req.query;
    if (!date || typeof date !== "string") {
      const today = new Date();
      date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    }
    
    try {
      const level = generateDailyChallenge(date);
      const scores = getDailyLeaderboard(date);
      res.json({ level, leaderboard: scores });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to generate daily challenge" });
    }
  });

  // Submit Daily Challenge solution
  app.post("/api/daily-challenge/submit", (req, res) => {
    const { dateStr, username, placedBlocks, moves, time } = req.body;
    if (!dateStr || !username || !placedBlocks || typeof moves !== "number" || typeof time !== "number") {
      return res.status(400).json({ error: "Missing required submission fields" });
    }

    try {
      const level = generateDailyChallenge(dateStr);
      const isValid = validateSolution(level, placedBlocks);
      if (!isValid) {
        return res.status(400).json({ success: false, error: "Invalid block placement or incomplete grid" });
      }

      // Solution is valid! Calculate stars
      let stars = 1;
      if (moves <= level.parMoves) stars++;
      if (time <= level.parTime) stars++;

      // Post to daily leaderboard
      const scores = getDailyLeaderboard(dateStr);
      
      // Update score or add new one
      const existingIdx = scores.findIndex(s => s.username === username);
      const newEntry: LeaderboardEntry = {
        username: String(username).substring(0, 20),
        levelId: 9999,
        stars,
        moves,
        time,
        timestamp: new Date().toISOString()
      };

      if (existingIdx >= 0) {
        // Only keep if it's better
        const current = scores[existingIdx];
        const isBetter = stars > current.stars || 
                        (stars === current.stars && moves < current.moves) ||
                        (stars === current.stars && moves === current.moves && time < current.time);
        if (isBetter) {
          scores[existingIdx] = newEntry;
        }
      } else {
        scores.push(newEntry);
      }

      // Sort scores
      scores.sort((a, b) => {
        if (b.stars !== a.stars) return b.stars - a.stars;
        if (a.moves !== b.moves) return a.moves - b.moves;
        return a.time - b.time;
      });

      res.status(200).json({ success: true, stars, leaderboard: scores });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error validating challenge" });
    }
  });

  // Get Leaderboard for a level
  app.get("/api/leaderboard", (req, res) => {
    const levelId = parseInt(req.query.levelId as string);
    if (isNaN(levelId)) {
      return res.json(leaderboard.slice(0, 50));
    }
    const filtered = leaderboard
      .filter((entry) => entry.levelId === levelId)
      .sort((a, b) => {
        if (b.stars !== a.stars) return b.stars - a.stars; // more stars is better
        if (a.moves !== b.moves) return a.moves - b.moves; // fewer moves is better
        return a.time - b.time; // faster time is better
      })
      .slice(0, 50);
    res.json(filtered);
  });

  // Post Leaderboard score
  app.post("/api/leaderboard", (req, res) => {
    const { username, levelId, stars, moves, time } = req.body;
    if (!username || typeof levelId !== "number" || typeof stars !== "number" || typeof moves !== "number" || typeof time !== "number") {
      return res.status(400).json({ error: "Missing required score fields" });
    }

    const newEntry: LeaderboardEntry = {
      username: String(username).substring(0, 20),
      levelId,
      stars,
      moves,
      time,
      timestamp: new Date().toISOString()
    };

    leaderboard.push(newEntry);
    res.status(201).json({ success: true, entry: newEntry });
  });

  // Get Speedrun Leaderboard for a level
  app.get("/api/speedrun/leaderboard", (req, res) => {
    const levelId = parseInt(req.query.levelId as string);
    if (isNaN(levelId)) {
      return res.json(speedrunLeaderboard.slice(0, 50));
    }
    const filtered = speedrunLeaderboard
      .filter((entry) => entry.levelId === levelId)
      .sort((a, b) => {
        // In speedrun mode, time is the absolute primary key! Smaller time is better.
        if (a.time !== b.time) return a.time - b.time;
        return a.moves - b.moves; // tie-breaker: fewer moves
      })
      .slice(0, 50);
    res.json(filtered);
  });

  // Post Speedrun Leaderboard score
  app.post("/api/speedrun/leaderboard", (req, res) => {
    const { username, levelId, stars, moves, time } = req.body;
    if (!username || typeof levelId !== "number" || typeof stars !== "number" || typeof moves !== "number" || typeof time !== "number") {
      return res.status(400).json({ error: "Missing required score fields" });
    }

    const newEntry: LeaderboardEntry = {
      username: String(username).substring(0, 20),
      levelId,
      stars,
      moves,
      time,
      timestamp: new Date().toISOString()
    };

    // Keep only the user's best speedrun score for this level to avoid cluttering the board
    const existingIdx = speedrunLeaderboard.findIndex(s => s.username === username && s.levelId === levelId);
    if (existingIdx >= 0) {
      if (time < speedrunLeaderboard[existingIdx].time) {
        speedrunLeaderboard[existingIdx] = newEntry;
      }
    } else {
      speedrunLeaderboard.push(newEntry);
    }
    
    res.status(201).json({ success: true, entry: newEntry });
  });

  // Generate a sync code and save current progress
  app.post("/api/sync/generate", (req, res) => {
    const profile = req.body as PlayerProfile;
    if (!profile || typeof profile.currentLevel !== "number") {
      return res.status(400).json({ error: "Invalid player profile payload" });
    }

    const code = generateSyncCode();
    syncProfiles.set(code, profile);
    res.json({ code });
  });

  // Load progress from a sync code
  app.post("/api/sync/load", (req, res) => {
    const { code } = req.body;
    if (!code || typeof code !== "string") {
      return res.status(400).json({ error: "Missing sync code" });
    }

    const cleanCode = code.trim().toUpperCase();
    const profile = syncProfiles.get(cleanCode);
    if (!profile) {
      return res.status(404).json({ error: "Sync code not found or expired" });
    }

    res.json({ profile });
  });

  // Save/Update progress on an existing sync code
  app.post("/api/sync/save", (req, res) => {
    const { code, profile } = req.body;
    if (!code || !profile || typeof code !== "string") {
      return res.status(400).json({ error: "Missing parameters" });
    }

    const cleanCode = code.trim().toUpperCase();
    if (!syncProfiles.has(cleanCode)) {
      return res.status(404).json({ error: "Sync code not found" });
    }

    syncProfiles.set(cleanCode, profile);
    res.json({ success: true });
  });

  // User Authentication & Database Sync Routes
  app.post("/api/auth/signup", (req, res) => signupHandler(req as any, res as any));
  app.post("/api/auth/login", (req, res) => loginHandler(req as any, res as any));
  app.post("/api/auth/save-profile", (req, res) => saveProfileHandler(req as any, res as any));
  app.get("/api/auth/load-profile", (req, res) => loadProfileHandler(req as any, res as any));

  // Vite middleware for assets / hot reloading
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Block Fit Server] Running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start Block Fit Server:", err);
});
