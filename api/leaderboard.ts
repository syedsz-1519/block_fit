import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../lib/supabase';

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
  if (req.method === 'GET') {
    const levelIdRaw = req.query.levelId;
    const levelId = typeof levelIdRaw === 'string' ? parseInt(levelIdRaw) : NaN;

    let query = supabase.from('scores').select('*').eq('mode', 'campaign');
    if (!isNaN(levelId)) query = query.eq('level_id', levelId);

    const { data, error } = await query
      .order('stars', { ascending: false })
      .order('moves', { ascending: true })
      .order('time', { ascending: true })
      .limit(50);

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json((data ?? []).map(mapRow));
  }

  if (req.method === 'POST') {
    const { username, levelId, stars, moves, time } = req.body ?? {};
    if (!username || typeof levelId !== 'number' || typeof stars !== 'number' || typeof moves !== 'number' || typeof time !== 'number') {
      return res.status(400).json({ error: 'Missing required score fields' });
    }

    const { data, error } = await supabase
      .from('scores')
      .insert({
        username: String(username).substring(0, 20),
        mode: 'campaign',
        level_id: levelId,
        stars,
        moves,
        time,
      })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json({ success: true, entry: mapRow(data) });
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: `Method ${req.method} not allowed` });
}
