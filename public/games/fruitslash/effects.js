// Cosmetic effects in CSS pixels: juice drops, splashes left on the
// background, sparkles, floating texts, the bomb flash and shake. Not
// saved: a resumed match starts with a clean screen.
const GRAVITY = 900;
const MAX_PARTICLES = 450;
const TEXT_FONT =
  '900 {size}px "Trebuchet MS", "Arial Rounded MT Bold", system-ui, sans-serif';

const rand = (min, max) => min + Math.random() * (max - min);

function burst(list, x, y, count, make) {
  for (let i = 0; i < count && list.length < MAX_PARTICLES; i++) {
    const angle = rand(0, Math.PI * 2);
    const speed = rand(120, 420);
    list.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 140,
      ...make(i)
    });
  }
}

function step(list, dt, gravity) {
  for (const p of list) {
    p.life -= dt;
    p.vy += gravity * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
  }
  return list.filter((p) => p.life > 0);
}

function drawParticles(ctx, particles) {
  ctx.globalCompositeOperation = "lighter";
  for (const p of particles) {
    ctx.globalAlpha = Math.min(1, p.life / p.max) * 0.9;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * (0.4 + p.life / p.max), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalCompositeOperation = "source-over";
}

function drawText(ctx, t) {
  const age = (t.max - t.life) / t.max;
  const pop = age < 0.15 ? 0.6 + (age / 0.15) * 0.6 : 1.2 - Math.min(0.2, age);
  ctx.globalAlpha = Math.min(1, t.life / 0.3);
  ctx.font = TEXT_FONT.replace("{size}", Math.round(t.size * pop));
  ctx.lineWidth = Math.max(3, t.size * 0.14);
  ctx.strokeStyle = "rgba(30, 6, 60, 0.85)";
  ctx.shadowColor = t.color;
  ctx.shadowBlur = 16;
  ctx.strokeText(t.label, t.x, t.y);
  ctx.shadowBlur = 0;
  ctx.fillStyle = t.color;
  ctx.fillText(t.label, t.x, t.y);
}

function drawSplats(ctx, splats) {
  for (const s of splats) {
    ctx.globalAlpha = 0.32 * Math.min(1, s.life / s.max);
    ctx.fillStyle = s.color;
    for (const blob of s.blobs) {
      ctx.beginPath();
      ctx.arc(s.x + blob.dx, s.y + blob.dy, blob.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}

function splatAt(x, y, color, scale) {
  const blobs = Array.from({ length: 7 }, (_, i) => ({
    dx: i === 0 ? 0 : rand(-1, 1) * scale,
    dy: i === 0 ? 0 : rand(-1, 1) * scale,
    r: i === 0 ? scale * 0.8 : rand(0.15, 0.4) * scale
  }));
  return { x, y, color, blobs, life: 1.8, max: 1.8 };
}

export function createEffects() {
  let particles = [];
  let splats = [];
  let texts = [];
  let flash = 0;
  let shake = 0;

  return {
    juice(x, y, color, scale) {
      burst(particles, x, y, 16, () => ({
        color,
        size: rand(3, 7),
        life: rand(0.35, 0.7),
        max: 0.7
      }));
      splats.push(splatAt(x, y, color, scale));
    },
    sparkle(x, y) {
      burst(particles, x, y, 30, (i) => ({
        color: `hsl(${(i * 37) % 360} 100% 65%)`,
        size: rand(3, 6),
        life: rand(0.5, 0.9),
        max: 0.9
      }));
    },
    boom(x, y) {
      flash = 1;
      shake = 0.45;
      burst(particles, x, y, 40, (i) => ({
        color: i % 3 ? "#ff9f1c" : "#ffe66d",
        size: rand(4, 9),
        life: rand(0.4, 0.8),
        max: 0.8
      }));
    },
    text(x, y, label, color, size = 34) {
      texts.push({ x, y, vx: 0, vy: -55, label, color, size, life: 1, max: 1 });
    },
    update(dt) {
      particles = step(particles, dt, GRAVITY);
      texts = step(texts, dt, 0);
      splats = splats.filter((s) => (s.life -= dt) > 0);
      flash = Math.max(0, flash - dt * 2.5);
      shake = Math.max(0, shake - dt);
    },
    shakeOffset() {
      const amount = shake * 22;
      return { x: rand(-amount, amount), y: rand(-amount, amount) };
    },
    drawBack(ctx) {
      drawSplats(ctx, splats);
    },
    drawFront(ctx, size) {
      drawParticles(ctx, particles);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      texts.forEach((t) => drawText(ctx, t));
      ctx.globalAlpha = flash * 0.8;
      ctx.fillStyle = "#ffffff";
      if (flash > 0) ctx.fillRect(0, 0, size.w, size.h);
      ctx.globalAlpha = 1;
    },
    clear() {
      particles = [];
      splats = [];
      texts = [];
      flash = 0;
      shake = 0;
    }
  };
}
