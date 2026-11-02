// Draws one fruit centred on (0, 0) with radius r: shaded body, skin
// pattern, top decoration (leaves, stem, crown) and a smiling face.
// Decorations reach up to TOP_REACH × r above the centre.
export const TOP_REACH = 1.45;

const LEAF = "#5cbf3a";
const LEAF_DARK = "#3a8f24";
const STEM = "#8a5a2b";
const INK = "#3b2a2f";
const CHEEK = "rgba(255, 120, 140, 0.45)";

function body(ctx, fruit, r) {
  const shade = ctx.createRadialGradient(
    -r * 0.35,
    -r * 0.4,
    r * 0.1,
    0,
    0,
    r * 1.05
  );
  shade.addColorStop(0, fruit.light);
  shade.addColorStop(0.45, fruit.body);
  shade.addColorStop(1, fruit.dark);
  ctx.fillStyle = shade;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
}

function dotsGrid(ctx, r, step, draw) {
  for (let y = -r; y <= r; y += step) {
    const shift = Math.round(y / step) % 2 ? step / 2 : 0;
    for (let x = -r - step; x <= r; x += step) draw(x + shift, y);
  }
}

function seeds(ctx, r) {
  ctx.fillStyle = "#ffe48a";
  dotsGrid(ctx, r, r * 0.42, (x, y) => {
    ctx.beginPath();
    ctx.ellipse(x, y, r * 0.05, r * 0.08, 0, 0, Math.PI * 2);
    ctx.fill();
  });
}

function bumps(ctx, fruit, r) {
  ctx.strokeStyle = fruit.dark;
  ctx.lineWidth = r * 0.05;
  ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
  dotsGrid(ctx, r, r * 0.38, (x, y) => {
    ctx.beginPath();
    ctx.arc(x, y, r * 0.17, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  });
}

function pores(ctx, fruit, r) {
  ctx.fillStyle = fruit.dark;
  ctx.globalAlpha = 0.35;
  dotsGrid(ctx, r, r * 0.28, (x, y) => {
    ctx.beginPath();
    ctx.arc(x, y, r * 0.025, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
}

function crossLines(ctx, r, step, slope) {
  for (let i = -3 * r; i <= 3 * r; i += step) {
    ctx.beginPath();
    ctx.moveTo(i - r * 2 * slope, -r * 2);
    ctx.lineTo(i + r * 2 * slope, r * 2);
    ctx.stroke();
  }
}

function grid(ctx, fruit, r) {
  ctx.strokeStyle = fruit.dark;
  ctx.lineWidth = r * 0.035;
  crossLines(ctx, r, r * 0.36, 0.8);
  crossLines(ctx, r, r * 0.36, -0.8);
}

function net(ctx, r) {
  ctx.strokeStyle = "rgba(255, 255, 240, 0.75)";
  ctx.lineWidth = r * 0.03;
  for (let i = -4; i <= 4; i++) {
    ctx.beginPath();
    for (let y = -r; y <= r; y += r * 0.2) {
      const x = i * r * 0.26 + Math.sin(y * 9 + i) * r * 0.06;
      ctx.lineTo(x + y * 0.25, y);
    }
    ctx.stroke();
    ctx.beginPath();
    for (let x = -r; x <= r; x += r * 0.2) {
      ctx.lineTo(x, i * r * 0.26 + Math.cos(x * 8 + i) * r * 0.06);
    }
    ctx.stroke();
  }
}

function stripes(ctx, fruit, r) {
  ctx.strokeStyle = fruit.dark;
  ctx.lineWidth = r * 0.13;
  ctx.lineJoin = "round";
  for (let i = -3; i <= 3; i++) {
    ctx.beginPath();
    for (let y = -r; y <= r; y += r * 0.16) {
      const zig = (Math.round(y / (r * 0.16)) % 2) * r * 0.07;
      ctx.lineTo(i * r * 0.32 + zig, y);
    }
    ctx.stroke();
  }
}

const PATTERNS = {
  seeds: (ctx, fruit, r) => seeds(ctx, r),
  bumps,
  dots: pores,
  grid,
  net: (ctx, fruit, r) => net(ctx, r),
  stripes
};

function pattern(ctx, fruit, r) {
  const draw = PATTERNS[fruit.pattern];
  if (!draw) return;
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.98, 0, Math.PI * 2);
  ctx.clip();
  draw(ctx, fruit, r);
  ctx.restore();
}

function leaf(ctx, x, y, length, width, angle) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = LEAF;
  ctx.strokeStyle = LEAF_DARK;
  ctx.lineWidth = width * 0.18;
  ctx.beginPath();
  ctx.ellipse(length / 2, 0, length / 2, width / 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function stem(ctx, r) {
  ctx.strokeStyle = STEM;
  ctx.lineCap = "round";
  ctx.lineWidth = r * 0.1;
  ctx.beginPath();
  ctx.moveTo(0, -r * 0.85);
  ctx.quadraticCurveTo(r * 0.02, -r * 1.1, r * 0.12, -r * 1.22);
  ctx.stroke();
}

function star(ctx, cx, cy, outer, inner, points) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const radius = i % 2 ? inner : outer;
    const a = (i * Math.PI) / points - Math.PI / 2;
    ctx.lineTo(cx + Math.cos(a) * radius, cy + Math.sin(a) * radius);
  }
  ctx.closePath();
}

function crown(ctx, fruit, r) {
  ctx.fillStyle = fruit.dark;
  star(ctx, 0, -r * 0.78, r * 0.22, r * 0.1, 5);
  ctx.fill();
}

function leaves(ctx, r) {
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i - 2) * 0.55;
    leaf(ctx, 0, -r * 0.86, r * 0.42, r * 0.2, a + Math.PI);
    leaf(ctx, 0, -r * 0.86, r * 0.42, r * 0.2, a);
  }
}

function crownLeaves(ctx, r) {
  [-0.5, -0.2, 0.2, 0.5, 0].forEach((tilt, i) => {
    const length = i === 4 ? r * 0.62 : r * 0.5;
    leaf(ctx, 0, -r * 0.82, length, r * 0.2, -Math.PI / 2 + tilt);
  });
}

const TOPS = {
  crown,
  leaves: (ctx, fruit, r) => leaves(ctx, r),
  leaf: (ctx, fruit, r) =>
    leaf(ctx, r * 0.05, -r * 0.9, r * 0.45, r * 0.24, -0.5),
  stem: (ctx, fruit, r) => stem(ctx, r),
  stemLeaf: (ctx, fruit, r) => {
    stem(ctx, r);
    leaf(ctx, r * 0.1, -r * 1.05, r * 0.42, r * 0.22, -0.35);
  },
  crownLeaves: (ctx, fruit, r) => crownLeaves(ctx, r)
};

function eye(ctx, x, y, r, closed) {
  if (closed) {
    ctx.beginPath();
    ctx.arc(x, y + r * 0.04, r * 0.09, Math.PI * 1.1, Math.PI * 1.9);
    ctx.stroke();
    return;
  }
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.ellipse(x, y, r * 0.075, r * 0.1, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(x - r * 0.025, y - r * 0.035, r * 0.03, 0, Math.PI * 2);
  ctx.fill();
}

function face(ctx, fruit, r) {
  ctx.strokeStyle = INK;
  ctx.lineCap = "round";
  ctx.lineWidth = r * 0.055;
  eye(ctx, -r * 0.3, 0, r, false);
  eye(ctx, r * 0.3, 0, r, fruit.wink);
  ctx.beginPath();
  ctx.arc(0, r * 0.1, r * 0.14, Math.PI * 0.15, Math.PI * 0.85);
  ctx.stroke();
  ctx.fillStyle = CHEEK;
  [-1, 1].forEach((side) => {
    ctx.beginPath();
    ctx.ellipse(side * r * 0.5, r * 0.2, r * 0.11, r * 0.07, 0, 0, Math.PI * 2);
    ctx.fill();
  });
}

function shine(ctx, r) {
  ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
  ctx.beginPath();
  ctx.ellipse(-r * 0.45, -r * 0.5, r * 0.16, r * 0.09, -0.7, 0, Math.PI * 2);
  ctx.fill();
}

export function drawFruit(ctx, fruit, r) {
  body(ctx, fruit, r);
  pattern(ctx, fruit, r);
  TOPS[fruit.top]?.(ctx, fruit, r);
  shine(ctx, r);
  face(ctx, fruit, r);
}
