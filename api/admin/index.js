import { isAdminUserId, readSessionUserId } from "../_lib/adminAuth.js";
import { exchangeGoogleIdToken } from "../_lib/googleAuth.js";
import {
  readJsonBody,
  sendError,
  sendJson,
  withErrorHandling
} from "../_lib/http.js";
import { clientKey, isRateLimited } from "../_lib/rateLimit.js";
import { handleFeedbackList, handleFeedbackUpdate } from "./_feedback.js";
import {
  handleHubSettingsGet,
  handleHubSettingsUpdate
} from "./_hubSettings.js";
import {
  handlePlayerDelete,
  handlePlayerReset,
  handlePlayersList
} from "./_players.js";
import { handleStats } from "./_stats.js";

// One Serverless Function fanning out on `action`, like api/profile/index.js:
// Vercel's Hobby plan caps a deployment at 12 functions total.
const THROTTLES = {
  login: { maxHits: 10, windowMs: 600000 },
  stats: { maxHits: 60, windowMs: 60000 },
  "feedback-list": { maxHits: 60, windowMs: 60000 },
  "feedback-update": { maxHits: 60, windowMs: 60000 },
  "hub-settings-get": { maxHits: 60, windowMs: 60000 },
  "hub-settings-update": { maxHits: 30, windowMs: 60000 },
  "players-list": { maxHits: 60, windowMs: 60000 },
  "player-reset": { maxHits: 30, windowMs: 60000 },
  "player-delete": { maxHits: 10, windowMs: 600000 }
};

const ADMIN_ACTIONS = {
  stats: handleStats,
  "feedback-list": handleFeedbackList,
  "feedback-update": handleFeedbackUpdate,
  "hub-settings-get": handleHubSettingsGet,
  "hub-settings-update": handleHubSettingsUpdate,
  "players-list": handlePlayersList,
  "player-reset": handlePlayerReset,
  "player-delete": handlePlayerDelete
};

async function handler(req, res) {
  if (req.method !== "POST") {
    sendError(res, "method-not-allowed", "Use POST for /api/admin.");
    return;
  }

  const body = await readJsonBody(req);
  const action = typeof body.action === "string" ? body.action : "";
  const throttle = THROTTLES[action];
  if (!throttle) {
    sendError(res, "invalid-action", "Unknown or missing action.");
    return;
  }

  if (isRateLimited(`admin-${action}:${clientKey(req)}`, throttle)) {
    sendError(res, "too-many-requests", "Too many requests. Try again later.");
    return;
  }

  if (action === "login") {
    await handleLogin(res, body);
    return;
  }

  if (await requireAdminSession(res, body.token)) {
    await ADMIN_ACTIONS[action](res, body);
  }
}

/**
 * Trades a Google ID token for the Supabase access token behind it, but only
 * for an allowlisted user. A refused account is told its own user id, which is
 * the value the owner puts in ADMIN_USER_IDS when setting this up.
 */
async function handleLogin(res, body) {
  const idToken = typeof body.idToken === "string" ? body.idToken : "";
  const identity = await exchangeGoogleIdToken(idToken);

  if (!identity?.accessToken) {
    sendError(res, "unauthorized", "Invalid or expired Google sign-in.");
    return;
  }

  if (!isAdminUserId(identity.userId)) {
    sendError(
      res,
      "forbidden",
      `This Google account is not an admin (user id ${identity.userId}).`
    );
    return;
  }

  sendJson(res, 200, { token: identity.accessToken });
}

async function requireAdminSession(res, token) {
  const userId = await readSessionUserId(token);

  if (!userId) {
    sendError(res, "unauthorized", "Session expired. Sign in again.");
    return false;
  }

  if (!isAdminUserId(userId)) {
    sendError(res, "forbidden", "This account is not an admin.");
    return false;
  }

  return true;
}

export default withErrorHandling(handler);
