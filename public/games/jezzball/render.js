// Draws one frame: cached field, capture glow, growing walls, the mouse
// preview of the next wall, atoms, effects and the hit flash.
import { drawBall } from "./draw-ball.js";
import { SOLID, cellAt } from "./grid.js";
import { BALL_RADIUS } from "./levels.js";
import { isLive, rayRect } from "./walls.js";

const BACKGROUND = "#0d1320";
const RAY_COLORS = [
  { body: "#e8413c", light: "#ffb3a8" },
  { body: "#2f6fe0", light: "#a9c8ff" }
];

function drawGlow(ctx, grid, layout) {
  const { cell: c, grid: origin } = layout;
  ctx.fillStyle = "#7fd3ff";
  for (let i = 0; i < grid.glow.length; i++) {
    const g = grid.glow[i];
    if (g <= 0) continue;
    ctx.globalAlpha = g * 0.55;
    ctx.fillRect(
      origin.x + (i % grid.cols) * c,
      origin.y + Math.floor(i / grid.cols) * c,
      c,
      c
    );
  }
  ctx.globalAlpha = 1;
}

function toPixels(layout, rect) {
  const { cell: c, grid } = layout;
  return {
    x: grid.x + rect.x0 * c,
    y: grid.y + rect.y0 * c,
    w: (rect.x1 - rect.x0) * c,
    h: (rect.y1 - rect.y0) * c
  };
}

function drawRay(ctx, layout, wall, ray, index, time) {
  const box = toPixels(layout, rayRect(wall, ray));
  if (box.w <= 0 || box.h <= 0) return;
  const colors = RAY_COLORS[index];
  const inset = Math.max(1, layout.cell * 0.18);
  const horizontal = wall.axis === "h";
  ctx.fillStyle = colors.body;
  ctx.fillRect(box.x, box.y, box.w, box.h);
  ctx.fillStyle = colors.light;
  if (horizontal) ctx.fillRect(box.x, box.y + inset, box.w, inset * 0.7);
  else ctx.fillRect(box.x + inset, box.y, inset * 0.7, box.h);
  if (!ray.growing) return;
  const pulse = 0.55 + 0.45 * Math.sin(time * 30);
  const head = ray.dir < 0 ? 0 : 1;
  const hx = horizontal ? box.x + box.w * head : box.x + box.w / 2;
  const hy = horizontal ? box.y + box.h / 2 : box.y + box.h * head;
  ctx.fillStyle = `rgba(255, 255, 255, ${pulse})`;
  ctx.beginPath();
  ctx.arc(hx, hy, layout.cell * 0.32, 0, Math.PI * 2);
  ctx.fill();
}

function drawWall(ctx, layout, wall, time) {
  if (!wall) return;
  wall.rays.forEach((ray, index) => {
    if (isLive(ray)) drawRay(ctx, layout, wall, ray, index, time);
  });
}

// Extent of the wall a tap on `cell` would build, both rays included.
function previewRect(grid, cell, axis) {
  const horizontal = axis === "h";
  const free = (k) =>
    horizontal
      ? cellAt(grid, k, cell.y) !== SOLID
      : cellAt(grid, cell.x, k) !== SOLID;
  let lo = horizontal ? cell.x : cell.y;
  let hi = lo;
  while (free(lo - 1)) lo -= 1;
  while (free(hi + 1)) hi += 1;
  return horizontal
    ? { x0: lo, y0: cell.y, x1: hi + 1, y1: cell.y + 1 }
    : { x0: cell.x, y0: lo, x1: cell.x + 1, y1: hi + 1 };
}

function drawPreview(ctx, layout, view) {
  const { state, hover } = view;
  if (!hover || !view.canBuild) return;
  if (cellAt(state.grid, hover.x, hover.y) === SOLID) return;
  const box = toPixels(layout, previewRect(state.grid, hover, state.axis));
  const c = layout.cell;
  ctx.fillStyle = "rgba(255, 255, 255, 0.28)";
  ctx.fillRect(box.x, box.y, box.w, box.h);
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2;
  ctx.strokeRect(
    layout.grid.x + hover.x * c + 1,
    layout.grid.y + hover.y * c + 1,
    c - 2,
    c - 2
  );
}

function drawBalls(ctx, layout, balls) {
  const { cell: c, grid } = layout;
  const r = BALL_RADIUS * c;
  balls.forEach((ball) =>
    drawBall(ctx, grid.x + ball.x * c, grid.y + ball.y * c, r, ball)
  );
}

function drawFlash(ctx, layout, flash) {
  if (flash <= 0) return;
  ctx.fillStyle = `rgba(255, 40, 40, ${Math.min(0.45, flash)})`;
  ctx.fillRect(0, 0, layout.width, layout.height);
}

export function render(ctx, layout, view) {
  const { state, effects, field, time } = view;
  ctx.fillStyle = BACKGROUND;
  ctx.fillRect(0, 0, layout.width, layout.height);
  field.draw(ctx, state.grid, layout);
  drawGlow(ctx, state.grid, layout);
  drawPreview(ctx, layout, view);
  drawWall(ctx, layout, state.wall, time);
  drawBalls(ctx, layout, state.balls);
  effects.draw(ctx, layout.grid.x, layout.grid.y, layout.cell);
  drawFlash(ctx, layout, state.flash);
}
