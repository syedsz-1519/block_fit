/**
 * lib/validate.ts
 * Shared request-body validators for all /api routes.
 * Keeps handler code clean and guarantees consistent 400 errors.
 */

import type { VercelResponse } from '@vercel/node';

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false };

// ── Primitives ─────────────────────────────────────────────────────────────────

/** Assert value is a non-empty string, max length enforced. */
export function assertString(
  val: unknown,
  field: string,
  res: VercelResponse,
  maxLen = 100
): string | null {
  if (typeof val !== 'string' || val.trim().length === 0) {
    res.status(400).json({ error: `${field} must be a non-empty string` });
    return null;
  }
  return val.trim().substring(0, maxLen);
}

/** Assert value is a finite integer within [min, max]. */
export function assertInt(
  val: unknown,
  field: string,
  res: VercelResponse,
  min = -Infinity,
  max = Infinity
): number | null {
  const n = typeof val === 'string' ? parseInt(val, 10) : val;
  if (typeof n !== 'number' || !Number.isFinite(n) || n < min || n > max) {
    res.status(400).json({ error: `${field} must be an integer between ${min} and ${max}` });
    return null;
  }
  return n;
}

/** Validate a YYYY-MM-DD date string and return it, or fall back to today. */
export function parseDate(raw: unknown): string {
  const DATE_RE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
  if (typeof raw === 'string' && DATE_RE.test(raw)) return raw;
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
}

/** Validate a YYYY-MM-DD date string strictly (returns null + 400 if invalid). */
export function assertDate(
  raw: unknown,
  field: string,
  res: VercelResponse
): string | null {
  const DATE_RE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
  if (typeof raw !== 'string' || !DATE_RE.test(raw)) {
    res.status(400).json({ error: `${field} must be a valid date in YYYY-MM-DD format` });
    return null;
  }
  return raw;
}

/** Validate 6-char uppercase sync code. */
export function assertSyncCode(
  val: unknown,
  field: string,
  res: VercelResponse
): string | null {
  const SYNC_CODE_RE = /^[A-Z2-9]{6}$/;
  if (typeof val !== 'string') {
    res.status(400).json({ error: `${field} must be a string` });
    return null;
  }
  const clean = val.trim().toUpperCase();
  if (!SYNC_CODE_RE.test(clean)) {
    res.status(400).json({ error: `${field} must be exactly 6 characters (letters and digits, no I/O/0/1)` });
    return null;
  }
  return clean;
}

/** Validate a username: non-empty, max 20 chars, strip control chars/HTML. */
export function assertUsername(val: unknown, res: VercelResponse): string | null {
  if (typeof val !== 'string' || val.trim().length === 0) {
    res.status(400).json({ error: 'username must be a non-empty string' });
    return null;
  }
  const clean = val
    .replace(/[\x00-\x1F\x7F]/g, '')
    .replace(/<[^>]*>/g, '')
    .trim()
    .substring(0, 20);
  if (clean.length === 0) {
    res.status(400).json({ error: 'username contains only invalid characters' });
    return null;
  }
  return clean;
}

/** Validate stars (1–3). */
export function assertStars(val: unknown, res: VercelResponse): number | null {
  return assertInt(val, 'stars', res, 1, 3);
}

/** Validate moves (0–9999). */
export function assertMoves(val: unknown, res: VercelResponse): number | null {
  return assertInt(val, 'moves', res, 0, 9999);
}

/** Validate time in seconds (0–86400). */
export function assertTime(val: unknown, res: VercelResponse): number | null {
  return assertInt(val, 'time', res, 0, 86_400);
}

/** Validate levelId (1–9999). */
export function assertLevelId(val: unknown, res: VercelResponse): number | null {
  return assertInt(val, 'levelId', res, 1, 9999);
}
