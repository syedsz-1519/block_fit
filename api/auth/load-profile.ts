import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../../lib/supabase';
import { applyCors } from '../../lib/cors';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (applyCors(req, res)) return;

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    res.status(405).json({ error: `Method ${req.method} not allowed` });
    return;
  }

  const { userId } = req.query ?? {};
  if (!userId || typeof userId !== 'string') {
    res.status(400).json({ error: 'User ID is required' });
    return;
  }

  // Security Check: Authenticate request token to verify ownership
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid authorization header' });
    return;
  }

  const token = authHeader.split(' ')[1];
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user || user.id !== userId) {
    res.status(401).json({ error: 'Unauthorized profile access' });
    return;
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('profile_data')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    if (!data) {
      res.status(404).json({ error: 'Profile not found' });
      return;
    }

    res.status(200).json({ success: true, profile: data.profile_data });
  } catch (err) {
    console.error('[auth/load-profile] Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
