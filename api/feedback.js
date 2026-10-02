import {
  readJsonBody,
  sendError,
  sendJson,
  withErrorHandling
} from "./_lib/http.js";
import { clientKey, isRateLimited } from "./_lib/rateLimit.js";
import { getServiceClient } from "./_lib/supabase.js";

// Must match the CHECK constraints in supabase/migrations/0004_feedback.sql.
const KINDS = ["bug", "idea"];
const MAX_MESSAGE_LENGTH = 2000;
const MAX_GAME_ID_LENGTH = 64;
const MAX_PAGE_LENGTH = 200;
const THROTTLE = { maxHits: 5, windowMs: 600000 }; // 5 reports per 10 min per IP.

/**
 * Stores one bug report or idea. Public and anonymous on purpose (owner
 * choice, see docs/tasks/platform-admin-profile-roadmap.md): nothing that
 * identifies the sender is stored, only what they typed and where they were.
 */
async function handler(req, res) {
  if (req.method !== "POST") {
    sendError(res, "method-not-allowed", "Use POST to send feedback.");
    return;
  }

  if (isRateLimited(`feedback:${clientKey(req)}`, THROTTLE)) {
    sendError(res, "too-many-requests", "Too many reports. Try again later.");
    return;
  }

  const row = buildFeedbackRow(await readJsonBody(req));
  if (!row) {
    sendError(
      res,
      "invalid-feedback",
      `Message must be 1 to ${MAX_MESSAGE_LENGTH} characters.`
    );
    return;
  }

  const { error } = await getServiceClient()
    .from("muchogames_feedback")
    .insert(row);

  if (error) {
    sendError(res, "server-error", error.message);
    return;
  }

  sendJson(res, 200, { recorded: true });
}

function buildFeedbackRow(body) {
  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!message || message.length > MAX_MESSAGE_LENGTH) return null;

  return {
    kind: KINDS.includes(body.kind) ? body.kind : "bug",
    message,
    game_id: optionalText(body.gameId, MAX_GAME_ID_LENGTH),
    page: optionalText(body.page, MAX_PAGE_LENGTH)
  };
}

// Context fields are a convenience for triage: drop a bad one rather than
// rejecting the whole report.
function optionalText(value, maxLength) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed && trimmed.length <= maxLength ? trimmed : null;
}

export default withErrorHandling(handler);
