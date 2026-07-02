import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applySecurityGuards } from '../../lib/apiSecurity';
import { isRateLimited } from '../../lib/rateLimit';
import { supabase } from '../../lib/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  // Apply standard CORS and size checks, then rate limit
  if (applySecurityGuards(req, res)) return;
  if (isRateLimited(req, res, 30)) return;

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    res.status(405).json({ error: `Method ${req.method} not allowed` });
    return;
  }

  try {
    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    const redirectUrl = `${appUrl}/api/auth/callback`;

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }

    if (!data?.url) {
      res.status(500).json({ error: 'Failed to generate OAuth redirect URL' });
      return;
    }

    // Redirect the browser straight to Google OAuth consent screen
    res.redirect(303, data.url);
  } catch (err) {
    console.error('[auth/google] Error:', err);
    res.status(500).json({ error: 'Internal server error during Google OAuth initiation' });
  }
}
