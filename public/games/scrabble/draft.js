// The letters the player has put on the board but not played yet:
// draft = [{ k, i, l }] — rack slot, cell, letter (lowercase for a blank),
// in the order they were put down. Pure helpers, no DOM.
import { BLANK, LETTERS, SIZE } from "./tiles.js";

export const draftTiles = (draft) => draft.map(({ i, l }) => ({ i, l }));
export const draftAt = (draft, i) => draft.find((d) => d.i === i);
export const isPlaced = (draft, k) => draft.some((d) => d.k === k);

export const place = (draft, k, i, l) => [
  ...draft.filter((d) => d.k !== k),
  { k, i, l }
];

export const unplace = (draft, k) => draft.filter((d) => d.k !== k);

// Moves rack slot `from` to position `to`; draft entries follow their tile.
export function moveSlot(rack, draft, from, to) {
  const order = rack.map((_, k) => k);
  order.splice(to, 0, order.splice(from, 1)[0]);
  const index = new Map(order.map((k, n) => [k, n]));
  return {
    rack: order.map((k) => rack[k]),
    draft: draft.map((d) => ({ ...d, k: index.get(d.k) }))
  };
}

// A free rack slot for a typed letter: the letter itself, else a blank.
export function slotFor(rack, draft, letter) {
  const free = (k) => !isPlaced(draft, k);
  const k = rack.findIndex((l, n) => l === letter && free(n));
  if (k >= 0) return { k, l: letter };
  const blank = rack.findIndex((l, n) => l === BLANK && free(n));
  return blank >= 0 ? { k: blank, l: letter.toLowerCase() } : null;
}

// Next empty cell after i along dir (0 across, 1 down), or -1.
export function nextFree(board, draft, i, dir) {
  let r = Math.floor(i / SIZE);
  let c = i % SIZE;
  for (;;) {
    if (dir) r += 1;
    else c += 1;
    if (r >= SIZE || c >= SIZE) return -1;
    const n = r * SIZE + c;
    if (!board[n] && !draftAt(draft, n)) return n;
  }
}

const isBlankLetter = (l) =>
  l.length === 1 && l !== l.toUpperCase() && LETTERS.includes(l.toUpperCase());

// A saved draft is kept only if it still fits the rack and the board.
export function draftFits(draft, rack, board) {
  if (!Array.isArray(draft)) return false;
  const slots = new Set();
  const cells = new Set();
  return draft.every((d) => {
    const letter = rack[d?.k];
    const ok =
      letter !== undefined &&
      !slots.has(d.k) &&
      !cells.has(d.i) &&
      board[d.i] === "" &&
      typeof d.l === "string" &&
      (letter === BLANK ? isBlankLetter(d.l) : d.l === letter);
    slots.add(d.k);
    cells.add(d.i);
    return ok;
  });
}
