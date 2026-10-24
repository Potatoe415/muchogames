// Skier against the world. Footprints overlap on the ground plane; an
// airborne skier clears anything lower than his altitude. Touching a dead
// tree in the air sets it on fire (original easter egg), hitting a dog
// leaves yellow snow behind it.
import { RAMP_SPEED, RAMP_SPEED_GAIN } from "./config.js";
import { HOP, KINDS } from "./entities.js";
import { chairHit } from "./lift.js";
import { ignite, knockNpc, scareDog } from "./npcs.js";
import { crash, launch } from "./skier.js";
import { eachEntity } from "./world.js";

const SKIER_HW = 5;
const SKIER_D = 5;
const HOP_MIN_SPEED = 40;
const MOGUL_DRAG = 0.985;
const FIRE_POINTS = 50;
// Lets the skier fly on through the tree he just set alight.
const FIRE_GRACE = 0.35;

function touches(s, e, def) {
  return (
    Math.abs(e.x - s.x) < def.hw + SKIER_HW &&
    s.y > e.y - def.d &&
    s.y - SKIER_D < e.y
  );
}

function hop(game, vz) {
  const s = game.skier;
  if (s.mode === "ski" && s.speed > HOP_MIN_SPEED) launch(s, vz, game);
}

const HITS = {
  crash: (game) => crash(game.skier, game),
  deadTree: (game, tree) => {
    if (game.skier.z <= 0) return crash(game.skier, game);
    ignite(game.world, tree);
    game.skier.style += FIRE_POINTS;
    game.skier.grace = FIRE_GRACE;
    game.audio.play("fire");
  },
  bump: (game, bump) => hop(game, HOP[bump.kind]),
  moguls: (game) => {
    game.skier.speed *= MOGUL_DRAG;
    hop(game, 80 + Math.random() * 60);
  },
  ramp: (game) => {
    const s = game.skier;
    launch(s, RAMP_SPEED + s.speed * RAMP_SPEED_GAIN, game, true);
  },
  dog: (game, dog) => {
    if (!crash(game.skier, game)) return;
    scareDog(game.world, dog);
    game.audio.play("woof");
  },
  npc: (game, npc) => {
    if (crash(game.skier, game)) knockNpc(npc);
  }
};

export function collide(game) {
  const s = game.skier;
  if (s.mode === "eaten" || s.mode === "crash") return;
  const hits = [];
  eachEntity(game.world, (e) => {
    const def = KINDS[e.kind];
    if (def.hit && s.z < def.h && touches(s, e, def)) hits.push([def.hit, e]);
  });
  hits.forEach(([hit, e]) => HITS[hit](game, e));
  if (chairHit(s, game.view, game.time)) crash(s, game);
}
