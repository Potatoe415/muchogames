// localStorage: the match in progress, so leaving it by any route and coming
// back resumes it. The sequence is the whole state: the current round
// restarts from its first colour. Everything read back is validated.
import { isDifficulty, isValidSequence } from "./rules.js";

const SAVE_KEY = "simon-current";
const VERSION = 1;

// `match` is game.snapshot(): { sequence, difficulty }.
export function encodeMatch(match) {
  return JSON.stringify({
    v: VERSION,
    sequence: match.sequence,
    difficulty: match.difficulty
  });
}

// Returns the saved match, or null when the save is unusable.
export function decodeMatch(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return null;
  }
  if (data?.v !== VERSION || !isValidSequence(data.sequence)) return null;
  // Saves from before the Easy level have no difficulty: they were Normal.
  const difficulty = data.difficulty ?? "normal";
  if (!isDifficulty(difficulty)) return null;
  return { sequence: [...data.sequence], difficulty };
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
