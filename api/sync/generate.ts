import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../../lib/supabase';
import { applyCors } from '../../lib/cors';

function generateSyncCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no easily confused chars (I, O, 0, 1)
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (applyCors(req, res)) return;

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    res.status(405).json({ error: `Method ${req.method} not allowed` });
    return;
  }

  const profile = req.body;
  if (!profile || typeof profile.currentLevel !== 'number') {
    res.status(400).json({ error: 'Invalid player profile payload' });
    return;
  }

  try {
    // Retry a couple of times in the astronomically unlikely case of a code collision.
    for (let attempt = 0; attempt < 3; attempt++) {
      const code = generateSyncCode();
      const { error } = await supabase.from('sync_profiles').insert({ code, profile });
      if (!error) {
        res.status(200).json({ code });
        return;
      }
      // 23505 = unique_violation in Postgres — only retry on collision, bail on anything else.
      if ((error as { code?: string }).code !== '23505') {
        res.status(500).json({ error: error.message });
        return;
      }
    }

    res.status(500).json({ error: 'Could not generate a unique sync code, please try again' });
  } catch (err) {
    console.error('[sync/generate]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
