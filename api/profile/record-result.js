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

const THROTTLE = { maxHits: 30, windowMs: 60000 };

/**
 * Atomically increments the signed-in player's wins or losses by 1. Called
 * from same-origin Yatzy (browser) the same way it already calls
 * PlayerProfile.recordGameResult() locally — this is the shared-profile
 * mirror of that call, not a replacement for it.
 */
async function handler(req, res) {
  if (req.method !== "POST") {
    sendError(res, "method-not-allowed", "Use POST to record a result.");
    return;
  }

  if (isRateLimited(`profile-result:${clientKey(req)}`, THROTTLE)) {
    sendError(res, "too-many-requests", "Too many requests. Try again later.");
    return;
  }

  const body = await readJsonBody(req);
  const idToken = typeof body.idToken === "string" ? body.idToken : "";
  if (!idToken || typeof body.won !== "boolean") {
    sendError(
      res,
      "invalid-profile",
      "idToken and won (boolean) are required."
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
    {
      p_id: identity.userId,
      p_wins: body.won ? 1 : 0,
      p_losses: body.won ? 0 : 1
    }
  );

  if (error) {
    sendError(res, "server-error", error.message);
    return;
  }

  sendJson(res, 200, { profile: toPublicProfile(data) });
}

export default withErrorHandling(handler);
