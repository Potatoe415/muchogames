import type { Card, GameState, Rank, Suit, TableauCard } from "./types";

/** Deterministic RNG (mulberry32) for reproducible shuffles in tests - same
 *  algorithm as every other game's `test-utils.ts`. */
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

export function card(rank: Rank, suit: Suit): Card {
  return { rank, suit };
}

export function up(rank: Rank, suit: Suit): TableauCard {
  return { card: card(rank, suit), faceUp: true };
}

export function down(rank: Rank, suit: Suit): TableauCard {
  return { card: card(rank, suit), faceUp: false };
}

/** A bare "playing" state with explicit piles, for tests that need precise
 *  control instead of a random deal. Missing columns are empty. */
export function stateWith(opts: {
  stock?: Card[];
  waste?: Card[];
  foundations?: Partial<GameState["foundations"]>;
  tableau?: TableauCard[][];
  drawCount?: GameState["drawCount"];
}): GameState {
  const tableau = Array.from({ length: 7 }, (_, col) => opts.tableau?.[col] ?? []);
  return {
    phase: "playing",
    drawCount: opts.drawCount ?? 1,
    stock: opts.stock ?? [],
    waste: opts.waste ?? [],
    foundations: { H: [], D: [], C: [], S: [], ...opts.foundations },
    tableau,
    moves: 0,
  };
}
