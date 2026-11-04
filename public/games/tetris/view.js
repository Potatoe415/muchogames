// Canvas drawing: the well (locked blocks, ghost, falling piece), the hold
// box and the next queue. Pure drawing, no game logic.
import { COLS, HIDDEN, VISIBLE_ROWS, collides } from "./grid.js";
import { CELLS, COLORS, TYPES } from "./pieces.js";

const WELL_BG = "#0f1620";
const GRID_LINE = "rgba(255, 255, 255, 0.05)";
const SIDE_SCALE = 0.75;
const SIDE_COLS = 4;
const SLOT_ROWS = 3;
const NEXT_SHOWN = 5;

function drawCell(ctx, x, y, size, color, alpha = 1) {
  const edge = Math.max(1, size * 0.1);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.fillRect(x, y, size, size);
  ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
  ctx.fillRect(x, y, size, edge);
  ctx.fillRect(x, y, edge, size);
  ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
  ctx.fillRect(x, y + size - edge, size, edge);
  ctx.fillRect(x + size - edge, y, edge, size);
  ctx.globalAlpha = 1;
}

function ghostRow(grid, piece) {
  let y = piece.y;
  while (!collides(grid, piece.type, piece.rot, piece.x, y + 1)) y += 1;
  return y;
}

// Draws a piece centred in the box { x, y, w, h }, at rotation 0.
function drawPreview(ctx, type, box, size, alpha) {
  const cells = CELLS[type][0];
  const cols = cells.map(([c]) => c);
  const rows = cells.map(([, r]) => r);
  const w = Math.max(...cols) - Math.min(...cols) + 1;
  const h = Math.max(...rows) - Math.min(...rows) + 1;
  const left = box.x + (box.w - w * size) / 2 - Math.min(...cols) * size;
  const top = box.y + (box.h - h * size) / 2 - Math.min(...rows) * size;
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

function drawPiece(c, state, cell) {
  const { piece, grid, over } = state;
  if (!piece || over === "blockout") return;
  const ghost = ghostRow(grid, piece);
  const color = COLORS[piece.type];
  CELLS[piece.type][piece.rot].forEach(([col, r]) => {
    const x = (piece.x + col) * cell;
    if (ghost + r >= HIDDEN) {
      drawCell(c, x, (ghost + r - HIDDEN) * cell, cell, color, 0.22);
    }
    if (piece.y + r >= HIDDEN) {
      drawCell(c, x, (piece.y + r - HIDDEN) * cell, cell, color);
    }
  });
}

function drawSide(ctx, state, cell) {
  const side = cell * SIDE_SCALE;
  const slot = side * SLOT_ROWS;
  const w = side * SIDE_COLS;
  ctx.hold.clearRect(0, 0, w, slot);
  ctx.next.clearRect(0, 0, w, slot * NEXT_SHOWN);
  if (state.hold) {
    const alpha = state.holdUsed ? 0.35 : 1;
    drawPreview(ctx.hold, state.hold, { x: 0, y: 0, w, h: slot }, side, alpha);
  }
  state.queue.slice(0, NEXT_SHOWN).forEach((type, i) => {
    drawPreview(ctx.next, type, { x: 0, y: i * slot, w, h: slot }, side, 1);
  });
}

function fit(canvas, c, w, h) {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
}

export function createView({ board, hold, next }) {
  const ctx = {
    board: board.getContext("2d"),
    hold: hold.getContext("2d"),
    next: next.getContext("2d")
  };
  let cell = 0;

  return {
    resize(size) {
      cell = size;
      const side = size * SIDE_SCALE;
      fit(board, ctx.board, size * COLS, size * VISIBLE_ROWS);
      fit(hold, ctx.hold, side * SIDE_COLS, side * SLOT_ROWS);
      fit(next, ctx.next, side * SIDE_COLS, side * SLOT_ROWS * NEXT_SHOWN);
    },
    render(state) {
      if (!cell) return;
      drawWell(ctx.board, state, cell);
      drawPiece(ctx.board, state, cell);
      drawSide(ctx, state, cell);
    }
  };
}
