import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../../lib/supabase';
import { generateDailyChallenge, getDailyBotScores } from '../../lib/dailyChallenge';
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

function todayStr() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (applyCors(req, res)) return;

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    res.status(405).json({ error: `Method ${req.method} not allowed` });
    return;
  }

  const dateRaw = req.query.date;
  // Validate format to prevent arbitrary strings being fed into the RNG seed
  const date = typeof dateRaw === 'string' && DATE_RE.test(dateRaw) ? dateRaw : todayStr();

  try {
    const level = generateDailyChallenge(date);

    const { data, error } = await supabase
      .from('scores')
      .select('*')
      .eq('mode', 'daily')
      .eq('challenge_date', date);

    if (error) { res.status(500).json({ error: error.message }); return; }

    const realScores = (data ?? []).map(mapRow);
    const botScores = getDailyBotScores(date);

    const merged = [...realScores, ...botScores].sort((a, b) => {
      if ((b.stars as number) !== (a.stars as number)) return (b.stars as number) - (a.stars as number);
      if ((a.moves as number) !== (b.moves as number)) return (a.moves as number) - (b.moves as number);
      return (a.time as number) - (b.time as number);
    });

    res.status(200).json({ level, leaderboard: merged });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate daily challenge' });
  }
}
