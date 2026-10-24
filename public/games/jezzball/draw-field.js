// Static field (free tiles, conquered area, border) painted into an
// off-screen canvas and only repainted when the grid or the layout changes.
import { SOLID } from "./grid.js";
import { BORDER } from "./levels.js";

const TILE = { face: "#b9c1cd", light: "#e4e8ee", dark: "#8892a1" };
const CONQUERED = { face: "#0c111b", line: "#151c2a" };
const EDGE = { face: "#05070c", line: "#2a3550" };

function paintTile(ctx, x, y, c) {
  const b = Math.max(1, Math.round(c * 0.1));
  ctx.fillStyle = TILE.dark;
  ctx.fillRect(x, y, c, c);
  ctx.fillStyle = TILE.light;
  ctx.fillRect(x, y, c - b, c - b);
  ctx.fillStyle = TILE.face;
  ctx.fillRect(x + b, y + b, c - 2 * b, c - 2 * b);
}

function paintSolid(ctx, x, y, c, edge) {
  const skin = edge ? EDGE : CONQUERED;
  ctx.fillStyle = skin.face;
  ctx.fillRect(x, y, c, c);
  ctx.fillStyle = skin.line;
  ctx.fillRect(x, y, c, 1);
  ctx.fillRect(x, y, 1, c);
}

const isEdge = (grid, x, y) =>
  x < BORDER ||
  y < BORDER ||
  x >= grid.cols - BORDER ||
  y >= grid.rows - BORDER;

function paint(cache, grid, layout) {
  const { cell: c, dpr } = layout;
  cache.width = Math.round(grid.cols * c * dpr);
  cache.height = Math.round(grid.rows * c * dpr);
  const ctx = cache.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  for (let y = 0; y < grid.rows; y++) {
    for (let x = 0; x < grid.cols; x++) {
      const kind = grid.cells[y * grid.cols + x];
      if (kind === SOLID) paintSolid(ctx, x * c, y * c, c, isEdge(grid, x, y));
      else paintTile(ctx, x * c, y * c, c);
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
      const c = layout.cell;
      ctx.drawImage(cache, x, y, grid.cols * c, grid.rows * c);
    },
    release() {
      painted = null;
      cache.width = 0;
      cache.height = 0;
    }
  };
}
