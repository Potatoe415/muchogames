// Moving characters: dogs walking across the slope, novice skiers who fall
// on their own, fast snowboarders cutting the slope diagonally, plus the
// burning dead trees. Each mover has a stable id so a regenerated world cell
// never spawns it twice.
import { makeEntity } from "./entities.js";
import { SPRITE } from "./sprites.js";

export const MOVERS = new Set(["dog", "npc", "boarder"]);

const FIRE_TIME = 4;
const frame = (frames, t, fps) => frames[Math.floor(t * fps) % frames.length];
const between = (min, max) => min + Math.random() * (max - min);

export function spawnMover(world, id, kind, x, y, rand) {
  if (world.live.has(id)) return;
  const mover = makeEntity(kind, Math.round(x), Math.round(y), {
    id,
    t: 0,
    mode: "go",
    next: 1 + rand() * 3,
    vx: 0,
    vy: 0
  });
  if (kind === "boarder") {
    mover.vx = rand() < 0.5 ? -110 : 110;
    mover.vy = 230;
  }
  world.live.add(id);
  world.movers.push(mover);
}

function updateDog(dog, dt) {
  dog.t += dt;
  if (dog.mode === "bark") {
    dog.sprite = frame(SPRITE.dogWoof, dog.t, 6);
    if (dog.t > 0.9)
      Object.assign(dog, { mode: "go", t: 0, next: between(2, 5) });
    return;
  }
  const speed = dog.mode === "flee" ? 90 : 28;
  dog.x += speed * dt;
  dog.sprite = frame(SPRITE.dogWalk, dog.t, speed / 7);
  if (dog.mode === "go" && dog.t > dog.next)
    Object.assign(dog, { mode: "bark", t: 0 });
}

function updateNpc(npc, dt) {
  npc.t += dt;
  if (npc.mode === "down") {
    if (npc.t > npc.next)
      Object.assign(npc, { mode: "go", t: 0, next: between(1, 3) });
    return;
  }
  npc.x += npc.vx * dt;
  npc.y += 70 * dt;
  if (npc.t < npc.next) return;
  if (Math.random() < 0.2) {
    Object.assign(npc, {
      mode: "down",
      t: 0,
      next: 2,
      sprite: SPRITE.npcDizzy
    });
    return;
  }
  const lean = Math.floor(Math.random() * 3) - 1;
  const sprites = [SPRITE.npcLeft, SPRITE.npcDown, SPRITE.npcRight];
  Object.assign(npc, {
    t: 0,
    next: between(1, 3),
    vx: lean * 25,
    sprite: sprites[lean + 1]
  });
}

function updateBoarder(rider, dt) {
  rider.t += dt;
  rider.x += rider.vx * dt;
  rider.y += rider.vy * dt;
  if (rider.mode === "flip") {
    rider.sprite = frame(SPRITE.boarderFlip, rider.t, 10);
    if (rider.t > 0.6)
      Object.assign(rider, { mode: "go", t: 0, next: between(2, 4) });
    return;
  }
  rider.sprite = SPRITE.boarderRide[rider.vx < 0 ? 0 : 1];
  if (rider.t > rider.next) Object.assign(rider, { mode: "flip", t: 0 });
}

function updateFire(tree, dt) {
  tree.t += dt;
  tree.sprite = frame(SPRITE.fire, tree.t, 8);
  if (tree.t < FIRE_TIME) return true;
  Object.assign(tree, { kind: "ash", sprite: SPRITE.ash });
  return false;
}

const UPDATE = { dog: updateDog, npc: updateNpc, boarder: updateBoarder };

export function updateMovers(world, dt) {
  world.movers.forEach((mover) => UPDATE[mover.kind]?.(mover, dt));
  world.burning = world.burning.filter((tree) => updateFire(tree, dt));
}

export function ignite(world, tree) {
  Object.assign(tree, { kind: "fire", t: 0 });
  world.burning.push(tree);
}

export function scareDog(world, dog) {
  Object.assign(dog, { mode: "flee", t: 0 });
  const id = `${dog.id}:pee`;
  if (world.live.has(id)) return;
  world.live.add(id);
  world.movers.push(makeEntity("yellow", dog.x, dog.y + 2, { id }));
}

export function knockNpc(npc) {
  Object.assign(npc, {
    mode: "down",
    t: 0,
    next: 2.5,
    sprite: SPRITE.npcFallen
  });
}
