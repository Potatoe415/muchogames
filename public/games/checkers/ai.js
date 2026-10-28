// Computer player: negamax alpha-beta over rules.js, with capture extension
// (forced captures are searched past the horizon). Pure, runs in the worker.
import {
  applyMove,
  crowns,
  isKing,
  legalMoves,
  LIGHT,
  sideOf,
  VARIANTS
} from "./rules.js";

export const LEVEL_IDS = ["easy", "medium", "hard", "expert"];

// randomRate: share of plain random moves. jitter: any root move within this
// many points of the best one may be picked, so play varies between games.
const LEVELS = {
  easy: { depth: 1, randomRate: 0.45, jitter: 60 },
  medium: { depth: 3, randomRate: 0.08, jitter: 25 },
  hard: { depth: 5, randomRate: 0, jitter: 4 },
  expert: { depth: 16, timeMs: 1400, randomRate: 0, jitter: 0 },
  hint: { depth: 5, randomRate: 0, jitter: 0 }
};

const WIN = 100000;
const MAX_EXTENSION = 8;
const TIMEOUT = Symbol("timeout");

function pieceValue(variant, piece, sq) {
  const { size } = variant;
  if (isKing(piece)) return variant.flyingKings ? 330 : 170;
  const row = Math.floor(sq / size);
  const col = sq % size;
  const advance = sideOf(piece) === LIGHT ? size - 1 - row : row;
  const centre = size / 2 - Math.abs(col - (size - 1) / 2);
  const homeGuard = advance === 0 ? 8 : 0;
  return (
    100 + advance * 4 + (advance >= size - 3 ? 12 : 0) + centre * 2 + homeGuard
  );
}

function evaluate(board, variant, side) {
  let score = 0;
  for (let sq = 0; sq < board.length; sq += 1) {
    const piece = board[sq];
    if (piece) score += sideOf(piece) * pieceValue(variant, piece, sq);
  }
  return score * side;
}

function ordered(board, variant, moves) {
  return moves
    .map((move) => ({ move, weight: crowns(board, variant, move) ? 1 : 0 }))
    .sort((a, b) => b.weight - a.weight)
    .map(({ move }) => move);
}

const childOf = (board, variant, side, move, ctx) => ({
  board: applyMove(board, variant, move),
  variant,
  side: -side,
  ctx
});

function negamax(node, depth, alpha, beta, ply, extension) {
  const { board, variant, side, ctx } = node;
  ctx.nodes += 1;
  if (ctx.deadline && (ctx.nodes & 1023) === 0 && Date.now() > ctx.deadline) {
    throw TIMEOUT;
  }
  const moves = legalMoves(board, variant, side);
  if (!moves.length) return -WIN + ply;
  const forced = moves[0].captures.length > 0;
  if (depth <= 0 && (!forced || extension >= MAX_EXTENSION)) {
    return evaluate(board, variant, side);
  }
  let best = -Infinity;
  for (const move of ordered(board, variant, moves)) {
    const child = childOf(board, variant, side, move, ctx);
    const nextExtension = depth <= 0 ? extension + 1 : extension;
    const score = -negamax(
      child,
      depth - 1,
      -beta,
      -alpha,
      ply + 1,
      nextExtension
    );
    if (score > best) best = score;
    if (score > alpha) alpha = score;
    if (alpha >= beta) break;
  }
  return best;
}

// Full-window score of every root move at a fixed depth.
function scoreRoot(board, variant, side, moves, depth, ctx) {
  return moves.map((move) => {
    const child = childOf(board, variant, side, move, ctx);
    return -negamax(child, depth - 1, -Infinity, Infinity, 1, 0);
  });
}

// Iterative deepening until the time budget runs out; the last completed
// depth wins. The previous best move is searched first at each depth.
function deepen(board, variant, side, moves, cfg) {
  const ctx = { nodes: 0, deadline: Date.now() + cfg.timeMs };
  let order = moves.map((_, i) => i);
  let scores = scoreRoot(board, variant, side, moves, 1, ctx);
  for (let depth = 2; depth <= cfg.depth; depth += 1) {
    try {
      const best = order.reduce((a, b) => (scores[b] > scores[a] ? b : a));
      order = [best, ...order.filter((i) => i !== best)];
      const next = [];
      let alpha = -Infinity;
      for (const i of order) {
        const child = childOf(board, variant, side, moves[i], ctx);
        // Beta one point above -alpha: a move that only ties is scored exactly.
        next[i] = -negamax(child, depth - 1, -Infinity, -alpha + 1, 1, 0);
        alpha = Math.max(alpha, next[i]);
      }
      scores = next;
      if (Math.abs(alpha) > WIN / 2) break;
    } catch (error) {
      if (error !== TIMEOUT) throw error;
      break;
    }
  }
  return scores;
}

function pick(scores, jitter, random) {
  const best = Math.max(...scores);
  const close = scores
    .map((score, i) => ({ score, i }))
    .filter(({ score }) => score >= best - jitter);
  return close[Math.floor(random() * close.length)].i;
}

// Index of the chosen move in legalMoves(board, variant, side).
export function chooseMove(
  board,
  variantId,
  side,
  level,
  random = Math.random
) {
  const variant = VARIANTS[variantId];
  const cfg = LEVELS[level] || LEVELS.medium;
  const moves = legalMoves(board, variant, side);
  if (moves.length <= 1) return 0;
  if (random() < cfg.randomRate) return Math.floor(random() * moves.length);
  const scores = cfg.timeMs
    ? deepen(board, variant, side, moves, cfg)
    : scoreRoot(board, variant, side, moves, cfg.depth, { nodes: 0 });
  return pick(scores, cfg.jitter, random);
}
