// The Abominable Snowman. He appears above the screen once the skier passes
// 2000 m (or climbs above -125 m, the original secret) and runs straight at
// him, faster than the normal top speed but slower than turbo. A yeti left
// far enough behind gives up; another one comes 500 m later. Once caught,
// the skier is eaten frame by frame and the run ends.
import {
  PX_PER_M,
  YETI_AGAIN_M,
  YETI_FIRST_M,
  YETI_SPEED,
  YETI_UPHILL_M
} from "./config.js";
import { SPRITE } from "./sprites.js";

const RUN_FRAME = 0.13;
const EAT_FRAME = 0.22;
const EAT_END = SPRITE.yetiEat.length * EAT_FRAME + 0.6;
const CATCH = 10;
const CATCH_Z = 24;
const GIVE_UP = 1.3;
const CHOMPS = new Set([78, 79]);

export function createYeti() {
  return { mob: null, nextM: YETI_FIRST_M, eatT: 0, frame: -1, done: false };
}

function runFrames(dx, dy) {
  if (Math.abs(dx) > Math.abs(dy))
    return dx > 0 ? SPRITE.yetiRight : SPRITE.yetiLeft;
  return dy >= 0 ? SPRITE.yetiDown : SPRITE.yetiUp;
}

function maybeSpawn(game) {
  const { skier: s, view, yeti } = game;
  const metres = s.y / PX_PER_M;
  if (metres < yeti.nextM && metres > YETI_UPHILL_M) return;
  const x = s.x + (Math.random() - 0.5) * view.w * 0.8;
  yeti.mob = { x, y: view.y - 40, t: 0, sprite: SPRITE.yetiDown[0] };
  game.audio.play("roar");
}

function catchSkier(game) {
  const { skier: s, yeti } = game;
  Object.assign(s, { mode: "eaten", speed: 0, z: 0 });
  Object.assign(yeti.mob, { x: s.x, y: s.y });
  yeti.eatT = 0;
  game.audio.play("roar");
}

function chase(game, dt) {
  const { skier: s, yeti } = game;
  const mob = yeti.mob;
  const dx = s.x - mob.x;
  const dy = s.y - mob.y;
  const dist = Math.hypot(dx, dy) || 1;
  const stride = Math.min(dist, YETI_SPEED * dt);
  mob.x += (dx / dist) * stride;
  mob.y += (dy / dist) * stride;
  mob.t += dt;
  mob.sprite = runFrames(dx, dy)[Math.floor(mob.t / RUN_FRAME) % 2];
  if (dist - stride < CATCH && s.z < CATCH_Z) return catchSkier(game);
  if (s.y - mob.y > game.view.h * GIVE_UP) {
    yeti.mob = null;
    yeti.nextM = s.y / PX_PER_M + YETI_AGAIN_M;
  }
}

function eat(game, dt) {
  const yeti = game.yeti;
  yeti.eatT += dt;
  const index = Math.min(
    SPRITE.yetiEat.length - 1,
    Math.floor(yeti.eatT / EAT_FRAME)
  );
  if (index !== yeti.frame) {
    yeti.frame = index;
    yeti.mob.sprite = SPRITE.yetiEat[index];
    if (CHOMPS.has(yeti.mob.sprite)) game.audio.play("chomp");
  }
  if (yeti.eatT >= EAT_END && !yeti.done) {
    yeti.done = true;
    game.onEaten();
  }
}

export function updateYeti(game, dt) {
  if (game.skier.mode === "eaten") {
    if (game.yeti.mob) eat(game, dt);
    return;
  }
  if (!game.yeti.mob) maybeSpawn(game);
  else chase(game, dt);
}
