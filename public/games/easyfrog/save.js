// The match in progress under one key, so leaving by any route and coming
// back resumes it. Everything read back is validated: a bad save is dropped.
import { isValidSnapshot } from "./snapshot.js";

const SAVE_KEY = "muchogames_easyfrog_save";
const VERSION = 1;

export function loadMatch() {
  try {
    const data = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (data?.v === VERSION && isValidSnapshot(data.match)) return data.match;
    localStorage.removeItem(SAVE_KEY);
  } catch {
    // Unreadable save or storage unavailable: no match to resume.
  }
  return null;
}

export function storeMatch(match) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ v: VERSION, match }));
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
