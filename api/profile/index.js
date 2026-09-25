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
import { randomBytes } from "node:crypto";

// One Serverless Function fanning out on `action` instead of 5 separate
// files — Vercel's Hobby plan caps a deployment at 12 functions total.
// Each action keeps the exact throttle it had as its own endpoint.
const THROTTLES = {
  get: { maxHits: 60, windowMs: 60000 },
  upsert: { maxHits: 30, windowMs: 60000 },
  "add-results": { maxHits: 10, windowMs: 60000 },
  "launch-code": { maxHits: 20, windowMs: 60000 },
  "record-result": { maxHits: 30, windowMs: 60000 }
};

const MAX_NAME_LENGTH = 40;
// ~25 KB base64 data URL, same cap /profile already enforces client-side.
const MAX_AVATAR_DATA_URL_LENGTH = 35000;
const MAX_STAT_DELTA = 100000;
const LAUNCH_CODE_TTL_MS = 60000; // 1 minute: only needs to survive one hub→game redirect.

async function handler(req, res) {
  if (req.method !== "POST") {
    sendError(res, "method-not-allowed", "Use POST for /api/profile.");
    return;
  }

  const body = await readJsonBody(req);
  const action = typeof body.action === "string" ? body.action : "";
  const throttle = THROTTLES[action];
  if (!throttle) {
    sendError(res, "invalid-action", "Unknown or missing action.");
    return;
  }

  if (isRateLimited(`profile-${action}:${clientKey(req)}`, throttle)) {
    sendError(res, "too-many-requests", "Too many requests. Try again later.");
    return;
  }

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

  switch (action) {
    case "get":
      return handleGet(res, identity);
    case "upsert":
      return handleUpsert(res, identity, body);
    case "add-results":
      return handleAddResults(res, identity, body);
    case "launch-code":
      return handleLaunchCode(res, identity);
    case "record-result":
      return handleRecordResult(res, identity, body);
  }
}

/** Returns the signed-in player's own profile, or an empty one if none exists yet. */
async function handleGet(res, identity) {
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

/**
 * Creates or updates the signed-in player's name/avatar. Wins/losses are not
 * touched here — see handleRecordResult for the atomic increment path.
 */
async function handleUpsert(res, identity, body) {
  const patch = buildProfilePatch(identity.userId, body);
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

function buildProfilePatch(userId, body) {
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

/**
 * One-shot fold of this browser's existing local win/loss counters into the
 * shared profile. Ongoing games use handleRecordResult (+1) instead.
 */
async function handleAddResults(res, identity, body) {
  const wins = clampStatDelta(body.wins);
  const losses = clampStatDelta(body.losses);
  if (wins === 0 && losses === 0) {
    sendError(res, "invalid-profile", "A positive total is required.");
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

function clampStatDelta(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.min(MAX_STAT_DELTA, Math.floor(n));
}

/**
 * Mints a short-lived, single-use code so coinchapp/tranquil can resolve the
 * signed-in player's shared profile without ever receiving a raw Google or
 * Supabase token in a launch URL. Those apps read/consume the code directly
 * against `muchogames_launch_codes` (same Supabase project, their own
 * service-role key) — this hub never hears back about the redemption.
 */
async function handleLaunchCode(res, identity) {
  const code = randomBytes(18).toString("base64url");
  const { error } = await getServiceClient()
    .from("muchogames_launch_codes")
    .insert({
      code,
      profile_id: identity.userId,
      expires_at: new Date(Date.now() + LAUNCH_CODE_TTL_MS).toISOString()
    });

  if (error) {
    sendError(res, "server-error", error.message);
    return;
  }

  sendJson(res, 200, { code });
}

/**
 * Atomically increments the signed-in player's wins or losses by 1. Called
 * from same-origin Yatzy (browser) the same way it already calls
 * PlayerProfile.recordGameResult() locally — this is the shared-profile
 * mirror of that call, not a replacement for it.
 */
async function handleRecordResult(res, identity, body) {
  if (typeof body.won !== "boolean") {
    sendError(res, "invalid-profile", "won (boolean) is required.");
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
