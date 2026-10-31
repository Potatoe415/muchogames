// localStorage: the match in progress, so leaving it by any route and coming
// back resumes it exactly (items in flight included). Everything read back
// is validated before use.
import { MAX_SECONDS, MODE_IDS } from "./rules.js";
import { BOMB, BONUS, THEME_IDS, isThemeItem } from "./themes.js";

const SAVE_KEY = "fruitslash-current";
const VERSION = 1;
const COUNTS = ["score", "sliced", "bestCombo"];
const TIMES = ["timeLeft", "elapsed", "spawnClock"];
const BODY = ["x", "y", "vx", "vy", "rot", "spin"];
const MAX_ITEMS = 40;
const MAX_HALVES = 80;
const MAX_COORD = 5;
const MAX_SPEED = 20;

const pick = (source, keys) =>
  Object.fromEntries(keys.map((key) => [key, source[key]]));
const isCount = (n) => Number.isInteger(n) && n >= 0;
const within = (n, limit) => Number.isFinite(n) && Math.abs(n) <= limit;

export function encodeMatch(world) {
  return JSON.stringify({
    v: VERSION,
    ...pick(world, ["mode", "theme", ...COUNTS, ...TIMES]),
    items: world.items.map((item) => pick(item, ["e", ...BODY])),
    halves: world.halves.map((half) =>
      pick(half, ["e", ...BODY, "cut", "side"])
    )
  });
}

function validMeta(data) {
  return (
    data?.v === VERSION &&
    MODE_IDS.includes(data.mode) &&
    THEME_IDS.includes(data.theme) &&
    COUNTS.every((key) => isCount(data[key])) &&
    TIMES.every((key) => Number.isFinite(data[key])) &&
    data.timeLeft > 0 &&
    data.timeLeft <= MAX_SECONDS &&
    data.elapsed >= 0 &&
    within(data.spawnClock, 5)
  );
}

// Bombs only fly in the ninja mode.
function validEmoji(data, emoji) {
  if (emoji === BOMB.e) return data.mode === "ninja";
  return emoji === BONUS.e || isThemeItem(data.theme, emoji);
}

function validBody(data, body) {
  return (
    validEmoji(data, body?.e) &&
    within(body.x, MAX_COORD) &&
    within(body.y, MAX_COORD) &&
    within(body.vx, MAX_SPEED) &&
    within(body.vy, MAX_SPEED) &&
    Number.isFinite(body.rot) &&
    within(body.spin, MAX_SPEED)
  );
}

function validBodies(data) {
  const { items, halves } = data;
  return (
    Array.isArray(items) &&
    Array.isArray(halves) &&
    items.length <= MAX_ITEMS &&
    halves.length <= MAX_HALVES &&
    items.every((item) => validBody(data, item)) &&
    halves.every(
      (half) =>
        validBody(data, half) &&
        Number.isFinite(half.cut) &&
        [-1, 1].includes(half.side) &&
        half.e !== BOMB.e
    )
  );
}

// Returns the world of the saved match, or null when the save is unusable.
export function decodeMatch(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return null;
  }
  if (!validMeta(data) || !validBodies(data)) return null;
  return {
    ...pick(data, ["mode", "theme", ...COUNTS, ...TIMES]),
    items: data.items.map((item) => pick(item, ["e", ...BODY])),
    halves: data.halves.map((half) => pick(half, ["e", ...BODY, "cut", "side"]))
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

export function storeMatch(world) {
  try {
    localStorage.setItem(SAVE_KEY, encodeMatch(world));
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
