// Microsoft Chip's Challenge tile codes (CHIPS.EXE order: code = column * 16
// + row in assets/tiles.png), the four directions and the tile families the
// rules need.
export const N = 0;
export const W = 1;
export const S = 2;
export const E = 3;
export const DX = [0, -1, 0, 1];
export const DY = [-1, 0, 1, 0];
export const left = (d) => (d + 1) % 4;
export const back = (d) => (d + 2) % 4;
export const right = (d) => (d + 3) % 4;

export const SIZE = 32;
export const TILE = 32;

export const T = Object.freeze({
  FLOOR: 0x00,
  WALL: 0x01,
  CHIP: 0x02,
  WATER: 0x03,
  FIRE: 0x04,
  INVISIBLE: 0x05,
  THIN_N: 0x06,
  THIN_W: 0x07,
  THIN_S: 0x08,
  THIN_E: 0x09,
  BLOCK: 0x0a,
  DIRT: 0x0b,
  ICE: 0x0c,
  FORCE_S: 0x0d,
  CLONE_BLOCK: 0x0e,
  FORCE_N: 0x12,
  FORCE_E: 0x13,
  FORCE_W: 0x14,
  EXIT: 0x15,
  DOOR_BLUE: 0x16,
  DOOR_RED: 0x17,
  DOOR_GREEN: 0x18,
  DOOR_YELLOW: 0x19,
  ICE_NW: 0x1a,
  ICE_NE: 0x1b,
  ICE_SE: 0x1c,
  ICE_SW: 0x1d,
  BLUE_FAKE: 0x1e,
  BLUE_REAL: 0x1f,
  THIEF: 0x21,
  SOCKET: 0x22,
  BTN_GREEN: 0x23,
  BTN_RED: 0x24,
  TOGGLE_CLOSED: 0x25,
  TOGGLE_OPEN: 0x26,
  BTN_BROWN: 0x27,
  BTN_BLUE: 0x28,
  TELEPORT: 0x29,
  BOMB: 0x2a,
  TRAP: 0x2b,
  HIDDEN_WALL: 0x2c,
  GRAVEL: 0x2d,
  RECESSED: 0x2e,
  HINT: 0x2f,
  THIN_SE: 0x30,
  CLONER: 0x31,
  FORCE_RANDOM: 0x32,
  DROWNED: 0x33,
  BURNED: 0x34,
  BOMBED: 0x35,
  CHIP_EXIT: 0x39,
  EXIT_2: 0x3a,
  EXIT_3: 0x3b,
  SWIM: 0x3c,
  KEY_BLUE: 0x64,
  KEY_RED: 0x65,
  KEY_GREEN: 0x66,
  KEY_YELLOW: 0x67,
  FLIPPERS: 0x68,
  FIRE_BOOTS: 0x69,
  SKATES: 0x6a,
  SUCTION: 0x6b
});

// First sprite of each creature; add the direction (N, W, S, E).
export const SPRITE = Object.freeze({
  bug: 0x40,
  fireball: 0x44,
  ball: 0x48,
  tank: 0x4c,
  glider: 0x50,
  teeth: 0x54,
  walker: 0x58,
  blob: 0x5c,
  paramecium: 0x60,
  chip: 0x6c
});

export const KEY_TILES = {
  [T.KEY_BLUE]: "blue",
  [T.KEY_RED]: "red",
  [T.KEY_YELLOW]: "yellow",
  [T.KEY_GREEN]: "green"
};
export const DOOR_TILES = {
  [T.DOOR_BLUE]: "blue",
  [T.DOOR_RED]: "red",
  [T.DOOR_YELLOW]: "yellow",
  [T.DOOR_GREEN]: "green"
};
export const BOOT_TILES = {
  [T.FLIPPERS]: "flippers",
  [T.FIRE_BOOTS]: "fire",
  [T.SKATES]: "skates",
  [T.SUCTION]: "suction"
};
export const FORCE_DIR = {
  [T.FORCE_N]: N,
  [T.FORCE_W]: W,
  [T.FORCE_S]: S,
  [T.FORCE_E]: E
};
const ICE_CORNERS = {
  [T.ICE_NW]: [N, W],
  [T.ICE_NE]: [N, E],
  [T.ICE_SE]: [S, E],
  [T.ICE_SW]: [S, W]
};
const THIN_WALLS = {
  [T.THIN_N]: [N],
  [T.THIN_W]: [W],
  [T.THIN_S]: [S],
  [T.THIN_E]: [E],
  [T.THIN_SE]: [S, E]
};
const NO_SIDES = [];

export const isIce = (t) => t === T.ICE || t in ICE_CORNERS;
export const isIceCorner = (t) => t in ICE_CORNERS;
export const isForce = (t) => t in FORCE_DIR || t === T.FORCE_RANDOM;
export const isButton = (t) =>
  t === T.BTN_GREEN || t === T.BTN_RED || t === T.BTN_BROWN || t === T.BTN_BLUE;

// Edges of a cell that act as walls (thin walls and curved ice).
export const sideWalls = (t) => ICE_CORNERS[t] || THIN_WALLS[t] || NO_SIDES;

// Direction after entering a curved ice tile while moving `dir`.
export function turnOnCorner(t, dir) {
  const walls = ICE_CORNERS[t];
  if (!walls.includes(dir)) return dir;
  return [N, W, S, E].find((d) => !walls.includes(d) && d !== back(dir));
}

// Where a slide goes after hitting something: straight back on plain ice,
// out through the other open side of a curved tile.
export function bounceDir(t, dir) {
  const walls = ICE_CORNERS[t];
  if (!walls) return back(dir);
  return [N, W, S, E].find((d) => !walls.includes(d) && d !== dir);
}

// Squares a block may be pushed onto.
const BLOCK_FLOORS = [
  T.FLOOR,
  T.WATER,
  T.FIRE,
  T.BOMB,
  T.ICE,
  T.ICE_NW,
  T.ICE_NE,
  T.ICE_SE,
  T.ICE_SW,
  T.FORCE_N,
  T.FORCE_W,
  T.FORCE_S,
  T.FORCE_E,
  T.FORCE_RANDOM,
  T.BTN_GREEN,
  T.BTN_RED,
  T.BTN_BROWN,
  T.BTN_BLUE,
  T.TELEPORT,
  T.TRAP,
  T.TOGGLE_OPEN,
  T.THIN_N,
  T.THIN_W,
  T.THIN_S,
  T.THIN_E,
  T.THIN_SE
];
export const BLOCK_OK = new Set(BLOCK_FLOORS);

// Monsters walk the same squares as blocks; water drowns all but gliders,
// fire burns all but fireballs, and bugs and walkers refuse to enter it.
export function creatureCanEnter(kind, t) {
  if (!BLOCK_OK.has(t)) return false;
  return !(t === T.FIRE && (kind === "bug" || kind === "walker"));
}
