// Pure placement rules and scoring. A placement is a list of { i, l }: cell
// index and letter (lowercase for a blank). The dictionary check is separate
// (invalidWords) so the same analysis serves the live preview and the robot.
import {
  BINGO,
  CENTER,
  letterFactor,
  RACK_SIZE,
  SIZE,
  tileValue,
  wordFactor
} from "./tiles.js";

const ACROSS = [0, 1];
const DOWN = [1, 0];

const rowOf = (i) => Math.floor(i / SIZE);
const colOf = (i) => i % SIZE;

export const isBoardEmpty = (board) => board.every((cell) => !cell);

function letterAt(board, placed, r, c) {
  if (r < 0 || c < 0 || r >= SIZE || c >= SIZE) return "";
  const i = r * SIZE + c;
  return placed.get(i) || board[i];
}

// Cells of the full word running through cell i in direction [dr, dc].
function wordCells(board, placed, i, [dr, dc]) {
  let r = rowOf(i);
  let c = colOf(i);
  while (letterAt(board, placed, r - dr, c - dc)) [r, c] = [r - dr, c - dc];
  const cells = [];
  while (letterAt(board, placed, r, c)) {
    cells.push(r * SIZE + c);
    [r, c] = [r + dr, c + dc];
  }
  return cells;
}

function scoreCells(board, placed, cells) {
  let sum = 0;
  let factor = 1;
  for (const i of cells) {
    const fresh = placed.has(i);
    sum += tileValue(placed.get(i) || board[i]) * (fresh ? letterFactor(i) : 1);
    if (fresh) factor *= wordFactor(i);
  }
  return sum * factor;
}

function makeWord(board, placed, cells) {
  const text = cells
    .map((i) => (placed.get(i) || board[i]).toUpperCase())
    .join("");
  return { text, cells, score: scoreCells(board, placed, cells) };
}

function direction(board, placed, tiles) {
  const rows = new Set(tiles.map((t) => rowOf(t.i)));
  const cols = new Set(tiles.map((t) => colOf(t.i)));
  if (tiles.length > 1)
    return rows.size === 1 ? ACROSS : cols.size === 1 ? DOWN : null;
  const across = wordCells(board, placed, tiles[0].i, ACROSS).length > 1;
  return across ? ACROSS : DOWN;
}

function geometryError(board, placed, tiles, main) {
  if (!tiles.every((t) => main.includes(t.i))) return "gap";
  if (isBoardEmpty(board)) {
    if (!tiles.some((t) => t.i === CENTER)) return "center";
    return tiles.length < 2 ? "short" : null;
  }
  return null;
}

// -> { error } | { words: [{ text, cells, score }], score, bingo }
export function analyzeMove(board, tiles) {
  if (!tiles.length) return { error: "empty" };
  const placed = new Map(tiles.map((t) => [t.i, t.l]));
  const dir = direction(board, placed, tiles);
  if (!dir) return { error: "line" };
  const main = wordCells(board, placed, tiles[0].i, dir);
  const error = geometryError(board, placed, tiles, main);
  if (error) return { error };
  const cross = dir === ACROSS ? DOWN : ACROSS;
  const words = [
    main,
    ...tiles.map((t) => wordCells(board, placed, t.i, cross))
  ]
    .filter((cells) => cells.length > 1)
    .map((cells) => makeWord(board, placed, cells));
  const touches = words.some((w) => w.cells.some((i) => board[i]));
  if (!isBoardEmpty(board) && !touches) return { error: "detached" };
  if (!words.length) return { error: "short" };
  const bingo = tiles.length === RACK_SIZE;
  const score = words.reduce((sum, w) => sum + w.score, bingo ? BINGO : 0);
  return { words, score, bingo };
}

export const invalidWords = (analysis, dict) =>
  analysis.words.filter((w) => !dict.has(w.text)).map((w) => w.text);
