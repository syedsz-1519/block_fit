/**
 * Scoring — calculates points and rewards based on game events
 * Handles star ratings, combo bonuses, and performance-based scoring
 */

import { GameStats, GameResult, StarRating } from '../types/game.types';
import { Grid } from './Grid';

export interface ScoringRules {
  basePointsPerLine: number;
  comboThresholds: number[];
  difficultyMultipliers: Record<string, number>;
  timeRatios: {
    fast: number;
    normal: number;
    slow: number;
  };
}

export const DEFAULT_SCORING_RULES: ScoringRules = {
  basePointsPerLine: 100,
  comboThresholds: [1, 2, 3, 5],
  difficultyMultipliers: {
    Easy: 1,
    Medium: 1.5,
    Hard: 2,
    Expert: 2.5,
    Master: 3,
  },
  timeRatios: {
    fast: 1.5,
    normal: 1,
    slow: 0.5,
  },
};

export class Scoring {
  private rules: ScoringRules;

  constructor(rules: ScoringRules = DEFAULT_SCORING_RULES) {
    this.rules = rules;
  }

  /**
   * Calculate score from completed lines
   */
  calculateLineScore(
    lineCount: number,
    combo: number,
    difficulty: string = 'Medium'
  ): number {
    if (lineCount === 0) return 0;

    const baseScore = lineCount * this.rules.basePointsPerLine;
    const comboBonus = Math.pow(1.1, combo - 1); // Exponential combo growth
    const difficultyMultiplier = this.rules.difficultyMultipliers[difficulty] || 1;

    return Math.round(baseScore * comboBonus * difficultyMultiplier);
  }

  /**
   * Calculate score from block placement
   */
  calculatePlacementScore(
    cellsPlaced: number,
    difficulty: string = 'Medium'
  ): number {
    const baseScore = cellsPlaced * 10;
    const difficultyMultiplier = this.rules.difficultyMultipliers[difficulty] || 1;

    return Math.round(baseScore * difficultyMultiplier);
  }

  /**
   * Calculate time bonus
   */
  calculateTimeBonus(
    elapsedSeconds: number,
    parTime: number,
    multiplier: number = 1
  ): number {
    if (parTime === 0) return 0;

    const ratio = elapsedSeconds / parTime;
    let timeRatio: number;

    if (ratio <= 0.75) {
      timeRatio = this.rules.timeRatios.fast;
    } else if (ratio <= 1.5) {
      timeRatio = this.rules.timeRatios.normal;
    } else {
      timeRatio = this.rules.timeRatios.slow;
    }

    const baseBonus = 500;
    return Math.round(baseBonus * timeRatio * multiplier);
  }

  /**
   * Calculate total game score
   */
  calculateTotalScore(
    stats: GameStats,
    parTime: number = 0,
    difficulty: string = 'Medium'
  ): number {
    const lineScore = this.calculateLineScore(
      stats.linesCleared,
      stats.combo,
      difficulty
    );
    const placementScore = this.calculatePlacementScore(
      stats.moves * 3, // Estimate cells placed from moves
      difficulty
    );
    const timeBonus = this.calculateTimeBonus(stats.elapsedSeconds, parTime);

    return lineScore + placementScore + timeBonus;
  }

  /**
   * Calculate star rating based on performance
   */
  calculateStarRating(
    moves: number,
    time: number,
    parMoves: number,
    parTime: number
  ): StarRating {
    return Grid.calculateStars(moves, time, parMoves, parTime);
  }

  /**
   * Create game result
   */
  createResult(
    stats: GameStats,
    levelId: number,
    mode: string,
    parMoves: number,
    parTime: number,
    previousHighScore: number,
    difficulty: string = 'Medium'
  ): GameResult {
    const stars = this.calculateStarRating(
      stats.moves,
      stats.elapsedSeconds,
      parMoves,
      parTime
    ).stars;

    const totalScore = this.calculateTotalScore(stats, parTime, difficulty);
    const newHighScore = totalScore > previousHighScore;

    return {
      levelId,
      mode: mode as any,
      stats,
      completed: true,
      stars: Math.max(0, stars),
      newHighScore,
    };
  }

  /**
   * Get performance tier
   */
  getPerformanceTier(stars: number): string {
    if (stars >= 3) return 'Perfect';
    if (stars >= 2) return 'Great';
    if (stars >= 1) return 'Good';
    return 'Incomplete';
  }

  /**
   * Calculate efficiency score
   */
  calculateEfficiency(
    linesCleared: number,
    moves: number,
    maxPossibleLines: number
  ): number {
    if (moves === 0) return 0;

    const clearRatio = linesCleared / maxPossibleLines;
    const moveEfficiency = 1 / moves;

    return Math.round((clearRatio * moveEfficiency) * 100);
  }

  /**
   * Get score multiplier for streak
   */
  getStreakMultiplier(streak: number): number {
    if (streak === 0) return 1;
    if (streak < 7) return 1 + streak * 0.05;
    if (streak < 30) return 1.3 + (streak - 7) * 0.02;
    return 1.5 + (streak - 30) * 0.01;
  }

  /**
   * Get combo reward tier
   */
  getComboReward(combo: number): {
    name: string;
    bonus: number;
    icon: string;
  } | null {
    if (combo < 2) return null;
    if (combo === 2) return { name: 'Double', bonus: 1.2, icon: '🔥' };
    if (combo === 3) return { name: 'Triple', bonus: 1.5, icon: '🔥🔥' };
    if (combo === 5) return { name: 'Mega', bonus: 2, icon: '💥' };
    if (combo === 10) return { name: 'Godlike', bonus: 3, icon: '⚡' };
    return { name: `${combo}x Combo`, bonus: 1 + combo * 0.1, icon: '🌟' };
  }

  /**
   * Validate score integrity
   */
  validateScore(
    score: number,
    moves: number,
    linesCleared: number,
    difficulty: string
  ): { valid: boolean; reason?: string } {
    // Basic sanity checks
    if (score < 0) return { valid: false, reason: 'Score cannot be negative' };
    if (moves < 0) return { valid: false, reason: 'Moves cannot be negative' };
    if (linesCleared < 0) return { valid: false, reason: 'Lines cleared cannot be negative' };

    // Estimate max possible score based on moves
    const estimatedMaxScore = moves * 100 * 3; // Very generous estimate
    if (score > estimatedMaxScore) {
      return { valid: false, reason: `Score ${score} exceeds estimated maximum ${estimatedMaxScore}` };
    }

    return { valid: true };
  }
}

/**
 * Calculate performance badges
 */
export function getPerformanceBadges(stats: GameStats): string[] {
  const badges: string[] = [];

  // Speed badges
  if (stats.elapsedSeconds < 10) badges.push('speedrun');
  if (stats.moves < 3) badges.push('efficient');

  // Combo badges
  if (stats.maxCombo >= 5) badges.push('combo-master');
  if (stats.maxCombo >= 10) badges.push('combo-legend');

  // Score badges
  if (stats.score > 10000) badges.push('high-scorer');

  return badges;
}
