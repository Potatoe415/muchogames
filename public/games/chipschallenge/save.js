// The match in progress (localStorage `chipschallenge-current`, decision
// 0054): level, failed attempts so far and the current attempt as seeds +
// input log + fingerprint (see replay.js). Anything that does not validate
// is dropped.
import { LEVELS } from "./levels.js";

const KEY = "chipschallenge-current";
const VERSION = 1;
const MAX_RUNS = 100000;

const isInt = (n, min, max) => Number.isInteger(n) && n >= min && n <= max;

function validInputs(inputs) {
  return (
    Array.isArray(inputs) &&
    inputs.length <= MAX_RUNS &&
    inputs.every(
      (run) =>
        Array.isArray(run) &&
        run.length === 2 &&
        isInt(run[0], 0, 0xff) &&
        isInt(run[1], 1, Number.MAX_SAFE_INTEGER)
    )
  );
}

function validCheck(check) {
  const keys = ["tic", "x", "y", "chips", "time", "actors"];
  return (
    check !== null &&
    typeof check === "object" &&
    keys.every((key) => Number.isInteger(check[key]))
  );
}

function valid(save) {
  return (
    save?.v === VERSION &&
    isInt(save.level, 1, LEVELS.length) &&
    isInt(save.failures, 0, Number.MAX_SAFE_INTEGER) &&
    isInt(save.seeds?.tw, 0, 0x7fffffff) &&
    isInt(save.seeds?.blob, 0, 0xff) &&
    validInputs(save.inputs) &&
    validCheck(save.check)
  );
}

// Needs LEVELS loaded (the level number is checked against it).
export function readMatch() {
  if (!LEVELS.length) return null;
  let save = null;
  try {
    save = JSON.parse(localStorage.getItem(KEY) ?? "null");
  } catch {
    save = undefined;
  }
  if (save === null) return null;
  if (valid(save)) return save;
  clearMatch();
  return null;
}

export function writeMatch({ level, failures, seeds, inputs, check }) {
  const save = { v: VERSION, level, failures, seeds, inputs, check };
  try {
    localStorage.setItem(KEY, JSON.stringify(save));
  } catch {
    // Storage unavailable or full: this visit simply cannot be resumed.
  }
}

export function clearMatch() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // Storage unavailable: nothing was saved either.
  }
}
