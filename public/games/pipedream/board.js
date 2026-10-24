// Grid state: start tile, rocks, and what a tap may do on a cell.
import { DX, DY, PIECES, channelFor } from "./pieces.js";

const ROCK_ATTEMPTS = 25;
const QUOTA_MARGIN = 6;

const inBounds = (cols, rows, x, y) => x >= 0 && y >= 0 && x < cols && y < rows;

export function cellAt(board, x, y) {
  return inBounds(board.cols, board.rows, x, y)
    ? board.cells[y * board.cols + x]
    : null;
}

export function pipeCell(type) {
  const fills = PIECES[type].links.map(() => null);
  return { kind: "pipe", type, fills, lock: 0, prevType: null };
}

export const isUnused = (cell) =>
  cell.kind === "pipe" && cell.fills.every((fill) => !fill);

// "place" on an empty cell, "replace" on an idle pipe the flooz has not
// reached, null on rocks, the start tile, filled or locked pipes.
export function placementFor(cell) {
  if (!cell) return null;
  if (cell.kind === "empty") return "place";
  if (isUnused(cell) && cell.lock <= 0) return "replace";
  return null;
}

// Channel the flooz can enter from `entry`, or -1 (overflow).
export function openChannel(cell, entry) {
  if (!cell || cell.kind !== "pipe" || cell.lock > 0) return -1;
  const channel = channelFor(cell.type, entry);
  return channel >= 0 && !cell.fills[channel] ? channel : -1;
}

export function tickLocks(board, dt) {
  board.cells.forEach((cell) => {
    if (cell.kind === "pipe" && cell.lock > 0) {
      cell.lock = Math.max(0, cell.lock - dt);
    }
  });
}

// Never on an edge, and its outlet always faces at least two free cells.
function pickStart(cols, rows, random) {
  const options = [];
  for (let y = 1; y < rows - 1; y++) {
    for (let x = 1; x < cols - 1; x++) {
      for (let dir = 0; dir < 4; dir++) {
        const ahead = inBounds(cols, rows, x + 2 * DX[dir], y + 2 * DY[dir]);
        if (ahead) options.push({ x, y, dir });
      }
    }
  }
  return options[Math.floor(random() * options.length)];
}

function protectedCells(board) {
  const { x, y, dir } = board.start;
  return new Set(
    [0, 1, 2].map((k) => (y + k * DY[dir]) * board.cols + x + k * DX[dir])
  );
}

function reachableFromOutlet(board) {
  const { x, y, dir } = board.start;
  const first = (y + DY[dir]) * board.cols + x + DX[dir];
  const seen = new Set([first]);
  const stack = [first];
  while (stack.length) {
    const index = stack.pop();
    const cx = index % board.cols;
    const cy = Math.floor(index / board.cols);
    for (let d = 0; d < 4; d++) {
      const next = cellAt(board, cx + DX[d], cy + DY[d]);
      const nextIndex = (cy + DY[d]) * board.cols + cx + DX[d];
      if (next?.kind === "empty" && !seen.has(nextIndex)) {
        seen.add(nextIndex);
        stack.push(nextIndex);
      }
    }
  }
  return seen.size;
}

function scatterRocks(board, count, random) {
  const keep = protectedCells(board);
  const free = board.cells
    .map((cell, index) => (cell.kind === "empty" ? index : -1))
    .filter((index) => index >= 0 && !keep.has(index));
  const placed = [];
  for (let n = 0; n < count && free.length; n++) {
    const [index] = free.splice(Math.floor(random() * free.length), 1);
    board.cells[index] = { kind: "rock", seed: random() };
    placed.push(index);
  }
  return placed;
}

// Retries until the rocks leave enough open cells to reach the quota.
function placeRocks(board, count, quota, random) {
  for (let attempt = 0; attempt < ROCK_ATTEMPTS; attempt++) {
    const placed = scatterRocks(board, count, random);
    if (reachableFromOutlet(board) >= quota + QUOTA_MARGIN) return;
    placed.forEach((index) => (board.cells[index] = { kind: "empty" }));
  }
}

export function createBoard(cols, rows, config, random = Math.random) {
  const cells = Array.from({ length: cols * rows }, () => ({ kind: "empty" }));
  const board = { cols, rows, cells, start: pickStart(cols, rows, random) };
  const { x, y, dir } = board.start;
  cells[y * cols + x] = {
    kind: "start",
    dir,
    fills: [{ entry: -1, progress: 0 }]
  };
  placeRocks(board, config.rocks, config.quota, random);
  return board;
}

export function unusedCells(board) {
  return board.cells
    .map((cell, index) => (isUnused(cell) ? index : -1))
    .filter((index) => index >= 0);
}
