// localStorage: the run in progress, so leaving it by any route and coming
// back resumes it exactly. Everything read back is validated before use.
import { COURSES } from "./config.js";
import { createCourse } from "./course.js";
import { makeEntity } from "./entities.js";
import { SPRITE, isSprite } from "./sprites.js";
import { encodeWorld, restoreWorld } from "./world.js";

const SAVE_KEY = "skifree-current";
const VERSION = 1;
const MAX_ITEMS = 5000;
const SKIER_NUMBERS = ["x", "y", "vz", "speed", "t"];
const SKIER_POSITIVE = ["z", "grace", "turnGap", "stepT", "style"];
const SKIER_INTS = {
  dir: [-3, 3],
  side: [-1, 1],
  step: [0, 1],
  spin: [0, 3],
  flip: [0, 3],
  spins: [0, Number.MAX_SAFE_INTEGER],
  flips: [0, Number.MAX_SAFE_INTEGER]
};
// Set on the first take-off (air.js).
const AIR_DEFAULTS = { spin: 0, flip: 0, spins: 0, flips: 0, ramp: false };
const SKIER_MODES = ["ski", "air", "crash", "eaten"];
const SKIER_KEYS = [
  ...SKIER_NUMBERS,
  ...SKIER_POSITIVE,
  ...Object.keys(SKIER_INTS),
  "ramp",
  "mode",
  "crashSprite"
];
const GATE_CODES = { ok: "o", miss: "x" };
const GATE_STATES = new Map([
  ["-", null],
  ["o", "ok"],
  ["x", "miss"]
]);
const GATE_SPRITES = { ok: SPRITE.gateOk, miss: SPRITE.gateMiss };
const RUN_KEYS = ["mode", "time", "missed", "style"];
const MOVER_MODES = new Map([
  ["dog", ["go", "bark", "flee"]],
  ["npc", ["go", "down"]],
  ["boarder", ["go", "flip"]]
]);
const MOVER_NUMBERS = ["t", "next", "vx", "vy"];
const CELL_KEY = /^-?\d{1,7},-?\d{1,7}$/;
const BURNT = ["fire", "ash"];

const isNum = Number.isFinite;
const isCount = (n) => Number.isInteger(n) && n >= 0;
const isPositive = (n) => isNum(n) && n >= 0;
const inRange = (n, [min, max]) => Number.isInteger(n) && n >= min && n <= max;
const isList = (list) => Array.isArray(list) && list.length <= MAX_ITEMS;
const isUnique = (list) => new Set(list).size === list.length;
const pick = (source, keys) =>
  Object.fromEntries(keys.map((key) => [key, source[key]]));

const encodeGates = (gates) =>
  gates.map((gate) => GATE_CODES[gate.state] ?? "-").join("");

export function encodeRun(game) {
  const { course } = game;
  return JSON.stringify({
    v: VERSION,
    time: game.time,
    turbo: game.turbo,
    skier: pick({ ...AIR_DEFAULTS, ...game.skier }, SKIER_KEYS),
    yeti: game.yeti,
    gates: {
      slalom: encodeGates(course.gates.slalom),
      tree: encodeGates(course.gates.tree)
    },
    run: course.run,
    world: encodeWorld(game.world)
  });
}

function validSkier(s) {
  return (
    SKIER_NUMBERS.every((key) => isNum(s?.[key])) &&
    SKIER_POSITIVE.every((key) => isPositive(s[key])) &&
    Object.entries(SKIER_INTS).every(([key, range]) =>
      inRange(s[key], range)
    ) &&
    s.side !== 0 &&
    SKIER_MODES.includes(s.mode) &&
    typeof s.ramp === "boolean" &&
    isSprite(s.crashSprite)
  );
}

function validYeti(yeti, skier) {
  const mob = yeti?.mob;
  const mobOk =
    mob === null
      ? skier.mode !== "eaten"
      : ["x", "y", "t"].every((key) => isNum(mob?.[key])) &&
        isSprite(mob.sprite);
  return (
    mobOk &&
    isNum(yeti.nextM) &&
    isPositive(yeti.eatT) &&
    inRange(yeti.frame, [-1, SPRITE.yetiEat.length - 1]) &&
    yeti.done === false
  );
}

const validRun = (run) =>
  run === null ||
  (Object.hasOwn(COURSES, run?.mode) &&
    isPositive(run.time) &&
    isCount(run.missed) &&
    isNum(run.style));

function restoreCourse(gates, run) {
  const course = createCourse();
  const lanes = Object.entries(course.gates);
  const fits = lanes.every(
    ([mode, list]) =>
      typeof gates?.[mode] === "string" &&
      gates[mode].length === list.length &&
      [...gates[mode]].every((code) => GATE_STATES.has(code))
  );
  if (!fits || !validRun(run)) return null;
  lanes.forEach(([mode, list]) => {
    list.forEach((gate, i) => {
      gate.state = GATE_STATES.get(gates[mode][i]);
      gate.sprite = GATE_SPRITES[gate.state] ?? gate.sprite;
    });
  });
  course.run = run && pick(run, RUN_KEYS);
  return course;
}

function restoreMover(m) {
  const base = typeof m?.id === "string" && isNum(m.x) && isNum(m.y);
  if (!base || !isSprite(m.sprite)) return null;
  const extra = { id: m.id, sprite: m.sprite };
  if (m.kind === "yellow") return makeEntity("yellow", m.x, m.y, extra);
  if (!MOVER_MODES.get(m.kind)?.includes(m.mode)) return null;
  if (!MOVER_NUMBERS.every((key) => isNum(m[key]))) return null;
  return makeEntity(m.kind, m.x, m.y, {
    ...extra,
    ...pick(m, MOVER_NUMBERS),
    mode: m.mode
  });
}

const validBurnt = (cells) => (entry) =>
  Array.isArray(entry) &&
  cells.has(entry[0]) &&
  isCount(entry[1]) &&
  BURNT.includes(entry[2]) &&
  isPositive(entry[3]) &&
  isSprite(entry[4]);

function decodeWorld(data, course) {
  const { seed, cells, movers, burnt } = data ?? {};
  if (!inRange(seed, [0, 0xffffffff])) return null;
  if (![cells, movers, burnt].every(isList) || !isUnique(cells)) return null;
  if (!cells.every((key) => typeof key === "string" && CELL_KEY.test(key)))
    return null;
  if (!burnt.every(validBurnt(new Set(cells)))) return null;
  const restored = movers.map(restoreMover);
  if (restored.includes(null)) return null;
  if (!isUnique(restored.map((mover) => mover.id))) return null;
  return restoreWorld(course, { seed, cells, movers: restored, burnt });
}

// Returns the run fields of the game state, or null when the save is unusable.
export function decodeRun(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return null;
  }
  if (data?.v !== VERSION || !isPositive(data.time)) return null;
  if (typeof data.turbo !== "boolean" || !validSkier(data.skier)) return null;
  if (!validYeti(data.yeti, data.skier)) return null;
  const course = restoreCourse(data.gates, data.run);
  const world = course && decodeWorld(data.world, course);
  if (!world) return null;
  const { mob } = data.yeti;
  return {
    time: data.time,
    turbo: data.turbo,
    skier: pick(data.skier, SKIER_KEYS),
    yeti: {
      ...pick(data.yeti, ["nextM", "eatT", "frame", "done"]),
      mob: mob && pick(mob, ["x", "y", "t", "sprite"])
    },
    course,
    world
  };
}

export function loadRun() {
  try {
    const text = localStorage.getItem(SAVE_KEY);
    if (text === null) return null;
    const run = decodeRun(text);
    if (!run) localStorage.removeItem(SAVE_KEY);
    return run;
  } catch {
    return null;
  }
}

export function storeRun(text) {
  try {
    localStorage.setItem(SAVE_KEY, text);
  } catch {
    // Storage unavailable or full: the run only lasts for this visit.
  }
}

export function clearRun() {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    // Storage unavailable: nothing was saved.
  }
}
