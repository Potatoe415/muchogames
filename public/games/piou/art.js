// Hand-drawn shapes on a 2D context in world units (see engine.js): the
// bird, a pipe, a cloud. No image files, so it stays sharp at any size.
import { BIRD_R, GAP, GROUND, PIPE_W } from "./engine.js";

const BIRD = {
  body: "#5fb8f2",
  belly: "#f4f8ff",
  wing: "#2f86c8",
  beak: "#ff9f1c",
  eye: "#1b2433",
  cheek: "#ff8fa3"
};
const PIPE = { fill: "#e0705a", shade: "#b9503d", light: "#f39a84" };

function ellipse(ctx, x, y, rx, ry, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawWing(ctx, r, flap) {
  ctx.save();
  ctx.translate(-r * 0.25, r * 0.1);
  ctx.rotate(flap ? -0.7 : 0.35);
  ellipse(ctx, -r * 0.2, 0, r * 0.62, r * 0.36, BIRD.wing);
  ctx.restore();
}

function drawFace(ctx, r) {
  ellipse(ctx, r * 0.38, -r * 0.3, r * 0.3, r * 0.3, "#ffffff");
  ellipse(ctx, r * 0.46, -r * 0.3, r * 0.15, r * 0.17, BIRD.eye);
  ellipse(ctx, r * 0.5, -r * 0.36, r * 0.05, r * 0.05, "#ffffff");
  ellipse(ctx, r * 0.28, r * 0.12, r * 0.15, r * 0.1, BIRD.cheek);
  ctx.fillStyle = BIRD.beak;
  ctx.beginPath();
  ctx.moveTo(r * 0.72, -r * 0.12);
  ctx.lineTo(r * 1.3, r * 0.04);
  ctx.lineTo(r * 0.72, r * 0.22);
  ctx.closePath();
  ctx.fill();
}

// `tilt` in radians (nose up < 0), `flap` = wing raised.
export function drawBird(ctx, x, y, tilt, flap) {
  const r = BIRD_R;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt);
  ellipse(ctx, -r * 0.95, -r * 0.1, r * 0.35, r * 0.2, BIRD.wing);
  ellipse(ctx, 0, 0, r * 1.08, r, BIRD.body);
  ellipse(ctx, r * 0.1, r * 0.4, r * 0.72, r * 0.5, BIRD.belly);
  ellipse(ctx, 0, -r * 0.95, r * 0.18, r * 0.28, BIRD.wing);
  drawFace(ctx, r);
  drawWing(ctx, r, flap);
  ctx.restore();
}

function drawColumn(ctx, x, y0, y1) {
  const cap = 4;
  ctx.fillStyle = PIPE.fill;
  ctx.fillRect(x + 1, y0, PIPE_W - 2, y1 - y0);
  ctx.fillStyle = PIPE.light;
  ctx.fillRect(x + 2.5, y0, 2, y1 - y0);
  ctx.fillStyle = PIPE.shade;
  ctx.fillRect(x + PIPE_W - 4, y0, 3, y1 - y0);
  const capY = y0 < 0 ? y1 - cap : y0;
  ctx.fillStyle = PIPE.shade;
  ctx.fillRect(x - 0.6, capY, PIPE_W + 1.2, cap);
  ctx.fillStyle = PIPE.light;
  ctx.fillRect(x + 0.4, capY + 0.8, PIPE_W - 0.8, 1.2);
}

export function drawPipe(ctx, pipe) {
  drawColumn(ctx, pipe.x, -10, pipe.gap - GAP / 2);
  drawColumn(ctx, pipe.x, pipe.gap + GAP / 2, GROUND);
}

export function drawCloud(ctx, x, y, size) {
  const color = "rgba(255, 255, 255, 0.85)";
  ellipse(ctx, x, y, size * 1.6, size * 0.7, color);
  ellipse(ctx, x - size * 0.7, y - size * 0.3, size * 0.8, size * 0.7, color);
  ellipse(ctx, x + size * 0.5, y - size * 0.55, size, size * 0.9, color);
}
