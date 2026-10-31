// Board DOM: 64 square buttons (data-id="chess-square-<name>") under a layer
// of pieces positioned by CSS variables, so moves animate with transitions.
// When `flipped`, the board is turned 180° so black sits at the bottom.
import {
  colOf,
  isDarkSquare,
  rowOf,
  sideOf,
  squareName,
  typeOf
} from "./rules.js";

const REDUCED = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
const MOVE_MS = REDUCED ? 60 : 220;
const FADE_MS = 260;
const TEXT = "\uFE0E";
// Filled glyphs (black pieces, and the white pieces' fill) and outlines
// (white pieces), indexed by piece type.
export const FILLED = ["", "♟", "♞", "♝", "♜", "♛", "♚"].map((g) => g + TEXT);
const OUTLINE = ["", "♙", "♘", "♗", "♖", "♕", "♔"].map((g) => g + TEXT);
const PIECE_NAMES = ["", "Pawn", "Knight", "Bishop", "Rook", "Queen", "King"];

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// White pieces draw the outline glyph over a white fill (CSS ::before reads
// data-glyph); black pieces are the filled glyph.
export function paintGlyph(el, piece) {
  const white = sideOf(piece) > 0;
  el.classList.toggle("is-white", white);
  el.classList.toggle("is-black", !white);
  el.dataset.glyph = FILLED[typeOf(piece)];
  el.textContent = (white ? OUTLINE : FILLED)[typeOf(piece)];
}

const MARKS = ["selected", "target", "capture", "last", "hint", "check"];

function label(className, text) {
  const span = document.createElement("span");
  span.className = `ch-coord ${className}`;
  span.textContent = text;
  span.setAttribute("aria-hidden", "true");
  return span;
}

// Rank digits down the left edge, file letters along the bottom edge.
function coordinates(button, sq, flipped) {
  const name = squareName(sq);
  if (colOf(sq) === (flipped ? 7 : 0)) button.append(label("ch-rank", name[1]));
  if (rowOf(sq) === (flipped ? 0 : 7)) button.append(label("ch-file", name[0]));
}

export function createView({ host, flipped, t }) {
  const toDisplay = (sq) => (flipped ? 63 - sq : sq);
  const squares = new Map();
  const pieces = new Map();
  let current = null;

  const frame = document.createElement("div");
  frame.className = "ch-frame";
  const grid = document.createElement("div");
  grid.className = "ch-board";
  grid.dataset.id = "chess-board-grid";
  const layer = document.createElement("div");
  layer.className = "ch-pieces";

  for (let i = 0; i < 64; i += 1) {
    const sq = toDisplay(i);
    const button = document.createElement("button");
    button.type = "button";
    button.className = `ch-sq ${isDarkSquare(sq) ? "is-dark" : "is-light"}`;
    button.dataset.sq = sq;
    button.dataset.id = `chess-square-${squareName(sq)}`;
    coordinates(button, sq, flipped);
    squares.set(sq, button);
    grid.append(button);
  }
  grid.append(layer);
  frame.append(grid);
  host.replaceChildren(frame);

  function place(el, sq) {
    const d = toDisplay(sq);
    el.style.setProperty("--r", rowOf(d));
    el.style.setProperty("--c", colOf(d));
  }

  const pieceName = (piece) =>
    t(`${sideOf(piece) > 0 ? "white" : "black"}${PIECE_NAMES[typeOf(piece)]}`);

  function relabel() {
    if (!current) return;
    grid.setAttribute("aria-label", t("board"));
    squares.forEach((button, sq) => {
      const piece = current[sq];
      const name = squareName(sq);
      button.setAttribute(
        "aria-label",
        piece ? `${name}, ${pieceName(piece)}` : name
      );
    });
  }

  // Brings the piece layer in line with `board` without animation.
  function render(board) {
    current = board;
    squares.forEach((_, sq) => {
      const piece = board[sq];
      let el = pieces.get(sq);
      if (!piece) {
        el?.remove();
        pieces.delete(sq);
        return;
      }
      if (!el) {
        el = Object.assign(document.createElement("div"), {
          className: "ch-piece"
        });
        el.setAttribute("aria-hidden", "true");
        pieces.set(sq, el);
        layer.append(el);
      }
      el.style.transform = "";
      el.classList.remove("is-dragging", "is-moving");
      place(el, sq);
      paintGlyph(el, piece);
    });
    relabel();
  }

  function mark(marks = {}) {
    squares.forEach((button, sq) => {
      MARKS.forEach((name) => {
        const value = marks[name];
        const on = value instanceof Set ? value.has(sq) : value === sq;
        button.classList.toggle(`is-${name}`, on);
      });
    });
    pieces.forEach((el, sq) =>
      el.classList.toggle("is-lifted", marks.selected === sq)
    );
  }

  function slide(from, to) {
    const el = pieces.get(from);
    if (!el) return null;
    pieces.delete(from);
    el.classList.remove("is-dragging");
    el.classList.add("is-moving");
    el.style.transform = "";
    place(el, to);
    pieces.set(to, el);
    return el;
  }

  // Slides the piece (and the rook when castling), then fades the taken piece.
  async function animate(m) {
    const victim = m.taken >= 0 ? pieces.get(m.taken) : null;
    if (victim) pieces.delete(m.taken);
    victim?.classList.add("is-taken");
    const moved = [slide(m.from, m.to), m.rook && slide(m.rook[0], m.rook[1])];
    await wait(MOVE_MS);
    moved.forEach((el) => el?.classList.remove("is-moving"));
    victim?.classList.add("is-gone");
    setTimeout(() => victim?.remove(), FADE_MS);
  }

  function dragTo(sq, x, y) {
    const el = pieces.get(sq);
    if (!el) return;
    const rect = layer.getBoundingClientRect();
    const size = rect.width / 8;
    el.classList.add("is-dragging");
    el.style.transform = `translate(${x - rect.left - size / 2}px, ${y - rect.top - size / 2}px)`;
  }

  function dragEnd(sq) {
    const el = pieces.get(sq);
    el?.classList.remove("is-dragging");
    if (el) el.style.transform = "";
  }

  function squareAt(x, y) {
    const rect = grid.getBoundingClientRect();
    const col = Math.floor(((x - rect.left) / rect.width) * 8);
    const row = Math.floor(((y - rect.top) / rect.height) * 8);
    if (col < 0 || row < 0 || col >= 8 || row >= 8) return -1;
    return toDisplay(row * 8 + col);
  }

  return {
    grid,
    render,
    mark,
    animate,
    dragTo,
    dragEnd,
    squareAt,
    relabel,
    destroy: () => host.replaceChildren()
  };
}
