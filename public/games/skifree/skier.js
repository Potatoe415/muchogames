// The player. Modes: "ski" (on the snow, 7 ski angles dir -3..3), "air"
// (see air.js), "crash" (OUCH, inertia slide, sitting, back up) and
// "eaten" (the yeti has him). Speed follows the ski angle: full speed
// straight down, slower on the diagonals, a full stop across the slope.
import { airSprite, landTricks, stepAir, takeOff } from "./air.js";
import {
  ACCEL,
  BRAKE,
  CRASH_BRAKE,
  CRASH_GRACE,
  CRASH_SIT,
  CRASH_SLIDE,
  MAX_SPEED,
  SPEED_SHARE,
  TURBO_FACTOR
} from "./config.js";
import { SKIER } from "./sprites.js";

const CRASH_FALL = 300;

export function createSkier() {
  return {
    x: 0,
    y: 0,
    z: 0,
    vz: 0,
    speed: 0,
    dir: 0,
    side: 1,
    mode: "ski",
    t: 0,
    grace: 0,
    turnGap: 0,
    step: 0,
    stepT: 0,
    style: 0,
    crashSprite: SKIER.ouch
  };
}

export const heading = (s) => (s.dir * Math.PI) / 6;

export function crash(s, game, sprite = SKIER.ouch, force = false) {
  const busy = s.mode === "crash" || s.mode === "eaten";
  if (busy || (s.grace > 0 && !force)) return false;
  Object.assign(s, { mode: "crash", t: 0, vz: 0, crashSprite: sprite });
  game.audio.play("crash");
  return true;
}

export function launch(s, vz, game, ramp = false) {
  if (s.mode !== "ski") return;
  takeOff(s, vz, ramp);
  game.audio.play("jump");
}

function glide(s, dt, turbo) {
  const top = MAX_SPEED * (turbo ? TURBO_FACTOR : 1);
  const target = top * SPEED_SHARE[Math.abs(s.dir)];
  if (s.speed < target) {
    s.speed = Math.min(target, s.speed + ACCEL * Math.cos(heading(s)) * dt);
  } else {
    s.speed = Math.max(target, s.speed - BRAKE * dt);
  }
}

function stepCrash(s, dt) {
  s.t += dt;
  s.z = Math.max(0, s.z - CRASH_FALL * dt);
  s.speed = Math.max(0, s.speed - CRASH_BRAKE * dt);
  if (s.t < CRASH_SLIDE + CRASH_SIT) return;
  Object.assign(s, { mode: "ski", dir: 0, speed: 0, grace: CRASH_GRACE });
}

function land(s, game) {
  const { ok, points } = landTricks(s);
  s.mode = "ski";
  if (!ok) {
    crash(s, game, SKIER.headFirst, true);
    return;
  }
  s.style += points;
  game.audio.play(points > 0 ? "style" : "land");
}

export function stepSkier(s, dt, game) {
  s.turnGap = Math.max(0, s.turnGap - dt);
  s.grace = Math.max(0, s.grace - dt);
  s.stepT = Math.max(0, s.stepT - dt);
  if (s.mode === "eaten") return;
  if (s.mode === "air" && stepAir(s, dt)) land(s, game);
  else if (s.mode === "crash") stepCrash(s, dt);
  else if (s.mode === "ski") glide(s, dt, game.turbo);
  s.x += s.speed * Math.sin(heading(s)) * dt;
  s.y += s.speed * Math.cos(heading(s)) * dt;
}

export function skierSprite(s) {
  if (s.mode === "crash") return s.t < CRASH_SLIDE ? s.crashSprite : SKIER.sit;
  if (s.mode === "air") return airSprite(s);
  if (s.stepT > 0)
    return (s.side < 0 ? SKIER.stepLeft : SKIER.stepRight)[s.step];
  return SKIER.dir[s.dir + 3];
}
