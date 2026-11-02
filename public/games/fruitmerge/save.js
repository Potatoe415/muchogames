// localStorage: the match in progress, so leaving it by any route and coming
// back resumes it exactly (fruits in flight and the undo step included).
// Everything read back is validated before use.
import { FRUITS, LAST, MAX_DROP_LEVEL } from "./fruits.js";
import {
  DANGER_LIMIT,
  MAX_BODIES,
  QUEUE_SIZE,
  SWEEPS,
  UNDOS
} from "./world.js";

const SAVE_KEY = "fruitmerge-current";
const VERSION = 1;
const BODY = ["level", "x", "y", "vx", "vy", "angle", "age"];
const STEP = ["score", "merges", "top", "danger"];
const MAX_COORD = 3;
const MAX_SPEED = 10;
const MAX_SCORE = 1e9;

const pick = (source, keys) =>
  Object.fromEntries(keys.map((key) => [key, source[key]]));
const isInt = (n, min, max) => Number.isInteger(n) && n >= min && n <= max;
const within = (n, limit) => Number.isFinite(n) && Math.abs(n) <= limit;

const packStep = (step) => ({
  ...pick(step, STEP),
  queue: [...step.queue],
  bodies: step.bodies.map((body) => pick(body, BODY))
});

export function encodeMatch(world) {
  return JSON.stringify({
    v: VERSION,
    ...packStep(world),
    ...pick(world, ["aim", "cooldown", "sweeps", "undos"]),
    undo: world.undo ? packStep(world.undo) : null
  });
}

function validBody(body) {
  return (
    isInt(body?.level, 0, LAST) &&
    within(body.x, MAX_COORD) &&
    within(body.y, MAX_COORD) &&
    within(body.vx, MAX_SPEED) &&
    within(body.vy, MAX_SPEED) &&
    Number.isFinite(body.angle) &&
    Number.isFinite(body.age) &&
    body.age >= 0
  );
}

function validStep(step) {
  return (
    isInt(step?.score, 0, MAX_SCORE) &&
    isInt(step.merges, 0, MAX_SCORE) &&
    isInt(step.top, 0, LAST) &&
    Number.isFinite(step.danger) &&
    step.danger >= 0 &&
    step.danger < DANGER_LIMIT &&
    Array.isArray(step.queue) &&
    step.queue.length === QUEUE_SIZE &&
    step.queue.every((level) => isInt(level, 0, MAX_DROP_LEVEL)) &&
    Array.isArray(step.bodies) &&
    step.bodies.length <= MAX_BODIES &&
    step.bodies.every(validBody)
  );
}

function validMatch(data) {
  return (
    data?.v === VERSION &&
    validStep(data) &&
    (data.undo === null || validStep(data.undo)) &&
    within(data.aim, 1) &&
    within(data.cooldown, 1) &&
    isInt(data.sweeps, 0, SWEEPS) &&
    isInt(data.undos, 0, UNDOS)
  );
}

const unpackBody = (body) => ({ ...pick(body, BODY), r: FRUITS[body.level].r });

const unpackStep = (step) => ({
  ...pick(step, STEP),
  queue: [...step.queue],
  bodies: step.bodies.map(unpackBody)
});

// Returns the world of the saved match, or null when the save is unusable.
export function decodeMatch(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return null;
  }
  if (!validMatch(data)) return null;
  return {
    ...unpackStep(data),
    ...pick(data, ["aim", "cooldown", "sweeps", "undos"]),
    undo: data.undo ? unpackStep(data.undo) : null
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
