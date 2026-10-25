// PUT /api/rooms/:game/:code/state. Route of api/rooms/index.js.
import { readJsonBody, sendError, sendJson } from "../_lib/http.js";
import { getServiceClient } from "../_lib/supabase.js";
import { insertTick, roomRows, seatTokenColumn } from "../_lib/rooms.js";

// A real Yatzy or Memory state serializes to a few KB. The cap stops a seated
// player from using their own room as unbounded storage in the shared
// Supabase project.
const MAX_GAME_STATE_BYTES = 65536;

function isAcceptableGameState(gameState) {
  if (gameState === null || gameState === undefined) {
    return true;
  }

  if (typeof gameState !== "object" || Array.isArray(gameState)) {
    return false;
  }

  return JSON.stringify(gameState).length <= MAX_GAME_STATE_BYTES;
}

export async function handleState(req, res, room) {
  if (req.method !== "PUT") {
    sendError(res, "method-not-allowed", "Use PUT to update game state.");
    return;
  }

  const body = await readJsonBody(req);
  const { role, resumeToken, gameState } = body;

  if (!isAcceptableGameState(gameState)) {
    sendError(
      res,
      "invalid-state",
      "gameState must be a JSON object under 64 KB."
    );
    return;
  }

  const supabase = getServiceClient();
  const rows = roomRows(supabase, room);
  const { data, error } = await rows.select(
    "version, creator_token, joiner_token"
  );

  if (error) {
    sendError(res, "server-error", error.message);
    return;
  }

  if (!data) {
    sendError(res, "game-not-found", "Game not found.");
    return;
  }

  const column = seatTokenColumn(role);
  const seatToken = column ? data[column] : null;

  if (!seatToken || seatToken !== resumeToken) {
    sendError(res, "resume-denied", "This seat belongs to another player.");
    return;
  }

  const nextVersion = (data.version || 0) + 1;
  const { error: updateError } = await rows.update({
    game_state: gameState,
    version: nextVersion
  });

  if (updateError) {
    sendError(res, "server-error", updateError.message);
    return;
  }

  await insertTick(supabase, room.code, nextVersion);

  sendJson(res, 200, { code: room.code, version: nextVersion });
}
