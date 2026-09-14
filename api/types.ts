/**
 * Shared API types and contracts
 * Used by both client and server for type safety
 */

// ─── Authentication Requests ───────────────────────────────────────────────

export interface SignupRequest {
  email: string;
  password: string;
  username: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface OAuthCallbackRequest {
  code: string;
  state: string;
}

// ─── Authentication Responses ──────────────────────────────────────────────

export interface AuthResponse {
  success: true;
  userId: string;
  email: string;
  username: string;
  token: string;
  profile?: ProfileData;
}

export interface AuthError {
  success: false;
  error: string;
}

// ─── Profile Requests ─────────────────────────────────────────────────────

export interface SaveProfileRequest {
  userId: string;
  profile: ProfileData;
}

export interface DeleteProfileRequest {
  userId: string;
  password?: string; // For account deletion confirmation
}

// ─── Profile Data ─────────────────────────────────────────────────────────

export interface ProfileData {
  levelProgress: Record<number, LevelProgress>;
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
  username: string;
  achievementsUnlocked?: string[];
  dailyStreakCount?: number;
}

export interface LevelProgress {
  stars: number;
  moves: number;
  time: number;
  completed: boolean;
  completedAt?: string;
}

// ─── Leaderboard Requests ─────────────────────────────────────────────────

export interface LeaderboardQuery {
  levelId: number;
  mode: 'campaign' | 'speedrun' | 'daily' | 'sudoku';
  limit?: number;
  offset?: number;
  date?: string; // YYYY-MM-DD for daily challenges
}

export interface LeaderboardResponse {
  success: true;
  entries: LeaderboardEntryData[];
  playerEntry?: LeaderboardEntryData;
  playerRank?: number;
  totalPlayers: number;
  pagination: {
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export interface LeaderboardEntryData {
  rank: number;
  username: string;
  userId?: string;
  stars: number;
  moves: number;
  time: number;
  score: number;
  timestamp: string;
  isPlayer: boolean;
  avatar?: string;
}

// ─── Score Submission ──────────────────────────────────────────────────────

export interface ScoreSubmissionRequest {
  levelId: number;
  mode: 'campaign' | 'speedrun' | 'daily' | 'sudoku';
  stars: number;
  moves: number;
  time: number;
  date?: string; // For daily challenges
  placement?: Array<{
    blockId: string;
    cells: [number, number][];
  }>;
}

export interface ScoreSubmissionResponse {
  success: true;
  rank: number;
  totalPlayers: number;
  newHighScore: boolean;
  achievements?: string[];
}

// ─── Daily Challenge ───────────────────────────────────────────────────────

export interface DailyChallengeQuery {
  date?: string; // YYYY-MM-DD, defaults to today
}

export interface DailyChallengeResponse {
  success: true;
  levelId: number;
  date: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  level: {
    id: number;
    gridWidth: number;
    gridHeight: number;
    blockedCells: [number, number][];
    availableBlocks: BlockData[];
    parMoves: number;
    parTime: number;
  };
  leaderboard: LeaderboardEntryData[];
}

export interface BlockData {
  id: string;
  name: string;
  color: string;
  cells: [number, number][];
}

// ─── Sync Requests ────────────────────────────────────────────────────────

export interface GenerateSyncCodeRequest {
  userId: string;
}

export interface GenerateSyncCodeResponse {
  success: true;
  code: string;
  expiresAt: string;
}

export interface LoadSyncedProfileRequest {
  code: string;
}

export interface LoadSyncedProfileResponse {
  success: true;
  profile: ProfileData;
  expiresAt: string;
}

export interface SaveSyncedProfileRequest {
  code: string;
  profile: ProfileData;
}

// ─── Common Response Format ────────────────────────────────────────────────

export interface ApiErrorResponse {
  success: false;
  error: string;
  code?: string;
}

// ─── Pagination ───────────────────────────────────────────────────────────

export interface PaginationParams {
  limit: number;
  offset: number;
  total?: number;
  hasMore: boolean;
}

// ─── Type Guards ──────────────────────────────────────────────────────────

export function isAuthResponse(obj: any): obj is AuthResponse {
  return obj?.success === true && obj?.userId && obj?.token;
}

export function isLeaderboardResponse(obj: any): obj is LeaderboardResponse {
  return obj?.success === true && Array.isArray(obj?.entries);
}

export function isScoreSubmissionResponse(obj: any): obj is ScoreSubmissionResponse {
  return obj?.success === true && typeof obj?.rank === 'number';
}

export function isDailyChallengeResponse(obj: any): obj is DailyChallengeResponse {
  return obj?.success === true && obj?.level && obj?.leaderboard;
}

export function isApiError(obj: any): obj is ApiErrorResponse {
  return obj?.success === false && typeof obj?.error === 'string';
}
