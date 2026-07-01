/**
 * lib/rateLimit.ts
 * In-memory sliding-window rate limiter for Vercel serverless functions.
 *
 * Works per-IP. Because each Vercel function instance has its own memory,
 * this is NOT globally shared — but it still provides meaningful protection
 * per cold-start instance and is zero-dependency.
 *
 * For true global rate-limiting at scale, swap this for an Upstash Redis
 * limiter (just replace `checkRateLimit` below with `@upstash/ratelimit`).
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

interface RateLimitWindow {
  count: number;
  resetAt: number; // ms epoch
}

const store = new Map<string, RateLimitWindow>();

// Purge stale entries every 5 minutes to prevent memory leaks.
setInterval(() => {
  const now = Date.now();
  for (const [key, window] of store.entries()) {
    if (now > window.resetAt) store.delete(key);
  }
}, 5 * 60 * 1000);

/**
 * Check whether the request IP has exceeded the limit.
 * @param req        Vercel request
 * @param res        Vercel response (headers are written if limited)
 * @param maxPerMin  Maximum requests allowed per 60-second window (default 60)
 * @returns true if the request should be rejected (caller must return)
 */
export function isRateLimited(
  req: VercelRequest,
  res: VercelResponse,
  maxPerMin = 60
): boolean {
  const ip =
    (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ??
    req.socket?.remoteAddress ??
    'unknown';

  const key = `${ip}`;
  const now = Date.now();
  const windowMs = 60_000; // 1 minute

  const existing = store.get(key);

  if (!existing || now > existing.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    res.setHeader('X-RateLimit-Limit', String(maxPerMin));
    res.setHeader('X-RateLimit-Remaining', String(maxPerMin - 1));
    res.setHeader('X-RateLimit-Reset', String(Math.floor((now + windowMs) / 1000)));
    return false;
  }

  existing.count++;
  const remaining = Math.max(0, maxPerMin - existing.count);
  res.setHeader('X-RateLimit-Limit', String(maxPerMin));
  res.setHeader('X-RateLimit-Remaining', String(remaining));
  res.setHeader('X-RateLimit-Reset', String(Math.floor(existing.resetAt / 1000)));

  if (existing.count > maxPerMin) {
    res.setHeader('Retry-After', '60');
    res.status(429).json({
      error: 'Too many requests — please slow down and try again in a minute.',
      retryAfter: 60,
    });
    return true;
  }

  return false;
}
