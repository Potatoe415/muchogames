import type { Card, GameState, Rank, Seat, Suit } from "./types";

/** Deterministic RNG (mulberry32) for reproducible shuffles in tests - same
 *  algorithm as every other game's `test-utils.ts` (see docs/DECISIONS.md). */
export function seededRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function card(rank: Rank, suit: Suit = "S"): Card {
  return { rank, suit };
}

/** Builds a bare "playing"-phase state with explicit stocks/pile, for tests
 *  that need precise control instead of a random deal. */
export function stateWith(opts: {
  turn: Seat;
  stocks: [Card[], Card[]];
  pile?: Card[];
  tribute?: GameState["tribute"];
  slapWindow?: GameState["slapWindow"];
  slapClaims?: GameState["slapClaims"];
  lastClosedSlapWindowId?: number | null;
  nextSlapWindowId?: number;
  pendingTributeWinner?: GameState["pendingTributeWinner"];
}): GameState {
  return {
    phase: "playing",
    turn: opts.turn,
    stocks: opts.stocks,
    pile: opts.pile ?? [],
    tribute: opts.tribute ?? null,
    slapWindow: opts.slapWindow ?? null,
    slapClaims: opts.slapClaims ?? [],
    lastClosedSlapWindowId: opts.lastClosedSlapWindowId ?? null,
    nextSlapWindowId: opts.nextSlapWindowId ?? 0,
    nextEventId: 0,
    winner: null,
    lastPileWin: null,
    lastFalseSlap: null,
    pendingTributeWinner: opts.pendingTributeWinner ?? null,
  };
}
