// What every world object is made of. Footprint: half width `hw` and depth
// `d` above the anchor (feet) line. The skier touches an object only while
// its altitude z is below the object's height `h`; `hit` names the reaction
// in collide.js. Objects without `hit` are scenery.
import { SPRITE } from "./sprites.js";

const SOLID = 999;

export const KINDS = {
  treeSmall: { sprite: SPRITE.treeSmall, hw: 8, d: 6, h: 28, hit: "crash" },
  treeLarge: { sprite: SPRITE.treeLarge, hw: 9, d: 6, h: SOLID, hit: "crash" },
  treeDead: { sprite: SPRITE.treeDead, hw: 6, d: 6, h: 24, hit: "deadTree" },
  rock: { sprite: SPRITE.rock, hw: 10, d: 6, h: 9, hit: "crash" },
  stump: { sprite: SPRITE.stump, hw: 7, d: 5, h: 9, hit: "crash" },
  bumpSmall: { sprite: SPRITE.bumpSmall, hw: 8, d: 4, h: 2, hit: "bump" },
  bumpLarge: { sprite: SPRITE.bumpLarge, hw: 12, d: 6, h: 2, hit: "bump" },
  moguls: { sprite: SPRITE.moguls, hw: 30, d: 26, h: 2, hit: "moguls" },
  ramp: { sprite: SPRITE.ramp, hw: 15, d: 7, h: 2, hit: "ramp" },
  tower: { sprite: SPRITE.tower, hw: 4, d: 5, h: SOLID, hit: "crash" },
  fire: { sprite: SPRITE.fire[0], hw: 7, d: 6, h: 26, hit: "crash" },
  ash: { sprite: SPRITE.ash, hw: 4, d: 4, h: 8, hit: "crash" },
  dog: { sprite: SPRITE.dogWalk[0], hw: 9, d: 6, h: 14, hit: "dog" },
  npc: { sprite: SPRITE.npcDown, hw: 8, d: 6, h: 28, hit: "npc" },
  boarder: { sprite: SPRITE.boarderRide[0], hw: 9, d: 6, h: 28, hit: "crash" },
  yellow: { sprite: SPRITE.yellow },
  decor: {},
  gate: {}
};

export const HOP = { bumpSmall: 110, bumpLarge: 165 };

/** @param {Record<string, any>} [extra] @returns {Record<string, any>} */
export function makeEntity(kind, x, y, extra = {}) {
  return { kind, sprite: KINDS[kind].sprite, x, y, ...extra };
}

export const spriteOf = (entity) => entity.gate?.sprite ?? entity.sprite;
