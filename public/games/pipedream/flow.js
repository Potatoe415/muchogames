// Flooz propagation: fills the current channel edge to edge, then follows
// the exit edge into the neighbour, or overflows.
import { cellAt, openChannel } from "./board.js";
import { DX, DY, exitFor, opposite } from "./pieces.js";

export function createFlow(board) {
  const { x, y, dir } = board.start;
  return { x, y, channel: 0, exit: dir, leak: null };
}

function enterNext(flow, board, events) {
  const nx = flow.x + DX[flow.exit];
  const ny = flow.y + DY[flow.exit];
  const entry = opposite(flow.exit);
  const cell = cellAt(board, nx, ny);
  const channel = openChannel(cell, entry);
  if (channel < 0) {
    flow.leak = { x: flow.x, y: flow.y, dir: flow.exit };
    events.push({ type: "leak" });
    return;
  }
  const cross = cell.fills.some(Boolean);
  cell.fills[channel] = { entry, progress: 0 };
  flow.x = nx;
  flow.y = ny;
  flow.channel = channel;
  flow.exit = exitFor(cell.type, channel, entry);
  events.push({ type: "enter", x: nx, y: ny, cross });
}

// `amount` is in tiles; a large step may cross several tiles at once.
export function advanceFlow(flow, board, amount, events) {
  let left = amount;
  while (left > 0 && !flow.leak) {
    const fill = cellAt(board, flow.x, flow.y).fills[flow.channel];
    const rest = 1 - fill.progress;
    if (left < rest) {
      fill.progress += left;
      return;
    }
    left -= rest;
    fill.progress = 1;
    enterNext(flow, board, events);
  }
}
