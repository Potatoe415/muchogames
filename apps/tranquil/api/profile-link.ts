import type { VercelRequest, VercelResponse } from '@vercel/node';
import { clampStat, linkAndAddStats } from './_lib/profileLink';

/** Links this browser to the hub profile and adds a win/loss delta.
 *  No launch code and no cookie: `{ linked: false }`, nothing is written. */
export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }
  const body = (req.body ?? {}) as { code?: unknown; wins?: unknown; losses?: unknown };
  const code = typeof body.code === 'string' && body.code.length > 0 ? body.code : null;
  try {
    const linked = await linkAndAddStats(req, res, code, clampStat(body.wins), clampStat(body.losses));
    res.status(200).json({ linked });
  } catch {
    res.status(500).json({ error: 'profile_stats_failed' });
  }
}
