// localStorage: the match in progress, so leaving it by any route and coming
// back resumes it exactly. Everything read back is validated before use.
import { OPEN, isWon, restoreBoard } from "./board.js";
import { LEVEL_IDS, MAX_SECONDS, levelLayout } from "./levels.js";

const SAVE_KEY = "minesweeper-current";
const VERSION = 1;

export function encodeMatch({ level, flagMode, elapsed, board }) {
  return JSON.stringify({
    v: VERSION,
    level,
    flagMode,
    elapsed: Math.round(elapsed),
    rows: board.rows,
    cols: board.cols,
    mines: board.mines,
    placed: board.placed,
    mine: board.mine.join(""),
    state: board.state.join("")
  });
}

// The saved size must be the level's, in either orientation.
function validLayout(data) {
  if (!LEVEL_IDS.includes(data.level)) return false;
  return [false, true].some((portrait) => {
    const layout = levelLayout(data.level, portrait);
    return (
      layout.rows === data.rows &&
      layout.cols === data.cols &&
      layout.mines === data.mines
    );
  });
}

function validCells(data) {
  const size = data.rows * data.cols;
  const { mine, state } = data;
  if (typeof mine !== "string" || typeof state !== "string") return false;
  if (mine.length !== size || state.length !== size) return false;
  if (!/^[01]*$/.test(mine) || !/^[012]*$/.test(state)) return false;
  const mineCount = mine.split("").filter((c) => c === "1").length;
  return mineCount === (data.placed ? data.mines : 0);
}

function validMeta(data) {
  return (
    data?.v === VERSION &&
    typeof data.flagMode === "boolean" &&
    typeof data.placed === "boolean" &&
    Number.isFinite(data.elapsed) &&
    data.elapsed >= 0
  );
}

// Still playable: no mine opened, not already won, nothing opened before
// the mines were placed.
function playable(board) {
  const openMine = board.state.some((s, i) => s === OPEN && board.mine[i]);
  return !openMine && !isWon(board) && (board.placed || board.opened === 0);
}

export function decodeMatch(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return null;
  }
  if (!validMeta(data) || !validLayout(data) || !validCells(data)) return null;
  const board = restoreBoard({
    ...data,
    mine: Array.from(data.mine, Number),
    state: Array.from(data.state, Number)
  });
  if (!playable(board)) return null;
  return {
    level: data.level,
    flagMode: data.flagMode,
    elapsed: Math.min(data.elapsed, MAX_SECONDS * 1000),
    board
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
