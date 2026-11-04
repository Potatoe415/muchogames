// Tetris rules as pure logic (no DOM, no timers): the caller feeds elapsed
// seconds to tick() and the player's actions, and reads `state` and drain().
import { QUEUE_SIZE, lock, nextType, spawn } from "./flow.js";
import { emptyGrid } from "./grid.js";
import { MAX_RESETS, grounded, rotate, shift } from "./motion.js";
import { fallInterval } from "./scoring.js";

export { MAX_RESETS, QUEUE_SIZE };
export const LOCK_DELAY = 0.5;
const SOFT_POINTS = 1;
const HARD_POINTS = 2;

function freshState(startLevel) {
  return {
    startLevel,
    grid: emptyGrid(),
    bag: [],
    queue: [],
    piece: null,
    hold: null,
    holdUsed: false,
    score: 0,
    lines: 0,
    combo: -1,
    b2b: false,
    lastAction: null,
    kick: 0,
    fallTimer: 0,
    lockTimer: null,
    lockResets: 0,
    lowest: 0,
    over: null
  };
}

// Gravity for `dt` seconds; false when the piece rests and cannot fall.
function fall(ctx, dt, soft) {
  const { s } = ctx;
  s.fallTimer += dt;
  const interval = fallInterval(s.startLevel, s.lines, soft);
  while (s.fallTimer >= interval && !s.over) {
    s.fallTimer -= interval;
    if (!shift(ctx, 0, 1)) {
      s.fallTimer = 0;
      return;
    }
    if (soft) s.score += SOFT_POINTS;
  }
}

function tick(ctx, dt, soft) {
  const { s } = ctx;
  if (s.over) return;
  fall(ctx, dt, soft);
  if (s.over || s.lockTimer === null || !grounded(ctx)) return;
  s.lockTimer += dt;
  if (s.lockTimer >= LOCK_DELAY) lock(ctx);
}

function hardDrop(ctx) {
  if (ctx.s.over) return;
  while (shift(ctx, 0, 1)) ctx.s.score += HARD_POINTS;
  ctx.events.push({ type: "hard" });
  lock(ctx);
}

function hold(ctx) {
  const { s } = ctx;
  if (s.over || s.holdUsed) return false;
  const held = s.hold;
  s.hold = s.piece.type;
  spawn(ctx, held ?? nextType(ctx));
  s.holdUsed = true;
  ctx.events.push({ type: "hold" });
  return true;
}

// An action that can fail; emits `type` when it worked.
function act(ctx, type, run) {
  const ok = !ctx.s.over && run();
  if (ok) ctx.events.push({ type });
  return ok;
}

export function createEngine({ startLevel = 1, rng = Math.random, saved } = {}) {
  const s = saved ? structuredClone(saved) : freshState(startLevel);
  const ctx = { s, events: [], rng };
  if (!saved) spawn(ctx, nextType(ctx));
  return {
    state: s,
    move: (dx) => act(ctx, "move", () => shift(ctx, dx, 0)),
    rotate: (dir) => act(ctx, "rotate", () => rotate(ctx, dir)),
    hardDrop: () => hardDrop(ctx),
    hold: () => hold(ctx),
    tick: (dt, soft) => tick(ctx, dt, soft),
    drain: () => ctx.events.splice(0, ctx.events.length),
    snapshot: () => structuredClone(s)
  };
}
