import { createHmac, timingSafeEqual } from 'node:crypto';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getServiceClient } from './supabaseAdmin';

const COOKIE = 'mg-profile';
const CODE_RE = /^[A-Za-z0-9_-]{20,64}$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_DELTA = 100_000;

export function clampStat(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.min(MAX_DELTA, Math.floor(n));
}

function sign(profileId: string): string {
  const mac = createHmac('sha256', process.env.SUPABASE_SERVICE_ROLE_KEY!)
    .update(profileId)
    .digest('base64url');
  return `${profileId}.${mac}`;
}

export function profileIdFromCookie(value: string | undefined): string | null {
  if (!value) return null;
  const dot = value.lastIndexOf('.');
  if (dot <= 0) return null;
  const profileId = value.slice(0, dot);
  if (!UUID_RE.test(profileId)) return null;
  const expected = sign(profileId);
  const left = Buffer.from(value);
  const right = Buffer.from(expected);
  if (left.length !== right.length) return null;
  return timingSafeEqual(left, right) ? profileId : null;
}

function readCookie(header: string | undefined): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === COOKIE) return decodeURIComponent(rest.join('='));
  }
  return undefined;
}

function writeCookie(res: VercelResponse, profileId: string): void {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader('Set-Cookie', `${COOKIE}=${sign(profileId)}; HttpOnly; Path=/; SameSite=Lax${secure}`);
}

async function consumeLaunchCode(code: string): Promise<string | null> {
  if (!CODE_RE.test(code)) return null;
  const now = new Date().toISOString();
  const { data, error } = await getServiceClient()
    .from('muchogames_launch_codes')
    .update({ used_at: now })
    .eq('code', code)
    .is('used_at', null)
    .gt('expires_at', now)
    .select('profile_id')
    .maybeSingle();
  if (error || !data?.profile_id) return null;
  return String(data.profile_id);
}

// Hub game id (root repo `public/hub-config.json`), for the hub profile's
// per-game breakdown.
const HUB_GAME_ID = 'tranquil';
// PostgREST "function not found": the hub's 0005_game_stats.sql has not run
// yet, so fall back to the totals-only function from 0003.
const MISSING_FUNCTION = 'PGRST202';

async function addStats(profileId: string, wins: number, losses: number): Promise<boolean> {
  if (wins === 0 && losses === 0) return true;
  const client = getServiceClient();
  const perGame = await client.rpc('record_muchogames_game_result', {
    p_id: profileId,
    p_game_id: HUB_GAME_ID,
    p_wins: wins,
    p_losses: losses,
  });
  if (perGame.error?.code !== MISSING_FUNCTION) return !perGame.error && Boolean(perGame.data);
  const { data, error } = await client.rpc('increment_muchogames_profile_stats', {
    p_id: profileId,
    p_wins: wins,
    p_losses: losses,
  });
  return !error && Boolean(data);
}

/** Consumes a hub launch code when present, then adds the delta for that profile. */
export async function linkAndAddStats(
  req: VercelRequest,
  res: VercelResponse,
  code: string | null,
  wins: number,
  losses: number,
): Promise<boolean> {
  const fromCode = code ? await consumeLaunchCode(code) : null;
  if (fromCode) writeCookie(res, fromCode);
  const existing = profileIdFromCookie(readCookie(req.headers.cookie));
  const profileId = fromCode ?? existing;
  if (!profileId) return false;
  return addStats(profileId, wins, losses);
}
