// Piece life cycle: spawn, lock, clear, score, game over.
import { draw } from "./bag.js";
import { HIDDEN, clearFull, collides } from "./grid.js";
import { place } from "./grid.js";
import { grounded } from "./motion.js";
import { CELLS, SPAWN } from "./pieces.js";
import { levelFor, scoreLock } from "./scoring.js";
import { detectSpin } from "./tspin.js";

export const QUEUE_SIZE = 5;

export function nextType({ s, rng }) {
  while (s.queue.length <= QUEUE_SIZE) s.queue.push(draw(s.bag, rng));
  return s.queue.shift();
}

function topOut(ctx, reason) {
  ctx.s.over = reason;
  ctx.events.push({ type: "over", reason });
}

export function spawn(ctx, type) {
  const { s } = ctx;
  // Whole on the first visible row; the hidden rows only take rotation kicks.
  const piece = { type, rot: 0, x: SPAWN[type].x, y: SPAWN[type].y + HIDDEN };
  s.lastAction = null;
  s.fallTimer = 0;
  s.lockTimer = null;
  s.lockResets = 0;
  s.piece = piece;
  if (collides(s.grid, type, 0, piece.x, piece.y)) return topOut(ctx, "blockout");
  s.lowest = piece.y;
  if (grounded(ctx)) s.lockTimer = 0;
}

const isHidden = (piece) =>
  CELLS[piece.type][piece.rot].every(([, r]) => piece.y + r < HIDDEN);

export function lock(ctx) {
  const { s, events } = ctx;
  const { piece } = s;
  const spin = detectSpin(s.grid, piece, s.lastAction, s.kick);
  const hidden = isHidden(piece);
  place(s.grid, piece);
  const lines = clearFull(s.grid);
  const level = levelFor(s.startLevel, s.lines);
  const res = scoreLock({ lines, spin, level, combo: s.combo, b2b: s.b2b });
  s.score += res.points;
  s.combo = res.combo;
  s.b2b = res.b2b;
  s.lines += lines;
  events.push({ type: "lock", lines, spin, combo: res.combo, points: res.points, b2b: res.b2bApplied });
  if (levelFor(s.startLevel, s.lines) > level) events.push({ type: "level" });
  s.holdUsed = false;
  if (hidden && lines === 0) topOut(ctx, "lockout");
  else spawn(ctx, nextType(ctx));
}
