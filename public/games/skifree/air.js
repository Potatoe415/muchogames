// Airborne skier: altitude z under gravity, tricks and landing. Left/right
// in the air spin the skier a quarter turn (front, side, back, side); jump
// or down flips him (tuck, upside down, spread). Landing upright, facing
// front or sideways, banks the style points; landing backwards or upside
// down is a crash.
import { GRAVITY } from "./config.js";
import { SKIER } from "./sprites.js";

const SPIN_POINTS = 10;
const FLIP_POINTS = 20;
const FULL_SPIN_BONUS = 30;
const FULL_FLIP_BONUS = 50;
const RAMP_POINTS = 5;

export function takeOff(s, vz, ramp) {
  Object.assign(s, {
    mode: "air",
    vz,
    z: Math.max(s.z, 0.01),
    spin: 0,
    flip: 0,
    spins: 0,
    flips: 0,
    ramp
  });
}

// Returns true on touchdown.
export function stepAir(s, dt) {
  s.z += s.vz * dt;
  s.vz -= GRAVITY * dt;
  if (s.z > 0) return false;
  s.z = 0;
  s.vz = 0;
  return true;
}

export function spin(s, sign) {
  s.spin = (s.spin + sign + 4) % 4;
  s.spins += 1;
}

export function flip(s) {
  s.flip = (s.flip + 1) % 4;
  s.flips += 1;
}

export function landTricks(s) {
  const ok = s.flip === 0 && s.spin !== 2;
  const points = ok
    ? s.spins * SPIN_POINTS +
      s.flips * FLIP_POINTS +
      Math.floor(s.spins / 4) * FULL_SPIN_BONUS +
      Math.floor(s.flips / 4) * FULL_FLIP_BONUS +
      (s.ramp ? RAMP_POINTS : 0)
    : 0;
  Object.assign(s, { spin: 0, flip: 0, spins: 0, flips: 0, ramp: false });
  return { ok, points };
}

export function airSprite(s) {
  if (s.flip > 0) {
    return (s.side < 0 ? SKIER.flipLeft : SKIER.flipRight)[s.flip - 1];
  }
  return SKIER.spin[s.spin];
}
