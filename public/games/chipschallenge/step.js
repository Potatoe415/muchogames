// One logic tick (20 per second). Chip walks a square every 4 ticks
// (5 squares/s) while a direction is held, slides every 2 ticks (10/s);
// creatures move every 4 ticks, teeth and blobs every 8. As in CHIPS.EXE,
// the level stays frozen until Chip's first move.
import { kill, sound, terrainAt } from "./board.js";
import { moveCreature, slideMob } from "./monsters.js";
import { chipTry, stuckInTrap } from "./move.js";
import { bounceDir } from "./tiles.js";

export const TICKS_PER_SECOND = 20;
const WALK_TICKS = 4;
const SLIDE_TICKS = 2;
const MONSTER_TICKS = 4;
const SLOW_TICKS = 8;
const SLOW_KINDS = new Set(["teeth", "blob"]);
const LOW_TIME = 15;

const over = (w) => Boolean(w.dead || w.won);

// Returns true when the slide used Chip's turn (moved or bounced).
function slideChip(w) {
  const chip = w.chip;
  const dir = chip.slide;
  if (chipTry(w, dir, false) || over(w)) return true;
  if (chip.slideKind !== "ice") return false;
  chip.slide = bounceDir(terrainAt(w, chip.x, chip.y), dir);
  return true;
}

// On a force floor Chip may step off in any direction instead of being
// pushed, as in CHIPS.EXE.
function overrideForce(w, input) {
  const chip = w.chip;
  const dir = input.next();
  if (dir < 0 || dir === chip.slide) return false;
  if (!chipTry(w, dir, true)) return false;
  chip.cool = WALK_TICKS;
  return true;
}

function stepChip(w, input) {
  const chip = w.chip;
  const forced = chip.slide >= 0 && chip.slideKind === "force";
  if (chip.cool > 0) chip.cool -= 1;
  if (chip.slide >= 0 && !forced) input.dropTaps();
  if (chip.cool > 0) return;
  if (forced && overrideForce(w, input)) return;
  if (chip.slide >= 0 && slideChip(w)) {
    chip.cool = SLIDE_TICKS;
    return;
  }
  const dir = input.next();
  if (dir < 0 || stuckInTrap(w, chip)) return;
  w.started = true;
  chipTry(w, dir, true);
  chip.cool = WALK_TICKS;
}

function eachMob(w, fn) {
  for (const mob of [...w.mobs]) {
    if (over(w)) return;
    if (!mob.template && w.mobs.includes(mob)) fn(mob);
  }
}

function creatureTurn(w, mob) {
  if (!mob.active || mob.slide >= 0 || mob.slidTick === w.tick) return;
  if (SLOW_KINDS.has(mob.kind) && w.tick % SLOW_TICKS !== 0) return;
  moveCreature(w, mob);
}

function runClock(w) {
  if (!w.started || !w.def.time) return;
  w.clockTicks = (w.clockTicks || 0) + 1;
  if (w.clockTicks % TICKS_PER_SECOND !== 0) return;
  w.timeLeft = Math.max(0, w.timeLeft - 1);
  if (w.timeLeft === 0) kill(w, "time");
  else if (w.timeLeft <= LOW_TIME) sound(w, "tick");
}

export function tick(w, input) {
  if (over(w)) return;
  stepChip(w, input);
  if (!w.started) return;
  w.tick += 1;
  if (w.tick % SLIDE_TICKS === 0) {
    eachMob(w, (mob) => mob.slide >= 0 && slideMob(w, mob));
  }
  if (w.tick % MONSTER_TICKS === 0) eachMob(w, (mob) => creatureTurn(w, mob));
  if (!over(w)) runClock(w);
}
