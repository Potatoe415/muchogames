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

const THROTTLE = { maxHits: 60, windowMs: 60000 };

/** Returns the signed-in player's own profile, or an empty one if none exists yet. */
async function handler(req, res) {
  if (req.method !== "POST") {
    sendError(res, "method-not-allowed", "Use POST to read a profile.");
    return;
  }

  if (isRateLimited(`profile-get:${clientKey(req)}`, THROTTLE)) {
    sendError(res, "too-many-requests", "Too many requests. Try again later.");
    return;
  }

  const body = await readJsonBody(req);
  const idToken = typeof body.idToken === "string" ? body.idToken : "";
  if (!idToken) {
    sendError(res, "unauthorized", "Missing idToken.");
    return;
  }

  const identity = await exchangeGoogleIdToken(idToken);
  if (!identity) {
    sendError(res, "unauthorized", "Invalid or expired Google sign-in.");
    return;
  }

  const { data, error } = await getServiceClient()
    .from("muchogames_profiles")
    .select("name, avatar_url, wins, losses")
    .eq("id", identity.userId)
    .maybeSingle();

  if (error) {
    sendError(res, "server-error", error.message);
    return;
  }

  sendJson(res, 200, { profile: toPublicProfile(data) });
}

export default withErrorHandling(handler);
