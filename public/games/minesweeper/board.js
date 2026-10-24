// Minefield model: flat typed arrays indexed by row * cols + col. Pure logic,
// no DOM. Mines are placed on the first reveal so the first click is safe.
export const HIDDEN = 0;
export const FLAGGED = 1;
export const OPEN = 2;

export function createBoard({ rows, cols, mines }) {
  const size = rows * cols;
  return {
    rows,
    cols,
    mines,
    mine: new Uint8Array(size),
    adjacent: new Uint8Array(size),
    state: new Uint8Array(size),
    placed: false,
    opened: 0,
    flags: 0,
    exploded: -1
  };
}

export function neighbors(board, index) {
  const { rows, cols } = board;
  const row = Math.floor(index / cols);
  const col = index % cols;
  const result = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      const r = row + dr;
      const c = col + dc;
      if ((dr || dc) && r >= 0 && r < rows && c >= 0 && c < cols) {
        result.push(r * cols + c);
      }
    }
  }
  return result;
}

// Keeps the first cell and, when the field is big enough, its neighbours
// mine-free so the first reveal always opens an area.
function safeZone(board, first) {
  const zone = [first, ...neighbors(board, first)];
  return board.rows * board.cols - zone.length >= board.mines
    ? new Set(zone)
    : new Set([first]);
}

export function placeMines(board, first, random = Math.random) {
  const safe = safeZone(board, first);
  const pool = [];
  for (let i = 0; i < board.mine.length; i++) {
    if (!safe.has(i)) pool.push(i);
  }
  for (let n = 0; n < board.mines; n++) {
    const pick = n + Math.floor(random() * (pool.length - n));
    [pool[n], pool[pick]] = [pool[pick], pool[n]];
    board.mine[pool[n]] = 1;
  }
  for (let i = 0; i < board.mine.length; i++) {
    board.adjacent[i] = neighbors(board, i).filter((j) => board.mine[j]).length;
  }
  board.placed = true;
}

function open(board, index, changed) {
  board.state[index] = OPEN;
  board.opened++;
  changed.push(index);
}

// Opens one cell; a zero opens its whole connected empty area. Returns the
// indices that changed. Hitting a mine sets `exploded`.
export function reveal(board, index, changed = []) {
  if (board.state[index] !== HIDDEN || board.exploded >= 0) return changed;
  if (!board.placed) placeMines(board, index);
  if (board.mine[index]) {
    board.exploded = index;
    board.state[index] = OPEN;
    changed.push(index);
    return changed;
  }
  const stack = [index];
  open(board, index, changed);
  while (stack.length) {
    const current = stack.pop();
    if (board.adjacent[current]) continue;
    for (const next of neighbors(board, current)) {
      if (board.state[next] !== HIDDEN) continue;
      open(board, next, changed);
      stack.push(next);
    }
  }
  return changed;
}

// Clicking an open number whose flag count matches it opens every other
// hidden neighbour (wrong flags can therefore cost the game).
export function chord(board, index) {
  const changed = [];
  if (board.state[index] !== OPEN || !board.adjacent[index]) return changed;
  const around = neighbors(board, index);
  const flags = around.filter((j) => board.state[j] === FLAGGED).length;
  if (flags !== board.adjacent[index]) return changed;
  around.forEach((j) => reveal(board, j, changed));
  return changed;
}

export function toggleFlag(board, index) {
  const current = board.state[index];
  if (current === OPEN) return false;
  board.state[index] = current === FLAGGED ? HIDDEN : FLAGGED;
  board.flags += current === FLAGGED ? -1 : 1;
  return true;
}

export function isWon(board) {
  return (
    board.exploded < 0 && board.opened === board.rows * board.cols - board.mines
  );
}

export const minesLeft = (board) => board.mines - board.flags;
