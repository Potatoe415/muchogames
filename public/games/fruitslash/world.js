// The simulation: thrown items, cut halves, the clock and the wave spawner.
// Pure state, no DOM. Coordinates are fractions of the play area (rules.js).
import { MATCH_SECONDS, MODES, waveDelay } from "./rules.js";
import { BOMB, BONUS, itemsOf } from "./themes.js";

const FIRST_WAVE = 1.2;
const START_Y = 1.12;
// Falling bodies are dropped once they are this far below the bottom edge.
const OFFSCREEN_Y = 1.3;
const HALF_PUSH = 0.16;
const HIT_SLACK = 1.1;

const rand = (min, max) => min + Math.random() * (max - min);
const randInt = (min, max) => Math.floor(rand(min, max + 1));
const pickOne = (list) => list[Math.floor(Math.random() * list.length)];

export const kindOf = (emoji) =>
  emoji === BOMB.e ? "bomb" : emoji === BONUS.e ? "bonus" : "item";

export function createWorld(mode, theme) {
  return {
    mode,
    theme,
    score: 0,
    timeLeft: MATCH_SECONDS,
    elapsed: 0,
    sliced: 0,
    bestCombo: 0,
    spawnClock: FIRST_WAVE,
    items: [],
    halves: []
  };
}

// Thrown from below the bottom edge so its peak lands between 16% and 42%
// of the height, drifting toward the middle.
function throwItem(world, def) {
  const { gravity } = MODES[world.mode];
  const x = rand(0.15, 0.85);
  const vy = -Math.sqrt(2 * gravity * (START_Y - rand(0.16, 0.42)));
  const rise = -vy / gravity;
  return {
    e: def.e,
    x,
    y: START_Y,
    vx: (rand(0.3, 0.7) - x) / (rise * 1.6),
    vy,
    rot: rand(0, Math.PI * 2),
    spin: rand(-3, 3)
  };
}

function spawnWave(world) {
  const mode = MODES[world.mode];
  const count = randInt(mode.waveSize[0], mode.waveSize[1]);
  const pool = itemsOf(world.theme);
  const defs = Array.from({ length: count }, () => pickOne(pool));
  if (count > 1 && Math.random() < mode.bombChance) defs[0] = BOMB;
  if (Math.random() < mode.bonusChance) defs.push(BONUS);
  defs.forEach((def) => world.items.push(throwItem(world, def)));
}

function move(body, gravity, dt) {
  body.vy += gravity * dt;
  body.x += body.vx * dt;
  body.y += body.vy * dt;
  body.rot += body.spin * dt;
}

const stillVisible = (body) => body.vy < 0 || body.y < OFFSCREEN_Y;

export function stepWorld(world, dt) {
  const { gravity } = MODES[world.mode];
  world.elapsed += dt;
  world.timeLeft = Math.max(0, world.timeLeft - dt);
  world.spawnClock -= dt;
  if (world.spawnClock <= 0 && world.timeLeft > 0) {
    spawnWave(world);
    world.spawnClock = waveDelay(world.mode, world.elapsed);
  }
  world.items.forEach((body) => move(body, gravity, dt));
  world.halves.forEach((body) => move(body, gravity * 1.15, dt));
  world.items = world.items.filter(stillVisible);
  world.halves = world.halves.filter(stillVisible);
}

// Two halves fly apart across the cut. `cut` is the cut angle in the
// piece's own frame, so it turns with the piece; `side` picks the half.
export function cutItem(world, item, angle) {
  world.items = world.items.filter((other) => other !== item);
  const nx = Math.cos(angle + Math.PI / 2);
  const ny = Math.sin(angle + Math.PI / 2);
  for (const side of [-1, 1]) {
    world.halves.push({
      e: item.e,
      x: item.x,
      y: item.y,
      vx: item.vx + side * nx * HALF_PUSH,
      vy: Math.min(item.vy, 0) * 0.4 + side * ny * HALF_PUSH - 0.1,
      rot: item.rot,
      spin: item.spin + side * 2,
      cut: angle - item.rot,
      side
    });
  }
}

// In pixels: the shorter side of the play area sets every item's size.
export const itemRadius = (world, size) =>
  MODES[world.mode].radius * Math.min(size.w, size.h);

function segmentDistance(a, b, p) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len2 = dx * dx + dy * dy || 1;
  const t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2;
  const k = Math.max(0, Math.min(1, t));
  return Math.hypot(a.x + k * dx - p.x, a.y + k * dy - p.y);
}

// Items crossed by the blade segment a→b (pixels).
export function itemsOnSegment(world, a, b, size) {
  const reach = itemRadius(world, size) * HIT_SLACK;
  return world.items.filter(
    (item) =>
      segmentDistance(a, b, { x: item.x * size.w, y: item.y * size.h }) <= reach
  );
}
