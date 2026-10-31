// localStorage: the match in progress, so leaving it by any route and coming
// back resumes it exactly. Everything read back is validated before use;
// particles and score labels are not saved.
import {
  GRID_LONG,
  GRID_SHORT,
  LOCK_SECONDS,
  QUEUE_SIZE,
  levelConfig
} from "./levels.js";
import { PIECES } from "./pieces.js";

const SAVE_KEY = "pipedream-current";
const VERSION = 1;
const PHASES = ["countdown", "flow", "leak", "sweep", "cleared"];
const PLACING = ["countdown", "flow"];

const isType = (type) => Object.hasOwn(PIECES, type);
const isDir = (dir) => Number.isInteger(dir) && dir >= 0 && dir < 4;
const isCount = (n) => Number.isInteger(n) && n >= 0;
const inRange = (n, max) => Number.isFinite(n) && n >= 0 && n <= max;
const inGrid = (cols, rows, p) =>
  isCount(p?.x) && isCount(p?.y) && p.x < cols && p.y < rows;

export function encodeMatch(state) {
  const { board, flow } = state;
  return JSON.stringify({
    v: VERSION,
    level: state.config.level,
    phase: state.phase,
    timer: Math.max(0, state.timer),
    fast: state.fast,
    score: state.score,
    filled: state.filled,
    crosses: state.crosses,
    removed: state.removed,
    sweep: state.sweep,
    queue: state.queue.list(),
    cols: board.cols,
    rows: board.rows,
    start: board.start,
    cells: board.cells,
    flow: {
      x: flow.x,
      y: flow.y,
      channel: flow.channel,
      exit: flow.exit,
      leak: flow.leak
    }
  });
}

// null = channel still dry, undefined = invalid.
function readFill(fill, link) {
  if (fill === null) return null;
  if (!link.includes(fill?.entry) || !inRange(fill.progress, 1)) return;
  return { entry: fill.entry, progress: fill.progress };
}

function readPipe(cell) {
  if (!isType(cell.type) || !inRange(cell.lock, LOCK_SECONDS)) return null;
  if (cell.lock > 0 && !isType(cell.prevType)) return null;
  const { links } = PIECES[cell.type];
  if (!Array.isArray(cell.fills) || cell.fills.length !== links.length) {
    return null;
  }
  const fills = cell.fills.map((fill, i) => readFill(fill, links[i]));
  if (fills.includes(undefined)) return null;
  const prevType = isType(cell.prevType) ? cell.prevType : null;
  return { kind: "pipe", type: cell.type, fills, lock: cell.lock, prevType };
}

function readCell(cell) {
  if (cell?.kind === "empty") return { kind: "empty" };
  if (cell?.kind === "pipe") return readPipe(cell);
  if (cell?.kind === "rock" && inRange(cell.seed, 1)) {
    return { kind: "rock", seed: cell.seed };
  }
  return null;
}

function readStart(cell, dir) {
  const fill = Array.isArray(cell?.fills) ? cell.fills[0] : null;
  const valid =
    cell?.kind === "start" &&
    cell.dir === dir &&
    cell.fills.length === 1 &&
    fill?.entry === -1 &&
    inRange(fill.progress, 1);
  if (!valid) return null;
  return {
    kind: "start",
    dir,
    fills: [{ entry: -1, progress: fill.progress }]
  };
}

function readBoard({ cols, rows, start, cells }) {
  const landscape = cols === GRID_LONG && rows === GRID_SHORT;
  const portrait = cols === GRID_SHORT && rows === GRID_LONG;
  if (!(landscape || portrait) || !Array.isArray(cells)) return null;
  if (cells.length !== cols * rows) return null;
  if (!inGrid(cols, rows, start) || !isDir(start.dir)) return null;
  const startIndex = start.y * cols + start.x;
  const read = cells.map((cell, i) =>
    i === startIndex ? readStart(cell, start.dir) : readCell(cell)
  );
  if (read.includes(null)) return null;
  return {
    cols,
    rows,
    start: { x: start.x, y: start.y, dir: start.dir },
    cells: read
  };
}

// The flooz head must sit in a filled channel; a leak only after the flow.
function readFlow(flow, board, phase) {
  const { cols, rows, cells } = board;
  if (!inGrid(cols, rows, flow) || !isDir(flow.exit)) return null;
  if (!isCount(flow.channel)) return null;
  if (!cells[flow.y * cols + flow.x].fills?.[flow.channel]) return null;
  const leak = flow.leak;
  if (leak !== null && !(inGrid(cols, rows, leak) && isDir(leak.dir))) {
    return null;
  }
  if (PLACING.includes(phase) !== (leak === null)) return null;
  const savedLeak = leak && { x: leak.x, y: leak.y, dir: leak.dir };
  return {
    x: flow.x,
    y: flow.y,
    channel: flow.channel,
    exit: flow.exit,
    leak: savedLeak
  };
}

function validMeta(data) {
  return (
    data?.v === VERSION &&
    Number.isInteger(data.level) &&
    data.level >= 1 &&
    PHASES.includes(data.phase) &&
    inRange(data.timer, levelConfig(data.level).countdown) &&
    typeof data.fast === "boolean" &&
    [data.score, data.filled, data.crosses, data.removed].every(isCount)
  );
}

function validLists(data) {
  const size = Array.isArray(data.cells) ? data.cells.length : 0;
  return (
    Array.isArray(data.queue) &&
    data.queue.length === QUEUE_SIZE &&
    data.queue.every(isType) &&
    Array.isArray(data.sweep) &&
    data.sweep.every((index) => isCount(index) && index < size)
  );
}

export function decodeMatch(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return null;
  }
  if (!validMeta(data) || !validLists(data)) return null;
  const board = readBoard(data);
  const flow = board && readFlow(data.flow ?? {}, board, data.phase);
  if (!flow) return null;
  const { level, phase, timer, fast, score, filled, crosses, removed } = data;
  return {
    level,
    phase,
    timer,
    fast,
    score,
    filled,
    crosses,
    removed,
    sweep: data.sweep.slice(),
    queue: data.queue.slice(),
    board,
    flow
  };
}

export function loadMatch() {
  try {
    const text = localStorage.getItem(SAVE_KEY);
    if (text === null) return null;
    const match = decodeMatch(text);
    if (!match) localStorage.removeItem(SAVE_KEY);
    return match;
  } catch {
    return null;
  }
}

export function storeMatch(state) {
  try {
    localStorage.setItem(SAVE_KEY, encodeMatch(state));
  } catch {
    // Storage unavailable or full: the match only lasts for this visit.
  }
}

export function clearMatch() {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    // Storage unavailable: nothing was saved.
  }
}
