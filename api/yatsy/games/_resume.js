// POST /api/yatsy/games/:code/resume. Route of api/yatsy/games/index.js.
import { readJsonBody, sendError, sendJson } from "../../_lib/http.js";
import { getServiceClient } from "../../_lib/supabase.js";
import { isExpired, seatTokenColumn } from "../../_lib/yatzyGames.js";

export async function handleResume(req, res, code) {
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

  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from("yatzy_games")
    .select("created_at, status, game_state, creator_token, joiner_token")
    .eq("code", code)
    .maybeSingle();

  if (error) {
    sendError(res, "server-error", error.message);
    return;
  }

  if (!data) {
    sendError(res, "game-not-found", "Game not found.");
    return;
  }

  if (isExpired(data.created_at)) {
    await supabase.from("yatzy_games").delete().eq("code", code);
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
    code,
    createdAt: new Date(data.created_at).getTime(),
    status: data.status,
    gameState: data.game_state || null
  });
}
