// Draws one frame: queue panel, grid, overwrite animations, hover ghost,
// the overflow puddle and effects.
import { placementFor } from "./board.js";
import { drawPipe, drawRock, drawStart, drawTileBase } from "./draw-pipe.js";
import { LEAK_SECONDS, LOCK_SECONDS } from "./levels.js";
import { DX, DY } from "./pieces.js";

const BACKGROUND = "#141a26";
const FRAME = "#0b0f17";
const ACCENT = "#ffd23f";

function clipped(ctx, box, paint) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(box.x, box.y, box.c, box.c);
  ctx.clip();
  paint();
  ctx.restore();
}

function drawPanel(ctx, x, y, w, h, c) {
  const p = Math.max(3, Math.round(c * 0.12));
  ctx.fillStyle = FRAME;
  ctx.fillRect(x - p, y - p, w + 2 * p, h + 2 * p);
  ctx.strokeStyle = "#39445a";
  ctx.lineWidth = 2;
  ctx.strokeRect(x - p + 1, y - p + 1, w + 2 * p - 2, h + 2 * p - 2);
}

function drawActiveMarker(ctx, slot, layout) {
  const { cell: c, side } = layout;
  const s = c * 0.16;
  ctx.fillStyle = ACCENT;
  ctx.beginPath();
  if (side) {
    const y = slot.y + c + c * 0.24;
    ctx.moveTo(slot.x + c / 2 - s, y + s);
    ctx.lineTo(slot.x + c / 2 + s, y + s);
    ctx.lineTo(slot.x + c / 2, y);
  } else {
    const x = slot.x - c * 0.06;
    ctx.moveTo(x - s, slot.y + c / 2 - s);
    ctx.lineTo(x - s, slot.y + c / 2 + s);
    ctx.lineTo(x, slot.y + c / 2);
  }
  ctx.fill();
}

function drawQueue(ctx, layout, pieces, time) {
  const { cell: c, queue, side } = layout;
  const first = queue[0];
  const last = queue[queue.length - 1];
  const x = Math.min(first.x, last.x);
  const y = Math.min(first.y, last.y);
  drawPanel(
    ctx,
    x,
    y,
    side ? c : c * queue.length,
    side ? c * queue.length : c,
    c
  );
  queue.forEach((slot, i) => {
    const box = { x: slot.x, y: slot.y, c };
    clipped(ctx, box, () => {
      drawTileBase(ctx, box, i > 0);
      drawPipe(ctx, pieces[i], null, box, time);
    });
  });
  ctx.strokeStyle = ACCENT;
  ctx.lineWidth = Math.max(2, c * 0.07);
  ctx.strokeRect(first.x + 1, first.y + 1, c - 2, c - 2);
  drawActiveMarker(ctx, first, layout);
}

function drawLocked(ctx, cell, box, time) {
  const t = 1 - cell.lock / LOCK_SECONDS;
  const { x, y, c } = box;
  if (t < 0.5) {
    const k = 1 - t * 1.6;
    ctx.save();
    ctx.globalAlpha = 1 - t;
    ctx.translate(x + c / 2, y + c / 2);
    ctx.rotate(t * 1.2);
    ctx.scale(k, k);
    drawPipe(ctx, cell.prevType, null, { x: -c / 2, y: -c / 2, c }, time);
    ctx.restore();
  } else {
    ctx.save();
    ctx.globalAlpha = (t - 0.5) * 2;
    drawPipe(ctx, cell.type, null, box, time);
    ctx.restore();
  }
  ctx.fillStyle = `rgba(255, 120, 40, ${0.55 * (1 - t)})`;
  ctx.fillRect(x, y, c, c);
  ctx.strokeStyle = `rgba(255, 70, 50, ${0.9 * (1 - t)})`;
  ctx.lineWidth = Math.max(2, c * 0.08);
  ctx.strokeRect(x + 2, y + 2, c - 4, c - 4);
}

function startGauge(state) {
  if (state.phase !== "countdown") return 1;
  return 1 - state.timer / state.config.countdown;
}

function drawCell(ctx, cell, box, state, time) {
  if (cell.kind === "rock") {
    drawTileBase(ctx, box, true);
    drawRock(ctx, cell.seed, box);
    return;
  }
  drawTileBase(ctx, box);
  if (cell.kind === "start") drawStart(ctx, cell, box, startGauge(state), time);
  else if (cell.kind === "pipe" && cell.lock > 0)
    drawLocked(ctx, cell, box, time);
  else if (cell.kind === "pipe")
    drawPipe(ctx, cell.type, cell.fills, box, time);
}

function drawGrid(ctx, layout, state, time) {
  const { cell: c, grid } = layout;
  const { board } = state;
  drawPanel(ctx, grid.x, grid.y, board.cols * c, board.rows * c, c);
  board.cells.forEach((cell, index) => {
    const box = {
      x: grid.x + (index % board.cols) * c,
      y: grid.y + Math.floor(index / board.cols) * c,
      c
    };
    clipped(ctx, box, () => drawCell(ctx, cell, box, state, time));
  });
}

function drawHover(ctx, layout, view) {
  const { state, hover, time } = view;
  if (!hover || !view.canPlace) return;
  const { cell: c, grid } = layout;
  const box = { x: grid.x + hover.x * c, y: grid.y + hover.y * c, c };
  const target = state.board.cells[hover.y * state.board.cols + hover.x];
  const action = placementFor(target);
  if (action === "place") {
    ctx.save();
    ctx.globalAlpha = 0.45;
    clipped(ctx, box, () =>
      drawPipe(ctx, state.queue.list()[0], null, box, time)
    );
    ctx.restore();
  }
  ctx.strokeStyle = action
    ? action === "replace"
      ? "#ff9f43"
      : "#ffffff"
    : "#ff4d4d";
  ctx.lineWidth = 2;
  ctx.strokeRect(box.x + 1, box.y + 1, c - 2, c - 2);
}

function drawLeak(ctx, layout, state) {
  const leak = state.flow?.leak;
  if (!leak) return;
  const { cell: c, grid } = layout;
  const grow = state.phase === "leak" ? 1 - state.timer / LEAK_SECONDS : 1;
  const px = grid.x + (leak.x + 0.5 + DX[leak.dir] * 0.5) * c;
  const py = grid.y + (leak.y + 0.5 + DY[leak.dir] * 0.5) * c;
  const r = c * (0.12 + 0.38 * Math.min(1, grow));
  ctx.fillStyle = "rgba(63, 217, 74, 0.85)";
  ctx.beginPath();
  ctx.ellipse(px, py, r, r * 0.75, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(195, 255, 158, 0.8)";
  ctx.beginPath();
  ctx.ellipse(
    px - r * 0.3,
    py - r * 0.25,
    r * 0.3,
    r * 0.18,
    -0.5,
    0,
    Math.PI * 2
  );
  ctx.fill();
}

export function render(ctx, layout, view) {
  const { state, effects, time } = view;
  ctx.fillStyle = BACKGROUND;
  ctx.fillRect(0, 0, layout.width, layout.height);
  drawQueue(ctx, layout, state.queue.list(), time);
  drawGrid(ctx, layout, state, time);
  drawHover(ctx, layout, view);
  drawLeak(ctx, layout, state);
  effects.draw(ctx, layout.grid.x, layout.grid.y, layout.cell);
}
