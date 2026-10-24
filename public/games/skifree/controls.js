// Player commands shared by keyboard, mouse, touch and buttons. On the snow
// left/right turn the skis one 30° notch (or side-step once stopped across
// the slope), down points them downhill, up brakes then climbs step by
// step. In the air the same commands perform tricks (air.js).
import { flip, spin } from "./air.js";
import { HOP_SPEED, STEP_PX, STEP_TIME, STOPPED, TURN_GAP } from "./config.js";
import { launch } from "./skier.js";

const clampDir = (d) => Math.max(-3, Math.min(3, d));

function stepTo(game, dx, dy) {
  const s = game.skier;
  s.x += dx;
  s.y += dy;
  s.step ^= 1;
  s.stepT = STEP_TIME;
  game.audio.play("step");
}

function trick(game, perform) {
  perform(game.skier);
  game.audio.play("trick");
}

function ready(s) {
  if (s.mode !== "ski" || s.turnGap > 0) return false;
  s.turnGap = TURN_GAP;
  return true;
}

export function turn(game, sign) {
  const s = game.skier;
  if (s.mode === "air") return trick(game, (sk) => spin(sk, sign));
  if (!ready(s)) return;
  s.side = sign;
  if (s.dir === 3 * sign && s.speed < STOPPED)
    return stepTo(game, sign * STEP_PX, 0);
  s.dir = clampDir(s.dir + sign);
  game.audio.play("swish");
}

// Absolute ski angle, from the mouse or a finger drag.
export function steer(game, dir) {
  const s = game.skier;
  const d = clampDir(dir);
  if (s.mode !== "ski" || d === s.dir) return;
  s.dir = d;
  if (d) s.side = Math.sign(d);
  game.audio.play("swish");
}

export function pointDown(game) {
  const s = game.skier;
  if (s.mode === "air") return trick(game, flip);
  if (s.mode === "ski") s.dir = 0;
}

export function climb(game) {
  const s = game.skier;
  if (!ready(s)) return;
  const sign = Math.sign(s.dir) || s.side;
  if (s.speed >= STOPPED) {
    s.dir = clampDir(s.dir + sign);
    return;
  }
  s.dir = 3 * sign;
  stepTo(game, 0, -STEP_PX);
}

export function jump(game) {
  const s = game.skier;
  if (s.mode === "air") return trick(game, flip);
  launch(s, HOP_SPEED, game);
}

export function airSpin(game, sign) {
  if (game.skier.mode === "air") trick(game, (sk) => spin(sk, sign));
}
