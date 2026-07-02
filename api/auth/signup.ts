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

    const user = data.user;

    // Create an initial default profile in the profiles table
    const defaultProfile = {
      levelProgress: {},
      currentLevel: 1,
      hintsRemaining: 3,
      isSubscribed: false,
      theme: 'light',
      soundEnabled: true,
      musicEnabled: true,
      hapticEnabled: true,
      colorblindMode: false,
      soundscape: 'zen',
      username: cleanUsername,
      userId: user.id,
      guestCreatedAt: new Date().toISOString(),
      isLoggedIn: true,
      userEmail: user.email,
      restrictedMode: false,
      authToken: ''
    };

    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        user_id: user.id,
        email: user.email,
        username: cleanUsername,
        profile_data: defaultProfile,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (profileError) {
      console.error('[auth/signup] Error inserting default profile row:', profileError);
    }

    res.status(201).json({
      success: true,
      userId: user.id,
      email: user.email,
      username: cleanUsername,
    });
  } catch (err) {
    console.error('[auth/signup] Error:', err);
    res.status(500).json({ error: 'Internal server error during registration' });
  }
}
