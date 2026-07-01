import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../../lib/supabase';
import { applyCors } from '../../lib/cors';

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

  try {
    if (req.method === 'GET') {
      const levelIdRaw = req.query.levelId;
      const levelId = typeof levelIdRaw === 'string' ? parseInt(levelIdRaw, 10) : NaN;

      let query = supabase.from('scores').select('*').eq('mode', 'speedrun');
      if (!isNaN(levelId)) query = query.eq('level_id', levelId);

      // In speedrun mode, time is the primary sort key — smaller is better.
      const { data, error } = await query
        .order('time', { ascending: true })
        .order('moves', { ascending: true })
        .limit(50);

      if (error) { res.status(500).json({ error: error.message }); return; }
      res.status(200).json((data ?? []).map(mapRow));
      return;
    }

    if (req.method === 'POST') {
      const { username, userId, levelId, stars, moves, time } = req.body ?? {};
      if (!username || !userId || typeof levelId !== 'number' || typeof stars !== 'number' || typeof moves !== 'number' || typeof time !== 'number') {
        res.status(400).json({ error: 'Missing required score fields' });
        return;
      }
      const cleanUsername = String(username).substring(0, 20);
      const cleanUserId = String(userId).substring(0, 50);

      // Keep only the user's best speedrun score for this level.
      const { data: existing, error: findErr } = await supabase
        .from('scores')
        .select('*')
        .eq('mode', 'speedrun')
        .eq('level_id', levelId)
        .eq('user_id', cleanUserId)
        .maybeSingle();

      if (findErr) { res.status(500).json({ error: findErr.message }); return; }

      if (existing) {
        const updates: Record<string, any> = { username: cleanUsername };
        let isImproved = false;
        if (time < existing.time) {
          updates.stars = stars;
          updates.moves = moves;
          updates.time = time;
          updates.created_at = new Date().toISOString();
          isImproved = true;
        }

        const { data, error } = await supabase
          .from('scores')
          .update(updates)
          .eq('id', existing.id)
          .select()
          .single();
        if (error) { res.status(500).json({ error: error.message }); return; }
        res.status(201).json({ success: true, entry: mapRow(data) });
        return;
      }

      const { data, error } = await supabase
        .from('scores')
        .insert({ username: cleanUsername, user_id: cleanUserId, mode: 'speedrun', level_id: levelId, stars, moves, time })
        .select()
        .single();

      if (error) { res.status(500).json({ error: error.message }); return; }
      res.status(201).json({ success: true, entry: mapRow(data) });
      return;
    }

    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).json({ error: `Method ${req.method} not allowed` });
  } catch (err) {
    console.error('[speedrun/leaderboard]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
