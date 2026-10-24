// Logical grid: one byte per cell, the outer ring is a solid border.
// `solid` counts interior cells turned solid, `version` changes whenever a
// cell becomes solid (render cache key), `glow` fades captured cells.
import { BORDER } from "./levels.js";

export const EMPTY = 0;
export const SOLID = 1;
export const GROW_1 = 2;
export const GROW_2 = 3;

export function createGrid(innerCols, innerRows) {
  const cols = innerCols + 2 * BORDER;
  const rows = innerRows + 2 * BORDER;
  const cells = new Uint8Array(cols * rows);
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const edge =
        x < BORDER || y < BORDER || x >= cols - BORDER || y >= rows - BORDER;
      if (edge) cells[y * cols + x] = SOLID;
    }
  }
  return {
    cols,
    rows,
    cells,
    interior: innerCols * innerRows,
    solid: 0,
    version: 0,
    glow: new Float32Array(cols * rows)
  };
}

export function cellAt(grid, x, y) {
  if (x < 0 || y < 0 || x >= grid.cols || y >= grid.rows) return SOLID;
  return grid.cells[y * grid.cols + x];
}

export const conqueredPercent = (grid) => (grid.solid / grid.interior) * 100;

export function solidify(grid, indices) {
  indices.forEach((index) => {
    if (grid.cells[index] === SOLID) return;
    grid.cells[index] = SOLID;
    grid.glow[index] = 1;
    grid.solid += 1;
  });
  if (indices.length) grid.version += 1;
}

// Multi-source BFS from every ball cell through all non-solid cells
// (growing walls included: they may still break). Every EMPTY cell no ball
// can reach is returned, to be solidified by the caller.
export function unreachedCells(grid, sources) {
  const { cols, cells } = grid;
  const reached = new Uint8Array(cells.length);
  const queue = new Int32Array(cells.length);
  let head = 0;
  let tail = 0;
  const visit = (index) => {
    if (reached[index] || cells[index] === SOLID) return;
    reached[index] = 1;
    queue[tail++] = index;
  };
  sources.forEach(visit);
  while (head < tail) {
    const index = queue[head++];
    visit(index - 1);
    visit(index + 1);
    visit(index - cols);
    visit(index + cols);
  }
  const unreached = [];
  for (let i = 0; i < cells.length; i++) {
    if (cells[i] === EMPTY && !reached[i]) unreached.push(i);
  }
  return unreached;
}

export function fadeGlow(grid, dt) {
  const { glow } = grid;
  for (let i = 0; i < glow.length; i++) {
    if (glow[i] > 0) glow[i] = Math.max(0, glow[i] - dt * 1.8);
  }
}
