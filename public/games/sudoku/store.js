// localStorage: the grid in progress (resumed after a reload), best times per
// level and preferences. Everything read back is validated before use.
import { ALL, SIZE } from "./grid.js";
import { LEVEL_IDS } from "./levels.js";

const GAME_KEY = "sudoku-current";
const BEST_KEY = "sudoku-best-times";
const PREFS_KEY = "sudoku-prefs";
const DEFAULT_PREFS = { showErrors: true };

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
    s.puzzle.every((v, i) => v === 0 || (v === s.solution[i] && v === s.values[i]))
  );
}

export function loadGame() {
  const state = readJson(GAME_KEY);
  return isValidState(state) ? state : null;
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
  return {
    showErrors:
      typeof stored?.showErrors === "boolean"
        ? stored.showErrors
        : DEFAULT_PREFS.showErrors
  };
}

export const savePrefs = (prefs) =>
  writeStorage(PREFS_KEY, JSON.stringify(prefs));
