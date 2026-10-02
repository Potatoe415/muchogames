// Daily play coins for api/profile/index.js. Not a route itself.
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

/** `{ spent: false }` (HTTP 200) when today's coins are used up. */
export async function handleSpendCoin(res, identity) {
  if (isAdminUserId(identity.userId)) {
    sendJson(res, 200, { spent: true, unlimited: true });
    return;
  }

  const { data, error } = await getServiceClient().rpc(
    "spend_muchogames_coin",
    { p_id: identity.userId, p_daily: DAILY_COINS }
  );

  if (error) {
    sendError(res, "server-error", error.message);
    return;
  }

  if (data === null) {
    sendJson(res, 200, { spent: false, remaining: 0 });
    return;
  }

  sendJson(res, 200, {
    spent: true,
    remaining: Math.max(0, DAILY_COINS - data)
  });
}
