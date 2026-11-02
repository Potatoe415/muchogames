// localStorage: the match in progress (resumed after leaving by any route)
// and the last player names. Everything read back is validated before use.
import { CATS, isNode } from "./board.js";
import { MAX_PLAYERS } from "./model.js";

const GAME_KEY = "trivialpursuit-current";
const NAMES_KEY = "trivialpursuit-names";
const PHASES = ["roll", "move", "ask", "reveal", "choose", "over"];
export const NAME_MAX = 16;

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

export function readJson(key) {
  try {
    return JSON.parse(readStorage(key, "null"));
  } catch {
    return null;
  }
}

const isInt = (n, min, max) => Number.isInteger(n) && n >= min && n <= max;
const isName = (n) =>
  typeof n === "string" && n.length > 0 && n.length <= NAME_MAX;

const isPlayer = (p) =>
  isName(p?.name) &&
  isNode(p.pos) &&
  Array.isArray(p.wedges) &&
  p.wedges.length === CATS &&
  p.wedges.every((w) => typeof w === "boolean") &&
  isInt(p.asked, 0, 1e6) &&
  isInt(p.right, 0, p.asked);

const isQuestion = (q) =>
  isInt(q?.cat, 0, CATS - 1) &&
  isInt(q.i, 0, 1e5) &&
  typeof q.final === "boolean" &&
  typeof q.hq === "boolean";

function isValidMatch(s) {
  if (s?.v !== 1 || !PHASES.includes(s.phase)) return false;
  if (!Array.isArray(s.players) || !isInt(s.players.length, 1, MAX_PLAYERS)) {
    return false;
  }
  const asking = s.phase === "ask" || s.phase === "reveal";
  return (
    s.players.every(isPlayer) &&
    isInt(s.cur, 0, s.players.length - 1) &&
    isInt(s.die, 0, 6) &&
    (s.phase !== "move" || s.die > 0) &&
    (asking ? isQuestion(s.q) : s.q === null) &&
    (s.phase === "choose" ? ["free", "final"].includes(s.choose) : true) &&
    isInt(s.winner, -1, s.players.length - 1) &&
    isInt(s.turns, 1, 1e6)
  );
}

export function loadMatch() {
  const state = readJson(GAME_KEY);
  return isValidMatch(state) && state.phase !== "over" ? state : null;
}

export const saveMatch = (state) =>
  writeStorage(GAME_KEY, state ? JSON.stringify(state) : null);

export function loadNames() {
  const stored = readJson(NAMES_KEY);
  return Array.isArray(stored)
    ? stored.filter(isName).slice(0, MAX_PLAYERS)
    : [];
}

export const saveNames = (names) =>
  writeStorage(NAMES_KEY, JSON.stringify(names));
