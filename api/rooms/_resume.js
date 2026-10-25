// POST /api/rooms/:game/:code/resume. Route of api/rooms/index.js.
import { readJsonBody, sendError, sendJson } from "../_lib/http.js";
import { getServiceClient } from "../_lib/supabase.js";
import { isExpired, roomRows, seatTokenColumn } from "../_lib/rooms.js";

export async function handleResume(req, res, room) {
  if (req.method !== "POST") {
    sendError(res, "method-not-allowed", "Use POST to resume a game.");
    return;
  }

  const body = await readJsonBody(req);
  const { role, resumeToken } = body;

  if (!role || !resumeToken) {
    sendError(res, "resume-denied", "Missing resume credentials.");
    return;
  }

  const rows = roomRows(getServiceClient(), room);
  const { data, error } = await rows.select(
    "created_at, status, version, game_state, creator_token, joiner_token"
  );

  if (error) {
    sendError(res, "server-error", error.message);
    return;
  }

  if (!data) {
    sendError(res, "game-not-found", "Game not found.");
    return;
  }

  if (isExpired(data.created_at)) {
    await rows.remove();
    sendError(res, "game-expired", "Game expired.");
    return;
  }

  const column = seatTokenColumn(role);
  const seatToken = column ? data[column] : null;

  if (!seatToken || seatToken !== resumeToken) {
    sendError(res, "resume-denied", "This seat belongs to another player.");
    return;
  }

  sendJson(res, 200, {
    code: room.code,
    createdAt: new Date(data.created_at).getTime(),
    status: data.status,
    version: data.version,
    gameState: data.game_state || null
  });
}
