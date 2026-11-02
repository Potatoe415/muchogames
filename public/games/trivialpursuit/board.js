// Board graph and geometry. Node ids: ring 0-41 (the six headquarters at
// 0, 7, 14…), spoke k cell j (1 = next to the ring, 5 = next to the hub) at
// 41 + 5k + j, hub 72. Coordinates are percentages of the square board.
export const CATS = 6;
export const RING = 42;
export const HUB = 72;
export const ROLL = -1;

// Category offsets from the segment's headquarters; ROLL is a roll-again cell.
// Each category gets 4 ring cells and 5 spoke cells.
const SEGMENT = [3, ROLL, 1, 4, ROLL, 2];
const R_RING = 43;
const SPOKE_STEP = 6.2;

export const spokeId = (k, j) => RING - 1 + 5 * k + j;

export function kindOf(id) {
  if (id === HUB) return "hub";
  if (id >= RING) return "cat";
  if (id % 7 === 0) return "hq";
  return SEGMENT[(id % 7) - 1] === ROLL ? "roll" : "cat";
}

export function catOf(id) {
  if (id === HUB) return ROLL;
  if (id >= RING) {
    const k = Math.floor((id - RING) / 5);
    return (k + ((id - RING) % 5) + 1) % CATS;
  }
  const k = Math.floor(id / 7);
  const offset = id % 7 === 0 ? 0 : SEGMENT[(id % 7) - 1];
  return offset === ROLL ? ROLL : (k + offset) % CATS;
}

export const hqOf = (cat) => cat * 7;

// Ring cell i sits at this angle (degrees, 0 = right, clockwise on screen).
export const angleOf = (i) => -90 + (i * 360) / RING;

export function polar(radius, deg) {
  const rad = (deg * Math.PI) / 180;
  return { x: 50 + radius * Math.cos(rad), y: 50 + radius * Math.sin(rad) };
}

export function cellPos(id) {
  if (id === HUB) return { x: 50, y: 50 };
  if (id < RING) return polar(R_RING, angleOf(id));
  const k = Math.floor((id - RING) / 5);
  const j = ((id - RING) % 5) + 1;
  return polar(R_RING - j * SPOKE_STEP, angleOf(k * 7));
}

function buildNeighbors() {
  const list = Array.from({ length: HUB + 1 }, () => []);
  const link = (a, b) => {
    list[a].push(b);
    list[b].push(a);
  };
  for (let i = 0; i < RING; i += 1) link(i, (i + 1) % RING);
  for (let k = 0; k < CATS; k += 1) {
    link(hqOf(k), spokeId(k, 1));
    for (let j = 1; j < 5; j += 1) link(spokeId(k, j), spokeId(k, j + 1));
    link(spokeId(k, 5), HUB);
  }
  return list;
}

export const NEIGHBORS = buildNeighbors();

// Every cell reachable in exactly `steps` moves without passing the same cell
// twice, with one path to it (the path excludes the start, ends on the cell).
export function reachable(from, steps) {
  const found = new Map();
  const path = [];
  const walk = (node) => {
    if (path.length === steps) {
      if (!found.has(node)) found.set(node, path.slice());
      return;
    }
    for (const next of NEIGHBORS[node]) {
      if (next === from || path.includes(next)) continue;
      path.push(next);
      walk(next);
      path.pop();
    }
  };
  walk(from);
  return found;
}

export const isNode = (id) => Number.isInteger(id) && id >= 0 && id <= HUB;
