import type { VercelRequest, VercelResponse } from '@vercel/node';

const ALLOWED_ORIGINS = new Set([
  process.env.APP_URL ?? '',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
]);

const isLocalNetworkOrigin = (origin: string): boolean => {
  try {
    const url = new URL(origin);
    const hostname = url.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') return true;
    if (hostname.startsWith('192.168.')) return true;
    if (hostname.startsWith('10.')) return true;
    if (hostname.startsWith('172.')) {
      const parts = hostname.split('.');
      if (parts.length >= 2) {
        const secondPart = parseInt(parts[1], 10);
        return secondPart >= 16 && secondPart <= 31;
      }
    }
  } catch (e) {
    // Ignore invalid origins
  }
  return false;
};

/**
 * Applies strict CORS headers to every API response and handles OPTIONS preflight.
 * Rejects wildcard origins to secure leaderboard and match profile guards.
 */
export function applyCors(req: VercelRequest, res: VercelResponse): boolean {
  const origin = req.headers['origin'] ?? '';

  if (ALLOWED_ORIGINS.has(origin) || isLocalNetworkOrigin(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Short-circuit preflight requests
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return true;
  }

  return false;
}
