// Every legal move for a rack (Appel & Jacobson): for each anchor (an empty
// cell next to a tile, or the centre on an empty board) build a left part on
// the free cells before it, then extend right through the board, keeping only
// dictionary prefixes and letters allowed by the perpendicular words.
import { analyzeMove, isBoardEmpty } from "./rules.js";
import { BLANK, CENTER, LETTERS, SIZE } from "./tiles.js";

const ALL = (1 << 26) - 1;
const bit = (letter) => 1 << (letter.charCodeAt(0) - 65);

// dir 0 = across (line = row), 1 = down (line = column).
const at = (dir, line, pos) => (dir ? pos * SIZE + line : line * SIZE + pos);

function hasNeighbour(board, i) {
  const r = Math.floor(i / SIZE);
  const c = i % SIZE;
  return Boolean(
    (r > 0 && board[i - SIZE]) ||
    (r < SIZE - 1 && board[i + SIZE]) ||
    (c > 0 && board[i - 1]) ||
    (c < SIZE - 1 && board[i + 1])
  );
}

function findAnchors(board) {
  if (isBoardEmpty(board)) return board.map((_, i) => i === CENTER);
  return board.map((cell, i) => !cell && hasNeighbour(board, i));
}

// Letters that may go on (line, pos) given the perpendicular word through it.
function crossMask(ctx, dir, line, pos) {
  const { board, dict } = ctx;
  let before = "";
  let after = "";
  for (let l = line - 1; l >= 0 && board[at(dir, l, pos)]; l--)
    before = board[at(dir, l, pos)].toUpperCase() + before;
  for (let l = line + 1; l < SIZE && board[at(dir, l, pos)]; l++)
    after += board[at(dir, l, pos)].toUpperCase();
  if (!before && !after) return ALL;
  let mask = 0;
  for (const letter of LETTERS)
    if (dict.has(before + letter + after)) mask |= bit(letter);
  return mask;
}

// Calls fn(letter, placedAs) for each rack letter allowed by mask, with that
// tile taken out of the rack for the duration of the call.
function eachRackLetter(ctx, mask, fn) {
  const { counts } = ctx;
  for (const kind of ctx.kinds) {
    if (!counts[kind]) continue;
    counts[kind]--;
    if (kind !== BLANK) {
      if (mask & bit(kind)) fn(kind, kind);
    } else {
      for (const letter of LETTERS)
        if (mask & bit(letter)) fn(letter, letter.toLowerCase());
    }
    counts[kind]++;
  }
}

function record(ctx, lc, anchor) {
  const { dir, line, left, right } = lc;
  const tiles = [
    ...left.map((l, k) => ({ i: at(dir, line, anchor - left.length + k), l })),
    ...right.map(({ pos, l }) => ({ i: at(dir, line, pos), l }))
  ];
  if (tiles.length === 1) {
    const key = `${tiles[0].i}${tiles[0].l}`;
    if (ctx.singles.has(key)) return;
    ctx.singles.add(key);
  }
  const analysis = analyzeMove(ctx.board, tiles);
  if (analysis.error) return;
  ctx.out.push({ tiles, score: analysis.score, word: analysis.words[0].text });
}

function extendRight(ctx, lc, partial, pos, anchor) {
  const cell = pos < SIZE ? ctx.board[at(lc.dir, lc.line, pos)] : "";
  if (cell) {
    const next = partial + cell.toUpperCase();
    if (ctx.hasPrefix(next)) extendRight(ctx, lc, next, pos + 1, anchor);
    return;
  }
  const placed = lc.left.length + lc.right.length;
  if (pos > anchor && placed && ctx.dict.has(partial)) record(ctx, lc, anchor);
  if (pos >= SIZE) return;
  eachRackLetter(ctx, lc.cross[pos], (letter, as) => {
    const next = partial + letter;
    if (!ctx.hasPrefix(next)) return;
    lc.right.push({ pos, l: as });
    extendRight(ctx, lc, next, pos + 1, anchor);
    lc.right.pop();
  });
}

function leftPart(ctx, lc, partial, limit, anchor) {
  extendRight(ctx, lc, partial, anchor, anchor);
  if (!limit) return;
  eachRackLetter(ctx, ALL, (letter, as) => {
    const next = partial + letter;
    if (!ctx.hasPrefix(next)) return;
    lc.left.push(as);
    leftPart(ctx, lc, next, limit - 1, anchor);
    lc.left.pop();
  });
}

function startAnchor(ctx, lc, pos, anchors) {
  const { board } = ctx;
  const { dir, line } = lc;
  if (pos > 0 && board[at(dir, line, pos - 1)]) {
    let start = pos - 1;
    while (start > 0 && board[at(dir, line, start - 1)]) start--;
    let prefix = "";
    for (let p = start; p < pos; p++)
      prefix += board[at(dir, line, p)].toUpperCase();
    if (ctx.hasPrefix(prefix)) extendRight(ctx, lc, prefix, pos, pos);
    return;
  }
  let limit = 0;
  while (
    limit < pos &&
    limit < ctx.rackSize - 1 &&
    !anchors[at(dir, line, pos - limit - 1)] &&
    !board[at(dir, line, pos - limit - 1)]
  )
    limit++;
  leftPart(ctx, lc, "", limit, pos);
}

function makeContext(board, rack, dict) {
  const counts = {};
  rack.forEach((letter) => (counts[letter] = (counts[letter] || 0) + 1));
  const cache = new Map();
  const hasPrefix = (prefix) => {
    let known = cache.get(prefix);
    if (known === undefined)
      cache.set(prefix, (known = dict.hasPrefix(prefix)));
    return known;
  };
  const kinds = Object.keys(counts);
  return {
    board,
    dict,
    counts,
    kinds,
    hasPrefix,
    rackSize: rack.length,
    out: [],
    singles: new Set()
  };
}

// -> [{ tiles: [{ i, l }], score, word }]
export function generateMoves(board, rack, dict) {
  if (!rack.length) return [];
  const ctx = makeContext(board, rack, dict);
  const anchors = findAnchors(board);
  for (const dir of [0, 1]) {
    for (let line = 0; line < SIZE; line++) {
      const cross = Array.from({ length: SIZE }, (_, pos) =>
        board[at(dir, line, pos)] ? 0 : crossMask(ctx, dir, line, pos)
      );
      const lc = { dir, line, cross, left: [], right: [] };
      for (let pos = 0; pos < SIZE; pos++)
        if (anchors[at(dir, line, pos)]) startAnchor(ctx, lc, pos, anchors);
    }
  }
  return ctx.out;
}
