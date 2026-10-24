// Chair lift chairs, computed from the clock instead of stored: loaded
// chairs ride up on the right of the towers, empty ones come down on the
// left. Chairs hang high, so only an airborne skier can hit one.
import { LIFT } from "./config.js";
import { SPRITE } from "./sprites.js";

const SIDE = 13;
const HIT_HW = 11;
const HIT_D = 6;
const HIT_Z = 24;
const MARGIN = 80;

function lane(view, time, up) {
  const travel = time * LIFT.speed;
  const cycles = Math.floor(travel / LIFT.chairStep);
  const phase = travel - cycles * LIFT.chairStep;
  const offset = up ? -phase : phase + LIFT.chairStep / 2;
  const from = Math.max(view.y - MARGIN, LIFT.top);
  const first = Math.ceil((from - LIFT.top - offset) / LIFT.chairStep);
  const last = Math.floor(
    (view.y + view.h + MARGIN - LIFT.top - offset) / LIFT.chairStep
  );
  const chairs = [];
  for (let n = first; n <= last; n += 1) {
    const y = LIFT.top + n * LIFT.chairStep + offset;
    if (y >= LIFT.top) chairs.push({ n: n + cycles, y });
  }
  return chairs;
}

export function liftChairs(view, time) {
  const loaded = lane(view, time, true).map(({ n, y }) => ({
    sprite: n % 3 === 0 ? SPRITE.chairOne : SPRITE.chairFull,
    x: LIFT.x + SIDE,
    y
  }));
  const empty = lane(view, time, false).map(({ y }) => ({
    sprite: SPRITE.chairEmpty,
    x: LIFT.x - SIDE,
    y
  }));
  return [...loaded, ...empty];
}

export function chairHit(skier, view, time) {
  if (skier.z < HIT_Z) return false;
  return liftChairs(view, time).some(
    (chair) =>
      Math.abs(chair.x - skier.x) < HIT_HW &&
      Math.abs(chair.y - skier.y) < HIT_D
  );
}
