// T-spin detection with the 3-corner rule.
import { filled } from "./grid.js";

const CORNERS = [
  [0, 0],
  [2, 0],
  [0, 2],
  [2, 2]
];
// The two corners the T points at, per rotation (spawn points up).
const FRONT = [
  [0, 1],
  [1, 3],
  [2, 3],
  [0, 2]
];
const LAST_KICK = 4;

// "none", "mini" or "full". Needs the last successful action of the piece to
// be a rotation; `kick` is the index of the kick test that made it fit.
export function detectSpin(grid, piece, lastAction, kick) {
  if (piece.type !== "T" || lastAction !== "rotate") return "none";
  const hit = CORNERS.map(([c, r]) => filled(grid, piece.x + c, piece.y + r));
  if (hit.filter(Boolean).length < 3) return "none";
  const front = FRONT[piece.rot].every((i) => hit[i]);
  return front || kick === LAST_KICK ? "full" : "mini";
}
