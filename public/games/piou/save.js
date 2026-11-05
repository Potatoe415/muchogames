// localStorage: the match in progress, so leaving it by any route and coming
// back resumes it (bird height and speed, pipes, score, scroll). A resumed
// match comes back frozen until the next flap. Everything read back is
// validated.
import { GROUND, HEIGHT } from "./engine.js";

const SAVE_KEY = "piou-current";
const VERSION = 1;
const MAX_PIPES = 40;

const isNum = (v, low, high) =>
  typeof v === "number" && Number.isFinite(v) && v >= low && v <= high;

const isPipe = (p) =>
  isNum(p?.x, -50, 1000) &&
  isNum(p.gap, 0, GROUND) &&
  typeof p.scored === "boolean";

// `match` is game.snapshot(): the engine state.
export function encodeMatch(match) {
  const { y, vy, pipes, nextIn, score, dist } = match;
  return JSON.stringify({ v: VERSION, y, vy, pipes, nextIn, score, dist });
}

// Returns the saved match, or null when the save is unusable.
export function decodeMatch(text) {
  let d;
  try {
    d = JSON.parse(text);
  } catch {
    return null;
  }
  const valid =
    d?.v === VERSION &&
    isNum(d.y, 0, HEIGHT) &&
    isNum(d.vy, -500, 500) &&
    Array.isArray(d.pipes) &&
    d.pipes.length <= MAX_PIPES &&
    d.pipes.every(isPipe) &&
    isNum(d.nextIn, -1000, 1000) &&
    Number.isInteger(d.score) &&
    isNum(d.score, 0, 1e6) &&
    isNum(d.dist, 0, 1e9);
  if (!valid) return null;
  return {
    phase: "ready",
    y: d.y,
    vy: 0,
    pipes: d.pipes.map(({ x, gap, scored }) => ({ x, gap, scored })),
    nextIn: d.nextIn,
    score: d.score,
    dist: d.dist,
    dying: 0
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
