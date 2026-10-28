// Double-dummy solver: with all four hands known, the most tricks a side can
// take from here. Alpha-beta over the plays, a transposition table at the
// start of each trick, touching cards merged into one move.
import { rankOf, suitOf } from "./cards.js";

class Budget extends Error {}

function winnerOf(trick, trump) {
  let best = trick[0];
  for (let i = 1; i < 4; i += 1) {
    const p = trick[i];
    if (p.suit === best.suit ? p.rank > best.rank : p.suit === trump) best = p;
  }
  return best.seat;
}

const keyOf = (st) =>
  `${st.leader}:${st.masks.map((m) => m.join(",")).join("|")}`;

function liveMask(st, suit) {
  let live =
    st.masks[0][suit] |
    st.masks[1][suit] |
    st.masks[2][suit] |
    st.masks[3][suit];
  st.trick.forEach((p) => {
    if (p.suit === suit) live |= 1 << p.rank;
  });
  return live;
}

function rawMoves(st, seat) {
  const m = st.masks[seat];
  const led = st.trick.length ? st.trick[0].suit : -1;
  const suits = led >= 0 && m[led] ? [led] : [0, 1, 2, 3];
  const list = [];
  suits.forEach((suit) => {
    const mine = m[suit];
    if (!mine) return;
    const live = liveMask(st, suit);
    let run = false;
    for (let r = 12; r >= 0; r -= 1) {
      const bit = 1 << r;
      if (!(live & bit)) continue;
      if (mine & bit) {
        if (!run) list.push({ suit, rank: r });
        run = true;
      } else run = false;
    }
  });
  return list;
}

// Following: the cheapest winner first, then low cards. Leading: high first.
function moves(st, seat) {
  const list = rawMoves(st, seat);
  if (!st.trick.length) return list;
  const win = st.trick.reduce((best, p) =>
    p.suit === best.suit
      ? p.rank > best.rank
        ? p
        : best
      : p.suit === st.trump
        ? p
        : best
  );
  const beatsWin = (mv) =>
    mv.suit === win.suit ? mv.rank > win.rank : mv.suit === st.trump;
  list.sort((a, b) => a.rank - b.rank);
  const first = list.findIndex(beatsWin);
  if (first > 0) list.unshift(list.splice(first, 1)[0]);
  return list;
}

function playMove(st, seat, mv, alpha, beta) {
  const bit = 1 << mv.rank;
  st.masks[seat][mv.suit] &= ~bit;
  st.trick.push({ seat, suit: mv.suit, rank: mv.rank });
  let value;
  if (st.trick.length === 4) {
    const { trick, leader } = st;
    const w = winnerOf(trick, st.trump);
    const gain = (w & 1) === st.maxSide ? 1 : 0;
    st.trick = [];
    st.leader = w;
    st.left -= 1;
    value = gain + search(st, alpha - gain, beta - gain);
    st.left += 1;
    st.leader = leader;
    st.trick = trick;
  } else value = search(st, alpha, beta);
  st.trick.pop();
  st.masks[seat][mv.suit] |= bit;
  return value;
}

function expand(st, alpha, beta) {
  if ((st.nodes += 1) > st.limit) throw new Budget();
  const seat = (st.leader + st.trick.length) % 4;
  const maxing = (seat & 1) === st.maxSide;
  let best = maxing ? -1 : 99;
  for (const mv of moves(st, seat)) {
    const value = playMove(st, seat, mv, alpha, beta);
    if (maxing) {
      if (value > best) best = value;
      if (best > alpha) alpha = best;
    } else {
      if (value < best) best = value;
      if (best < beta) beta = best;
    }
    if (alpha >= beta) break;
  }
  return best;
}

function search(st, alpha, beta) {
  if (st.trick.length) return expand(st, alpha, beta);
  if (st.left === 0) return 0;
  const key = keyOf(st);
  const hit = st.table.get(key);
  if (hit) {
    if (hit.lo >= beta || hit.lo === hit.hi) return hit.lo;
    if (hit.hi <= alpha) return hit.hi;
    alpha = Math.max(alpha, hit.lo);
    beta = Math.min(beta, hit.hi);
  }
  const value = expand(st, alpha, beta);
  const entry = hit || { lo: 0, hi: st.left };
  if (value <= alpha) entry.hi = Math.min(entry.hi, value);
  else if (value >= beta) entry.lo = Math.max(entry.lo, value);
  else entry.lo = entry.hi = value;
  st.table.set(key, entry);
  return value;
}

// hands: the four remaining hands; trick: plays of the trick in progress.
// valueOf(seat, card) → tricks for `maxSide` from this trick on if `seat`
// plays `card` now, or null once `limit` nodes are spent.
export function createSolver({
  hands,
  trick,
  leader,
  trump,
  maxSide,
  limit = 2e6
}) {
  const st = {
    masks: hands.map((cards) => {
      const m = [0, 0, 0, 0];
      cards.forEach((c) => (m[suitOf(c)] |= 1 << rankOf(c)));
      return m;
    }),
    trick: trick.map(({ seat, card }) => ({
      seat,
      suit: suitOf(card),
      rank: rankOf(card)
    })),
    leader,
    trump,
    maxSide,
    left: Math.max(...hands.map((h) => h.length)),
    table: new Map(),
    nodes: 0,
    limit
  };
  // An aborted search leaves the position half-played: the solver is spent.
  let spent = false;
  const run = (fn) => {
    if (spent) return null;
    try {
      return fn();
    } catch (error) {
      if (!(error instanceof Budget)) throw error;
      spent = true;
      return null;
    }
  };
  return {
    valueOf: (seat, card) =>
      run(() =>
        playMove(st, seat, { suit: suitOf(card), rank: rankOf(card) }, -1, 14)
      ),
    // Tricks for `maxSide` from here with best play by everyone.
    value: () => run(() => search(st, -1, 14))
  };
}
