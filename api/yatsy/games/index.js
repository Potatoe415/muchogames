import { sendError, withErrorHandling } from "../../_lib/http.js";
import { CODE_LENGTH, normalizeCode } from "../../_lib/yatzyGames.js";
import { handleCreate } from "./_create.js";
import { handleJoin } from "./_join.js";
import { handleResume } from "./_resume.js";
import { handleRoom } from "./_room.js";
import { handleState } from "./_state.js";

// Every Yatzy room route in one Serverless Function (Vercel Hobby caps a
// deployment at 12). vercel.json rewrites /api/yatsy/games/:code and
// /api/yatsy/games/:code/:op here as ?code=…&op=…, so the URLs used by
// public/games/yatsy/matchmaking.js are unchanged.
const ROOM_OPERATIONS = {
  join: handleJoin,
  resume: handleResume,
  state: handleState
};

async function handler(req, res) {
  if (req.query.code === undefined) {
    await handleCreate(req, res);
    return;
  }

  const code = normalizeCode(req.query.code);

  if (code.length !== CODE_LENGTH) {
    sendError(res, "invalid-code", "Game code must contain exactly 3 letters.");
    return;
  }

  if (!req.query.op) {
    await handleRoom(req, res, code);
    return;
  }

  const operation = ROOM_OPERATIONS[req.query.op];

  if (!operation) {
    sendError(res, "invalid-action", "Unknown game operation.");
    return;
  }

  await operation(req, res, code);
}

export default withErrorHandling(handler);
