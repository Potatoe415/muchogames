import { isAdminUserId } from "./_lib/adminAuth.js";
import { exchangeGoogleIdToken } from "./_lib/googleAuth.js";
import {
  readJsonBody,
  sendError,
  sendJson,
  withErrorHandling
} from "./_lib/http.js";
import { clientKey, isRateLimited } from "./_lib/rateLimit.js";
import { getServiceClient } from "./_lib/supabase.js";
import { DAILY_COINS, handleCoins } from "./profile/_coins.js";

const THROTTLES = {
  start: { maxHits: 30, windowMs: 60000 },
  coins: { maxHits: 60, windowMs: 60000 }
};
const GAME_ID_PATTERN = /^[a-z0-9-]{1,64}$/;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Daily coins spent per match (docs/PLATFORM_RULES.md), called by
 * public/shared/js/game-session.js. Signed-in players send their Google ID
 * token; anonymous players only a random device id, so whoever knows a
 * device id can spend its coins — the same trust level as the browser
 * counter it replaces. An expired token falls back to the device id.
 */
async function handler(req, res) {
  if (req.method !== "POST") {
    sendError(res, "method-not-allowed", "Use POST for /api/match.");
    return;
  }

  const body = await readJsonBody(req);
  const action = typeof body.action === "string" ? body.action : "";
  const throttle = THROTTLES[action];
  if (!throttle) {
    sendError(res, "invalid-action", "Unknown or missing action.");
    return;
  }

  if (isRateLimited(`match-${action}:${clientKey(req)}`, throttle)) {
    sendError(res, "too-many-requests", "Too many requests. Try again later.");
    return;
  }

  const player = await resolvePlayer(body);
  if (!player) {
    sendError(res, "invalid-player", "A deviceId or idToken is required.");
    return;
  }

  if (action === "coins") return handlePlayerCoins(res, player);
  return handleStart(res, player, body.gameId);
}

async function resolvePlayer(body) {
  const idToken = typeof body.idToken === "string" ? body.idToken : "";
  const identity = idToken ? await exchangeGoogleIdToken(idToken) : null;
  if (identity) {
    return {
      profileId: identity.userId,
      unlimited: isAdminUserId(identity.userId)
    };
  }
  const deviceId = typeof body.deviceId === "string" ? body.deviceId : "";
  return UUID_PATTERN.test(deviceId)
    ? { deviceId: deviceId.toLowerCase(), unlimited: false }
    : null;
}

/** `{ started: false }` (HTTP 200) when today's coins are used up. */
async function handleStart(res, player, rawGameId) {
  const gameId = typeof rawGameId === "string" ? rawGameId.trim() : "";
  if (!GAME_ID_PATTERN.test(gameId)) {
    sendError(res, "invalid-event", "gameId must be a hub game id.");
    return;
  }

  const { data, error } = await getServiceClient().rpc(
    "start_muchogames_match",
    {
      p_game_id: gameId,
      p_daily: DAILY_COINS,
      p_profile_id: player.profileId || null,
      p_device_id: player.deviceId || null,
      p_unlimited: player.unlimited
    }
  );

  if (error) {
    sendError(res, "server-error", error.message);
    return;
  }

  if (data === null) {
    sendJson(res, 200, { started: false, remaining: 0 });
    return;
  }

  sendJson(res, 200, {
    started: true,
    remaining: data,
    unlimited: player.unlimited
  });
}

async function handlePlayerCoins(res, player) {
  if (player.profileId) {
    await handleCoins(res, { userId: player.profileId });
    return;
  }

  const { data, error } = await getServiceClient().rpc(
    "muchogames_device_coins_left",
    { p_device_id: player.deviceId, p_daily: DAILY_COINS }
  );

  if (error) {
    sendError(res, "server-error", error.message);
    return;
  }

  sendJson(res, 200, {
    unlimited: false,
    daily: DAILY_COINS,
    remaining: Number.isInteger(data) ? data : DAILY_COINS
  });
}

export default withErrorHandling(handler);
