import {
  readJsonBody,
  sendError,
  sendJson,
  withErrorHandling
} from "../_lib/http.js";
import { clientKey, isRateLimited } from "../_lib/rateLimit.js";
import { getServiceClient } from "../_lib/supabase.js";
import { exchangeGoogleIdToken } from "../_lib/googleAuth.js";
import { toPublicProfile } from "./_shared.js";

const THROTTLE = { maxHits: 10, windowMs: 60000 };
const MAX_DELTA = 100000;

/**
 * One-shot fold of this browser's existing local win/loss counters into the
 * shared profile. Ongoing games use record-result.js (+1) instead.
 */
async function handler(req, res) {
  if (req.method !== "POST") {
    sendError(res, "method-not-allowed", "Use POST to add results.");
    return;
  }

  if (isRateLimited(`profile-add:${clientKey(req)}`, THROTTLE)) {
    sendError(res, "too-many-requests", "Too many requests. Try again later.");
    return;
  }

  const body = await readJsonBody(req);
  const idToken = typeof body.idToken === "string" ? body.idToken : "";
  const wins = clampStat(body.wins);
  const losses = clampStat(body.losses);
  if (!idToken || (wins === 0 && losses === 0)) {
    sendError(
      res,
      "invalid-profile",
      "idToken and a positive total are required."
    );
    return;
  }

  const identity = await exchangeGoogleIdToken(idToken);
  if (!identity) {
    sendError(res, "unauthorized", "Invalid or expired Google sign-in.");
    return;
  }

  const { data, error } = await getServiceClient().rpc(
    "increment_muchogames_profile_stats",
    { p_id: identity.userId, p_wins: wins, p_losses: losses }
  );

  if (error || !data) {
    sendError(res, "server-error", error?.message || "profile row missing");
    return;
  }

  sendJson(res, 200, { profile: toPublicProfile(data) });
}

function clampStat(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.min(MAX_DELTA, Math.floor(n));
}

export default withErrorHandling(handler);
