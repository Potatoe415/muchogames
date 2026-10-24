// Endless slope, generated in CELL x CELL squares around the camera. A cell
// is seeded from its coordinates, so it regenerates identically after being
// culled. Cells and movers more than one screen above the camera (or far to
// the sides / below) are dropped to keep memory flat.
import { CELL, LIFT, START_Y } from "./config.js";
import { fixedItemsIn, laneAt, nearGate } from "./course.js";
import { makeEntity } from "./entities.js";
import { MOVERS, spawnMover } from "./npcs.js";

const TRIES = 4;
const FREE = [
  ["none", 26],
  ["treeSmall", 40],
  ["treeLarge", 10],
  ["treeDead", 8],
  ["rock", 12],
  ["stump", 5],
  ["bumpSmall", 9],
  ["bumpLarge", 6],
  ["moguls", 3],
  ["ramp", 4],
  ["dog", 1.2],
  ["npc", 1.5],
  ["boarder", 1.3]
];
const FREESTYLE = [
  ["none", 2],
  ["ramp", 3],
  ["bumpSmall", 2],
  ["bumpLarge", 2],
  ["moguls", 1.2],
  ["treeSmall", 1],
  ["rock", 0.8]
];

function hash(a, b, seed) {
  let h = (seed ^ Math.imul(a, 0x27d4eb2d) ^ Math.imul(b, 0x165667b1)) >>> 0;
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return (h ^ (h >>> 16)) >>> 0;
}

function seeded(seed) {
  let state = seed || 1;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick(table, rand) {
  const total = table.reduce((sum, [, weight]) => sum + weight, 0);
  let roll = rand() * total;
  for (const [kind, weight] of table) {
    roll -= weight;
    if (roll < 0) return kind;
  }
  return table[0][0];
}

function keptClear(x, y) {
  const startArea = Math.abs(x) < 170 && y > -300 && y < START_Y + 40;
  const lift = Math.abs(x - LIFT.x) < 28 && y > LIFT.top - 100;
  const banners = Math.abs(y - START_Y) < 40 && laneAt(x, START_Y);
  return startArea || lift || banners;
}

function kindAt(x, y, rand) {
  const roll = rand();
  if (keptClear(x, y)) return null;
  const mode = laneAt(x, y);
  if (mode === "slalom")
    return roll < 0.15 && !nearGate(mode, y, 60) ? "moguls" : null;
  if (mode === "tree") return nearGate(mode, y, 56) ? null : "treeSmall";
  const kind = pick(mode === "freestyle" ? FREESTYLE : FREE, rand);
  return kind === "none" ? null : kind;
}

function towersIn(x0, y0) {
  if (LIFT.x < x0 || LIFT.x >= x0 + CELL) return [];
  const towers = [];
  const first = Math.ceil((Math.max(y0, LIFT.top) - LIFT.top) / LIFT.towerStep);
  for (
    let y = LIFT.top + first * LIFT.towerStep;
    y < y0 + CELL;
    y += LIFT.towerStep
  ) {
    towers.push(makeEntity("tower", LIFT.x, y));
  }
  return towers;
}

function fillCell(world, cx, cy) {
  const key = `${cx},${cy}`;
  const rand = seeded(hash(cx, cy, world.seed));
  const x0 = cx * CELL;
  const y0 = cy * CELL;
  const list = fixedItemsIn(world.course, x0, y0, x0 + CELL, y0 + CELL);
  list.push(...towersIn(x0, y0));
  for (let i = 0; i < TRIES; i += 1) {
    const x = Math.round(x0 + rand() * CELL);
    const y = Math.round(y0 + rand() * CELL);
    const kind = kindAt(x, y, rand);
    if (!kind) continue;
    if (MOVERS.has(kind)) spawnMover(world, `${key}:${i}`, kind, x, y, rand);
    else list.push(makeEntity(kind, x, y));
  }
  world.cells.set(key, list);
}

export function createWorld(course) {
  const seed = (Math.random() * 0xffffffff) >>> 0;
  return {
    seed,
    course,
    cells: new Map(),
    movers: [],
    live: new Set(),
    burning: []
  };
}

function generate(world, view) {
  const cx0 = Math.floor((view.x - CELL) / CELL);
  const cx1 = Math.floor((view.x + view.w + CELL) / CELL);
  const cy0 = Math.floor((view.y - CELL) / CELL);
  const cy1 = Math.floor((view.y + view.h + CELL * 2) / CELL);
  for (let cy = cy0; cy <= cy1; cy += 1) {
    for (let cx = cx0; cx <= cx1; cx += 1) {
      if (!world.cells.has(`${cx},${cy}`)) fillCell(world, cx, cy);
    }
  }
}

function farFrom(view) {
  const h = Math.max(view.h, CELL * 1.5);
  const w = Math.max(view.w, CELL) * 1.5;
  return (x0, y0, x1, y1) =>
    y1 < view.y - h ||
    y0 > view.y + view.h + h * 2 ||
    x1 < view.x - w ||
    x0 > view.x + view.w + w;
}

function cull(world, view) {
  const far = farFrom(view);
  for (const [key, list] of world.cells) {
    const [cx, cy] = key.split(",").map(Number);
    if (!far(cx * CELL, cy * CELL, (cx + 1) * CELL, (cy + 1) * CELL)) continue;
    world.cells.delete(key);
    world.burning = world.burning.filter((tree) => !list.includes(tree));
  }
  world.movers = world.movers.filter((m) => {
    if (!far(m.x, m.y, m.x, m.y)) return true;
    world.live.delete(m.id);
    return false;
  });
}

export function updateWorld(world, view) {
  generate(world, view);
  cull(world, view);
}

export function eachEntity(world, fn) {
  world.cells.forEach((list) => list.forEach(fn));
  world.movers.forEach(fn);
}
