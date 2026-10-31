// One game of chess: position, history (for undo, notation and draws) and a
// compact serialisation for resuming after a reload.
import {
  applyMove,
  inCheck,
  initialPosition,
  insufficientMaterial,
  legalMoves,
  positionKey
} from "./rules.js";

const FIFTY_MOVES = 100;

export const sameMove = (a, b) =>
  a.from === b.from && a.to === b.to && (a.promo || 0) === (b.promo || 0);

export function createMatch() {
  let pos = initialPosition();
  let moves = null;
  const history = [];
  const keys = [positionKey(pos)];

  const legal = () => {
    moves ??= legalMoves(pos);
    return moves;
  };

  function play(m) {
    history.push({ pos, move: m });
    pos = applyMove(pos, m);
    moves = null;
    keys.push(positionKey(pos));
  }

  function undo() {
    const previous = history.pop();
    if (!previous) return null;
    pos = previous.pos;
    moves = null;
    keys.pop();
    return previous.move;
  }

  // Ends: checkmate, stalemate, dead position, fifty moves without a pawn
  // move or capture, the same position three times.
  function status() {
    if (!legal().length) {
      return inCheck(pos)
        ? { over: true, winner: -pos.turn, reason: "checkmate" }
        : { over: true, winner: 0, reason: "stalemate" };
    }
    if (insufficientMaterial(pos.board))
      return { over: true, winner: 0, reason: "material" };
    if (pos.halfmove >= FIFTY_MOVES)
      return { over: true, winner: 0, reason: "fifty" };
    const key = keys[keys.length - 1];
    if (keys.filter((k) => k === key).length >= 3)
      return { over: true, winner: 0, reason: "repetition" };
    return { over: false };
  }

  return {
    get position() {
      return pos;
    },
    get board() {
      return pos.board;
    },
    get turn() {
      return pos.turn;
    },
    get plies() {
      return history.length;
    },
    keys: () => keys.slice(),
    inCheck: () => inCheck(pos),
    lastMove: () => history[history.length - 1]?.move || null,
    // { pos, move } of the side's last move: the position it was played from.
    lastBy: (side) => history.findLast((h) => h.pos.turn === side) || null,
    moveBy: (side) =>
      history.findLast((h) => h.pos.turn === side)?.move || null,
    legal,
    play,
    undo,
    status,
    serialize: () => history.map(({ move }) => [move.from, move.to, move.promo])
  };
}

// Rebuilds a match from `serialize()` output, replaying every move against
// the rules. Returns null when the data does not describe a legal game.
export function restoreMatch(saved) {
  if (!Array.isArray(saved)) return null;
  const match = createMatch();
  for (const entry of saved) {
    if (!Array.isArray(entry)) return null;
    const wanted = { from: entry[0], to: entry[1], promo: entry[2] };
    const found = match.legal().find((m) => sameMove(m, wanted));
    if (!found || match.status().over) return null;
    match.play(found);
  }
  return match;
}
