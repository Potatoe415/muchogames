// Board DOM: square buttons (data-id="checkers-square-<sq>") under a layer of
// pieces positioned by CSS variables, so moves animate with transitions. When
// `flipped`, the board is turned 180° so the local player sits at the bottom.
import { isDarkSquare, isKing, sideOf, squareNumber } from "./rules.js";

const REDUCED = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
const HOP_MS = REDUCED ? 60 : 190;
const FADE_MS = 260;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const MARKS = ["selected", "target", "step", "movable", "last", "hint"];

export function createView({ host, variant, flipped, t }) {
  const n = variant.size;
  const toDisplay = (sq) => (flipped ? n * n - 1 - sq : sq);
  const squares = new Map();
  const pieces = new Map();
  let current = null;

  const frame = document.createElement("div");
  frame.className = "ck-frame";
  const grid = document.createElement("div");
  grid.className = "ck-board";
  grid.dataset.id = "checkers-board-grid";
  grid.style.setProperty("--n", n);
  const layer = document.createElement("div");
  layer.className = "ck-pieces";

  for (let i = 0; i < n * n; i += 1) {
    const sq = toDisplay(i);
    if (!isDarkSquare(n, sq)) {
      grid.append(
        Object.assign(document.createElement("div"), { className: "ck-sq" })
      );
      continue;
    }
    const button = document.createElement("button");
    button.type = "button";
    button.className = "ck-sq is-dark";
    button.dataset.sq = sq;
    button.dataset.id = `checkers-square-${sq}`;
    squares.set(sq, button);
    grid.append(button);
  }
  grid.append(layer);
  frame.append(grid);
  host.replaceChildren(frame);

  function place(el, sq) {
    const d = toDisplay(sq);
    el.style.setProperty("--r", Math.floor(d / n));
    el.style.setProperty("--c", d % n);
  }

  function paint(el, piece) {
    el.classList.toggle("is-light", sideOf(piece) > 0);
    el.classList.toggle("is-dark", sideOf(piece) < 0);
    el.classList.toggle("is-king", isKing(piece));
  }

  function pieceName(piece) {
    const color = sideOf(piece) > 0 ? "light" : "dark";
    return t(`${color}${isKing(piece) ? "King" : "Man"}`);
  }

  function relabel() {
    if (!current) return;
    grid.setAttribute("aria-label", t("board"));
    squares.forEach((button, sq) => {
      const piece = current[sq];
      const name = t("square", { n: squareNumber(sq) });
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
          className: "ck-piece"
        });
        pieces.set(sq, el);
        layer.append(el);
      }
      el.style.transform = "";
      el.classList.remove("is-dragging", "is-moving");
      place(el, sq);
      paint(el, piece);
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

  function removeTaken(captures) {
    captures.forEach((sq) => {
      const el = pieces.get(sq);
      pieces.delete(sq);
      el?.classList.add("is-gone");
      setTimeout(() => el?.remove(), FADE_MS);
    });
  }

  // Slides the piece through every landing square, dimming each piece it
  // takes, then fades the taken pieces out. `direct` (after a drag) goes
  // straight to the destination.
  async function animate(move, { direct = false } = {}) {
    const el = pieces.get(move.from);
    if (!el) return;
    pieces.delete(move.from);
    el.classList.remove("is-dragging");
    el.classList.add("is-moving");
    el.style.transform = "";
    const hops = direct ? [move.to] : move.path;
    for (let i = 0; i < hops.length; i += 1) {
      place(el, hops[i]);
      const taken = direct ? move.captures : [move.captures[i]];
      taken.forEach((sq) => pieces.get(sq)?.classList.add("is-taken"));
      await wait(HOP_MS);
    }
    removeTaken(move.captures);
    el.classList.remove("is-moving");
    pieces.set(move.to, el);
  }

  function dragTo(sq, x, y) {
    const el = pieces.get(sq);
    if (!el) return;
    const rect = layer.getBoundingClientRect();
    const size = rect.width / n;
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
    const col = Math.floor(((x - rect.left) / rect.width) * n);
    const row = Math.floor(((y - rect.top) / rect.height) * n);
    if (col < 0 || row < 0 || col >= n || row >= n) return -1;
    const sq = toDisplay(row * n + col);
    return squares.has(sq) ? sq : -1;
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
