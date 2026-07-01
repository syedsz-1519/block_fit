import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../../lib/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  const { code } = req.body ?? {};
  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'Missing sync code' });
  }

  const cleanCode = code.trim().toUpperCase();
  const { data, error } = await supabase.from('sync_profiles').select('profile').eq('code', cleanCode).maybeSingle();

  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'Sync code not found or expired' });

  return res.status(200).json({ profile: data.profile });
}
