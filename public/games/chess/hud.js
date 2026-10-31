// Player bars above and below the board (name, pieces taken, status / last
// move) and the action buttons' state.
import { san } from "./notation.js";
import {
  BISHOP,
  BLACK,
  KING,
  KNIGHT,
  PAWN,
  QUEEN,
  ROOK,
  sideOf,
  typeOf,
  WHITE
} from "./rules.js";
import { paintGlyph } from "./view.js";

const $ = (id) => document.querySelector(`[data-id="${id}"]`);

const START_COUNT = {
  [QUEEN]: 1,
  [ROOK]: 2,
  [BISHOP]: 2,
  [KNIGHT]: 2,
  [PAWN]: 8
};
const POINTS = { [QUEEN]: 9, [ROOK]: 5, [BISHOP]: 3, [KNIGHT]: 3, [PAWN]: 1 };
const TAKEN_ORDER = [QUEEN, ROOK, BISHOP, KNIGHT, PAWN];

function counts(board, side) {
  const out = { [QUEEN]: 0, [ROOK]: 0, [BISHOP]: 0, [KNIGHT]: 0, [PAWN]: 0 };
  board.forEach((piece) => {
    if (sideOf(piece) === side && typeOf(piece) !== KING)
      out[typeOf(piece)] += 1;
  });
  return out;
}

const points = (count) =>
  TAKEN_ORDER.reduce((sum, type) => sum + count[type] * POINTS[type], 0);

// Enemy pieces `side` has taken, and its material lead in pawns.
function taken(board, side) {
  const enemy = counts(board, -side);
  const list = TAKEN_ORDER.flatMap((type) =>
    Array(Math.max(0, START_COUNT[type] - enemy[type])).fill(type)
  );
  return { list, lead: points(counts(board, side)) - points(enemy) };
}

function notation(entry, t) {
  return entry ? san(entry.pos, entry.move, t("letters")) : "";
}

function barName(config, side, t) {
  if (config.mode === "duo") return t(side === WHITE ? "white" : "black");
  return side === config.side
    ? t("you")
    : t("computer", { level: t(config.level) });
}

function barStatus(match, side, info, over, t) {
  if (!over && match.turn === side) {
    if (info.thinking) return t("thinking");
    return match.inCheck() ? t("check") : t("toPlay");
  }
  const last = match.lastBy(side);
  return last ? t("lastMove", { move: notation(last, t) }) : "";
}

function renderTaken(node, board, side) {
  const { list, lead } = taken(board, side);
  node.replaceChildren(
    ...list.map((type) => {
      const span = document.createElement("span");
      span.className = "ch-glyph";
      paintGlyph(span, -side * type);
      return span;
    })
  );
  if (lead > 0) node.append(` +${lead}`);
}

function renderBar(id, side, { match, config, info, over, t }) {
  const bar = $(id);
  const active = !over && match.turn === side;
  bar.classList.toggle("is-active", active);
  bar.classList.toggle("is-thinking", active && info.thinking);
  bar.classList.toggle("is-check", active && match.inCheck());
  paintGlyph(bar.querySelector("[data-bar-glyph]"), side * KING);
  bar.querySelector("[data-bar-name]").textContent = barName(config, side, t);
  renderTaken(bar.querySelector("[data-bar-taken]"), match.board, side);
  bar.querySelector("[data-bar-status]").textContent = barStatus(
    match,
    side,
    info,
    over,
    t
  );
}

// state: { match, config, info, over, t }
export function renderHud(state) {
  const bottom = state.config.mode === "solo" ? state.config.side : WHITE;
  renderBar("chess-player-bottom", bottom, state);
  renderBar("chess-player-top", bottom === WHITE ? BLACK : WHITE, state);
  $("chess-undo-button").disabled = !state.info.canUndo;
  $("chess-hint-button").disabled = !state.info.canHint;
}
