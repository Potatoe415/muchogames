// Canvas drawing of one tile: bevelled base, metal pipes with relief,
// animated flooz, the start reservoir and rocks. Geometry is in tile units
// (0..1) and scaled by the cell size `c`.
import { E, PIECES, S, opposite } from "./pieces.js";

const EDGE = [
  [0.5, 0],
  [1, 0.5],
  [0.5, 1],
  [0, 0.5]
];
const CENTER = [0.5, 0.5];
const ARC_STEPS = 12;
const FLOOZ = "#3fd94a";
const FLOOZ_LIGHT = "#c3ff9e";
const pathCache = new Map();

function arcPoints(a, b) {
  const cx = a === E || b === E ? 1 : 0;
  const cy = a === S || b === S ? 1 : 0;
  const from = Math.atan2(EDGE[a][1] - cy, EDGE[a][0] - cx);
  let delta = Math.atan2(EDGE[b][1] - cy, EDGE[b][0] - cx) - from;
  if (delta > Math.PI) delta -= Math.PI * 2;
  if (delta < -Math.PI) delta += Math.PI * 2;
  return Array.from({ length: ARC_STEPS + 1 }, (_, i) => {
    const angle = from + (delta * i) / ARC_STEPS;
    return [cx + Math.cos(angle) * 0.5, cy + Math.sin(angle) * 0.5];
  });
}

// Points from edge `a` to edge `b`; a = -1 starts at the tile centre.
function linkPoints(a, b) {
  const key = `${a}:${b}`;
  if (!pathCache.has(key)) {
    let points;
    if (a < 0) points = [CENTER, EDGE[b]];
    else if (b === opposite(a)) points = [EDGE[a], EDGE[b]];
    else points = arcPoints(a, b);
    pathCache.set(key, points);
  }
  return pathCache.get(key);
}

function slicePoints(points, t) {
  if (t >= 1) return points;
  const lengths = points.slice(1).map((p, i) => {
    const q = points[i];
    return Math.hypot(p[0] - q[0], p[1] - q[1]);
  });
  let left = lengths.reduce((sum, l) => sum + l, 0) * t;
  const out = [points[0]];
  for (let i = 0; i < lengths.length && left > 0; i++) {
    const k = Math.min(1, left / lengths[i]);
    const [ax, ay] = points[i];
    const [bx, by] = points[i + 1];
    out.push([ax + (bx - ax) * k, ay + (by - ay) * k]);
    left -= lengths[i];
  }
  return out;
}

function stroke(ctx, points, box, width, color, shift = 0) {
  const { x, y, c } = box;
  ctx.beginPath();
  points.forEach(([px, py], i) => {
    const sx = x + (px + shift) * c;
    const sy = y + (py + shift) * c;
    if (i === 0) ctx.moveTo(sx, sy);
    else ctx.lineTo(sx, sy);
  });
  ctx.lineWidth = width * box.c;
  ctx.strokeStyle = color;
  ctx.stroke();
}

function drawFlange(ctx, dir, box) {
  const { x, y, c } = box;
  const long = 0.56;
  const thin = 0.09;
  const along = (1 - long) / 2;
  const horizontal = dir % 2 === 0;
  const fx = horizontal ? along : dir === E ? 1 - thin : 0;
  const fy = horizontal ? (dir === S ? 1 - thin : 0) : along;
  const w = horizontal ? long : thin;
  const h = horizontal ? thin : long;
  ctx.fillStyle = "#11151c";
  ctx.fillRect(x + fx * c, y + fy * c, w * c, h * c);
  ctx.fillStyle = "#56627a";
  ctx.fillRect(
    x + (fx + 0.02) * c,
    y + (fy + 0.02) * c,
    (w - 0.04) * c,
    (h - 0.04) * c
  );
}

function drawTube(ctx, a, b, box) {
  const points = linkPoints(a, b);
  stroke(ctx, points, box, 0.5, "#11151c");
  stroke(ctx, points, box, 0.42, "#5f6c80");
  stroke(ctx, points, box, 0.26, "#d3dce8", -0.035);
  stroke(ctx, points, box, 0.26, "#8794a8");
  stroke(ctx, points, box, 0.17, "#1a2029");
  [a, b].filter((dir) => dir >= 0).forEach((dir) => drawFlange(ctx, dir, box));
}

function drawFlooz(ctx, fill, exit, box, time) {
  if (!fill || fill.progress <= 0) return;
  const points = slicePoints(linkPoints(fill.entry, exit), fill.progress);
  stroke(ctx, points, box, 0.17, FLOOZ);
  ctx.save();
  ctx.setLineDash([box.c * 0.1, box.c * 0.18]);
  ctx.lineDashOffset = -time * box.c * 0.9;
  stroke(ctx, points, box, 0.06, FLOOZ_LIGHT);
  ctx.restore();
  if (fill.progress < 1) {
    const [hx, hy] = points[points.length - 1];
    ctx.fillStyle = FLOOZ_LIGHT;
    ctx.beginPath();
    ctx.arc(
      box.x + hx * box.c,
      box.y + hy * box.c,
      box.c * 0.07,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }
}

export function drawTileBase(ctx, box, dark = false) {
  const { x, y, c } = box;
  const b = Math.max(1, Math.round(c * 0.06));
  ctx.fillStyle = dark ? "#6c7380" : "#a7aeb9";
  ctx.fillRect(x, y, c, c);
  ctx.fillStyle = dark ? "#8b929e" : "#dfe3e9";
  ctx.fillRect(x, y, c, b);
  ctx.fillRect(x, y, b, c);
  ctx.fillStyle = dark ? "#474d57" : "#717884";
  ctx.fillRect(x, y + c - b, c, b);
  ctx.fillRect(x + c - b, y, b, c);
}

// Cross: vertical channel first so the horizontal one bridges over it.
export function drawPipe(ctx, type, fills, box, time) {
  const links = PIECES[type].links;
  const order = links.length > 1 ? [1, 0] : [0];
  ctx.lineCap = "butt";
  ctx.lineJoin = "round";
  order.forEach((i) => {
    const [a, b] = links[i];
    drawTube(ctx, a, b, box);
    const fill = fills?.[i];
    if (fill) drawFlooz(ctx, fill, fill.entry === a ? b : a, box, time);
  });
}

function drawReservoir(ctx, box, gauge) {
  const { x, y, c } = box;
  const r = c * 0.3;
  const cx = x + c / 2;
  const cy = y + c / 2;
  ctx.fillStyle = "#11151c";
  ctx.beginPath();
  ctx.arc(cx, cy, r + c * 0.04, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#1a2029";
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.fillStyle = FLOOZ;
  ctx.fillRect(cx - r, cy + r - 2 * r * gauge, 2 * r, 2 * r * gauge);
  ctx.restore();
  ctx.strokeStyle = "#d3dce8";
  ctx.lineWidth = c * 0.05;
  ctx.beginPath();
  ctx.arc(cx, cy, r - c * 0.02, Math.PI * 0.9, Math.PI * 1.6);
  ctx.stroke();
}

export function drawStart(ctx, cell, box, gauge, time) {
  ctx.lineCap = "butt";
  ctx.lineJoin = "round";
  drawTube(ctx, -1, cell.dir, box);
  drawFlooz(ctx, cell.fills[0], cell.dir, box, time);
  drawReservoir(ctx, box, gauge);
}

function seeded(seed) {
  let s = Math.floor(seed * 2147483646) + 1;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
}

export function drawRock(ctx, seed, box) {
  const { x, y, c } = box;
  const rand = seeded(seed);
  const points = Array.from({ length: 8 }, (_, i) => {
    const angle = (i / 8) * Math.PI * 2 + rand() * 0.4;
    const radius = c * (0.3 + rand() * 0.12);
    return [
      x + c / 2 + Math.cos(angle) * radius,
      y + c / 2 + Math.sin(angle) * radius
    ];
  });
  ctx.beginPath();
  points.forEach(([px, py], i) =>
    i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)
  );
  ctx.closePath();
  ctx.fillStyle = "#6e5f4f";
  ctx.fill();
  ctx.lineWidth = Math.max(1.5, c * 0.05);
  ctx.strokeStyle = "#2a231c";
  ctx.stroke();
  ctx.fillStyle = "rgba(255, 236, 210, 0.28)";
  ctx.beginPath();
  ctx.ellipse(
    x + c * 0.42,
    y + c * 0.38,
    c * 0.14,
    c * 0.08,
    -0.6,
    0,
    Math.PI * 2
  );
  ctx.fill();
}
