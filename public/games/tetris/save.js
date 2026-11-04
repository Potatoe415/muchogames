// localStorage: the match in progress, so leaving it by any route and coming
// back resumes it exactly. Everything read back is validated before use.
import { QUEUE_SIZE } from "./flow.js";
import { COLS, ROWS, collides } from "./grid.js";
import { CELLS, TYPES } from "./pieces.js";
import { MAX_START_LEVEL } from "./prefs.js";

const SAVE_KEY = "tetris-current";
const VERSION = 1;
const MAX_SCORE = 1e9;
const MAX_LINES = 1e5;

const isInt = (n, min, max) => Number.isInteger(n) && n >= min && n <= max;
const isNum = (n, max) => Number.isFinite(n) && n >= 0 && n <= max;
const isType = (t) => TYPES.includes(t);
const isTypes = (list, max) =>
  Array.isArray(list) && list.length <= max && list.every(isType);

function validGrid(grid) {
  return (
    Array.isArray(grid) &&
    grid.length === ROWS &&
    grid.every(
      (row) =>
        Array.isArray(row) &&
        row.length === COLS &&
        row.every((v) => isInt(v, 0, TYPES.length))
    )
  );
}

function validPiece(grid, p) {
  return (
    isType(p?.type) &&
    isInt(p.rot, 0, CELLS[p.type].length - 1) &&
    isInt(p.x, -4, COLS) &&
    isInt(p.y, -4, ROWS) &&
    !collides(grid, p.type, p.rot, p.x, p.y)
  );
}

function validTimers(d) {
  return (
    isNum(d.fallTimer, 100) &&
    (d.lockTimer === null || isNum(d.lockTimer, 100)) &&
    isInt(d.lockResets, 0, 100) &&
    isInt(d.lowest, -4, ROWS) &&
    isInt(d.kick, 0, 4) &&
    (d.lastAction === null || ["move", "rotate"].includes(d.lastAction))
  );
}

function validMatch(d) {
  return (
    d?.v === VERSION &&
    isInt(d.startLevel, 1, MAX_START_LEVEL) &&
    validGrid(d.grid) &&
    validPiece(d.grid, d.piece) &&
    isTypes(d.bag, TYPES.length) &&
    isTypes(d.queue, QUEUE_SIZE + 1) &&
    (d.hold === null || isType(d.hold)) &&
    typeof d.holdUsed === "boolean" &&
    isInt(d.score, 0, MAX_SCORE) &&
    isInt(d.lines, 0, MAX_LINES) &&
    isInt(d.combo, -1, MAX_LINES) &&
    typeof d.b2b === "boolean" &&
    d.over === null &&
    validTimers(d)
  );
}

// `state` is engine.snapshot(): plain values only.
export const encodeMatch = (state) => JSON.stringify({ v: VERSION, ...state });

// Returns the saved engine state, or null when the save is unusable.
export function decodeMatch(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return null;
  }
  if (!validMatch(data)) return null;
  delete data.v;
  return data;
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

export function storeMatch(state) {
  try {
    localStorage.setItem(SAVE_KEY, encodeMatch(state));
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
