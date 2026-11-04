// Canvas drawing: the well (locked blocks, ghost, falling piece) and the
// next piece. Pure drawing, no game logic.
import { COLS, HIDDEN, VISIBLE_ROWS, collides } from "./grid.js";
import { CELLS, COLORS, TYPES } from "./pieces.js";

const WELL_BG = "#121a26";
const GRID_LINE = "rgba(255, 255, 255, 0.05)";
// A preview box fits 4 columns x 2 rows of cells with a margin.
const BOX_COLS = 4.4;
const BOX_ROWS = 2.6;

function drawCell(ctx, x, y, size, color, alpha = 1) {
  const edge = Math.max(1, size * 0.1);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.fillRect(x, y, size, size);
  ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
  ctx.fillRect(x, y, size, edge);
  ctx.fillRect(x, y, edge, size);
  ctx.fillStyle = "rgba(0, 0, 0, 0.12)";
  ctx.fillRect(x, y + size - edge, size, edge);
  ctx.fillRect(x + size - edge, y, edge, size);
  ctx.globalAlpha = 1;
}

function ghostRow(grid, piece) {
  let y = piece.y;
  while (!collides(grid, piece.type, piece.rot, piece.x, y + 1)) y += 1;
  return y;
}

// Draws a piece centred in its preview box, at rotation 0.
function drawPreview(ctx, type, box, alpha) {
  ctx.clearRect(0, 0, box.w, box.h);
  if (!type) return;
  const size = Math.min(box.w / BOX_COLS, box.h / BOX_ROWS);
  const cells = CELLS[type][0];
  const cols = cells.map(([c]) => c);
  const rows = cells.map(([, r]) => r);
  const w = Math.max(...cols) - Math.min(...cols) + 1;
  const h = Math.max(...rows) - Math.min(...rows) + 1;
  const left = (box.w - w * size) / 2 - Math.min(...cols) * size;
  const top = (box.h - h * size) / 2 - Math.min(...rows) * size;
  cells.forEach(([c, r]) =>
    drawCell(ctx, left + c * size, top + r * size, size, COLORS[type], alpha)
  );
}

function drawWell(c, state, cell) {
  c.fillStyle = WELL_BG;
  c.fillRect(0, 0, cell * COLS, cell * VISIBLE_ROWS);
  c.fillStyle = GRID_LINE;
  for (let i = 1; i < COLS; i += 1) c.fillRect(i * cell, 0, 1, cell * 20);
  for (let i = 1; i < VISIBLE_ROWS; i += 1) {
    c.fillRect(0, i * cell, cell * COLS, 1);
  }
  state.grid.forEach((row, r) =>
    row.forEach((v, col) => {
      if (!v || r < HIDDEN) return;
      drawCell(c, col * cell, (r - HIDDEN) * cell, cell, COLORS[TYPES[v - 1]]);
    })
  );
}

function drawPiece(c, state, cell, showGhost) {
  const { piece, grid, over } = state;
  if (!piece || over === "blockout") return;
  const ghost = ghostRow(grid, piece);
  const color = COLORS[piece.type];
  CELLS[piece.type][piece.rot].forEach(([col, r]) => {
    const x = (piece.x + col) * cell;
    if (showGhost && ghost + r >= HIDDEN) {
      drawCell(c, x, (ghost + r - HIDDEN) * cell, cell, color, 0.22);
    }
    if (piece.y + r >= HIDDEN) {
      drawCell(c, x, (piece.y + r - HIDDEN) * cell, cell, color);
    }
  });
}

function setScale(canvas, c, w, h) {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
}

// The board gets its size from the cell; a preview box from its CSS size.
function fitBoard(canvas, c, w, h) {
  setScale(canvas, c, w, h);
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;
}

function fitBox(canvas, c) {
  const box = { w: canvas.clientWidth, h: canvas.clientHeight };
  setScale(canvas, c, box.w, box.h);
  return box;
}

export function createView({ board, next, ghost }) {
  const ctx = {
    board: board.getContext("2d"),
    next: next.getContext("2d")
  };
  let nextBox = { w: 0, h: 0 };
  let cell = 0;

  return {
    resize(size) {
      cell = size;
      fitBoard(board, ctx.board, size * COLS, size * VISIBLE_ROWS);
      nextBox = fitBox(next, ctx.next);
    },
    render(state) {
      if (!cell) return;
      drawWell(ctx.board, state, cell);
      drawPiece(ctx.board, state, cell, ghost);
      drawPreview(ctx.next, state.queue[0], nextBox, 1);
    }
  };
}
