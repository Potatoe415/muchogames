// Computer player: negamax alpha-beta over rules.js with a capture search
// past the horizon (quiescence) and a check extension. Pure, runs in the
// worker.
import { evaluate, VALUE } from "./eval.js";
import {
  applyMove,
  exposesKing,
  inCheck,
  legalMoves,
  positionKey,
  pseudoMoves,
  typeOf
} from "./rules.js";

export const LEVEL_IDS = ["easy", "medium", "hard", "expert"];

// randomRate: share of plain random moves. jitter: any root move within this
// many centipawns of the best one may be picked, so play varies. quiesce:
// whether exchanges are searched to the end (without it, pieces get hung).
const LEVELS = {
  easy: { depth: 1, randomRate: 0.3, jitter: 90, quiesce: false },
  medium: { depth: 2, randomRate: 0.05, jitter: 30, quiesce: true },
  hard: { depth: 4, randomRate: 0, jitter: 8, quiesce: true },
  expert: { depth: 12, timeMs: 1500, randomRate: 0, jitter: 0, quiesce: true },
  hint: { depth: 4, randomRate: 0, jitter: 0, quiesce: true }
};

const MATE = 100000;
const MAX_PLY = 24;
const TIMEOUT = Symbol("timeout");

// Captures first (most valuable victim, least valuable attacker), then
// promotions, then quiet moves.
function weight(board, m) {
  let w = m.promo ? VALUE[m.promo] : 0;
  if (m.taken >= 0)
    w +=
      10 * VALUE[typeOf(board[m.taken])] - VALUE[typeOf(board[m.from])] + 1000;
  return w;
}

function ordered(board, moves, first) {
  return moves
    .map((m) => ({ m, w: m === first ? Infinity : weight(board, m) }))
    .sort((a, b) => b.w - a.w)
    .map(({ m }) => m);
}

function tick(ctx) {
  ctx.nodes += 1;
  if (ctx.deadline && (ctx.nodes & 1023) === 0 && Date.now() > ctx.deadline)
    throw TIMEOUT;
}

function quiesce(pos, alpha, beta, ctx) {
  tick(ctx);
  const stand = evaluate(pos.board, pos.turn);
  if (!ctx.quiesce || stand >= beta) return stand;
  let best = stand;
  if (stand > alpha) alpha = stand;
  for (const m of ordered(pos.board, pseudoMoves(pos, true))) {
    const child = applyMove(pos, m);
    if (exposesKing(child)) continue;
    const score = -quiesce(child, -beta, -alpha, ctx);
    if (score > best) best = score;
    if (score > alpha) alpha = score;
    if (alpha >= beta) break;
  }
  return best;
}

function negamax(pos, depth, alpha, beta, ply, ctx) {
  const checked = inCheck(pos);
  if (depth <= 0 && !(checked && ply < MAX_PLY))
    return quiesce(pos, alpha, beta, ctx);
  tick(ctx);
  if (pos.halfmove >= 100) return 0;
  let best = -Infinity;
  for (const m of ordered(pos.board, pseudoMoves(pos))) {
    const child = applyMove(pos, m);
    if (exposesKing(child)) continue;
    const score = -negamax(child, depth - 1, -beta, -alpha, ply + 1, ctx);
    if (score > best) best = score;
    if (score > alpha) alpha = score;
    if (alpha >= beta) break;
  }
  if (best === -Infinity) return checked ? -MATE + ply : 0;
  return best;
}

// A root move back into a position already seen in the game counts as a
// draw: the computer repeats only when it is worse off.
function rootScore(pos, m, depth, alpha, ctx) {
  const child = applyMove(pos, m);
  if (ctx.seen.has(positionKey(child))) return 0;
  return -negamax(child, depth - 1, -Infinity, -alpha, 1, ctx);
}

// Scores every root move; a move that cannot come within `jitter` of the
// best is only bounded, never picked.
function scoreRoot(pos, moves, depth, jitter, ctx) {
  let floor = -Infinity;
  return moves.map((m) => {
    const score = rootScore(pos, m, depth, floor, ctx);
    floor = Math.max(floor, score - jitter - 1);
    return score;
  });
}

// Iterative deepening until the time budget runs out; the last completed
// depth wins. The previous best move is searched first at each depth.
function deepen(pos, moves, cfg, ctx) {
  ctx.deadline = Date.now() + cfg.timeMs;
  let scores = scoreRoot(pos, moves, 1, 0, ctx);
  for (let depth = 2; depth <= cfg.depth; depth += 1) {
    try {
      const best = scores.indexOf(Math.max(...scores));
      const order = ordered(pos.board, moves, moves[best]);
      const next = scoreRoot(pos, order, depth, 0, ctx);
      scores = moves.map((m) => next[order.indexOf(m)]);
      if (Math.max(...scores) > MATE / 2) break;
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

// Index of the chosen move in legalMoves(pos). `seen`: position keys of the
// game so far.
export function chooseMove(pos, level, seen = [], random = Math.random) {
  const cfg = LEVELS[level] || LEVELS.medium;
  const moves = legalMoves(pos);
  if (moves.length <= 1) return 0;
  if (random() < cfg.randomRate) return Math.floor(random() * moves.length);
  const ctx = {
    nodes: 0,
    deadline: 0,
    quiesce: cfg.quiesce,
    seen: new Set(seen)
  };
  const order = ordered(pos.board, moves);
  const scores = cfg.timeMs
    ? deepen(pos, order, cfg, ctx)
    : scoreRoot(pos, order, cfg.depth, cfg.jitter, ctx);
  return moves.indexOf(order[pick(scores, cfg.jitter, random)]);
}
