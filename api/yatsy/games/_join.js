// POST /api/yatsy/games/:code/join. Route of api/yatsy/games/index.js.
import { readJsonBody, sendError, sendJson } from "../../_lib/http.js";
import { getServiceClient } from "../../_lib/supabase.js";
import {
  insertTick,
  isExpired,
  randomSeatToken,
  seatTokenColumn
} from "../../_lib/yatzyGames.js";

export async function handleJoin(req, res, code) {
  if (req.method !== "POST") {
    sendError(res, "method-not-allowed", "Use POST to join a game.");
    return;
  }

  const body = await readJsonBody(req);
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from("yatzy_games")
    .select("created_at, status, version, creator_token, joiner_token")
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

  const nextVersion = (data.version || 0) + 1;

  if (data.status === "waiting") {
    const joinerToken = randomSeatToken();
    const { error: updateError } = await supabase
      .from("yatzy_games")
      .update({
        status: "playing",
        joiner_token: joinerToken,
        version: nextVersion
      })
      .eq("code", code);

    if (updateError) {
      sendError(res, "server-error", updateError.message);
      return;
    }

    await insertTick(supabase, code, nextVersion);

    sendJson(res, 200, {
      code,
      role: "joiner",
      localPlayerIndex: 1,
      resumeToken: joinerToken
    });
    return;
  }

  // Game already playing: both seats are taken, so the only legitimate caller
  // is a player reclaiming their own seat. They must prove it with the token
  // they were given on create/join. Previously this branch handed a fresh token
  // to any caller and rotated the sitting player's one, which let anyone
  // holding the 3-letter code hijack a seat and kick the real player out.
  const column = seatTokenColumn(body.role);
  const seatToken = column ? data[column] : null;

  if (!seatToken || seatToken !== body.resumeToken) {
    sendError(res, "game-in-progress", "This game is already in progress.");
    return;
  }

  sendJson(res, 200, {
    code,
    role: body.role,
    localPlayerIndex: body.role === "creator" ? 0 : 1,
    resumeToken: seatToken
  });
}
