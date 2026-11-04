// The playfield: 10 columns, 20 visible rows plus 2 hidden rows on top
// (row 0 is the top). A cell is 0 (empty) or the piece type index + 1.
import { CELLS, TYPES } from "./pieces.js";

export const COLS = 10;
export const VISIBLE_ROWS = 20;
export const HIDDEN = 2;
export const ROWS = VISIBLE_ROWS + HIDDEN;

export const emptyGrid = () =>
  Array.from({ length: ROWS }, () => Array(COLS).fill(0));

// True when a cell is a wall, the floor or a locked block.
export function filled(grid, x, y) {
  if (x < 0 || x >= COLS || y >= ROWS) return true;
  return y >= 0 && grid[y][x] !== 0;
}

export function collides(grid, type, rot, x, y) {
  return CELLS[type][rot].some(([c, r]) => filled(grid, x + c, y + r));
}

export function place(grid, piece) {
  const value = TYPES.indexOf(piece.type) + 1;
  CELLS[piece.type][piece.rot].forEach(([c, r]) => {
    const y = piece.y + r;
    if (y >= 0) grid[y][piece.x + c] = value;
  });
}

// Removes the full rows in place and returns how many there were.
export function clearFull(grid) {
  const kept = grid.filter((row) => row.some((v) => v === 0));
  const cleared = ROWS - kept.length;
  const fresh = Array.from({ length: cleared }, () => Array(COLS).fill(0));
  grid.splice(0, ROWS, ...fresh, ...kept);
  return cleared;
}
