import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../../lib/supabase';
import { generateDailyChallenge, validateSolution, getDailyBotScores } from '../../lib/dailyChallenge';

function mapRow(row: any) {
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
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  const { dateStr, username, placedBlocks, moves, time } = req.body ?? {};
  if (!dateStr || !username || !placedBlocks || typeof moves !== 'number' || typeof time !== 'number') {
    return res.status(400).json({ error: 'Missing required submission fields' });
  }

  try {
    const level = generateDailyChallenge(dateStr);
    const isValid = validateSolution(level, placedBlocks);
    if (!isValid) {
      return res.status(400).json({ success: false, error: 'Invalid block placement or incomplete grid' });
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

    if (findErr) return res.status(500).json({ error: findErr.message });

    const isBetter = (a: { stars: number; moves: number; time: number }) =>
      stars > a.stars || (stars === a.stars && moves < a.moves) || (stars === a.stars && moves === a.moves && time < a.time);

    if (existing) {
      if (isBetter(existing)) {
        const { error: updErr } = await supabase
          .from('scores')
          .update({ stars, moves, time, created_at: new Date().toISOString() })
          .eq('id', existing.id);
        if (updErr) return res.status(500).json({ error: updErr.message });
      }
    } else {
      const { error: insErr } = await supabase
        .from('scores')
        .insert({ username: cleanUsername, mode: 'daily', level_id: 9999, challenge_date: dateStr, stars, moves, time });
      if (insErr) return res.status(500).json({ error: insErr.message });
    }

    const { data: allScores, error: fetchErr } = await supabase
      .from('scores')
      .select('*')
      .eq('mode', 'daily')
      .eq('challenge_date', dateStr);

    if (fetchErr) return res.status(500).json({ error: fetchErr.message });

    const merged = [...(allScores ?? []).map(mapRow), ...getDailyBotScores(dateStr)].sort((a, b) => {
      if (b.stars !== a.stars) return b.stars - a.stars;
      if (a.moves !== b.moves) return a.moves - b.moves;
      return a.time - b.time;
    });

    return res.status(200).json({ success: true, stars, leaderboard: merged });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error validating challenge' });
  }
}
