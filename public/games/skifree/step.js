// One fixed 60 Hz simulation step, and the camera: the skier stays centered
// horizontally, 30 % from the top so 70 % of the screen shows what's ahead.
import { collide } from "./collide.js";
import { CAMERA_TOP, MAX_SPEED } from "./config.js";
import { updateCourse } from "./course.js";
import { updateMovers } from "./npcs.js";
import { stepSkier } from "./skier.js";
import { updateWorld } from "./world.js";
import { updateYeti } from "./yeti.js";

export function followCamera(game) {
  const { view, skier } = game;
  view.x = Math.round(skier.x - view.w / 2);
  view.y = Math.round(skier.y - view.h * CAMERA_TOP);
}

export function stepGame(game, dt) {
  const s = game.skier;
  const prevY = s.y;
  if (s.mode !== "eaten") game.time += dt;
  stepSkier(s, dt, game);
  updateMovers(game.world, dt);
  collide(game);
  updateCourse(game, prevY, dt);
  updateYeti(game, dt);
  followCamera(game);
  updateWorld(game.world, game.view);
  const gliding = s.mode === "ski" || s.mode === "crash";
  game.audio.setGlide(gliding ? s.speed / MAX_SPEED : 0);
}
