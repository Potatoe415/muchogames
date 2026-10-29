// localStorage: the match in progress (grid, undo history, selection, notes
// mode, pause; resumed after leaving by any route), best times per
// level and preferences. Everything read back is validated before use.
import { ALL, SIZE } from "./grid.js";
import { LEVEL_IDS } from "./levels.js";
import { HISTORY_LIMIT } from "./model.js";

const GAME_KEY = "sudoku-current";
const BEST_KEY = "sudoku-best-times";
const PREFS_KEY = "sudoku-prefs";
const DEFAULT_PREFS = { showErrors: false, showHint: false };

export function readStorage(key, fallback) {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

export function writeStorage(key, value) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    // Storage unavailable: the value only lasts for this visit.
  }
}

function readJson(key) {
  try {
    return JSON.parse(readStorage(key, "null"));
  } catch {
    return null;
  }
}

const isCount = (n) => Number.isInteger(n) && n >= 0 && n < 1e7;

const isGrid = (list, max) =>
  Array.isArray(list) &&
  list.length === SIZE &&
  list.every((v) => Number.isInteger(v) && v >= 0 && v <= max);

const isInt = (n, min, max) => Number.isInteger(n) && n >= min && n <= max;

// Undo only ever records editable cells.
const isUndoCell = (c, puzzle) =>
  isInt(c?.i, 0, SIZE - 1) &&
  puzzle[c.i] === 0 &&
  isInt(c.v, 0, 9) &&
  isInt(c.n, 0, ALL) &&
  isInt(c.h, 0, 1);

const isHistory = (list, puzzle) =>
  Array.isArray(list) &&
  list.length <= HISTORY_LIMIT &&
  list.every(
    (step) =>
      Array.isArray(step) &&
      step.length <= SIZE &&
      step.every((c) => isUndoCell(c, puzzle))
  );

const isUi = (ui) =>
  isInt(ui?.selected, -1, SIZE - 1) &&
  isInt(ui.digit, 0, 9) &&
  typeof ui.notesMode === "boolean" &&
  typeof ui.paused === "boolean";

// Saves from before `history` / `ui` existed still load.
function isValidState(s) {
  return (
    LEVEL_IDS.includes(s?.level) &&
    isGrid(s.puzzle, 9) &&
    isGrid(s.solution, 9) &&
    isGrid(s.values, 9) &&
    isGrid(s.notes, ALL) &&
    isGrid(s.hinted, 1) &&
    [s.seconds, s.hints, s.mistakes].every(isCount) &&
    s.solution.every((v) => v > 0) &&
    s.puzzle.every((v, i) => v === 0 || (v === s.solution[i] && v === s.values[i])) &&
    (s.history === undefined || isHistory(s.history, s.puzzle)) &&
    (s.ui === undefined || isUi(s.ui))
  );
}

export function loadGame() {
  const state = readJson(GAME_KEY);
  if (!isValidState(state)) return null;
  state.history ??= [];
  return state;
}

export const saveGame = (state) =>
  writeStorage(GAME_KEY, state ? JSON.stringify(state) : null);

export function loadBest() {
  const stored = readJson(BEST_KEY);
  return Object.fromEntries(
    LEVEL_IDS.map((id) => [id, isCount(stored?.[id]) ? stored[id] : 0])
  );
}

export const saveBest = (best) => writeStorage(BEST_KEY, JSON.stringify(best));

export function loadPrefs() {
  const stored = readJson(PREFS_KEY);
  return Object.fromEntries(
    Object.entries(DEFAULT_PREFS).map(([key, fallback]) => [
      key,
      typeof stored?.[key] === "boolean" ? stored[key] : fallback
    ])
  );
}

export const savePrefs = (prefs) =>
  writeStorage(PREFS_KEY, JSON.stringify(prefs));
