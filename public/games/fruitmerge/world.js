// Pure match state: the fruits in the box, the queue (held fruit + the next
// three), drops, merges, the broom, undo and the loss rule. No DOM.
import {
  FRUITS,
  LAST,
  PAIR_POINTS,
  pointsFor,
  randomDropLevel
} from "./fruits.js";
import { BOX, stepPhysics } from "./physics.js";

export const LINE_Y = 0.2;
export const HOLD_Y = 0.1;
export const QUEUE_SIZE = 4;
export const SWEEPS = 2;
export const UNDOS = 3;
export const SWEPT_LEVELS = 2;
export const DANGER_LIMIT = 3;
export const MAX_BODIES = 200;
const COOLDOWN = 0.45;
// A dropped fruit needs this long before it can lose the match.
const SETTLE_AGE = 1;
const DROP_SPEED = 0.6;
const GROW_TIME = 0.15;

const copyBody = (b) => ({ ...b });

export function createWorld(saved) {
  if (saved) {
    return { ...saved, bodies: saved.bodies.map(copyBody), over: false };
  }
  return {
    bodies: [],
    queue: Array.from({ length: QUEUE_SIZE }, () => randomDropLevel()),
    aim: 0.5,
    cooldown: 0,
    score: 0,
    merges: 0,
    top: 0,
    sweeps: SWEEPS,
    undos: UNDOS,
    danger: 0,
    undo: null,
    over: false
  };
}

export function makeBody(level, x, y, extra = {}) {
  const r = FRUITS[level].r;
  return { level, r, x, y, vx: 0, vy: 0, angle: 0, age: 0, ...extra };
}

export const heldRadius = (world) => FRUITS[world.queue[0]].r;

export function setAim(world, x) {
  const r = heldRadius(world);
  world.aim = Math.max(r, Math.min(BOX.w - r, x));
}

export const canDrop = (world) =>
  !world.over && world.cooldown <= 0 && world.bodies.length < MAX_BODIES;

function rememberForUndo(world) {
  const { bodies, queue, score, merges, top, danger } = world;
  world.undo = {
    bodies: bodies.map(copyBody),
    queue: [...queue],
    score,
    merges,
    top,
    danger
  };
}

export function drop(world) {
  if (!canDrop(world)) return null;
  rememberForUndo(world);
  const level = world.queue.shift();
  world.queue.push(randomDropLevel());
  const body = makeBody(level, world.aim, HOLD_Y, { vy: DROP_SPEED });
  world.bodies.push(body);
  world.cooldown = COOLDOWN;
  setAim(world, world.aim);
  return body;
}

export const canUndo = (world) =>
  !world.over && world.undos > 0 && world.undo !== null;

export function undo(world) {
  if (!canUndo(world)) return false;
  Object.assign(world, world.undo, {
    bodies: world.undo.bodies.map(copyBody)
  });
  world.undo = null;
  world.undos -= 1;
  world.cooldown = 0;
  setAim(world, world.aim);
  return true;
}

const isSmall = (body) => body.level < SWEPT_LEVELS;

export const canSweep = (world) =>
  !world.over && world.sweeps > 0 && world.bodies.some(isSmall);

// Returns the swept fruits. Undo cannot reach back past a sweep.
export function sweep(world) {
  if (!canSweep(world)) return [];
  const swept = world.bodies.filter(isSmall);
  world.bodies = world.bodies.filter((body) => !isSmall(body));
  world.sweeps -= 1;
  world.undo = null;
  return swept;
}

function mergePair(world, a, b, events) {
  const x = (a.x + b.x) / 2;
  const y = (a.y + b.y) / 2;
  world.merges += 1;
  if (a.level === LAST) {
    world.score += PAIR_POINTS;
    events.push({ type: "pair", x, y, level: LAST, points: PAIR_POINTS });
    return;
  }
  const level = a.level + 1;
  const vx = (a.vx + b.vx) / 2;
  const vy = (a.vy + b.vy) / 2;
  world.bodies.push(
    makeBody(level, x, y, { vx, vy, age: SETTLE_AGE, grow: GROW_TIME })
  );
  world.top = Math.max(world.top, level);
  world.score += pointsFor(level);
  events.push({ type: "merge", x, y, level, points: pointsFor(level) });
}

function resolveMerges(world, pairs, events) {
  const gone = new Set();
  pairs.forEach(([a, b]) => {
    if (gone.has(a) || gone.has(b)) return;
    gone.add(a);
    gone.add(b);
    mergePair(world, a, b, events);
  });
  if (gone.size) world.bodies = world.bodies.filter((b) => !gone.has(b));
}

function overLine(world) {
  return world.bodies.some(
    (body) => body.age >= SETTLE_AGE && body.y - body.r < LINE_Y
  );
}

function ageBodies(world, dt) {
  world.bodies.forEach((body) => {
    body.age += dt;
    if (body.grow) body.grow = Math.max(0, body.grow - dt);
  });
}

// Advances the match by dt seconds; events lists what happened (merges,
// vanished watermelon pairs, the loss).
export function stepWorld(world, dt) {
  const events = [];
  if (world.over) return events;
  const pairs = [];
  stepPhysics(world.bodies, dt, (a, b) => {
    if (a.level === b.level) pairs.push([a, b]);
  });
  resolveMerges(world, pairs, events);
  ageBodies(world, dt);
  world.cooldown = Math.max(0, world.cooldown - dt);
  world.danger = overLine(world) ? world.danger + dt : 0;
  if (world.danger >= DANGER_LIMIT) {
    world.over = true;
    events.push({ type: "over" });
  }
  return events;
}
