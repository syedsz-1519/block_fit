import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyCors } from '../lib/cors';

export default function handler(req: VercelRequest, res: VercelResponse): void {
  if (applyCors(req, res)) return;
  try {
    res.status(200).json({ status: 'ok', time: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
}
