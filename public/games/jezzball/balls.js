// Atoms: constant speed on the diagonals, moved in sub-steps short enough
// that a ball can never skip a cell. Wall collisions use the ball's square
// box, resolved one axis at a time, so a ball never overlaps a solid cell.
import { SOLID, cellAt } from "./grid.js";
import { BALL_RADIUS, BALL_SPEED, BORDER } from "./levels.js";

const MAX_SUBSTEP = 0.2;
const EPS = 1e-6;
const SPIN = 7;
const COMPONENT = BALL_SPEED / Math.SQRT2;

function hitsSolid(grid, x, y) {
  const r = BALL_RADIUS - EPS;
  const x0 = Math.floor(x - r);
  const x1 = Math.floor(x + r);
  const y0 = Math.floor(y - r);
  const y1 = Math.floor(y + r);
  for (let cy = y0; cy <= y1; cy++) {
    for (let cx = x0; cx <= x1; cx++) {
      if (cellAt(grid, cx, cy) === SOLID) return true;
    }
  }
  return false;
}

export function spawnBalls(grid, count, random = Math.random) {
  const margin = BORDER + 1;
  const spanX = grid.cols - 2 * margin;
  const spanY = grid.rows - 2 * margin;
  const balls = [];
  for (let tries = 0; balls.length < count && tries < 2000; tries++) {
    const x = margin + random() * spanX;
    const y = margin + random() * spanY;
    const spacing = tries < 1500 ? 2.5 : 1;
    const crowded = balls.some(
      (b) => Math.hypot(b.x - x, b.y - y) < spacing * BALL_RADIUS * 2
    );
    if (crowded) continue;
    balls.push({
      x,
      y,
      vx: random() < 0.5 ? -COMPONENT : COMPONENT,
      vy: random() < 0.5 ? -COMPONENT : COMPONENT,
      spin: random() * Math.PI * 2,
      tilt: random() * Math.PI
    });
  }
  return balls;
}

// Moves the ball along one axis; on contact snaps it against the blocking
// cell edge and reverses that velocity component.
function stepAxis(grid, ball, axis, h) {
  const key = axis === "x" ? "vx" : "vy";
  const v = ball[key];
  const next = ball[axis] + v * h;
  const x = axis === "x" ? next : ball.x;
  const y = axis === "y" ? next : ball.y;
  if (!hitsSolid(grid, x, y)) {
    ball[axis] = next;
    return false;
  }
  ball[axis] =
    v > 0
      ? Math.floor(next + BALL_RADIUS) - BALL_RADIUS - EPS
      : Math.floor(next - BALL_RADIUS) + 1 + BALL_RADIUS + EPS;
  ball[key] = -v;
  return true;
}

// Equal masses on the diagonals: swapping the component along the main
// separation axis keeps every ball at 45 degrees and constant speed.
function collidePair(a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  if (dx * dx + dy * dy >= 4 * BALL_RADIUS * BALL_RADIUS) return false;
  const key = Math.abs(dx) >= Math.abs(dy) ? "vx" : "vy";
  const gap = key === "vx" ? dx : dy;
  if ((b[key] - a[key]) * gap >= 0) return false;
  [a[key], b[key]] = [b[key], a[key]];
  return true;
}

function collideBalls(balls) {
  let bounces = 0;
  for (let i = 0; i < balls.length; i++) {
    for (let j = i + 1; j < balls.length; j++) {
      if (collidePair(balls[i], balls[j])) bounces += 1;
    }
  }
  return bounces;
}

// Returns the number of bounces (walls + other balls) during dt.
export function moveBalls(grid, balls, dt) {
  const steps = Math.max(1, Math.ceil((BALL_SPEED * dt) / MAX_SUBSTEP));
  const h = dt / steps;
  let bounces = 0;
  for (let s = 0; s < steps; s++) {
    balls.forEach((ball) => {
      if (stepAxis(grid, ball, "x", h)) bounces += 1;
      if (stepAxis(grid, ball, "y", h)) bounces += 1;
    });
    bounces += collideBalls(balls);
  }
  balls.forEach((ball) => {
    ball.spin += dt * SPIN * Math.sign(ball.vx || 1);
  });
  return bounces;
}

export function touchesRect(ball, rect) {
  const r = BALL_RADIUS;
  return (
    ball.x + r > rect.x0 &&
    ball.x - r < rect.x1 &&
    ball.y + r > rect.y0 &&
    ball.y - r < rect.y1
  );
}

export const ballCell = (grid, ball) =>
  Math.floor(ball.y) * grid.cols + Math.floor(ball.x);
