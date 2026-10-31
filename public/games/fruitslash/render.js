// Canvas drawing: glowing night background with drifting light bubbles,
// splashes, halves, flying items, the rainbow blade and the effects.
import { TRAIL_SECONDS } from "./blade.js";
import { sprite, spritePadding } from "./sprites.js";
import { lookup } from "./themes.js";
import { itemRadius } from "./world.js";

const MAX_DPR = 2;
const BUBBLES = 14;
const EMOJI_SCALE = 2.1;

const makeBubbles = () =>
  Array.from({ length: BUBBLES }, () => ({
    x: Math.random(),
    y: Math.random(),
    r: 0.05 + Math.random() * 0.12,
    hue: Math.random() * 360,
    speed: 0.01 + Math.random() * 0.03,
    phase: Math.random() * Math.PI * 2
  }));

function skyGradient(ctx, size) {
  const sky = ctx.createLinearGradient(0, 0, size.w * 0.3, size.h);
  sky.addColorStop(0, "#1b0a4a");
  sky.addColorStop(0.55, "#3c0f86");
  sky.addColorStop(1, "#7a1aa8");
  return sky;
}

function drawBubbles(ctx, size, bubbles, now) {
  ctx.globalCompositeOperation = "lighter";
  const unit = Math.max(size.w, size.h);
  for (const b of bubbles) {
    const x = (b.x + Math.sin(now * 0.4 + b.phase) * 0.03) * size.w;
    const y = (((((b.y - now * b.speed) % 1.2) + 1.2) % 1.2) - 0.1) * size.h;
    const r = b.r * unit;
    const glow = ctx.createRadialGradient(x, y, 0, x, y, r);
    glow.addColorStop(0, `hsl(${b.hue} 100% 70% / 0.28)`);
    glow.addColorStop(1, `hsl(${b.hue} 100% 60% / 0)`);
    ctx.fillStyle = glow;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  ctx.globalCompositeOperation = "source-over";
}

function drawSprite(ctx, body, r, dpr) {
  const def = lookup(body.e);
  const image = sprite(body.e, def.c, r * EMOJI_SCALE * dpr);
  const s = r * EMOJI_SCALE * spritePadding;
  ctx.drawImage(image, -s / 2, -s / 2, s, s);
  return def;
}

function drawItem(ctx, body, size, r) {
  ctx.save();
  ctx.translate(body.x * size.w, body.y * size.h);
  ctx.rotate(body.rot);
  drawSprite(ctx, body, r, size.dpr);
  ctx.restore();
}

// The half is clipped along its cut line, then the cut face is painted in
// the item's juice colour.
function drawHalf(ctx, half, size, r) {
  const span = r * EMOJI_SCALE * spritePadding;
  ctx.save();
  ctx.translate(half.x * size.w, half.y * size.h);
  ctx.rotate(half.rot + half.cut);
  ctx.beginPath();
  ctx.rect(-span, half.side < 0 ? -span : 0, span * 2, span);
  ctx.clip();
  ctx.rotate(-half.cut);
  const def = drawSprite(ctx, half, r, size.dpr);
  ctx.rotate(half.cut);
  ctx.strokeStyle = def.c;
  ctx.lineWidth = r * 0.14;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-r * 0.8, 0);
  ctx.lineTo(r * 0.8, 0);
  ctx.stroke();
  ctx.restore();
}

function strokeTrail(ctx, points, now, core) {
  for (let i = 1; i < points.length; i++) {
    const p = points[i];
    const life = 1 - (now - p.t) / TRAIL_SECONDS;
    if (p.first || life <= 0) continue;
    const color = `hsl(${(now * 240 + i * 28) % 360} 100% 62%)`;
    ctx.strokeStyle = core ? "rgba(255, 255, 255, 0.95)" : color;
    ctx.shadowColor = color;
    ctx.shadowBlur = core ? 0 : 20;
    ctx.lineWidth = core ? 1.5 + 4 * life : 5 + 14 * life;
    ctx.beginPath();
    ctx.moveTo(points[i - 1].x, points[i - 1].y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  }
}

function drawBlade(ctx, blade, cursor, now) {
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  strokeTrail(ctx, blade.points, now, false);
  strokeTrail(ctx, blade.points, now, true);
  ctx.shadowBlur = 0;
  if (!cursor) return;
  ctx.fillStyle = "#ffffff";
  ctx.shadowColor = `hsl(${(now * 240) % 360} 100% 62%)`;
  ctx.shadowBlur = 24;
  ctx.beginPath();
  ctx.arc(cursor.x, cursor.y, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext("2d");
  const size = { w: 1, h: 1, dpr: 1 };
  const bubbles = makeBubbles();
  let sky = null;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    size.dpr = Math.min(MAX_DPR, window.devicePixelRatio || 1);
    size.w = Math.max(1, rect.width);
    size.h = Math.max(1, rect.height);
    canvas.width = Math.round(size.w * size.dpr);
    canvas.height = Math.round(size.h * size.dpr);
    sky = skyGradient(ctx, size);
  }

  function draw({ world, effects, blade, cursor }, now) {
    ctx.setTransform(size.dpr, 0, 0, size.dpr, 0, 0);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, size.w, size.h);
    drawBubbles(ctx, size, bubbles, now);
    const shake = effects.shakeOffset();
    ctx.translate(shake.x, shake.y);
    effects.drawBack(ctx);
    const r = itemRadius(world, size);
    world.halves.forEach((half) => drawHalf(ctx, half, size, r));
    world.items.forEach((item) => drawItem(ctx, item, size, r));
    ctx.setTransform(size.dpr, 0, 0, size.dpr, 0, 0);
    drawBlade(ctx, blade, cursor, now);
    effects.drawFront(ctx, size);
  }

  resize();
  return { size, resize, draw };
}
