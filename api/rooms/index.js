import { sendError, withErrorHandling } from "../_lib/http.js";
import { CODE_LENGTH, normalizeCode, readGame } from "../_lib/rooms.js";
import { handleCreate } from "./_create.js";
import { handleJoin } from "./_join.js";
import { handleResume } from "./_resume.js";
import { handleRoom } from "./_room.js";
import { handleState } from "./_state.js";

// Every online room route of every game in one Serverless Function (Vercel
// Hobby caps a deployment at 12). vercel.json rewrites /api/rooms/:game,
// /api/rooms/:game/:code and /api/rooms/:game/:code/:op here as
// ?game=…&code=…&op=…, and the legacy /api/yatsy/games/* URLs as game=yatsy.
const ROOM_OPERATIONS = {
  join: handleJoin,
  resume: handleResume,
  state: handleState
};

async function handler(req, res) {
  const game = readGame(req.query.game);

  if (!game) {
    sendError(res, "invalid-game", "Unknown game.");
    return;
  }

  if (req.query.code === undefined) {
    await handleCreate(req, res, game);
    return;
  }

  const code = normalizeCode(req.query.code);

  if (code.length !== CODE_LENGTH) {
    sendError(res, "invalid-code", "Game code must contain exactly 3 letters.");
    return;
  }

  const room = { game, code };

  if (!req.query.op) {
    await handleRoom(req, res, room);
    return;
  }

  const operation = ROOM_OPERATIONS[req.query.op];

  if (!operation) {
    sendError(res, "invalid-action", "Unknown game operation.");
    return;
  }

  await operation(req, res, room);
}

export default withErrorHandling(handler);
