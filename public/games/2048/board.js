// Pure 2048 rules on a 4×4 grid: cells[row * SIZE + col] is a tile
// { id, value } or null. Tiles are never mutated, so an older cells array
// stays valid (undo, animations).
export const SIZE = 4;
export const GOAL = 2048;
export const MAX_VALUE = 2 ** 17;
const FOUR_CHANCE = 0.1;

let nextId = 1;
const newTile = (value) => ({ id: nextId++, value });

export const emptyCells = () => Array(SIZE * SIZE).fill(null);

// Cell index of the k-th cell of a line, counted from the side the tiles
// move towards.
const AT = {
  left: (line, k) => line * SIZE + k,
  right: (line, k) => line * SIZE + SIZE - 1 - k,
  up: (line, k) => k * SIZE + line,
  down: (line, k) => (SIZE - 1 - k) * SIZE + line
};

function slideLine(cells, indices, out) {
  let slot = 0;
  let open = null;
  for (const from of indices) {
    const tile = cells[from];
    if (!tile) continue;
    if (open && open.tile.value === tile.value) {
      const merged = { id: open.tile.id, value: tile.value * 2 };
      out.cells[open.at] = merged;
      out.merged.push(merged.id);
      out.absorbed.push({ id: tile.id, at: open.at });
      out.gained += merged.value;
      out.top = Math.max(out.top, merged.value);
      out.moved = true;
      open = null;
      continue;
    }
    const at = indices[slot++];
    out.cells[at] = tile;
    if (at !== from) out.moved = true;
    open = { at, tile };
  }
}

// Slides every line towards `dir`; each tile merges at most once per move.
export function move(cells, dir) {
  const out = {
    cells: emptyCells(),
    moved: false,
    gained: 0,
    top: 0,
    merged: [],
    absorbed: []
  };
  for (let line = 0; line < SIZE; line++) {
    const indices = Array.from({ length: SIZE }, (_, k) => AT[dir](line, k));
    slideLine(cells, indices, out);
  }
  return out;
}

// Places a 2 (sometimes a 4) on a random empty cell; returns its index or -1.
export function spawn(cells, random = Math.random) {
  const free = cells.flatMap((tile, index) => (tile ? [] : [index]));
  if (free.length === 0) return -1;
  const index = free[Math.floor(random() * free.length)];
  cells[index] = newTile(random() < FOUR_CHANCE ? 4 : 2);
  return index;
}

export function canMove(cells) {
  return cells.some((tile, index) => {
    if (!tile) return true;
    const right = index % SIZE < SIZE - 1 ? cells[index + 1] : null;
    const below = cells[index + SIZE] ?? null;
    return right?.value === tile.value || below?.value === tile.value;
  });
}

export const maxValue = (cells) =>
  cells.reduce((top, tile) => Math.max(top, tile?.value ?? 0), 0);

export const toValues = (cells) => cells.map((tile) => tile?.value ?? 0);

export const fromValues = (values) =>
  values.map((value) => (value ? newTile(value) : null));
