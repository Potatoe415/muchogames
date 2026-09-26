import { isChallengeRank } from "./cards";
import type { Card, SlapPattern } from "./types";

/** Same double/sandwich test, run against the real pile only. */
function detectOnSequence(cards: Card[]): SlapPattern | null {
  const n = cards.length;
  if (n >= 2 && cards[n - 1].rank === cards[n - 2].rank) return "double";
  if (n >= 3 && cards[n - 1].rank === cards[n - 3].rank) return "sandwich";
  return null;
}

/** Same "top 2 share a rank" test as `detectOnSequence`'s double branch, but
 *  standalone: the figure/ace-filtered check below must only ever reuse
 *  this half, never the sandwich half (see `detectSlapPattern`). */
function detectDouble(cards: Card[]): SlapPattern | null {
  const n = cards.length;
  return n >= 2 && cards[n - 1].rank === cards[n - 2].rank ? "double" : null;
}

/** Detects a live slap opportunity on top of the pile (last element = top):
 *  - "double": the top 2 cards share the same rank.
 *  - "sandwich": the top card and the one 2 below it share the same rank
 *    (exactly one *real* card between them - never relaxed, see below).
 *  When the top card is itself a figure/ace, the double check (only) also
 *  runs again on the pile filtered down to just figure/ace cards: while a
 *  tribute is being paid, a seat's own plain attempts (see
 *  `resolveTributeEffect`) sit between the challenge card and whichever
 *  later figure/ace actually answers it - e.g. As, 3, 5, 9, As. Those plain
 *  filler cards don't break the *double* pattern for the figures themselves:
 *  an As "right after" an As, or a Valet right after a Valet, still counts
 *  even with ordinary attempts in between (see docs/DECISIONS.md).
 *  Sandwich is deliberately excluded from this filtered check: a sandwich is
 *  defined by exactly one real card sitting between the two matching cards,
 *  and that stops being a meaningful, at-the-table-visible rule the moment
 *  filler cards get filtered out from under it (see docs/decisions - a real
 *  pile like Q, K, 8, 7, Q has 3 real cards between the Qs, not 1, even
 *  though only one of them, the K, is itself a figure). Guarding on the
 *  real top card being a figure/ace keeps the double check from resurrecting
 *  a stale figure/ace pair once an unrelated plain card has since been
 *  played on top of it. */
export function detectSlapPattern(pile: Card[]): SlapPattern | null {
  const direct = detectOnSequence(pile);
  if (direct) return direct;
  const top = pile[pile.length - 1];
  if (!top || !isChallengeRank(top.rank)) return null;
  return detectDouble(pile.filter((c) => isChallengeRank(c.rank)));
}
