import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../../lib/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  const { code, profile } = req.body ?? {};
  if (!code || !profile || typeof code !== 'string') {
    return res.status(400).json({ error: 'Missing parameters' });
  }

  const cleanCode = code.trim().toUpperCase();

  const { data: existing, error: findErr } = await supabase
    .from('sync_profiles')
    .select('code')
    .eq('code', cleanCode)
    .maybeSingle();

  if (findErr) return res.status(500).json({ error: findErr.message });
  if (!existing) return res.status(404).json({ error: 'Sync code not found' });

  const { error: updErr } = await supabase
    .from('sync_profiles')
    .update({ profile, updated_at: new Date().toISOString() })
    .eq('code', cleanCode);

  if (updErr) return res.status(500).json({ error: updErr.message });

  return res.status(200).json({ success: true });
}
