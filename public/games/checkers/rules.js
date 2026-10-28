// Draughts rules, pure: variants, start position, legal moves, apply.
// Board: Int8Array(size * size), index = row * size + col, row 0 at the top.
// A piece is side * kind: light (+1) starts at the bottom and moves up, dark
// (-1) starts at the top and moves down. Only dark squares ((row + col) odd)
// are ever used.
export const EMPTY = 0;
export const MAN = 1;
export const KING = 2;
export const LIGHT = 1;
export const DARK = -1;

// international: 10x10, men capture backwards, flying kings, the longest
// capture is mandatory, a man only crowns when it ends its move on the far
// row. english: 8x8, men move and capture forward only, kings step one
// square, any complete capture may be chosen, crowning ends the move.
export const VARIANTS = {
  international: {
    id: "international",
    size: 10,
    rows: 4,
    backCapture: true,
    flyingKings: true,
    maxCapture: true,
    crownStops: false,
    first: LIGHT,
    drawPlies: 50
  },
  english: {
    id: "english",
    size: 8,
    rows: 3,
    backCapture: false,
    flyingKings: false,
    maxCapture: false,
    crownStops: true,
    first: DARK,
    drawPlies: 80
  }
};

export const VARIANT_IDS = Object.keys(VARIANTS);

const DIRS = [
  [-1, -1],
  [-1, 1],
  [1, -1],
  [1, 1]
];

export const sideOf = (piece) => Math.sign(piece);
export const isKing = (piece) => Math.abs(piece) === KING;
export const forwardOf = (side) => (side === LIGHT ? -1 : 1);
export const squareNumber = (sq) => Math.floor(sq / 2) + 1;

export function isDarkSquare(size, sq) {
  return (Math.floor(sq / size) + (sq % size)) % 2 === 1;
}

export function isCrownSquare(variant, side, sq) {
  const row = Math.floor(sq / variant.size);
  return side === LIGHT ? row === 0 : row === variant.size - 1;
}

export function initialBoard(variant) {
  const { size, rows } = variant;
  const board = new Int8Array(size * size);
  for (let sq = 0; sq < board.length; sq += 1) {
    if (!isDarkSquare(size, sq)) continue;
    const row = Math.floor(sq / size);
    if (row < rows) board[sq] = DARK * MAN;
    else if (row >= size - rows) board[sq] = LIGHT * MAN;
  }
  return board;
}

const inside = (size, r, c) => r >= 0 && c >= 0 && r < size && c < size;

// The enemy piece a capture along (dr, dc) would take and the empty squares
// the capturing piece may land on behind it. Pieces already taken in this
// sequence stay on the board until the move ends: they block, and cannot be
// taken twice.
function jumpAlong(board, variant, pos, dir, side, king, taken) {
  const { size } = variant;
  const [dr, dc] = dir;
  const flying = king && variant.flyingKings;
  let r = Math.floor(pos / size) + dr;
  let c = (pos % size) + dc;
  while (flying && inside(size, r, c) && board[r * size + c] === EMPTY) {
    r += dr;
    c += dc;
  }
  if (!inside(size, r, c)) return null;
  const victim = r * size + c;
  if (sideOf(board[victim]) !== -side || taken.includes(victim)) return null;
  const landings = [];
  for (r += dr, c += dc; inside(size, r, c); r += dr, c += dc) {
    if (board[r * size + c] !== EMPTY) break;
    landings.push(r * size + c);
    if (!flying) break;
  }
  return landings.length ? { victim, landings } : null;
}

// Depth-first walk of capture sequences. Only maximal sequences count: a
// capture may never stop while another one is possible.
function extendCapture(walk, pos) {
  const { board, variant, side, king, path, taken } = walk;
  let extended = false;
  for (const dir of DIRS) {
    if (!king && !variant.backCapture && dir[0] !== forwardOf(side)) continue;
    const jump = jumpAlong(board, variant, pos, dir, side, king, taken);
    if (!jump) continue;
    for (const land of jump.landings) {
      extended = true;
      path.push(land);
      taken.push(jump.victim);
      const stop =
        !king && variant.crownStops && isCrownSquare(variant, side, land);
      if (stop) walk.moves.push(makeMove(walk.from, path, taken));
      else extendCapture(walk, land);
      path.pop();
      taken.pop();
    }
  }
  if (!extended && taken.length) {
    walk.moves.push(makeMove(walk.from, path, taken));
  }
}

function captureMoves(board, variant, from) {
  const piece = board[from];
  const walk = {
    board,
    variant,
    from,
    side: sideOf(piece),
    king: isKing(piece),
    path: [],
    taken: [],
    moves: []
  };
  board[from] = EMPTY;
  extendCapture(walk, from);
  board[from] = piece;
  return walk.moves;
}

function makeMove(from, path, captures) {
  return {
    from,
    to: path[path.length - 1],
    path: path.slice(),
    captures: captures.slice()
  };
}

function stepMoves(board, variant, from) {
  const { size } = variant;
  const piece = board[from];
  const side = sideOf(piece);
  const flying = isKing(piece) && variant.flyingKings;
  const moves = [];
  for (const [dr, dc] of DIRS) {
    if (!isKing(piece) && dr !== forwardOf(side)) continue;
    let r = Math.floor(from / size) + dr;
    let c = (from % size) + dc;
    while (inside(size, r, c) && board[r * size + c] === EMPTY) {
      moves.push(makeMove(from, [r * size + c], []));
      if (!flying) break;
      r += dr;
      c += dc;
    }
  }
  return moves;
}

// Two routes ending on the same square and taking the same pieces are the
// same move.
function dedupe(moves) {
  const seen = new Set();
  return moves.filter((move) => {
    const key = `${move.from}:${move.to}:${[...move.captures].sort()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function legalMoves(board, variant, side) {
  const captures = [];
  const steps = [];
  for (let sq = 0; sq < board.length; sq += 1) {
    if (sideOf(board[sq]) !== side) continue;
    captures.push(...captureMoves(board, variant, sq));
    if (!captures.length) steps.push(...stepMoves(board, variant, sq));
  }
  if (!captures.length) return steps;
  if (!variant.maxCapture) return dedupe(captures);
  const longest = captures.reduce((n, m) => Math.max(n, m.captures.length), 0);
  return dedupe(captures.filter((m) => m.captures.length === longest));
}

export function crowns(board, variant, move) {
  const piece = board[move.from];
  return !isKing(piece) && isCrownSquare(variant, sideOf(piece), move.to);
}

export function applyMove(board, variant, move) {
  const next = board.slice();
  const piece = next[move.from];
  next[move.from] = EMPTY;
  for (const sq of move.captures) next[sq] = EMPTY;
  next[move.to] = crowns(board, variant, move) ? sideOf(piece) * KING : piece;
  return next;
}

export function countPieces(board, side) {
  let men = 0;
  let kings = 0;
  for (const piece of board) {
    if (sideOf(piece) !== side) continue;
    if (isKing(piece)) kings += 1;
    else men += 1;
  }
  return { men, kings };
}
