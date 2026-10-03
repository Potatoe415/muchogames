import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import type { CoinchappGame } from "@/lib/profileGames";
import { getServiceClient } from "@/lib/supabase/server";

const COOKIE = "mg-profile";
const CODE_RE = /^[A-Za-z0-9_-]{20,64}$/;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_DELTA = 100_000;

export function clampStat(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.min(MAX_DELTA, Math.floor(value));
}

function sign(profileId: string): string {
  const mac = createHmac("sha256", process.env.SUPABASE_SERVICE_ROLE_KEY!)
    .update(profileId)
    .digest("base64url");
  return `${profileId}.${mac}`;
}

export function profileIdFromCookie(value: string | undefined): string | null {
  if (!value) return null;
  const dot = value.lastIndexOf(".");
  if (dot <= 0) return null;
  const profileId = value.slice(0, dot);
  if (!UUID_RE.test(profileId)) return null;
  const expected = sign(profileId);
  const left = Buffer.from(value);
  const right = Buffer.from(expected);
  if (left.length !== right.length) return null;
  return timingSafeEqual(left, right) ? profileId : null;
}

export async function readLinkedProfileId(): Promise<string | null> {
  const store = await cookies();
  return profileIdFromCookie(store.get(COOKIE)?.value);
}

async function writeCookie(profileId: string): Promise<void> {
  const store = await cookies();
  store.set(COOKIE, sign(profileId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
}

async function consumeLaunchCode(code: string): Promise<string | null> {
  if (!CODE_RE.test(code)) return null;
  const now = new Date().toISOString();
  const { data, error } = await getServiceClient()
    .from("muchogames_launch_codes")
    .update({ used_at: now })
    .eq("code", code)
    .is("used_at", null)
    .gt("expires_at", now)
    .select("profile_id")
    .maybeSingle();
  if (error || !data?.profile_id) return null;
  return String(data.profile_id);
}

// PostgREST "function not found": the hub's 0005_game_stats.sql has not run
// yet, so fall back to the totals-only function from 0003.
const MISSING_FUNCTION = "PGRST202";

async function addStats(
  profileId: string,
  wins: number,
  losses: number,
  game: CoinchappGame | null,
): Promise<boolean> {
  if (wins === 0 && losses === 0) return true;
  const client = getServiceClient();
  if (game) {
    const { data, error } = await client.rpc("record_muchogames_game_result", {
      p_id: profileId,
      p_game_id: game,
      p_wins: wins,
      p_losses: losses,
    });
    if (error?.code !== MISSING_FUNCTION) return !error && Boolean(data);
  }
  const { data, error } = await client.rpc("increment_muchogames_profile_stats", {
    p_id: profileId,
    p_wins: wins,
    p_losses: losses,
  });
  return !error && Boolean(data);
}

/** Consumes a hub launch code when present, then adds the delta for that
 *  profile (and that game's row on the hub profile when `game` is given). */
export async function linkAndAddStats(
  code: string | null,
  wins: number,
  losses: number,
  game: CoinchappGame | null = null,
): Promise<boolean> {
  const fromCode = code ? await consumeLaunchCode(code) : null;
  if (fromCode) await writeCookie(fromCode);
  const profileId = fromCode ?? (await readLinkedProfileId());
  if (!profileId) return false;
  return addStats(profileId, clampStat(wins), clampStat(losses), game);
}
