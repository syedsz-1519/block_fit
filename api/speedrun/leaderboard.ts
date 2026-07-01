import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../../lib/supabase';

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

    let query = supabase.from('scores').select('*').eq('mode', 'speedrun');
    if (!isNaN(levelId)) query = query.eq('level_id', levelId);

    // In speedrun mode, time is the primary sort key — smaller is better.
    const { data, error } = await query
      .order('time', { ascending: true })
      .order('moves', { ascending: true })
      .limit(50);

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json((data ?? []).map(mapRow));
  }

  if (req.method === 'POST') {
    const { username, levelId, stars, moves, time } = req.body ?? {};
    if (!username || typeof levelId !== 'number' || typeof stars !== 'number' || typeof moves !== 'number' || typeof time !== 'number') {
      return res.status(400).json({ error: 'Missing required score fields' });
    }
    const cleanUsername = String(username).substring(0, 20);

    // Keep only the user's best speedrun score for this level.
    const { data: existing, error: findErr } = await supabase
      .from('scores')
      .select('*')
      .eq('mode', 'speedrun')
      .eq('level_id', levelId)
      .eq('username', cleanUsername)
      .maybeSingle();

    if (findErr) return res.status(500).json({ error: findErr.message });

    if (existing) {
      if (time < existing.time) {
        const { data, error } = await supabase
          .from('scores')
          .update({ stars, moves, time, created_at: new Date().toISOString() })
          .eq('id', existing.id)
          .select()
          .single();
        if (error) return res.status(500).json({ error: error.message });
        return res.status(201).json({ success: true, entry: mapRow(data) });
      }
      return res.status(201).json({ success: true, entry: mapRow(existing) });
    }

    const { data, error } = await supabase
      .from('scores')
      .insert({ username: cleanUsername, mode: 'speedrun', level_id: levelId, stars, moves, time })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json({ success: true, entry: mapRow(data) });
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: `Method ${req.method} not allowed` });
}
