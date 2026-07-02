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

  const { userId, email, username, profileData } = req.body ?? {};
  if (!userId || !email || !username || !profileData) {
    res.status(400).json({ error: 'Missing required parameters' });
    return;
  }

  try {
    const { error } = await supabase
      .from('profiles')
      .upsert({
        user_id: userId,
        email,
        username,
        profile_data: profileData,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.status(200).json({ success: true });
  } catch (err) {
    console.error('[auth/save-profile] Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
