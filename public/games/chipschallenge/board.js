// Read-only questions about the board plus the few writes every rule shares
// (terrain change, mob removal, Chip's death, sound requests).
import { cellIndex } from "./level.js";
import {
  BLOCK_OK,
  DOOR_TILES,
  DX,
  DY,
  SIZE,
  T,
  back,
  creatureCanEnter,
  sideWalls
} from "./tiles.js";

const DEATH_SOUND = { water: "splash", fire: "fire", bomb: "bomb" };

export const inside = (x, y) => x >= 0 && y >= 0 && x < SIZE && y < SIZE;
export const terrainAt = (w, x, y) => w.terrain[cellIndex(x, y)];
export const chipAt = (w, x, y) => w.chip.x === x && w.chip.y === y;
export const sound = (w, name) => w.sounds.push(name);

export function setTerrain(w, x, y, t) {
  w.terrain[cellIndex(x, y)] = t;
}

export function mobAt(w, x, y) {
  return w.mobs.find((m) => m.x === x && m.y === y) || null;
}

export function removeMob(w, mob) {
  const i = w.mobs.indexOf(mob);
  if (i >= 0) w.mobs.splice(i, 1);
}

// Thin walls and curved ice on either side of the edge being crossed.
export function edgeBlocked(w, x, y, dir) {
  if (sideWalls(terrainAt(w, x, y)).includes(dir)) return true;
  const t = terrainAt(w, x + DX[dir], y + DY[dir]);
  return sideWalls(t).includes(back(dir));
}

// Terrain Chip may step onto (lethal squares included), without effects.
export function chipTerrainOpen(w, t) {
  switch (t) {
    case T.WALL:
    case T.INVISIBLE:
    case T.HIDDEN_WALL:
    case T.BLUE_REAL:
    case T.TOGGLE_CLOSED:
    case T.CLONER:
      return false;
    case T.SOCKET:
      return w.chipsLeft === 0;
    default:
      return t in DOOR_TILES ? w.keys[DOOR_TILES[t]] > 0 : true;
  }
}

// Whether a block or a creature can move from where it stands in `dir`.
export function canMobEnter(w, mob, dir) {
  const x = mob.x + DX[dir];
  const y = mob.y + DY[dir];
  if (!inside(x, y) || edgeBlocked(w, mob.x, mob.y, dir)) return false;
  const t = terrainAt(w, x, y);
  const ok =
    mob.kind === "block" ? BLOCK_OK.has(t) : creatureCanEnter(mob.kind, t);
  return ok && !mobAt(w, x, y);
}

const occupied = (w, i) =>
  cellIndex(w.chip.x, w.chip.y) === i ||
  w.mobs.some((m) => cellIndex(m.x, m.y) === i);

// A trap holds whatever enters it unless one of its brown buttons is held.
export function trapOpen(w, trapIndex) {
  for (const [button, trap] of w.trapLinks) {
    if (trap === trapIndex && occupied(w, button)) return true;
  }
  return false;
}

export function kill(w, reason) {
  if (w.dead || w.won) return;
  w.dead = reason;
  sound(w, DEATH_SOUND[reason] || "oof");
}
