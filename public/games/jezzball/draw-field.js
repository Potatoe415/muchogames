// Static field (free tiles, conquered area, border) painted into an
// off-screen canvas and only repainted when the grid or the layout changes.
import { SOLID } from "./grid.js";
import { BORDER } from "./levels.js";

const TILE = { face: "#b9c1cd", light: "#e4e8ee", dark: "#8892a1" };
const CONQUERED = { face: "#0c111b", line: "#151c2a" };
const EDGE = { face: "#05070c", line: "#2a3550" };

// Cells are painted in device pixels; box = { x, y, w, h, bevel, line }.
function paintTile(ctx, box) {
  const { x, y, w, h, bevel: b } = box;
  ctx.fillStyle = TILE.dark;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = TILE.light;
  ctx.fillRect(x, y, w - b, h - b);
  ctx.fillStyle = TILE.face;
  ctx.fillRect(x + b, y + b, w - 2 * b, h - 2 * b);
}

function paintSolid(ctx, box, edge) {
  const { x, y, w, h, line } = box;
  const skin = edge ? EDGE : CONQUERED;
  ctx.fillStyle = skin.face;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = skin.line;
  ctx.fillRect(x, y, w, line);
  ctx.fillRect(x, y, line, h);
}

const isEdge = (grid, x, y) =>
  x < BORDER ||
  y < BORDER ||
  x >= grid.cols - BORDER ||
  y >= grid.rows - BORDER;

// The cell size is fractional: each cell edge is rounded to a device pixel,
// so neighbouring cells never leave a seam.
function paint(cache, grid, layout) {
  const { cell, dpr } = layout;
  const edge = (i) => Math.round(i * cell * dpr);
  cache.width = edge(grid.cols);
  cache.height = edge(grid.rows);
  const ctx = cache.getContext("2d");
  const bevel = Math.max(1, Math.round(cell * dpr * 0.1));
  const line = Math.max(1, Math.round(dpr));
  for (let y = 0; y < grid.rows; y++) {
    for (let x = 0; x < grid.cols; x++) {
      const [x0, y0] = [edge(x), edge(y)];
      const box = { x: x0, y: y0, w: edge(x + 1) - x0, h: edge(y + 1) - y0 };
      Object.assign(box, { bevel, line });
      const kind = grid.cells[y * grid.cols + x];
      if (kind === SOLID) paintSolid(ctx, box, isEdge(grid, x, y));
      else paintTile(ctx, box);
    }
  }
}

// Growing walls are painted as free tiles here: they are drawn live on top.
export function createFieldCache() {
  const cache = document.createElement("canvas");
  let key = "";
  let painted = null;
  return {
    draw(ctx, grid, layout) {
      const next = `${grid.version}|${layout.cell}|${layout.dpr}`;
      if (next !== key || painted !== grid) {
        key = next;
        painted = grid;
        paint(cache, grid, layout);
      }
      const { x, y } = layout.grid;
      const { dpr } = layout;
      ctx.drawImage(cache, x, y, cache.width / dpr, cache.height / dpr);
    },
    release() {
      painted = null;
      cache.width = 0;
      cache.height = 0;
    }
  };
}
