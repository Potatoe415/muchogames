import { randomBytes } from "node:crypto";
import {
  readJsonBody,
  sendError,
  sendJson,
  withErrorHandling
} from "../_lib/http.js";
import { clientKey, isRateLimited } from "../_lib/rateLimit.js";
import { getServiceClient } from "../_lib/supabase.js";
import { exchangeGoogleIdToken } from "../_lib/googleAuth.js";

const THROTTLE = { maxHits: 20, windowMs: 60000 };
const CODE_TTL_MS = 60000; // 1 minute: only needs to survive one hub→game redirect.

/**
 * Mints a short-lived, single-use code so coinchapp/tranquil can resolve the
 * signed-in player's shared profile without ever receiving a raw Google or
 * Supabase token in a launch URL. Those apps read/consume the code directly
 * against `muchogames_launch_codes` (same Supabase project, their own
 * service-role key) — this hub never hears back about the redemption.
 */
async function handler(req, res) {
  if (req.method !== "POST") {
    sendError(res, "method-not-allowed", "Use POST to mint a launch code.");
    return;
  }

  if (isRateLimited(`profile-launch-code:${clientKey(req)}`, THROTTLE)) {
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

  const code = randomBytes(18).toString("base64url");
  const { error } = await getServiceClient()
    .from("muchogames_launch_codes")
    .insert({
      code,
      profile_id: identity.userId,
      expires_at: new Date(Date.now() + CODE_TTL_MS).toISOString()
    });

  if (error) {
    sendError(res, "server-error", error.message);
    return;
  }

  sendJson(res, 200, { code });
}

export default withErrorHandling(handler);
