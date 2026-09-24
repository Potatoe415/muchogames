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
const MAX_NAME_LENGTH = 40;
// ~50 KB base64 data URL, same cap /profile already enforces client-side.
const MAX_AVATAR_DATA_URL_LENGTH = 70000;

/**
 * Creates or updates the signed-in player's name/avatar. Wins/losses are not
 * touched here — see record-result.js for the atomic increment path.
 */
async function handler(req, res) {
  if (req.method !== "POST") {
    sendError(res, "method-not-allowed", "Use POST to update a profile.");
    return;
  }

  if (isRateLimited(`profile-upsert:${clientKey(req)}`, THROTTLE)) {
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

  const patch = buildPatch(identity.userId, body);
  if (!patch) {
    sendError(res, "invalid-profile", "Invalid name or avatar.");
    return;
  }

  const { data, error } = await getServiceClient()
    .from("muchogames_profiles")
    .upsert(patch)
    .select()
    .single();

  if (error) {
    sendError(res, "server-error", error.message);
    return;
  }

  sendJson(res, 200, { profile: toPublicProfile(data) });
}

function buildPatch(userId, body) {
  const patch = { id: userId };

  if (body.name !== undefined) {
    if (typeof body.name !== "string" || body.name.length > MAX_NAME_LENGTH) {
      return null;
    }
    patch.name = body.name.trim();
  }

  if (body.avatarDataUrl !== undefined) {
    const avatar = body.avatarDataUrl;
    const isValid =
      avatar === "" ||
      (typeof avatar === "string" &&
        avatar.startsWith("data:image/") &&
        avatar.length <= MAX_AVATAR_DATA_URL_LENGTH);
    if (!isValid) return null;
    patch.avatar_url = avatar || null;
  }

  return patch;
}

export default withErrorHandling(handler);
