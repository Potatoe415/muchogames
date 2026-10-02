// Feedback inbox actions for api/admin/index.js. Not a route itself.
import { sendError, sendJson } from "../_lib/http.js";
import { getServiceClient } from "../_lib/supabase.js";

// Must match the CHECK constraint in supabase/migrations/0004_feedback.sql.
const STATUSES = ["new", "in_progress", "resolved"];
const MAX_LIST_ROWS = 200;

/** Newest first, filtered by status (defaults to "new"), plus per-status counts. */
export async function handleFeedbackList(res, body) {
  const status = STATUSES.includes(body.status) ? body.status : "new";
  const client = getServiceClient();

  const [list, counts] = await Promise.all([
    client
      .from("muchogames_feedback")
      .select("id, kind, message, game_id, page, status, created_at")
      .eq("status", status)
      .order("created_at", { ascending: false })
      .limit(MAX_LIST_ROWS),
    countByStatus(client)
  ]);

  if (list.error || counts.error) {
    sendError(res, "server-error", (list.error || counts.error).message);
    return;
  }

  sendJson(res, 200, {
    status,
    counts: counts.data,
    items: list.data.map(toPublicFeedback)
  });
}

export async function handleFeedbackUpdate(res, body) {
  const id = Number(body.id);
  if (!Number.isSafeInteger(id) || id <= 0 || !STATUSES.includes(body.status)) {
    sendError(res, "invalid-feedback", "A valid id and status are required.");
    return;
  }

  const { data, error } = await getServiceClient()
    .from("muchogames_feedback")
    .update({ status: body.status })
    .eq("id", id)
    .select("id, kind, message, game_id, page, status, created_at")
    .maybeSingle();

  if (error) {
    sendError(res, "server-error", error.message);
    return;
  }

  if (!data) {
    sendError(res, "feedback-not-found", "This report no longer exists.");
    return;
  }

  sendJson(res, 200, { item: toPublicFeedback(data) });
}

async function countByStatus(client) {
  const results = await Promise.all(
    STATUSES.map((status) =>
      client
        .from("muchogames_feedback")
        .select("id", { count: "exact", head: true })
        .eq("status", status)
    )
  );

  const failed = results.find((result) => result.error);
  if (failed) return { error: failed.error };

  const data = {};
  STATUSES.forEach((status, index) => {
    data[status] = results[index].count || 0;
  });
  return { data };
}

function toPublicFeedback(row) {
  return {
    id: row.id,
    kind: row.kind,
    message: row.message,
    gameId: row.game_id || "",
    page: row.page || "",
    status: row.status,
    createdAt: row.created_at
  };
}
