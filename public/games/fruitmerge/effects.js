// Cosmetic effects in box units: juice drops, a ring and a floating "+N"
// on each merge, a puff for swept fruits. Never saved.
import { FRUITS } from "./fruits.js";

const GRAVITY = 2.2;
const DROP_LIFE = 0.6;
const RING_LIFE = 0.35;
const TEXT_LIFE = 0.9;

function drawDrops(ctx, drops, view) {
  drops.forEach((d) => {
    ctx.globalAlpha = Math.min(1, d.life / DROP_LIFE + 0.2);
    ctx.fillStyle = d.color;
    ctx.beginPath();
    ctx.arc(view.x(d.x), view.y(d.y), d.size * view.scale, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawRings(ctx, rings, view) {
  ctx.strokeStyle = "#ffffff";
  rings.forEach((ring) => {
    const t = 1 - ring.life / RING_LIFE;
    const radius = ring.r * (1 + t * 0.5) * view.scale;
    ctx.globalAlpha = 1 - t;
    ctx.lineWidth = Math.max(2, ring.r * view.scale * 0.12);
    ctx.beginPath();
    ctx.arc(view.x(ring.x), view.y(ring.y), radius, 0, Math.PI * 2);
    ctx.stroke();
  });
}

function drawTexts(ctx, texts, view) {
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `900 ${Math.round(view.scale * 0.07)}px system-ui, sans-serif`;
  ctx.lineWidth = view.scale * 0.012;
  ctx.strokeStyle = "#7a2f5a";
  ctx.fillStyle = "#ffffff";
  texts.forEach((text) => {
    ctx.globalAlpha = Math.min(1, (text.life / TEXT_LIFE) * 2);
    ctx.strokeText(text.text, view.x(text.x), view.y(text.y));
    ctx.fillText(text.text, view.x(text.x), view.y(text.y));
  });
}

function moveDrop(d, dt) {
  d.vy += GRAVITY * dt;
  d.x += d.vx * dt;
  d.y += d.vy * dt;
  d.life -= dt;
}

export function createEffects() {
  let drops = [];
  let rings = [];
  let texts = [];

  function splash(x, y, level, count) {
    const { body, light, r } = FRUITS[level];
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const speed = 0.4 + Math.random() * 0.8;
      drops.push({
        x: x + Math.cos(a) * r * 0.6,
        y: y + Math.sin(a) * r * 0.6,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed - 0.4,
        size: r * (0.12 + Math.random() * 0.12),
        color: i % 3 ? body : light,
        life: DROP_LIFE
      });
    }
  }

  return {
    merge({ x, y, level, points }) {
      const r = FRUITS[level].r;
      splash(x, y, level, 10);
      rings.push({ x, y, r, life: RING_LIFE });
      texts.push({ x, y: y - r, text: `+${points}`, life: TEXT_LIFE });
    },
    puff(body) {
      splash(body.x, body.y, body.level, 5);
    },
    update(dt) {
      drops.forEach((d) => moveDrop(d, dt));
      rings.forEach((ring) => (ring.life -= dt));
      texts.forEach((text) => {
        text.y -= 0.25 * dt;
        text.life -= dt;
      });
      drops = drops.filter((d) => d.life > 0);
      rings = rings.filter((ring) => ring.life > 0);
      texts = texts.filter((text) => text.life > 0);
    },
    draw(ctx, view) {
      drawDrops(ctx, drops, view);
      drawRings(ctx, rings, view);
      drawTexts(ctx, texts, view);
      ctx.globalAlpha = 1;
    }
  };
}
