/**
 * lib/apiSecurity.ts
 * Shared security middleware for all /api Vercel serverless functions.
 *
 * Provides:
 *   - CORS headers (only the Vite origin or same-origin is allowed)
 *   - Security response headers (XSS, content sniffing, clickjacking)
 *   - Input size guard (rejects bodies > 64 KB)
 *   - Username sanitiser (strips control chars / HTML)
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

// ── CORS ──────────────────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = new Set([
  process.env.APP_URL ?? '',          // e.g. https://block-fit.vercel.app
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

export function setCorsHeaders(req: VercelRequest, res: VercelResponse): boolean {
  const origin = req.headers['origin'] ?? '';

  if (ALLOWED_ORIGINS.has(origin) || isLocalNetworkOrigin(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 h preflight cache

  // Handle OPTIONS preflight immediately
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return true; // caller should return immediately
  }
  return false;
}

// ── Security headers ──────────────────────────────────────────────────────────
export function setSecurityHeaders(res: VercelResponse): void {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  // API routes never serve HTML, so a tight CSP is safe here.
  res.setHeader('Content-Security-Policy', "default-src 'none'");
}

// ── Body size guard ────────────────────────────────────────────────────────────
const MAX_BODY_BYTES = 64 * 1024; // 64 KB

export function bodyTooLarge(req: VercelRequest, res: VercelResponse): boolean {
  const contentLength = parseInt(req.headers['content-length'] ?? '0', 10);
  if (contentLength > MAX_BODY_BYTES) {
    res.status(413).json({ error: 'Request body too large' });
    return true;
  }
  return false;
}

// ── Input sanitiser ────────────────────────────────────────────────────────────
// Strips HTML tags, null bytes, and control characters from a string.
export function sanitiseString(value: unknown, maxLen = 100): string {
  if (typeof value !== 'string') return '';
  return value
    .replace(/[\x00-\x1F\x7F]/g, '') // control characters
    .replace(/<[^>]*>/g, '')           // HTML tags
    .trim()
    .substring(0, maxLen);
}

// ── Apply all common guards in one call ───────────────────────────────────────
// Returns true if the handler should abort (preflight or body-too-large).
export function applySecurityGuards(req: VercelRequest, res: VercelResponse): boolean {
  if (setCorsHeaders(req, res)) return true;  // OPTIONS preflight handled
  setSecurityHeaders(res);
  if (bodyTooLarge(req, res)) return true;    // body > 64 KB rejected
  return false;
}
