// What happens when Chip, a block or a creature lands on a square: pickups,
// hazards, buttons, clone machines, teleports and the start of a slide.
import {
  canMobEnter,
  chipAt,
  chipTerrainOpen,
  edgeBlocked,
  inside,
  kill,
  mobAt,
  removeMob,
  setTerrain,
  sound,
  terrainAt,
  trapOpen
} from "./board.js";
import { cellIndex, createMob } from "./level.js";
import {
  BOOT_TILES,
  DX,
  DY,
  FORCE_DIR,
  KEY_TILES,
  SIZE,
  T,
  back,
  isButton,
  isForce,
  isIce,
  isIceCorner,
  turnOnCorner
} from "./tiles.js";

function collect(w, t) {
  const { x, y } = w.chip;
  if (t === T.CHIP) {
    w.chipsLeft = Math.max(0, w.chipsLeft - 1);
    sound(w, "chip");
  } else if (t in KEY_TILES) {
    w.keys[KEY_TILES[t]] += 1;
    sound(w, "item");
  } else if (t in BOOT_TILES) {
    w.boots[BOOT_TILES[t]] = true;
    sound(w, "item");
  } else if (t !== T.DIRT && t !== T.BLUE_FAKE) {
    return false;
  }
  setTerrain(w, x, y, T.FLOOR);
  return true;
}

// Returns false when Chip's run is over (dead or out).
function chipArrive(w, t) {
  if (collect(w, t)) return true;
  if (t === T.WATER && !w.boots.flippers) kill(w, "water");
  else if (t === T.FIRE && !w.boots.fire) kill(w, "fire");
  else if (t === T.BOMB) {
    setTerrain(w, w.chip.x, w.chip.y, T.FLOOR);
    kill(w, "bomb");
  } else if (t === T.THIEF) {
    Object.keys(w.boots).forEach((k) => (w.boots[k] = false));
    sound(w, "thief");
  } else if (t === T.EXIT) {
    w.won = true;
  }
  return !w.dead && !w.won;
}

// Returns false when the block or creature is gone.
function mobArrive(w, mob, t) {
  const block = mob.kind === "block";
  let gone = null;
  if (t === T.WATER && mob.kind !== "glider") gone = "splash";
  else if (t === T.FIRE && !block && mob.kind !== "fireball") gone = "fire";
  else if (t === T.BOMB) gone = "bomb";
  if (!gone) return true;
  if (block && t === T.WATER) setTerrain(w, mob.x, mob.y, T.DIRT);
  if (t === T.BOMB) setTerrain(w, mob.x, mob.y, T.FLOOR);
  removeMob(w, mob);
  sound(w, gone);
  return false;
}

function toggleWalls(w) {
  w.terrain.forEach((t, i) => {
    if (t === T.TOGGLE_CLOSED) w.terrain[i] = T.TOGGLE_OPEN;
    else if (t === T.TOGGLE_OPEN) w.terrain[i] = T.TOGGLE_CLOSED;
  });
}

function clone(w, machine) {
  const template = w.mobs.find(
    (m) => m.template && cellIndex(m.x, m.y) === machine
  );
  if (!template || !canMobEnter(w, template, template.dir)) return;
  const x = template.x + DX[template.dir];
  const y = template.y + DY[template.dir];
  if (template.kind === "block" && chipAt(w, x, y)) return;
  const mob = createMob(template.kind, x, y, template.dir);
  w.mobs.push(mob);
  if (chipAt(w, x, y)) kill(w, "monster");
  else arrive(w, mob, template.dir);
}

function press(w, t, i) {
  sound(w, t === T.BTN_GREEN ? "toggle" : "click");
  if (t === T.BTN_GREEN) toggleWalls(w);
  if (t === T.BTN_BLUE) {
    w.mobs.forEach((m) => {
      if (m.kind === "tank" && !m.template) m.dir = back(m.dir);
    });
  }
  if (t === T.BTN_RED && w.cloneLinks.has(i)) clone(w, w.cloneLinks.get(i));
}

function exitOpen(w, ent, x, y, dir) {
  const nx = x + DX[dir];
  const ny = y + DY[dir];
  if (!inside(nx, ny) || edgeBlocked(w, x, y, dir)) return false;
  if (ent !== w.chip) return canMobEnter(w, { ...ent, x, y }, dir);
  return chipTerrainOpen(w, terrainAt(w, nx, ny)) && !mobAt(w, nx, ny);
}

// Next teleport in reading order whose way out (same direction) is free.
function teleport(w, ent, dir) {
  const list = w.teleports;
  const from = cellIndex(ent.x, ent.y);
  const k = list.indexOf(from);
  for (let step = 1; step <= list.length; step++) {
    const to = list[(k + step) % list.length];
    const x = to % SIZE;
    const y = Math.floor(to / SIZE);
    if (to !== from && (mobAt(w, x, y) || chipAt(w, x, y))) continue;
    if (!exitOpen(w, ent, x, y, dir)) continue;
    Object.assign(ent, { x, y });
    break;
  }
  ent.slide = dir;
  ent.slideKind = "teleport";
  if (ent === w.chip) sound(w, "teleport");
}

function startSlide(w, ent, t, dir) {
  const isChip = ent === w.chip;
  if (isIce(t) && !(isChip && w.boots.skates)) {
    ent.slide = isIceCorner(t) ? turnOnCorner(t, dir) : dir;
    ent.slideKind = "ice";
    if (isChip) sound(w, "ice");
  } else if (isForce(t) && !(isChip && w.boots.suction)) {
    const random = Math.floor(w.rng() * 4);
    ent.slide = t === T.FORCE_RANDOM ? random : FORCE_DIR[t];
    ent.slideKind = "force";
    if (isChip) sound(w, "force");
  }
}

export function arrive(w, ent, dir) {
  const t = terrainAt(w, ent.x, ent.y);
  const i = cellIndex(ent.x, ent.y);
  ent.slide = -1;
  ent.slideKind = null;
  const alive = ent === w.chip ? chipArrive(w, t) : mobArrive(w, ent, t);
  if (!alive) return;
  if (isButton(t)) press(w, t, i);
  if (t === T.TRAP && !trapOpen(w, i)) ent.trapped = true;
  if (t === T.TELEPORT) teleport(w, ent, dir);
  else startSlide(w, ent, t, dir);
}
