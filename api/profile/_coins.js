// Signed-in daily coin balance, read by api/match.js. Not a route itself.
import { isAdminUserId } from "../_lib/adminAuth.js";
import { sendError, sendJson } from "../_lib/http.js";
import { getServiceClient } from "../_lib/supabase.js";

// Must match DAILY_COINS in hub-coins.js.
export const DAILY_COINS = 10;

function parisToday() {
  // en-CA formats as YYYY-MM-DD, the same shape Postgres returns for `date`.
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris" }).format(
    new Date()
  );
}

export async function handleCoins(res, identity) {
  if (isAdminUserId(identity.userId)) {
    sendJson(res, 200, { unlimited: true, daily: DAILY_COINS });
    return;
  }

  const { data, error } = await getServiceClient()
    .from("muchogames_coins")
    .select("day, spent")
    .eq("profile_id", identity.userId)
    .maybeSingle();

  if (error) {
    sendError(res, "server-error", error.message);
    return;
  }

  const spent = data && data.day === parisToday() ? data.spent : 0;
  sendJson(res, 200, {
    unlimited: false,
    daily: DAILY_COINS,
    remaining: Math.max(0, DAILY_COINS - spent)
  });
}
