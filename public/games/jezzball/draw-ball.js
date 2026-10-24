// Retro two-tone atom: a sphere of four alternating red/white segments
// turning around a tilted axis (meridians projected as half-ellipses), then
// shaded with a fixed light from the top-left and a specular highlight.
const TAU = Math.PI * 2;
const HALF = Math.PI / 2;
const RED = "#e0262b";
const WHITE = "#fbfbfb";
const STEPS = 12;

const clampFront = (lon) => Math.max(-HALF, Math.min(HALF, lon));

// Visible meridian at longitude `lon`, walked top to bottom or back up.
function meridian(ctx, r, lon, down) {
  const k = r * Math.sin(lon);
  for (let i = 0; i <= STEPS; i++) {
    const lat = -HALF + (Math.PI * (down ? i : STEPS - i)) / STEPS;
    ctx.lineTo(k * Math.cos(lat), r * Math.sin(lat));
  }
}

function fillSegment(ctx, r, from, to) {
  const a = clampFront(from);
  const b = clampFront(to);
  if (b <= a) return;
  ctx.beginPath();
  meridian(ctx, r, a, true);
  meridian(ctx, r, b, false);
  ctx.closePath();
  ctx.fill();
}

function drawSegments(ctx, px, py, r, ball) {
  const phase = ((ball.spin % Math.PI) + Math.PI) % Math.PI;
  ctx.save();
  ctx.translate(px, py);
  ctx.rotate(ball.tilt);
  ctx.fillStyle = RED;
  ctx.fillRect(-r, -r, 2 * r, 2 * r);
  ctx.fillStyle = WHITE;
  fillSegment(ctx, r, phase - Math.PI, phase - HALF);
  fillSegment(ctx, r, phase, phase + HALF);
  ctx.restore();
}

function drawShading(ctx, px, py, r) {
  const shade = ctx.createRadialGradient(
    px - r * 0.35,
    py - r * 0.35,
    r * 0.1,
    px,
    py,
    r
  );
  shade.addColorStop(0, "rgba(255, 255, 255, 0.15)");
  shade.addColorStop(0.65, "rgba(0, 0, 0, 0.05)");
  shade.addColorStop(1, "rgba(0, 0, 0, 0.5)");
  ctx.fillStyle = shade;
  ctx.fillRect(px - r, py - r, 2 * r, 2 * r);
  const hx = px - r * 0.38;
  const hy = py - r * 0.4;
  const spec = ctx.createRadialGradient(hx, hy, 0, hx, hy, r * 0.42);
  spec.addColorStop(0, "rgba(255, 255, 255, 0.95)");
  spec.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = spec;
  ctx.fillRect(px - r, py - r, 2 * r, 2 * r);
}

export function drawBall(ctx, px, py, r, ball) {
  ctx.save();
  ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
  ctx.beginPath();
  ctx.ellipse(px + r * 0.15, py + r * 0.3, r * 0.95, r * 0.8, 0, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(px, py, r, 0, TAU);
  ctx.clip();
  drawSegments(ctx, px, py, r, ball);
  drawShading(ctx, px, py, r);
  ctx.restore();
  ctx.strokeStyle = "rgba(60, 0, 0, 0.55)";
  ctx.lineWidth = Math.max(1, r * 0.08);
  ctx.beginPath();
  ctx.arc(px, py, r, 0, TAU);
  ctx.stroke();
}
