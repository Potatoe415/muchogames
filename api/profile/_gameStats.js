// Per-game results for api/profile/index.js. Not a route itself.
import { sendError, sendJson } from "../_lib/http.js";
import { getServiceClient } from "../_lib/supabase.js";

const GAME_ID_RE = /^[a-z0-9-]{1,64}$/;
const MAX_SCORE = 100000;
// PostgREST "function not found": 0005_game_stats.sql has not run yet.
const MISSING_FUNCTION = "PGRST202";

export function readGameId(value) {
  return typeof value === "string" && GAME_ID_RE.test(value) ? value : null;
}

export function readScore(value) {
  const n = Number(value);
  if (value === undefined || value === null || !Number.isInteger(n)) {
    return null;
  }
  return n >= 0 && n <= MAX_SCORE ? n : null;
}

/**
 * Adds wins/losses to the profile and, with a gameId, to that game's row.
 * Falls back to the totals-only function while the per-game migration is
 * missing, so results keep counting whichever ships first.
 */
export async function recordGameResult({
  profileId,
  gameId,
  wins,
  losses,
  score
}) {
  const client = getServiceClient();
  if (gameId) {
    const { data, error } = await client.rpc("record_muchogames_game_result", {
      p_id: profileId,
      p_game_id: gameId,
      p_wins: wins,
      p_losses: losses,
      p_score: score
    });
    if (error?.code !== MISSING_FUNCTION) return { data, error };
  }
  return client.rpc("increment_muchogames_profile_stats", {
    p_id: profileId,
    p_wins: wins,
    p_losses: losses
  });
}

/** Per-game breakdown for /profile, most recently played first. */
export async function handleGameStats(res, identity) {
  const { data, error } = await getServiceClient()
    .from("muchogames_game_stats")
    .select("game_id, wins, losses, best_score, last_played_at")
    .eq("profile_id", identity.userId)
    .order("last_played_at", { ascending: false });

  if (error) {
    sendError(res, "server-error", error.message);
    return;
  }

  sendJson(res, 200, {
    games: data.map((row) => ({
      gameId: row.game_id,
      wins: row.wins,
      losses: row.losses,
      bestScore: row.best_score,
      lastPlayedAt: row.last_played_at
    }))
  });
}
