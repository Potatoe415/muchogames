// The match in progress under one key, so leaving by any route and coming
// back resumes it. Only the list of columns played is stored; reading it
// back replays it through the rules, so a bad or finished save is dropped.
import { isOver, replay } from "./rules.js";

const SAVE_KEY = "muchogames_connectfour_save";
const VERSION = 1;

function readMoves(data) {
  if (data?.v !== VERSION || !Array.isArray(data.moves)) return null;
  const match = replay(data.moves);
  return match && !isOver(match) ? match : null;
}

export function loadMatch() {
  try {
    const match = readMoves(JSON.parse(localStorage.getItem(SAVE_KEY)));
    if (match) return match;
    localStorage.removeItem(SAVE_KEY);
  } catch {
    // Unreadable save or storage unavailable: no match to resume.
  }
  return null;
}

export function storeMatch(match) {
  try {
    const data = { v: VERSION, moves: match.moves };
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch {
    // Storage full or unavailable: the match only lasts for this visit.
  }
}

export function clearMatch() {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    // Storage unavailable: nothing was saved.
  }
}
