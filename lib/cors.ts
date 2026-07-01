import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Applies CORS headers to every API response and handles OPTIONS preflight.
 * Call at the top of every handler, and return immediately if it returns true.
 *
 * @example
 *   export default function handler(req, res) {
 *     if (applyCors(req, res)) return;
 *     // ... rest of handler
 *   }
 */
export function applyCors(req: VercelRequest, res: VercelResponse): boolean {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Short-circuit preflight requests
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return true;
  }

  return false;
}
