import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../../lib/supabase';

function generateSyncCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no easily confused chars (I, O, 0, 1)
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  const profile = req.body;
  if (!profile || typeof profile.currentLevel !== 'number') {
    return res.status(400).json({ error: 'Invalid player profile payload' });
  }

  // Retry a couple of times in the astronomically unlikely case of a code collision.
  for (let attempt = 0; attempt < 3; attempt++) {
    const code = generateSyncCode();
    const { error } = await supabase.from('sync_profiles').insert({ code, profile });
    if (!error) {
      return res.status(200).json({ code });
    }
    // 23505 = unique_violation in Postgres — only retry on collision, bail on anything else.
    if ((error as any).code !== '23505') {
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(500).json({ error: 'Could not generate a unique sync code, please try again' });
}
