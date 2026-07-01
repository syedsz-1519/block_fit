import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  // Don't throw at import time (would crash the whole function bundle) —
  // log loudly instead so it's obvious in Vercel function logs what's missing.
  console.warn(
    '[Block Fit] SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set. ' +
      'Add them in Vercel Project Settings → Environment Variables. ' +
      'All /api routes that touch the database will return 500 until this is fixed.'
  );
}

// Service-role key is used because these calls only ever happen server-side
// (inside Vercel functions), never in the browser — so RLS can stay strict
// and we bypass it intentionally here.
export const supabase = createClient(supabaseUrl ?? '', supabaseServiceKey ?? '', {
  auth: { persistSession: false },
});
