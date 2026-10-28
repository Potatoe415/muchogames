// Builds a full solution, then removes clues in symmetric pairs while the grid
// keeps exactly one solution and still matches the level (levels.js).
import {
  ALL,
  SIZE,
  UNITS,
  bitCount,
  boxOf,
  colOf,
  digitsOf,
  freeMask,
  indexes,
  rowOf,
  shuffle
} from "./grid.js";
import { LEVELS } from "./levels.js";

const MAX_ATTEMPTS = 40;

function createState(values) {
  const s = {
    grid: new Uint8Array(SIZE),
    rows: new Uint16Array(9),
    cols: new Uint16Array(9),
    boxes: new Uint16Array(9)
  };
  values.forEach((v, i) => v && place(s, i, v));
  return s;
}

function place(s, i, v) {
  const bit = 1 << v;
  s.grid[i] = v;
  s.rows[rowOf(i)] |= bit;
  s.cols[colOf(i)] |= bit;
  s.boxes[boxOf(i)] |= bit;
}

function unplace(s, i, v) {
  const keep = ~(1 << v);
  s.grid[i] = 0;
  s.rows[rowOf(i)] &= keep;
  s.cols[colOf(i)] &= keep;
  s.boxes[boxOf(i)] &= keep;
}

const options = (s, i) =>
  ALL & ~(s.rows[rowOf(i)] | s.cols[colOf(i)] | s.boxes[boxOf(i)]);

// Empty cell with the fewest candidates, -1 when the grid is full.
function pickCell(s) {
  let best = -1;
  let bestCount = 10;
  for (let i = 0; i < SIZE; i++) {
    if (s.grid[i]) continue;
    const n = bitCount(options(s, i));
    if (n < bestCount) {
      best = i;
      bestCount = n;
      if (n <= 1) break;
    }
  }
  return best;
}

// Depth-first search; `visit(grid)` returns true to stop.
function search(s, order, visit) {
  const i = pickCell(s);
  if (i < 0) return visit(s.grid);
  for (const v of order(digitsOf(options(s, i)))) {
    place(s, i, v);
    const stop = search(s, order, visit);
    unplace(s, i, v);
    if (stop) return true;
  }
  return false;
}

export function countSolutions(values, limit = 2) {
  let found = 0;
  search(
    createState(values),
    (digits) => digits,
    () => ++found >= limit
  );
  return found;
}

function randomSolution(rng) {
  let solution = null;
  search(
    createState(new Array(SIZE).fill(0)),
    (digits) => shuffle(digits, rng),
    (grid) => {
      solution = Array.from(grid);
      return true;
    }
  );
  return solution;
}

function placeSingle(values, i, v) {
  values[i] = v;
  return true;
}

function nakedSingles(values) {
  let placed = false;
  values.forEach((v, i) => {
    if (v) return;
    const mask = freeMask(values, i);
    if (bitCount(mask) === 1) placed = placeSingle(values, i, digitsOf(mask)[0]);
  });
  return placed;
}

function hiddenSingles(values) {
  let placed = false;
  for (const unit of UNITS) {
    for (let v = 1; v <= 9; v++) {
      if (unit.some((i) => values[i] === v)) continue;
      const spots = unit.filter(
        (i) => !values[i] && freeMask(values, i) & (1 << v)
      );
      if (spots.length === 1) placed = placeSingle(values, spots[0], v);
    }
  }
  return placed;
}

// True when naked and hidden singles alone fill the grid (implies uniqueness).
export function solvableWithSingles(puzzle) {
  const values = puzzle.slice();
  while (nakedSingles(values) || hiddenSingles(values));
  return !values.includes(0);
}

function carve(solution, level, rng) {
  const puzzle = solution.slice();
  const keeps = level.singles
    ? () => solvableWithSingles(puzzle)
    : () => countSolutions(puzzle) === 1;
  let clues = SIZE;
  for (const i of shuffle(indexes().slice(0, 41), rng)) {
    const pair = i === 40 ? [40] : [i, SIZE - 1 - i];
    if (clues - pair.length < level.clues) continue;
    pair.forEach((j) => (puzzle[j] = 0));
    if (keeps()) clues -= pair.length;
    else pair.forEach((j) => (puzzle[j] = solution[j]));
  }
  return puzzle;
}

export function generate(levelId, rng = Math.random) {
  const level = LEVELS[levelId] || LEVELS.easy;
  let grid = null;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const solution = randomSolution(rng);
    grid = { puzzle: carve(solution, level, rng), solution };
    if (level.singles || !solvableWithSingles(grid.puzzle)) break;
  }
  return grid;
}
