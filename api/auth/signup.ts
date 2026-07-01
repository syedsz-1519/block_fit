import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applySecurityGuards } from '../../lib/apiSecurity';
import { isRateLimited } from '../../lib/rateLimit';
import { supabase } from '../../lib/supabase';
import { assertUsername } from '../../lib/validate';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (applySecurityGuards(req, res)) return;
  if (isRateLimited(req, res, 15)) return; // 15 requests per minute

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    res.status(405).json({ error: `Method ${req.method} not allowed` });
    return;
  }

  const { email, password, username } = req.body ?? {};
  if (!email || !password || !username) {
    res.status(400).json({ error: 'Email, password, and username are required' });
    return;
  }

  const cleanUsername = assertUsername(username, res);
  if (!cleanUsername) return;

  try {
    // Call Supabase admin auth to create a confirmed user without verification email friction
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { username: cleanUsername },
    });

    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }

    res.status(201).json({
      success: true,
      userId: data.user.id,
      email: data.user.email,
      username: cleanUsername,
    });
  } catch (err) {
    console.error('[auth/signup] Error:', err);
    res.status(500).json({ error: 'Internal server error during registration' });
  }
}
