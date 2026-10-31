// Static evaluation for the computer: material + piece-square tables (the
// "simplified evaluation function"), a king table for the endgame, and a
// mop-up term that drives a lone king to the edge so won endings get mated.
import {
  BISHOP,
  colOf,
  KING,
  KNIGHT,
  PAWN,
  QUEEN,
  ROOK,
  rowOf
} from "./rules.js";

export const VALUE = [0, 100, 320, 330, 500, 900, 0];

// Tables from white's point of view, index 0 = a8. Black reads sq ^ 56.
// prettier-ignore
const PAWN_TABLE = [
   0,   0,   0,   0,   0,   0,   0,   0,
  50,  50,  50,  50,  50,  50,  50,  50,
  10,  10,  20,  30,  30,  20,  10,  10,
   5,   5,  10,  25,  25,  10,   5,   5,
   0,   0,   0,  20,  20,   0,   0,   0,
   5,  -5, -10,   0,   0, -10,  -5,   5,
   5,  10,  10, -20, -20,  10,  10,   5,
   0,   0,   0,   0,   0,   0,   0,   0
];
// prettier-ignore
const KNIGHT_TABLE = [
  -50, -40, -30, -30, -30, -30, -40, -50,
  -40, -20,   0,   0,   0,   0, -20, -40,
  -30,   0,  10,  15,  15,  10,   0, -30,
  -30,   5,  15,  20,  20,  15,   5, -30,
  -30,   0,  15,  20,  20,  15,   0, -30,
  -30,   5,  10,  15,  15,  10,   5, -30,
  -40, -20,   0,   5,   5,   0, -20, -40,
  -50, -40, -30, -30, -30, -30, -40, -50
];
// prettier-ignore
const BISHOP_TABLE = [
  -20, -10, -10, -10, -10, -10, -10, -20,
  -10,   0,   0,   0,   0,   0,   0, -10,
  -10,   0,   5,  10,  10,   5,   0, -10,
  -10,   5,   5,  10,  10,   5,   5, -10,
  -10,   0,  10,  10,  10,  10,   0, -10,
  -10,  10,  10,  10,  10,  10,  10, -10,
  -10,   5,   0,   0,   0,   0,   5, -10,
  -20, -10, -10, -10, -10, -10, -10, -20
];
// prettier-ignore
const ROOK_TABLE = [
   0,   0,   0,   0,   0,   0,   0,   0,
   5,  10,  10,  10,  10,  10,  10,   5,
  -5,   0,   0,   0,   0,   0,   0,  -5,
  -5,   0,   0,   0,   0,   0,   0,  -5,
  -5,   0,   0,   0,   0,   0,   0,  -5,
  -5,   0,   0,   0,   0,   0,   0,  -5,
  -5,   0,   0,   0,   0,   0,   0,  -5,
   0,   0,   0,   5,   5,   0,   0,   0
];
// prettier-ignore
const QUEEN_TABLE = [
  -20, -10, -10,  -5,  -5, -10, -10, -20,
  -10,   0,   0,   0,   0,   0,   0, -10,
  -10,   0,   5,   5,   5,   5,   0, -10,
   -5,   0,   5,   5,   5,   5,   0,  -5,
    0,   0,   5,   5,   5,   5,   0,  -5,
  -10,   5,   5,   5,   5,   5,   0, -10,
  -10,   0,   5,   0,   0,   0,   0, -10,
  -20, -10, -10,  -5,  -5, -10, -10, -20
];
// prettier-ignore
const KING_MIDDLE = [
  -30, -40, -40, -50, -50, -40, -40, -30,
  -30, -40, -40, -50, -50, -40, -40, -30,
  -30, -40, -40, -50, -50, -40, -40, -30,
  -30, -40, -40, -50, -50, -40, -40, -30,
  -20, -30, -30, -40, -40, -30, -30, -20,
  -10, -20, -20, -20, -20, -20, -20, -10,
   20,  20,   0,   0,   0,   0,  20,  20,
   20,  30,  10,   0,   0,  10,  30,  20
];
// prettier-ignore
const KING_END = [
  -50, -40, -30, -20, -20, -30, -40, -50,
  -30, -20, -10,   0,   0, -10, -20, -30,
  -30, -10,  20,  30,  30,  20, -10, -30,
  -30, -10,  30,  40,  40,  30, -10, -30,
  -30, -10,  30,  40,  40,  30, -10, -30,
  -30, -10,  20,  30,  30,  20, -10, -30,
  -30, -30,   0,   0,   0,   0, -30, -30,
  -50, -30, -30, -30, -30, -30, -30, -50
];

const TABLES = {
  [PAWN]: PAWN_TABLE,
  [KNIGHT]: KNIGHT_TABLE,
  [BISHOP]: BISHOP_TABLE,
  [ROOK]: ROOK_TABLE,
  [QUEEN]: QUEEN_TABLE
};

// Non-pawn material (both sides) at or below which the endgame king table
// applies: roughly queens off, or one rook and a minor piece each.
const ENDGAME_MATERIAL = 1700;
const MOP_UP_MARGIN = 300;

const tableIndex = (sq, side) => (side > 0 ? sq : sq ^ 56);
const centreDistance = (sq) =>
  Math.max(3 - rowOf(sq), rowOf(sq) - 4, 0) +
  Math.max(3 - colOf(sq), colOf(sq) - 4, 0);
const kingDistance = (a, b) =>
  Math.max(Math.abs(rowOf(a) - rowOf(b)), Math.abs(colOf(a) - colOf(b)));

function mopUp(score, kings) {
  if (Math.abs(score) < MOP_UP_MARGIN) return 0;
  const winner = score > 0 ? 1 : -1;
  const loserKing = kings[-winner];
  const bonus =
    centreDistance(loserKing) * 10 +
    (7 - kingDistance(kings[1], kings[-1])) * 4;
  return winner * bonus;
}

// Score of `board` for `side` to move, in centipawns.
export function evaluate(board, side) {
  let score = 0;
  let pieces = 0;
  const kings = { 1: -1, [-1]: -1 };
  for (let sq = 0; sq < 64; sq += 1) {
    const piece = board[sq];
    if (!piece) continue;
    const owner = piece > 0 ? 1 : -1;
    const type = piece * owner;
    if (type === KING) {
      kings[owner] = sq;
      continue;
    }
    if (type !== PAWN) pieces += VALUE[type];
    score += owner * (VALUE[type] + TABLES[type][tableIndex(sq, owner)]);
  }
  const endgame = pieces <= ENDGAME_MATERIAL;
  const kingTable = endgame ? KING_END : KING_MIDDLE;
  score +=
    kingTable[tableIndex(kings[1], 1)] - kingTable[tableIndex(kings[-1], -1)];
  if (endgame) score += mopUp(score, kings);
  return score * side;
}
