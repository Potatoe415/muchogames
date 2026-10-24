// Creature brains (which directions to try, in order) and sliding mobs.
import { terrainAt } from "./board.js";
import { tryMoveMob } from "./move.js";
import { E, N, S, W, back, bounceDir, left, right } from "./tiles.js";

const ahead = (d) => d;

// Fixed turn orders, relative to the way the creature faces.
const TURNS = {
  bug: [left, ahead, right, back],
  paramecium: [right, ahead, left, back],
  fireball: [ahead, right, left, back],
  glider: [ahead, left, right, back],
  ball: [ahead, back],
  tank: [ahead]
};

function shuffled(w, dirs) {
  const out = [...dirs];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(w.rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// Teeth close in on Chip along the axis where he is farther away first.
function towardChip(w, mob) {
  const dx = w.chip.x - mob.x;
  const dy = w.chip.y - mob.y;
  const h = dx < 0 ? W : E;
  const v = dy < 0 ? N : S;
  const order = Math.abs(dx) > Math.abs(dy) ? [h, v] : [v, h];
  return order.filter((d) => (d === h ? dx !== 0 : dy !== 0));
}

function candidates(w, mob) {
  if (TURNS[mob.kind]) return TURNS[mob.kind].map((turn) => turn(mob.dir));
  if (mob.kind === "teeth") return towardChip(w, mob);
  const all = [N, W, S, E];
  if (mob.kind === "walker") {
    return [
      mob.dir,
      ...shuffled(
        w,
        all.filter((d) => d !== mob.dir)
      )
    ];
  }
  return shuffled(w, all);
}

export function moveCreature(w, mob) {
  const dirs = candidates(w, mob);
  for (const d of dirs) {
    if (tryMoveMob(w, mob, d)) return;
  }
  if (mob.kind === "teeth" && dirs.length > 0) mob.dir = dirs[0];
}

// One sliding square. Ice bounces back what hits a wall; a blocked force
// floor or teleport exit just holds it and hands control back.
export function slideMob(w, mob) {
  const dir = mob.slide;
  mob.slidTick = w.tick;
  if (tryMoveMob(w, mob, dir)) return;
  if (mob.slideKind === "ice") {
    mob.slide = bounceDir(terrainAt(w, mob.x, mob.y), dir);
  } else {
    mob.slide = -1;
    mob.slideKind = null;
  }
}
