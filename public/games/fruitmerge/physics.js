// Circles in an open-top box: gravity, impulse collisions with position
// correction, walls and floor. Units: the box is 1 wide and BOX.h tall, y
// grows downwards. Mass grows with the area (r²).
export const BOX = { w: 1, h: 1.55 };

const GRAVITY = 3.2;
const SUBSTEPS = 8;
const ITERATIONS = 2;
const BOUNCE = 0.12;
const FRICTION = 0.25;
const FLOOR_DRAG = 0.997;
const AIR_DRAG = 0.9995;
const CORRECTION = 0.8;
const MAX_SPEED = 5;
const ROLL = 0.7;

function integrate(body, h) {
  body.vy += GRAVITY * h;
  body.vx *= AIR_DRAG;
  body.vy *= AIR_DRAG;
  const speed = Math.hypot(body.vx, body.vy);
  if (speed > MAX_SPEED) {
    body.vx *= MAX_SPEED / speed;
    body.vy *= MAX_SPEED / speed;
  }
  body.x += body.vx * h;
  body.y += body.vy * h;
  body.angle += (body.vx / body.r) * h * ROLL;
}

function applyImpulse(a, b, nx, ny, ia, ib) {
  const rvx = b.vx - a.vx;
  const rvy = b.vy - a.vy;
  const vn = rvx * nx + rvy * ny;
  if (vn >= 0) return;
  const sum = ia + ib;
  const j = (-(1 + BOUNCE) * vn) / sum;
  const vt = -rvx * ny + rvy * nx;
  const jt = Math.max(-FRICTION * j, Math.min(FRICTION * j, -vt / sum));
  const ix = j * nx - jt * ny;
  const iy = j * ny + jt * nx;
  a.vx -= ix * ia;
  a.vy -= iy * ia;
  b.vx += ix * ib;
  b.vy += iy * ib;
}

// True when the two circles touch.
function collide(a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const reach = a.r + b.r;
  const dist2 = dx * dx + dy * dy;
  if (dist2 >= reach * reach) return false;
  const dist = Math.sqrt(dist2) || 1e-6;
  const nx = dist2 ? dx / dist : 0;
  const ny = dist2 ? dy / dist : 1;
  const ia = 1 / (a.r * a.r);
  const ib = 1 / (b.r * b.r);
  const push = ((reach - dist) * CORRECTION) / (ia + ib);
  a.x -= nx * push * ia;
  a.y -= ny * push * ia;
  b.x += nx * push * ib;
  b.y += ny * push * ib;
  applyImpulse(a, b, nx, ny, ia, ib);
  return true;
}

function collideWalls(body) {
  if (body.x - body.r < 0) {
    body.x = body.r;
    if (body.vx < 0) body.vx *= -BOUNCE;
  } else if (body.x + body.r > BOX.w) {
    body.x = BOX.w - body.r;
    if (body.vx > 0) body.vx *= -BOUNCE;
  }
  if (body.y + body.r > BOX.h) {
    body.y = BOX.h - body.r;
    if (body.vy > 0) body.vy *= -BOUNCE;
    body.vx *= FLOOR_DRAG;
  }
}

function collideAll(bodies, onTouch) {
  for (let i = 0; i < bodies.length; i++) {
    for (let k = i + 1; k < bodies.length; k++) {
      if (collide(bodies[i], bodies[k])) onTouch(bodies[i], bodies[k]);
    }
  }
  bodies.forEach(collideWalls);
}

// onTouch(a, b) runs for every touching pair (several times per step).
export function stepPhysics(bodies, dt, onTouch) {
  const h = dt / SUBSTEPS;
  for (let s = 0; s < SUBSTEPS; s++) {
    bodies.forEach((body) => integrate(body, h));
    for (let k = 0; k < ITERATIONS; k++) collideAll(bodies, onTouch);
  }
}
