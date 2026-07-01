import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applySecurityGuards } from '../../lib/apiSecurity';
import { isRateLimited } from '../../lib/rateLimit';
import { supabase } from '../../lib/supabase';
import { generateDailyChallenge, getDailyBotScores } from '../../lib/dailyChallenge';
import { parseDate } from '../../lib/validate';

interface ScoreRow {
  username: string;
  level_id: number;
  stars: number;
  moves: number;
  time: number;
  created_at: string;
}

function mapRow(row: ScoreRow) {
  return {
    username: row.username,
    levelId: row.level_id,
    stars: row.stars,
    moves: row.moves,
    time: row.time,
    timestamp: row.created_at,
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // ── Security + rate limit ──────────────────────────────────────────────────
  if (applySecurityGuards(req, res)) return;
  if (isRateLimited(req, res, 30)) return; // 30 req/min per IP for this endpoint

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  // ── Parse + validate date ──────────────────────────────────────────────────
  const date = parseDate(req.query.date); // falls back to today if missing/invalid

  try {
    // Generate puzzle (deterministic — no DB read needed)
    const level = generateDailyChallenge(date);

    // Fetch real player scores for this date
    const { data, error } = await supabase
      .from('scores')
      .select('username, level_id, stars, moves, time, created_at')
      .eq('mode', 'daily')
      .eq('challenge_date', date)
      .order('stars', { ascending: false })
      .order('moves', { ascending: true })
      .order('time', { ascending: true })
      .limit(50);

    if (error) {
      console.error('[daily-challenge] DB error:', error.message);
      return res.status(500).json({ error: 'Failed to load leaderboard' });
    }

    const realScores = (data ?? []).map(mapRow);
    const botScores = getDailyBotScores(date);

    // Merge real players + bots, real players take precedence if username clashes
    const seen = new Set<string>();
    const merged: ReturnType<typeof mapRow>[] = [];
    for (const s of [...realScores, ...botScores]) {
      if (!seen.has(s.username)) {
        seen.add(s.username);
        merged.push(s);
      }
    }
    merged.sort((a, b) => {
      if (b.stars !== a.stars) return b.stars - a.stars;
      if (a.moves !== b.moves) return a.moves - b.moves;
      return a.time - b.time;
    });

    return res.status(200).json({ level, leaderboard: merged });
  } catch (err) {
    console.error('[daily-challenge] Unexpected error:', err);
    return res.status(500).json({ error: 'Failed to generate daily challenge' });
  }
}
