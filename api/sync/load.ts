import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../../lib/supabase';
import { applyCors } from '../../lib/cors';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (applyCors(req, res)) return;

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    res.status(405).json({ error: `Method ${req.method} not allowed` });
    return;
  }

  const { code } = req.body ?? {};
  if (!code || typeof code !== 'string') {
    res.status(400).json({ error: 'Missing sync code' });
    return;
  }

  const cleanCode = code.trim().toUpperCase();
  // Sync codes are exactly 6 characters
  if (cleanCode.length !== 6) {
    res.status(400).json({ error: 'Sync code must be exactly 6 characters' });
    return;
  }

  try {
    const { data, error } = await supabase
      .from('sync_profiles')
      .select('profile')
      .eq('code', cleanCode)
      .maybeSingle();

    if (error) { res.status(500).json({ error: error.message }); return; }
    if (!data) { res.status(404).json({ error: 'Sync code not found or expired' }); return; }

    res.status(200).json({ profile: data.profile });
  } catch (err) {
    console.error('[sync/load]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
