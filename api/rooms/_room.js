// GET / DELETE /api/rooms/:game/:code. Route of api/rooms/index.js.
import { readJsonBody, sendError, sendJson } from "../_lib/http.js";
import { getServiceClient } from "../_lib/supabase.js";
import { isExpired, roomRows, seatTokenColumn } from "../_lib/rooms.js";

async function handleGet(res, rows, room) {
  const { data, error } = await rows.select(
    "created_at, status, version, game_state"
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

  sendJson(res, 200, {
    code: room.code,
    createdAt: new Date(data.created_at).getTime(),
    status: data.status,
    version: data.version,
    gameState: data.game_state || null
  });
}

async function handleDelete(req, res, rows, room) {
  const body = await readJsonBody(req);
  const { data, error } = await rows.select(
    "status, creator_token, joiner_token"
  );

  if (error) {
    sendError(res, "server-error", error.message);
    return;
  }

  if (!data) {
    sendJson(res, 200, { code: room.code, removed: false });
    return;
  }

  // Only a seated player may destroy a room. Without this, knowing a 3-letter
  // code was enough to wipe any game in progress.
  const column = seatTokenColumn(body.role);
  const seatToken = column ? data[column] : null;

  if (!seatToken || seatToken !== body.resumeToken) {
    sendError(res, "resume-denied", "This seat belongs to another player.");
    return;
  }

  if (body.deleteCurrent || data.status === "waiting") {
    await rows.remove();
    sendJson(res, 200, { code: room.code, removed: true });
    return;
  }

  sendJson(res, 200, { code: room.code, removed: false });
}

export async function handleRoom(req, res, room) {
  const rows = roomRows(getServiceClient(), room);

  if (req.method === "GET") {
    await handleGet(res, rows, room);
    return;
  }

  if (req.method === "DELETE") {
    await handleDelete(req, res, rows, room);
    return;
  }

  sendError(res, "method-not-allowed", "Use GET or DELETE.");
}
