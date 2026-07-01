import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../../lib/supabase';
import { generateDailyChallenge, validateSolution, getDailyBotScores } from '../../lib/dailyChallenge';
import { applyCors } from '../../lib/cors';

/** ISO date YYYY-MM-DD */
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function mapRow(row: Record<string, unknown>) {
  return {
    username: row.username,
    levelId: row.level_id,
    stars: row.stars,
    moves: row.moves,
    time: row.time,
    timestamp: row.created_at,
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (applyCors(req, res)) return;

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    res.status(405).json({ error: `Method ${req.method} not allowed` });
    return;
  }

  const { dateStr, username, placedBlocks, moves, time } = req.body ?? {};

  // Validate date format before using it as DB filter or RNG seed
  if (!dateStr || !DATE_RE.test(String(dateStr))) {
    res.status(400).json({ error: 'Invalid or missing dateStr (expected YYYY-MM-DD)' });
    return;
  }
  if (!username || !placedBlocks || typeof moves !== 'number' || typeof time !== 'number') {
    res.status(400).json({ error: 'Missing required submission fields' });
    return;
  }

  try {
    const level = generateDailyChallenge(dateStr);
    const isValid = validateSolution(level, placedBlocks);
    if (!isValid) {
      res.status(400).json({ success: false, error: 'Invalid block placement or incomplete grid' });
      return;
    }

    let stars = 1;
    if (moves <= level.parMoves) stars++;
    if (time <= level.parTime) stars++;

    const cleanUsername = String(username).substring(0, 20);

    const { data: existing, error: findErr } = await supabase
      .from('scores')
      .select('*')
      .eq('mode', 'daily')
      .eq('challenge_date', dateStr)
      .eq('username', cleanUsername)
      .maybeSingle();

    if (findErr) { res.status(500).json({ error: findErr.message }); return; }

    const isBetter = (a: { stars: number; moves: number; time: number }) =>
      stars > a.stars || (stars === a.stars && moves < a.moves) || (stars === a.stars && moves === a.moves && time < a.time);

    if (existing) {
      if (isBetter(existing)) {
        const { error: updErr } = await supabase
          .from('scores')
          .update({ stars, moves, time, created_at: new Date().toISOString() })
          .eq('id', existing.id);
        if (updErr) { res.status(500).json({ error: updErr.message }); return; }
      }
    } else {
      const { error: insErr } = await supabase
        .from('scores')
        .insert({ username: cleanUsername, mode: 'daily', level_id: 9999, challenge_date: dateStr, stars, moves, time });
      if (insErr) { res.status(500).json({ error: insErr.message }); return; }
    }

    const { data: allScores, error: fetchErr } = await supabase
      .from('scores')
      .select('*')
      .eq('mode', 'daily')
      .eq('challenge_date', dateStr);

    if (fetchErr) { res.status(500).json({ error: fetchErr.message }); return; }

    const merged = [...(allScores ?? []).map(mapRow), ...getDailyBotScores(dateStr)].sort((a, b) => {
      if ((b.stars as number) !== (a.stars as number)) return (b.stars as number) - (a.stars as number);
      if ((a.moves as number) !== (b.moves as number)) return (a.moves as number) - (b.moves as number);
      return (a.time as number) - (b.time as number);
    });

    res.status(200).json({ success: true, stars, leaderboard: merged });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error validating challenge' });
  }
}
