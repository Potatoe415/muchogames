import type { Card, SlapPattern } from "./types";

/** Detects a live slap opportunity on top of the pile (last element = top):
 *  - "double": the top 2 cards share the same rank.
 *  - "sandwich": the top card and the one 2 below it share the same rank
 *    (exactly one real card between them).
 *  Always evaluated on the real, unfiltered pile - no figure/ace-only
 *  exception (see docs/decisions/0067). `resolveTributeEffect` opens a
 *  fresh tribute on *every* challenge-rank flip, unconditionally, so the
 *  card that closes a tribute (by matching it, or by any other
 *  challenge-rank card) is always simultaneously the one that opens the
 *  next chain - "the ace I just answered with" is a new chain, not a
 *  continuation of the one it just closed, even when its rank happens to
 *  match the card that opened that chain. A 1-filler gap between two
 *  same-rank challenge cards still fires here as a literal sandwich (no
 *  filtering needed for that); 2+ fillers in between fires nothing. */
export function detectSlapPattern(pile: Card[]): SlapPattern | null {
  const n = pile.length;
  if (n >= 2 && pile[n - 1].rank === pile[n - 2].rank) return "double";
  if (n >= 3 && pile[n - 1].rank === pile[n - 3].rank) return "sandwich";
  return null;
}
