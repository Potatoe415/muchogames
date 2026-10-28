// One game of draughts: position, turn, history (for undo and draws) and a
// compact serialisation for resuming after a reload.
import {
  applyMove,
  initialBoard,
  isKing,
  legalMoves,
  VARIANTS
} from "./rules.js";

const positionKey = (board, turn) => `${turn}|${board.join(",")}`;

export function sameMove(a, b) {
  return (
    a.from === b.from &&
    a.to === b.to &&
    a.captures.length === b.captures.length &&
    a.captures.every((sq) => b.captures.includes(sq))
  );
}

export function createMatch(variantId) {
  const variant = VARIANTS[variantId] || VARIANTS.international;
  const state = {
    board: initialBoard(variant),
    turn: variant.first,
    quiet: 0,
    moves: null
  };
  const history = [];
  const keys = [positionKey(state.board, state.turn)];

  const legal = () => {
    state.moves ??= legalMoves(state.board, variant, state.turn);
    return state.moves;
  };

  function play(move) {
    const progress =
      move.captures.length > 0 || !isKing(state.board[move.from]);
    history.push({ ...state, move });
    state.board = applyMove(state.board, variant, move);
    state.turn = -state.turn;
    state.quiet = progress ? 0 : state.quiet + 1;
    state.moves = null;
    keys.push(positionKey(state.board, state.turn));
  }

  function undo() {
    const previous = history.pop();
    if (!previous) return null;
    Object.assign(state, previous, { moves: null });
    keys.pop();
    return previous.move;
  }

  // Draws: the same position three times with the same side to move, or
  // `drawPlies` moves in a row with kings only and no capture.
  function status() {
    if (!legal().length)
      return { over: true, winner: -state.turn, reason: "blocked" };
    if (state.quiet >= variant.drawPlies)
      return { over: true, winner: 0, reason: "quiet" };
    const key = keys[keys.length - 1];
    const repeats = keys.filter((k) => k === key).length;
    if (repeats >= 3) return { over: true, winner: 0, reason: "repetition" };
    return { over: false };
  }

  return {
    variant,
    get board() {
      return state.board;
    },
    get turn() {
      return state.turn;
    },
    get quiet() {
      return state.quiet;
    },
    get plies() {
      return history.length;
    },
    lastMove: () => history[history.length - 1]?.move || null,
    moveBy: (side) => history.findLast((h) => h.turn === side)?.move || null,
    legal,
    play,
    undo,
    status,
    serialize: () =>
      history.map(({ move }) => [move.from, move.to, move.captures])
  };
}

// Rebuilds a match from `serialize()` output, replaying every move against
// the rules. Returns null when the data does not describe a legal game.
export function restoreMatch(variantId, saved) {
  if (!VARIANTS[variantId] || !Array.isArray(saved)) return null;
  const match = createMatch(variantId);
  for (const entry of saved) {
    if (!Array.isArray(entry) || !Array.isArray(entry[2])) return null;
    const wanted = { from: entry[0], to: entry[1], captures: entry[2] };
    const move = match.legal().find((m) => sameMove(m, wanted));
    if (!move || match.status().over) return null;
    match.play(move);
  }
  return match;
}
