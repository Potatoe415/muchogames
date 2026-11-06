// The match in progress under one key, so leaving by any route and coming
// back resumes it. Only the mode, the first colour and the columns played
// are stored; reading it back replays them through the rules, so a bad or
// finished save is dropped. A v1 save (before the bot) is a player vs
// player match that Red started.
import { PLAYERS, isOver, replay } from "./rules.js";

const SAVE_KEY = "muchogames_connectfour_save";
const VERSION = 2;
export const MODES = ["pvp", "easy", "normal"];

function readMoves(data) {
  if (!Array.isArray(data?.moves)) return null;
  const old = data.v === 1;
  if (!old && data.v !== VERSION) return null;
  const mode = old ? "pvp" : data.mode;
  const first = old ? 1 : data.first;
  if (!MODES.includes(mode) || !PLAYERS.includes(first)) return null;
  const match = replay(data.moves, first);
  return match && !isOver(match) ? { ...match, mode } : null;
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
    const data = {
      v: VERSION,
      mode: match.mode,
      first: match.first,
      moves: match.moves
    };
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
