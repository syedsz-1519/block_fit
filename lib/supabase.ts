import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// ── Security guard ────────────────────────────────────────────────────────────
// Catch placeholder / example values that were never replaced.
const PLACEHOLDER_PATTERNS = ['YOUR_', 'MY_', 'example', 'YOUR-PROJECT'];
const looksLikePlaceholder = (v: string) =>
  PLACEHOLDER_PATTERNS.some((p) => v.toUpperCase().includes(p.toUpperCase()));

if (!supabaseUrl || !supabaseServiceKey) {
  // Don't throw at import time (would crash the whole function bundle) —
  // log loudly instead so it's obvious in Vercel function logs what's missing.
  console.error(
    '[Block Fit] ❌ SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set. ' +
      'Add them in Vercel Project Settings → Environment Variables. ' +
      'All /api routes that touch the database will return 500 until this is fixed.'
  );
} else if (looksLikePlaceholder(supabaseUrl) || looksLikePlaceholder(supabaseServiceKey)) {
  console.error(
    '[Block Fit] ❌ SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY still contain placeholder values. ' +
      'Replace them with your real Supabase project credentials.'
  );
}

// Service-role key is used because these calls only ever happen server-side
// (inside Vercel serverless functions), NEVER in the browser — so RLS stays
// strict on all client-side access and we bypass it intentionally here.
export const supabase = createClient(supabaseUrl ?? '', supabaseServiceKey ?? '', {
  auth: {
    persistSession: false,      // no cookie/localStorage — server-side only
    autoRefreshToken: false,    // no background token refresh in a function
    detectSessionInUrl: false,  // not a browser
  },
  global: {
    headers: {
      // Identify server-side calls in Supabase logs
      'x-application-name': 'block-fit-api',
    },
  },
});
