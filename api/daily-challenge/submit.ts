import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applySecurityGuards } from '../../lib/apiSecurity';
import { isRateLimited } from '../../lib/rateLimit';
import { supabase } from '../../lib/supabase';
import { generateDailyChallenge, validateSolution, getDailyBotScores } from '../../lib/dailyChallenge';
import { assertDate, assertUsername, assertMoves, assertTime } from '../../lib/validate';

interface ScoreRow {
  id: number;
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
  if (isRateLimited(req, res, 10)) return; // strict: 10 submissions/min per IP

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  // ── Validate inputs ────────────────────────────────────────────────────────
  const body = req.body ?? {};
  const dateStr = assertDate(body.dateStr, 'dateStr', res);
  if (!dateStr) return;
  const username = assertUsername(body.username, res);
  if (!username) return;
  const moves = assertMoves(body.moves, res);
  if (moves === null) return;
  const time = assertTime(body.time, res);
  if (time === null) return;

  const { placedBlocks } = body;
  if (!Array.isArray(placedBlocks) || placedBlocks.length === 0) {
    return res.status(400).json({ error: 'placedBlocks must be a non-empty array' });
  }
  if (placedBlocks.length > 50) {
    return res.status(400).json({ error: 'Too many placed blocks' });
  }

  try {
    // ── Validate solution server-side ────────────────────────────────────────
    const level = generateDailyChallenge(dateStr);
    const isValid = validateSolution(level, placedBlocks);
    if (!isValid) {
      return res.status(400).json({ success: false, error: 'Invalid block placement or incomplete grid' });
    }

    // ── Calculate stars ──────────────────────────────────────────────────────
    let stars = 1;
    if (moves <= level.parMoves) stars++;
    if (time <= level.parTime) stars++;

    // ── Upsert best score ────────────────────────────────────────────────────
    const { data: existing, error: findErr } = await supabase
      .from('scores')
      .select('id, stars, moves, time')
      .eq('mode', 'daily')
      .eq('challenge_date', dateStr)
      .eq('username', username)
      .maybeSingle();

    if (findErr) {
      console.error('[daily-submit] DB find error:', findErr.message);
      return res.status(500).json({ error: 'Database error' });
    }

    const isBetter = (a: { stars: number; moves: number; time: number }) =>
      stars > a.stars ||
      (stars === a.stars && moves < a.moves) ||
      (stars === a.stars && moves === a.moves && time < a.time);

    if (existing) {
      if (isBetter(existing)) {
        const { error: updErr } = await supabase
          .from('scores')
          .update({ stars, moves, time, created_at: new Date().toISOString() })
          .eq('id', existing.id);
        if (updErr) {
          console.error('[daily-submit] DB update error:', updErr.message);
          return res.status(500).json({ error: 'Database error' });
        }
      }
      // else: keep existing better score — still return 200 with leaderboard
    } else {
      const { error: insErr } = await supabase
        .from('scores')
        .insert({
          username,
          mode: 'daily',
          level_id: 9999,
          challenge_date: dateStr,
          stars,
          moves,
          time,
        });
      if (insErr) {
        console.error('[daily-submit] DB insert error:', insErr.message);
        return res.status(500).json({ error: 'Database error' });
      }
    }

    // ── Fetch updated leaderboard ────────────────────────────────────────────
    const { data: allScores, error: fetchErr } = await supabase
      .from('scores')
      .select('username, level_id, stars, moves, time, created_at')
      .eq('mode', 'daily')
      .eq('challenge_date', dateStr)
      .order('stars', { ascending: false })
      .order('moves', { ascending: true })
      .order('time', { ascending: true })
      .limit(50);

    if (fetchErr) {
      console.error('[daily-submit] DB fetch error:', fetchErr.message);
      return res.status(500).json({ error: 'Database error' });
    }

    const realScores = (allScores ?? []).map(mapRow);
    const botScores = getDailyBotScores(dateStr);

    // Merge — real players shadow bots with same username
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

    return res.status(200).json({ success: true, stars, leaderboard: merged });
  } catch (err) {
    console.error('[daily-submit] Unexpected error:', err);
    return res.status(500).json({ error: 'Server error validating challenge' });
  }
}
