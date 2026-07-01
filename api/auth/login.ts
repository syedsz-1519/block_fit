import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applySecurityGuards } from '../../lib/apiSecurity';
import { isRateLimited } from '../../lib/rateLimit';
import { supabase } from '../../lib/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (applySecurityGuards(req, res)) return;
  if (isRateLimited(req, res, 20)) return; // 20 requests per minute

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    res.status(405).json({ error: `Method ${req.method} not allowed` });
    return;
  }

  const { email, password } = req.body ?? {};
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }

    const user = data.user;
    const session = data.session;
    const username = user?.user_metadata?.username || user?.email?.split('@')[0] || 'Player';

    res.status(200).json({
      success: true,
      userId: user?.id,
      email: user?.email,
      username,
      token: session?.access_token,
    });
  } catch (err) {
    console.error('[auth/login] Error:', err);
    res.status(500).json({ error: 'Internal server error during login' });
  }
}
