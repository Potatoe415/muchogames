// Turns a CHIPS.DAT level (see datfile.js) into a fresh world state. The
// top layer holds Chip, creatures, blocks or a terrain tile; whatever lies
// beneath goes to `lower`, uncovered when the top tile is cleared. Only the
// creatures of the level's monster list move, in that order; a creature or
// block standing on a clone machine is its template.
import { SIZE, SPRITE, T } from "./tiles.js";

const CREATURES = Object.keys(SPRITE).filter((kind) => kind !== "chip");
const FIRST_CREATURE = 0x40;
const LAST_CREATURE = 0x63;
const CLONE_BLOCKS = [T.CLONE_BLOCK, T.CLONE_BLOCK + 3];

export const cellIndex = (x, y) => y * SIZE + x;

export function createMob(kind, x, y, dir) {
  return { kind, x, y, dir, slide: -1, slideKind: null, trapped: false };
}

// Deterministic generator (walkers, blobs, random force floors).
function createRng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function emptyWorld(def, number) {
  return {
    number,
    def,
    terrain: new Uint8Array(SIZE * SIZE),
    lower: new Uint8Array(SIZE * SIZE),
    mobs: [],
    chip: { ...createMob("chip", 0, 0, 2), cool: 0 },
    keys: { blue: 0, red: 0, yellow: 0, green: 0 },
    boots: { flippers: false, fire: false, skates: false, suction: false },
    chipsLeft: def.chips,
    timeLeft: def.time,
    started: false,
    tick: 0,
    dead: null,
    won: false,
    sounds: [],
    rng: createRng(number * 7919)
  };
}

function placeMob(world, kind, i, dir, under, template) {
  const mob = createMob(kind, i % SIZE, Math.floor(i / SIZE), dir);
  if (template) mob.template = true;
  world.mobs.push(mob);
  world.terrain[i] = under;
}

function placeCell(world, top, bottom, i) {
  if (top >= SPRITE.chip && top <= SPRITE.chip + 3) {
    Object.assign(world.chip, { x: i % SIZE, y: Math.floor(i / SIZE) });
    world.chip.dir = top - SPRITE.chip;
    world.terrain[i] = bottom;
  } else if (top >= FIRST_CREATURE && top <= LAST_CREATURE) {
    const kind = CREATURES[(top - FIRST_CREATURE) >> 2];
    placeMob(world, kind, i, top & 3, bottom, bottom === T.CLONER);
  } else if (top === T.BLOCK) {
    placeMob(world, "block", i, 0, bottom, bottom === T.CLONER);
  } else if (top >= CLONE_BLOCKS[0] && top <= CLONE_BLOCKS[1]) {
    placeMob(world, "block", i, top - T.CLONE_BLOCK, T.CLONER, true);
  } else {
    world.terrain[i] = top;
    world.lower[i] = bottom;
  }
}

// Monster list order first; creatures missing from the list never move.
function activate(world, monsters) {
  const listed = [];
  monsters.forEach(([x, y]) => {
    const mob = world.mobs.find(
      (m) => m.x === x && m.y === y && m.kind !== "block" && !m.template
    );
    if (mob && !mob.active) {
      mob.active = true;
      listed.push(mob);
    }
  });
  world.mobs = [...listed, ...world.mobs.filter((m) => !m.active)];
}

const toLinks = (records) =>
  records.map(([bx, by, mx, my]) => [cellIndex(bx, by), cellIndex(mx, my)]);

export function createWorld(def, number) {
  const world = emptyWorld(def, number);
  for (let i = 0; i < SIZE * SIZE; i++) {
    placeCell(world, def.top[i], def.bottom[i], i);
  }
  activate(world, def.monsters);
  world.teleports = [];
  world.terrain.forEach((t, i) => t === T.TELEPORT && world.teleports.push(i));
  world.trapLinks = toLinks(def.traps);
  world.cloneLinks = toLinks(def.clones);
  return world;
}
