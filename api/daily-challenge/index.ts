import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../../lib/supabase';
import { generateDailyChallenge, getDailyBotScores } from '../../lib/dailyChallenge';

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

function todayStr() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  const dateRaw = req.query.date;
  const date = typeof dateRaw === 'string' && dateRaw.length > 0 ? dateRaw : todayStr();

  try {
    const level = generateDailyChallenge(date);

    const { data, error } = await supabase
      .from('scores')
      .select('*')
      .eq('mode', 'daily')
      .eq('challenge_date', date);

    if (error) return res.status(500).json({ error: error.message });

    const realScores = (data ?? []).map(mapRow);
    const botScores = getDailyBotScores(date);

    const merged = [...realScores, ...botScores].sort((a, b) => {
      if (b.stars !== a.stars) return b.stars - a.stars;
      if (a.moves !== b.moves) return a.moves - b.moves;
      return a.time - b.time;
    });

    return res.status(200).json({ level, leaderboard: merged });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to generate daily challenge' });
  }
}
