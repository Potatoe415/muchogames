// localStorage: the match in progress, so leaving it by any route and coming
// back resumes it exactly (undo step included). Everything read back is
// validated before use.
import { MAX_VALUE, SIZE } from "./board.js";
import { UNDOS } from "./game.js";

const SAVE_KEY = "2048-current";
const VERSION = 1;
const MAX_SCORE = 1e9;

const isInt = (n, min, max) => Number.isInteger(n) && n >= min && n <= max;
const isTile = (n) =>
  n === 0 || (isInt(n, 2, MAX_VALUE) && (n & (n - 1)) === 0);

function validCells(cells) {
  return (
    Array.isArray(cells) &&
    cells.length === SIZE * SIZE &&
    cells.every(isTile) &&
    cells.some((n) => n > 0)
  );
}

function validMatch(data) {
  return (
    data?.v === VERSION &&
    validCells(data.cells) &&
    isInt(data.score, 0, MAX_SCORE) &&
    isInt(data.undos, 0, UNDOS) &&
    typeof data.won === "boolean" &&
    (data.undo === null ||
      (validCells(data.undo?.cells) && isInt(data.undo.score, 0, MAX_SCORE)))
  );
}

// `match` is game.snapshot(): plain values only.
export function encodeMatch(match) {
  return JSON.stringify({ v: VERSION, ...match });
}

// Returns the saved match, or null when the save is unusable.
export function decodeMatch(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return null;
  }
  if (!validMatch(data)) return null;
  const { cells, score, undos, won, undo } = data;
  return {
    cells,
    score,
    undos,
    won,
    undo: undo ? { cells: undo.cells, score: undo.score } : null
  };
}

export function loadMatch() {
  try {
    const text = localStorage.getItem(SAVE_KEY);
    if (text === null) return null;
    const match = decodeMatch(text);
    if (!match) localStorage.removeItem(SAVE_KEY);
    return match;
  } catch {
    return null;
  }
}

export function storeMatch(match) {
  try {
    localStorage.setItem(SAVE_KEY, encodeMatch(match));
  } catch {
    // Storage unavailable or full: the match only lasts for this visit.
  }
}

export function clearMatch() {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    // Storage unavailable: nothing was saved.
  }
}
