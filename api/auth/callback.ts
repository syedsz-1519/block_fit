import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../../lib/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  // Callback is called directly from OAuth redirects, standard GET check
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    res.status(405).json({ error: `Method ${req.method} not allowed` });
    return;
  }

  // Supabase Auth exchanges authorization code for a session
  const code = req.query.code;
  const appUrl = process.env.APP_URL || 'http://localhost:5173';

  if (!code) {
    // If no code is present, check if there was an error in redirect
    const errorDescription = req.query.error_description || 'OAuth authorization failed';
    res.redirect(307, `${appUrl}/?auth_error=${encodeURIComponent(String(errorDescription))}`);
    return;
  }

  try {
    const { data, error } = await supabase.auth.exchangeCodeForSession(String(code));

    if (error) {
      res.redirect(307, `${appUrl}/?auth_error=${encodeURIComponent(error.message)}`);
      return;
    }

    const session = data.session;
    const user = data.user;

    if (!session || !user) {
      res.redirect(307, `${appUrl}/?auth_error=Session%20exchange%20failed`);
      return;
    }

    const token = session.access_token;
    const email = user.email || '';
    const userId = user.id;
    const username = user.user_metadata?.username || email.split('@')[0] || 'Player';

    // Redirect the user back to the web application with credentials in the query parameters
    const targetRedirect = `${appUrl}/?token=${encodeURIComponent(token)}&userId=${encodeURIComponent(userId)}&email=${encodeURIComponent(email)}&username=${encodeURIComponent(username)}`;
    res.redirect(303, targetRedirect);
  } catch (err) {
    console.error('[auth/callback] Error:', err);
    res.redirect(307, `${appUrl}/?auth_error=Internal%20server%20error`);
  }
}
