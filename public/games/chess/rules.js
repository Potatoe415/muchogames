// Pure chess rules. Board = Int8Array(64), index 0 = a8 … 63 = h1 (row 0 at
// the top, white at the bottom). Piece = side * type, white +1, black -1.
// Position = { board, turn, castling (bits), ep (square or -1), halfmove }.
// Move = { from, to, promo (type or 0), taken (square or -1), rook ([from, to]
// when castling, else null) }.
export const WHITE = 1;
export const BLACK = -1;
export const PAWN = 1;
export const KNIGHT = 2;
export const BISHOP = 3;
export const ROOK = 4;
export const QUEEN = 5;
export const KING = 6;
export const PROMOTIONS = [QUEEN, ROOK, BISHOP, KNIGHT];

const BACK_RANK = [ROOK, KNIGHT, BISHOP, QUEEN, KING, BISHOP, KNIGHT, ROOK];
const WK = 1;
const WQ = 2;
const BK = 4;
const BQ = 8;

export const sideOf = (piece) => Math.sign(piece);
export const typeOf = (piece) => Math.abs(piece);
export const rowOf = (sq) => sq >> 3;
export const colOf = (sq) => sq & 7;
export const isDarkSquare = (sq) => (rowOf(sq) + colOf(sq)) % 2 === 1;
export const squareName = (sq) => "abcdefgh"[colOf(sq)] + (8 - rowOf(sq));

const onBoard = (r, c) => r >= 0 && r < 8 && c >= 0 && c < 8;

function buildSteps(steps) {
  return Array.from({ length: 64 }, (_, sq) =>
    steps
      .map(([dr, dc]) => [rowOf(sq) + dr, colOf(sq) + dc])
      .filter(([r, c]) => onBoard(r, c))
      .map(([r, c]) => r * 8 + c)
  );
}

function buildRays(dirs) {
  return Array.from({ length: 64 }, (_, sq) =>
    dirs.map(([dr, dc]) => {
      const ray = [];
      for (let r = rowOf(sq) + dr, c = colOf(sq) + dc; onBoard(r, c); ) {
        ray.push(r * 8 + c);
        r += dr;
        c += dc;
      }
      return ray;
    })
  );
}

const STRAIGHT = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1]
];
const DIAGONAL = [
  [-1, -1],
  [-1, 1],
  [1, -1],
  [1, 1]
];
const KNIGHT_TO = buildSteps([
  [-2, -1],
  [-2, 1],
  [-1, -2],
  [-1, 2],
  [1, -2],
  [1, 2],
  [2, -1],
  [2, 1]
]);
const KING_TO = buildSteps([...STRAIGHT, ...DIAGONAL]);
const ROOK_RAYS = buildRays(STRAIGHT);
const BISHOP_RAYS = buildRays(DIAGONAL);

// Castling rights kept when a move starts or ends on each square.
const CASTLE_KEEP = Array.from({ length: 64 }, () => 15);
CASTLE_KEEP[0] = 15 & ~BQ;
CASTLE_KEEP[4] = 15 & ~(BK | BQ);
CASTLE_KEEP[7] = 15 & ~BK;
CASTLE_KEEP[56] = 15 & ~WQ;
CASTLE_KEEP[60] = 15 & ~(WK | WQ);
CASTLE_KEEP[63] = 15 & ~WK;

export function initialPosition() {
  const board = new Int8Array(64);
  for (let c = 0; c < 8; c += 1) {
    board[c] = -BACK_RANK[c];
    board[8 + c] = -PAWN;
    board[48 + c] = PAWN;
    board[56 + c] = BACK_RANK[c];
  }
  return {
    board,
    turn: WHITE,
    castling: WK | WQ | BK | BQ,
    ep: -1,
    halfmove: 0
  };
}

function slidesTo(board, rays, sq, attackers) {
  for (const ray of rays[sq]) {
    for (const target of ray) {
      const piece = board[target];
      if (!piece) continue;
      if (attackers.includes(piece)) return true;
      break;
    }
  }
  return false;
}

// Is `sq` attacked by a piece of side `by`?
export function attacked(board, sq, by) {
  const pawnRow = rowOf(sq) + by;
  if (pawnRow >= 0 && pawnRow < 8) {
    for (const dc of [-1, 1]) {
      const c = colOf(sq) + dc;
      if (c >= 0 && c < 8 && board[pawnRow * 8 + c] === by * PAWN) return true;
    }
  }
  if (KNIGHT_TO[sq].some((t) => board[t] === by * KNIGHT)) return true;
  if (KING_TO[sq].some((t) => board[t] === by * KING)) return true;
  return (
    slidesTo(board, ROOK_RAYS, sq, [by * ROOK, by * QUEEN]) ||
    slidesTo(board, BISHOP_RAYS, sq, [by * BISHOP, by * QUEEN])
  );
}

export const kingSquare = (board, side) => board.indexOf(side * KING);

export const inCheck = (pos, side = pos.turn) =>
  attacked(pos.board, kingSquare(pos.board, side), -side);

const move = (from, to, taken = -1, promo = 0, rook = null) => ({
  from,
  to,
  promo,
  taken,
  rook
});

function pushPawn(moves, from, to, taken) {
  if (rowOf(to) === 0 || rowOf(to) === 7) {
    PROMOTIONS.forEach((promo) => moves.push(move(from, to, taken, promo)));
  } else moves.push(move(from, to, taken));
}

function pawnMoves({ board, turn: side, ep }, from, moves, capturesOnly) {
  const ahead = from - 8 * side;
  const lastRow = side === WHITE ? 0 : 7;
  if (!board[ahead] && (!capturesOnly || rowOf(ahead) === lastRow)) {
    pushPawn(moves, from, ahead, -1);
    const start = rowOf(from) === (side === WHITE ? 6 : 1);
    const twice = ahead - 8 * side;
    if (start && !capturesOnly && !board[twice]) moves.push(move(from, twice));
  }
  for (const dc of [-1, 1]) {
    const c = colOf(from) + dc;
    if (c < 0 || c > 7) continue;
    const to = ahead + dc;
    if (sideOf(board[to]) === -side) pushPawn(moves, from, to, to);
    else if (to === ep) moves.push(move(from, to, to + 8 * side));
  }
}

function stepMoves(board, from, targets, moves, capturesOnly) {
  const side = sideOf(board[from]);
  for (const to of targets[from]) {
    const other = sideOf(board[to]);
    if (other === side || (capturesOnly && !other)) continue;
    moves.push(move(from, to, other ? to : -1));
  }
}

function slideMoves(board, from, rays, moves, capturesOnly) {
  const side = sideOf(board[from]);
  for (const ray of rays[from]) {
    for (const to of ray) {
      const other = sideOf(board[to]);
      if (other === side) break;
      if (other || !capturesOnly) moves.push(move(from, to, other ? to : -1));
      if (other) break;
    }
  }
}

function castleMoves({ board, turn: side, castling }, moves) {
  const home = side === WHITE ? 60 : 4;
  const [kingBit, queenBit] = side === WHITE ? [WK, WQ] : [BK, BQ];
  if (!(castling & (kingBit | queenBit)) || board[home] !== side * KING) return;
  if (attacked(board, home, -side)) return;
  const free = (...squares) => squares.every((sq) => !board[sq]);
  const rookAt = (sq) => board[sq] === side * ROOK;
  if (
    castling & kingBit &&
    free(home + 1, home + 2) &&
    rookAt(home + 3) &&
    !attacked(board, home + 1, -side)
  ) {
    moves.push(move(home, home + 2, -1, 0, [home + 3, home + 1]));
  }
  if (
    castling & queenBit &&
    free(home - 1, home - 2, home - 3) &&
    rookAt(home - 4) &&
    !attacked(board, home - 1, -side)
  ) {
    moves.push(move(home, home - 2, -1, 0, [home - 4, home - 1]));
  }
}

const PIECE_MOVES = {
  [KNIGHT]: (b, sq, m, c) => stepMoves(b, sq, KNIGHT_TO, m, c),
  [BISHOP]: (b, sq, m, c) => slideMoves(b, sq, BISHOP_RAYS, m, c),
  [ROOK]: (b, sq, m, c) => slideMoves(b, sq, ROOK_RAYS, m, c),
  [QUEEN]: (b, sq, m, c) => {
    slideMoves(b, sq, ROOK_RAYS, m, c);
    slideMoves(b, sq, BISHOP_RAYS, m, c);
  },
  [KING]: (b, sq, m, c) => stepMoves(b, sq, KING_TO, m, c)
};

// Moves that ignore whether the mover's king is left in check. With
// `capturesOnly`: captures and promotions, no castling.
export function pseudoMoves(pos, capturesOnly = false) {
  const { board, turn } = pos;
  const moves = [];
  for (let sq = 0; sq < 64; sq += 1) {
    const piece = board[sq];
    if (sideOf(piece) !== turn) continue;
    if (typeOf(piece) === PAWN) pawnMoves(pos, sq, moves, capturesOnly);
    else PIECE_MOVES[typeOf(piece)](board, sq, moves, capturesOnly);
  }
  if (!capturesOnly) castleMoves(pos, moves);
  return moves;
}

// En passant square, kept only when an enemy pawn can actually take there,
// so that repeated positions compare equal.
function epSquare(board, from, to) {
  if (typeOf(board[to]) !== PAWN || Math.abs(to - from) !== 16) return -1;
  const enemy = -sideOf(board[to]) * PAWN;
  const left = colOf(to) > 0 && board[to - 1] === enemy;
  const right = colOf(to) < 7 && board[to + 1] === enemy;
  return left || right ? (from + to) / 2 : -1;
}

export function applyMove(pos, m) {
  const board = pos.board.slice();
  const piece = board[m.from];
  if (m.taken >= 0) board[m.taken] = 0;
  board[m.to] = m.promo ? sideOf(piece) * m.promo : piece;
  board[m.from] = 0;
  if (m.rook) {
    board[m.rook[1]] = board[m.rook[0]];
    board[m.rook[0]] = 0;
  }
  const reset = typeOf(piece) === PAWN || m.taken >= 0;
  return {
    board,
    turn: -pos.turn,
    castling: pos.castling & CASTLE_KEEP[m.from] & CASTLE_KEEP[m.to],
    ep: epSquare(board, m.from, m.to),
    halfmove: reset ? 0 : pos.halfmove + 1
  };
}

// The move just played into `child` left its own king attacked.
export const exposesKing = (child) => inCheck(child, -child.turn);

export const legalMoves = (pos) =>
  pseudoMoves(pos).filter((m) => !exposesKing(applyMove(pos, m)));

// Neither side can ever mate: kings alone, one minor piece, or bishops all
// on squares of one colour.
export function insufficientMaterial(board) {
  const others = [];
  for (let sq = 0; sq < 64; sq += 1) {
    const type = typeOf(board[sq]);
    if (type === PAWN || type === ROOK || type === QUEEN) return false;
    if (type === KNIGHT || type === BISHOP) others.push({ type, sq });
  }
  if (others.length <= 1) return true;
  const shade = isDarkSquare(others[0].sq);
  return others.every((p) => p.type === BISHOP && isDarkSquare(p.sq) === shade);
}

export const positionKey = (pos) =>
  `${pos.turn}|${pos.castling}|${pos.ep}|${pos.board.join(",")}`;
