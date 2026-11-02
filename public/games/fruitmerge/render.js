// Canvas frame: the wooden box with its checked cloth, the red danger line,
// the aim guide, the held fruit, the fruits in the box and the effects.
import { BOX } from "./physics.js";
import { HALF } from "./sprites.js";
import { HOLD_Y, LINE_Y, canDrop, makeBody } from "./world.js";

export const WALL = 0.045;
const TOP = -0.06;
// Drawn area in box units, walls included.
export const EXTENT = { w: BOX.w + WALL * 2, h: BOX.h + WALL - TOP };

const CLOTH = "#fdefc4";
const CHECK = "rgba(240, 196, 120, 0.28)";
const WOOD = "#c8643b";
const WOOD_LIGHT = "#e3875a";
const DANGER = "#e2574c";
const CHECK_SIZE = 0.1;

export function createView(pixelWidth) {
  const scale = pixelWidth / EXTENT.w;
  return {
    scale,
    x: (wx) => (wx + WALL) * scale,
    y: (wy) => (wy - TOP) * scale
  };
}

function cloth(ctx, view) {
  const s = view.scale;
  ctx.fillStyle = CLOTH;
  ctx.fillRect(view.x(0), view.y(0), BOX.w * s, BOX.h * s);
  ctx.fillStyle = CHECK;
  for (let x = 0; x < BOX.w; x += CHECK_SIZE) {
    ctx.fillRect(view.x(x), view.y(0), (CHECK_SIZE / 2) * s, BOX.h * s);
  }
  for (let y = 0; y < BOX.h; y += CHECK_SIZE) {
    ctx.fillRect(view.x(0), view.y(y), BOX.w * s, (CHECK_SIZE / 2) * s);
  }
}

function plank(ctx, view, x, y, w, h) {
  const s = view.scale;
  const radius = WALL * s * 0.45;
  ctx.fillStyle = WOOD;
  ctx.beginPath();
  ctx.roundRect(view.x(x), view.y(y), w * s, h * s, radius);
  ctx.fill();
  ctx.fillStyle = WOOD_LIGHT;
  ctx.fillRect(
    view.x(x) + w * s * 0.25,
    view.y(y) + radius,
    w * s * 0.2,
    h * s - radius * 2
  );
}

// Static layer, drawn once per canvas size.
function paintBox(width, height, view) {
  const layer = document.createElement("canvas");
  layer.width = width;
  layer.height = height;
  const ctx = layer.getContext("2d");
  cloth(ctx, view);
  plank(ctx, view, -WALL, 0, WALL, BOX.h + WALL);
  plank(ctx, view, BOX.w, 0, WALL, BOX.h + WALL);
  ctx.fillStyle = WOOD;
  ctx.fillRect(view.x(0), view.y(BOX.h), BOX.w * view.scale, WALL * view.scale);
  return layer;
}

function dangerLine(ctx, view, world, time) {
  const s = view.scale;
  const alert = world.danger > 0;
  ctx.globalAlpha = alert ? 0.55 + 0.45 * Math.sin(time * 14) : 0.8;
  ctx.strokeStyle = DANGER;
  ctx.lineWidth = Math.max(2, s * (alert ? 0.012 : 0.007));
  ctx.setLineDash([s * 0.03, s * 0.02]);
  ctx.beginPath();
  ctx.moveTo(view.x(0), view.y(LINE_Y));
  ctx.lineTo(view.x(BOX.w), view.y(LINE_Y));
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;
}

function aimGuide(ctx, view, world, r) {
  const s = view.scale;
  ctx.fillStyle = "rgba(70, 90, 170, 0.55)";
  for (let y = HOLD_Y + r + 0.03; y < BOX.h; y += 0.03) {
    ctx.beginPath();
    ctx.arc(
      view.x(world.aim),
      view.y(y),
      Math.max(1.2, s * 0.0045),
      0,
      Math.PI * 2
    );
    ctx.fill();
  }
}

// `grow` (0..1) shrinks a fruit that just appeared from a merge.
function fruit(ctx, view, sprites, body) {
  const { level, r, x, y, angle } = body;
  const px = r * view.scale;
  const image = sprites.get(level, px);
  const half = px * HALF * (1 - (body.grow || 0) * 2);
  ctx.save();
  ctx.translate(view.x(x), view.y(y));
  ctx.rotate(angle);
  ctx.drawImage(image, -half, -half, half * 2, half * 2);
  ctx.restore();
}

export function createRenderer(ctx, sprites) {
  let layer = null;
  return {
    resize() {
      layer = null;
      sprites.clear();
    },
    draw(view, world, effects, time) {
      const { width, height } = ctx.canvas;
      if (!layer) layer = paintBox(width, height, view);
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(layer, 0, 0);
      dangerLine(ctx, view, world, time);
      if (canDrop(world)) {
        const held = makeBody(world.queue[0], world.aim, HOLD_Y);
        aimGuide(ctx, view, world, held.r);
        fruit(ctx, view, sprites, held);
      }
      world.bodies.forEach((body) => fruit(ctx, view, sprites, body));
      effects.draw(ctx, view);
    }
  };
}
