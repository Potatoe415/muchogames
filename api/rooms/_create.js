// POST /api/rooms/:game — create a room. Route of api/rooms/index.js.
import { sendError, sendJson } from "../_lib/http.js";
import { getServiceClient } from "../_lib/supabase.js";
import {
  MAX_CODE_ATTEMPTS,
  ROOMS_TABLE,
  insertTick,
  isExpired,
  randomCode,
  randomSeatToken
} from "../_lib/rooms.js";

export async function handleCreate(req, res, game) {
  if (req.method !== "POST") {
    sendError(res, "method-not-allowed", "Use POST to create a game.");
    return;
  }

  const supabase = getServiceClient();

  for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt += 1) {
    const code = randomCode();
    // Codes are unique across games: the table key is the code alone.
    const { data: existing, error: readError } = await supabase
      .from(ROOMS_TABLE)
      .select("created_at")
      .eq("code", code)
      .maybeSingle();

    if (readError) {
      sendError(res, "server-error", readError.message);
      return;
    }

    if (existing) {
      if (!isExpired(existing.created_at)) {
        continue;
      }

      await supabase.from(ROOMS_TABLE).delete().eq("code", code);
    }

    const creatorToken = randomSeatToken();
    const { error: insertError } = await supabase.from(ROOMS_TABLE).insert({
      code,
      game_id: game,
      status: "waiting",
      game_state: null,
      creator_token: creatorToken,
      joiner_token: null
    });

    if (insertError) {
      if (insertError.code === "23505") {
        continue; // Unique violation: another request just took this code.
      }

      sendError(res, "server-error", insertError.message);
      return;
    }

    await insertTick(supabase, code, 0);

    sendJson(res, 200, {
      code,
      role: "creator",
      localPlayerIndex: 0,
      resumeToken: creatorToken
    });
    return;
  }

  sendError(res, "code-exhausted", "Unable to reserve a free game code.");
}
