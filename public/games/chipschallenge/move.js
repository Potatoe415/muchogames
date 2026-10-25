// Moving one square: Chip's steps (doors, socket, pushes, walls that show
// up), block pushes, creature and sliding moves.
import { arrive } from "./arrive.js";
import {
  canMobEnter,
  chipAt,
  chipTerrainOpen,
  clearTerrain,
  edgeBlocked,
  inside,
  kill,
  mobAt,
  setTerrain,
  sound,
  terrainAt,
  trapOpen
} from "./board.js";
import { cellIndex } from "./level.js";
import { DOOR_TILES, DX, DY, T } from "./tiles.js";

function moveEntity(w, ent, x, y, dir) {
  if (ent === w.chip && terrainAt(w, ent.x, ent.y) === T.RECESSED) {
    setTerrain(w, ent.x, ent.y, T.WALL);
  }
  Object.assign(ent, { x, y, trapped: false });
  arrive(w, ent, dir);
}

// A trapped mob may only leave once its trap is open.
export function stuckInTrap(w, ent) {
  return ent.trapped && !trapOpen(w, cellIndex(ent.x, ent.y));
}

function pushBlock(w, block, dir) {
  if (block.template || stuckInTrap(w, block)) return false;
  if (!canMobEnter(w, block, dir)) return false;
  sound(w, "push");
  moveEntity(w, block, block.x + DX[dir], block.y + DY[dir], dir);
  return true;
}

function bump(w, voluntary) {
  if (voluntary) sound(w, "oof");
  return false;
}

function openDoor(w, x, y, t) {
  const color = DOOR_TILES[t];
  if (color !== "green") w.keys[color] -= 1;
  clearTerrain(w, x, y);
  sound(w, "door");
}

// One step of Chip, walking (voluntary) or sliding. Returns true if he moved.
export function chipTry(w, dir, voluntary) {
  const chip = w.chip;
  chip.dir = dir;
  const x = chip.x + DX[dir];
  const y = chip.y + DY[dir];
  if (!inside(x, y) || edgeBlocked(w, chip.x, chip.y, dir)) {
    return bump(w, voluntary);
  }
  const t = terrainAt(w, x, y);
  if (t === T.HIDDEN_WALL || t === T.BLUE_REAL) {
    setTerrain(w, x, y, T.WALL);
    return bump(w, true);
  }
  if (!chipTerrainOpen(w, t)) return bump(w, voluntary);
  const mob = mobAt(w, x, y);
  if (mob?.kind === "block" && !pushBlock(w, mob, dir)) {
    return bump(w, voluntary);
  }
  if (t in DOOR_TILES) openDoor(w, x, y, t);
  if (t === T.SOCKET) {
    clearTerrain(w, x, y);
    sound(w, "socket");
  }
  if (mob && mob.kind !== "block") {
    Object.assign(chip, { x, y });
    kill(w, "monster");
    return true;
  }
  if (voluntary) sound(w, "step");
  moveEntity(w, chip, x, y, dir);
  return true;
}

// Moves a creature or a block one square. Running into Chip kills him; a
// block only does that while sliding.
export function tryMoveMob(w, mob, dir) {
  if (stuckInTrap(w, mob) || !canMobEnter(w, mob, dir)) return false;
  const x = mob.x + DX[dir];
  const y = mob.y + DY[dir];
  const block = mob.kind === "block";
  if (!block) mob.dir = dir;
  if (chipAt(w, x, y)) {
    if (block && mob.slide < 0) return false;
    Object.assign(mob, { x, y });
    kill(w, block ? "block" : "monster");
    return true;
  }
  moveEntity(w, mob, x, y, dir);
  return true;
}
