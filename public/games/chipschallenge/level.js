// Turns a level of levels.js into a fresh world state. Map legend (one
// character per square):
//   .  floor        #  wall          c  IC chip      ~  water     %  fire
//   _  ice          1 2 3 4  curved ice NW NE SE SW
//   ^ v < >  force floors N S W E    *  random force floor
//   =  dirt (mud)   :  gravel        E  exit         S  socket    ?  hint
//   b r y g  keys   B R Y G  doors (blue, red, yellow, green)
//   w  flippers     h  fire boots    k  ice skates   u  suction boots
//   T  thief        $  bomb          t  teleport     n  trap
//   !  green button ,  red button    ;  blue button  j  brown button
//   |  toggle wall (closed)          '  toggle wall (open)
//   H  hidden wall  I  invisible wall  L  fake blue wall  W  real blue wall
//   P  pop-up wall  6 7 8 9 0  thin wall N W S E SE   C  clone machine
//   @  Chip         o  dirt block
//   x bug  F fireball  p pink ball  K tank  Q teeth  A glider  M walker
//   O blob  Z paramecium   (facing north unless `dirs` says otherwise)
import { N, S, SIZE, T, W, E } from "./tiles.js";

const TERRAIN = {
  ".": T.FLOOR,
  "#": T.WALL,
  c: T.CHIP,
  "~": T.WATER,
  "%": T.FIRE,
  _: T.ICE,
  1: T.ICE_NW,
  2: T.ICE_NE,
  3: T.ICE_SE,
  4: T.ICE_SW,
  "^": T.FORCE_N,
  v: T.FORCE_S,
  "<": T.FORCE_W,
  ">": T.FORCE_E,
  "*": T.FORCE_RANDOM,
  "=": T.DIRT,
  ":": T.GRAVEL,
  E: T.EXIT,
  S: T.SOCKET,
  "?": T.HINT,
  b: T.KEY_BLUE,
  r: T.KEY_RED,
  y: T.KEY_YELLOW,
  g: T.KEY_GREEN,
  B: T.DOOR_BLUE,
  R: T.DOOR_RED,
  Y: T.DOOR_YELLOW,
  G: T.DOOR_GREEN,
  w: T.FLIPPERS,
  h: T.FIRE_BOOTS,
  k: T.SKATES,
  u: T.SUCTION,
  T: T.THIEF,
  $: T.BOMB,
  t: T.TELEPORT,
  n: T.TRAP,
  "!": T.BTN_GREEN,
  ",": T.BTN_RED,
  ";": T.BTN_BLUE,
  j: T.BTN_BROWN,
  "|": T.TOGGLE_CLOSED,
  "'": T.TOGGLE_OPEN,
  H: T.HIDDEN_WALL,
  I: T.INVISIBLE,
  L: T.BLUE_FAKE,
  W: T.BLUE_REAL,
  P: T.RECESSED,
  6: T.THIN_N,
  7: T.THIN_W,
  8: T.THIN_S,
  9: T.THIN_E,
  0: T.THIN_SE,
  C: T.CLONER
};

export const MOB_CHARS = {
  o: "block",
  x: "bug",
  F: "fireball",
  p: "ball",
  K: "tank",
  Q: "teeth",
  A: "glider",
  M: "walker",
  O: "blob",
  Z: "paramecium"
};

const DIR_NAMES = { N, W, S, E };

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
    terrain: new Uint8Array(SIZE * SIZE).fill(T.WALL),
    mobs: [],
    chip: { ...createMob("chip", 0, 0, S), cool: 0 },
    keys: { blue: 0, red: 0, yellow: 0, green: 0 },
    boots: { flippers: false, fire: false, skates: false, suction: false },
    chipsLeft: 0,
    timeLeft: def.time,
    started: false,
    tick: 0,
    dead: null,
    won: false,
    sounds: [],
    rng: createRng(number * 7919)
  };
}

function placeChar(world, ch, x, y, dir) {
  const i = cellIndex(x, y);
  if (ch === "@") {
    Object.assign(world.chip, { x, y });
    world.terrain[i] = T.FLOOR;
  } else if (MOB_CHARS[ch]) {
    world.mobs.push(createMob(MOB_CHARS[ch], x, y, dir));
    world.terrain[i] = T.FLOOR;
  } else if (ch in TERRAIN) {
    world.terrain[i] = TERRAIN[ch];
  } else {
    throw new Error(`Unknown map character "${ch}" at ${x},${y}`);
  }
}

function addClones(world, def, ox, oy) {
  Object.entries(def.clones || {}).forEach(([at, [ch, dirName]]) => {
    const [x, y] = at.split(",").map(Number);
    const mob = createMob(MOB_CHARS[ch], x + ox, y + oy, DIR_NAMES[dirName]);
    mob.template = true;
    world.mobs.push(mob);
  });
}

// Lynx wiring: each button drives the next machine in reading order.
function wire(world, buttonTile, machineTile) {
  const machines = [];
  const buttons = [];
  world.terrain.forEach((t, i) => {
    if (t === machineTile) machines.push(i);
    if (t === buttonTile) buttons.push(i);
  });
  const links = new Map();
  if (machines.length === 0) return links;
  buttons.forEach((b) => {
    links.set(b, machines.find((m) => m > b) ?? machines[0]);
  });
  return links;
}

export function createWorld(def, number) {
  const world = emptyWorld(def, number);
  const ox = (SIZE - def.map[0].length) >> 1;
  const oy = (SIZE - def.map.length) >> 1;
  def.map.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      const dir = DIR_NAMES[def.dirs?.[`${x},${y}`]] ?? N;
      placeChar(world, ch, x + ox, y + oy, dir);
    });
  });
  addClones(world, def, ox, oy);
  world.chipsLeft = world.terrain.filter((t) => t === T.CHIP).length;
  world.teleports = [];
  world.terrain.forEach((t, i) => t === T.TELEPORT && world.teleports.push(i));
  world.cloneLinks = wire(world, T.BTN_RED, T.CLONER);
  world.trapLinks = wire(world, T.BTN_BROWN, T.TRAP);
  return world;
}
