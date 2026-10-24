// Particles, rings and floating score labels. Positions are in grid cells so
// they survive a resize; draw() converts them to pixels.
const GRAVITY = 9;

export function createEffects(random = Math.random) {
  let particles = [];
  let rings = [];
  let texts = [];

  function burst(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      const angle = random() * Math.PI * 2;
      const power = 1.5 + random() * 3.5;
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * power,
        vy: Math.sin(angle) * power - 2,
        life: 0.5 + random() * 0.5,
        size: 0.05 + random() * 0.07,
        color
      });
    }
  }

  function update(dt) {
    particles.forEach((p) => {
      p.vy += GRAVITY * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
    });
    rings.forEach((r) => (r.age += dt));
    texts.forEach((t) => (t.age += dt));
    particles = particles.filter((p) => p.life > 0);
    rings = rings.filter((r) => r.age < r.max);
    texts = texts.filter((t) => t.age < t.max);
  }

  function drawParticles(ctx, ox, oy, c) {
    particles.forEach((p) => {
      ctx.globalAlpha = Math.min(1, p.life * 2);
      ctx.fillStyle = p.color;
      const s = p.size * c;
      ctx.fillRect(ox + p.x * c - s / 2, oy + p.y * c - s / 2, s, s);
    });
  }

  function drawRings(ctx, ox, oy, c) {
    rings.forEach((r) => {
      const t = r.age / r.max;
      ctx.globalAlpha = 1 - t;
      ctx.strokeStyle = r.color;
      ctx.lineWidth = Math.max(2, c * 0.08 * (1 - t));
      ctx.beginPath();
      ctx.arc(ox + r.x * c, oy + r.y * c, c * (0.3 + t * 1.2), 0, Math.PI * 2);
      ctx.stroke();
    });
  }

  function drawTexts(ctx, ox, oy, c) {
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `800 ${Math.round(c * 0.34)}px system-ui, sans-serif`;
    ctx.lineWidth = Math.max(2, c * 0.07);
    ctx.strokeStyle = "#10141c";
    texts.forEach((t) => {
      const k = t.age / t.max;
      const px = ox + t.x * c;
      const py = oy + (t.y - k * 0.8) * c;
      ctx.globalAlpha = 1 - k * k;
      ctx.strokeText(t.label, px, py);
      ctx.fillStyle = t.color;
      ctx.fillText(t.label, px, py);
    });
  }

  function draw(ctx, ox, oy, c) {
    ctx.save();
    drawParticles(ctx, ox, oy, c);
    drawRings(ctx, ox, oy, c);
    drawTexts(ctx, ox, oy, c);
    ctx.restore();
  }

  return {
    burst,
    ring: (x, y, color) => rings.push({ x, y, color, age: 0, max: 0.6 }),
    text: (x, y, label, color) =>
      texts.push({ x, y, label, color, age: 0, max: 1.1 }),
    update,
    draw
  };
}
