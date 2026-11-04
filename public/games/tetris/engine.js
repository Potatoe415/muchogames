// Tetris rules as pure logic (no DOM, no timers): the caller feeds elapsed
// seconds to tick() and the player's actions, and reads `state` and drain().
import { QUEUE_SIZE, lock, nextType, spawn } from "./flow.js";
import { emptyGrid } from "./grid.js";
import { MAX_RESETS, grounded, rotate, shift } from "./motion.js";
import { fallInterval } from "./scoring.js";

export { MAX_RESETS, QUEUE_SIZE };
export const LOCK_DELAY = 0.5;
// Game Boy: 1 point per row pushed down (it had no hard drop; same here).
const DROP_POINTS = 1;

function freshState(startLevel, ghost) {
  return {
    startLevel,
    ghost,
    grid: emptyGrid(),
    bag: [],
    queue: [],
    piece: null,
    score: 0,
    lines: 0,
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
    if (soft) s.score += DROP_POINTS;
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
  while (shift(ctx, 0, 1)) ctx.s.score += DROP_POINTS;
  ctx.events.push({ type: "hard" });
  lock(ctx);
}

// An action that can fail; emits `type` when it worked.
function act(ctx, type, run) {
  const ok = !ctx.s.over && run();
  if (ok) ctx.events.push({ type });
  return ok;
}

// `ghost` is only carried along so a saved match keeps its setting.
export function createEngine({
  startLevel = 0,
  ghost = false,
  rng = Math.random,
  saved
} = {}) {
  const s = saved ? structuredClone(saved) : freshState(startLevel, ghost);
  const ctx = { s, events: [], rng };
  if (!saved) spawn(ctx, nextType(ctx));
  return {
    state: s,
    move: (dx) => act(ctx, "move", () => shift(ctx, dx, 0)),
    rotate: (dir) => act(ctx, "rotate", () => rotate(ctx, dir)),
    hardDrop: () => hardDrop(ctx),
    tick: (dt, soft) => tick(ctx, dt, soft),
    drain: () => ctx.events.splice(0, ctx.events.length),
    snapshot: () => structuredClone(s)
  };
}
