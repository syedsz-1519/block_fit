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

  const { code, profile } = req.body ?? {};
  if (!code || !profile || typeof code !== 'string') {
    res.status(400).json({ error: 'Missing parameters' });
    return;
  }

  const cleanCode = code.trim().toUpperCase();
  // Sync codes are exactly 6 characters
  if (cleanCode.length !== 6) {
    res.status(400).json({ error: 'Sync code must be exactly 6 characters' });
    return;
  }

  try {
    const { data: existing, error: findErr } = await supabase
      .from('sync_profiles')
      .select('code')
      .eq('code', cleanCode)
      .maybeSingle();

    if (findErr) { res.status(500).json({ error: findErr.message }); return; }
    if (!existing) { res.status(404).json({ error: 'Sync code not found' }); return; }

    const { error: updErr } = await supabase
      .from('sync_profiles')
      .update({ profile, updated_at: new Date().toISOString() })
      .eq('code', cleanCode);

    if (updErr) { res.status(500).json({ error: updErr.message }); return; }

    res.status(200).json({ success: true });
  } catch (err) {
    console.error('[sync/save]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
