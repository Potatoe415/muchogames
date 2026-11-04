// Moving and rotating the falling piece, with the lock-delay bookkeeping.
// Every function takes the engine context { s: state, events, rng }.
import { collides } from "./grid.js";
import { kicksFor } from "./pieces.js";

export const MAX_RESETS = 15;

export const grounded = ({ s }) =>
  collides(s.grid, s.piece.type, s.piece.rot, s.piece.x, s.piece.y + 1);

// After the piece moved or rotated: lock delay and its reset limit.
export function settle(ctx, moved) {
  const { s } = ctx;
  if (s.piece.y > s.lowest) {
    s.lowest = s.piece.y;
    s.lockResets = 0;
  }
  if (!grounded(ctx)) {
    s.lockTimer = null;
  } else if (s.lockTimer === null) {
    s.lockTimer = 0;
  } else if (moved && s.lockResets < MAX_RESETS) {
    s.lockTimer = 0;
    s.lockResets += 1;
  }
}

export function shift(ctx, dx, dy) {
  const { s } = ctx;
  const { type, rot, x, y } = s.piece;
  if (collides(s.grid, type, rot, x + dx, y + dy)) return false;
  s.piece.x += dx;
  s.piece.y += dy;
  settle(ctx, true);
  return true;
}

export function rotate(ctx, dir) {
  const { s } = ctx;
  const { type, rot, x, y } = s.piece;
  const to = (rot + dir + 4) % 4;
  const kick = kicksFor(type, rot, to).find(
    ([dx, dy]) => !collides(s.grid, type, to, x + dx, y + dy)
  );
  if (!kick) return false;
  s.piece = { type, rot: to, x: x + kick[0], y: y + kick[1] };
  settle(ctx, true);
  return true;
}
