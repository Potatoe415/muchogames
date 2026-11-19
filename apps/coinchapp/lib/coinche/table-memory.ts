import { isTrump, RANKS } from "./cards";
import type { Card, Rank, Suit, Trick, TrumpMode } from "./types";

/** What any player at the table can deduce from public play alone. */
export interface TableState {
  /** Every card played this deal, current trick included. */
  played: Card[];
  /** Trumps played so far (single-suit trump only; 0 in TA/SA). */
  trumpsPlayed: number;
  /** Suits whose ace / ten has already fallen. */
  acesDown: Set<Suit>;
  tensDown: Set<Suit>;
  /** Known voids per seat: a seat that did not follow the led suit cannot hold it. */
  voids: Set<Suit>[];
}

function scanTrick(trick: Trick, voids: Set<Suit>[]): void {
  if (trick.cards.length === 0) return;
  const led = trick.cards[0].card.suit;
  for (const p of trick.cards) if (p.card.suit !== led) voids[p.seat].add(led);
}

/** Pure, never looks at hidden hands: only completed tricks and the open trick. */
export function analyzeTableState(tricks: Trick[], currentTrick: Trick, trump: TrumpMode | null): TableState {
  const voids: Set<Suit>[] = [new Set(), new Set(), new Set(), new Set()];
  const all = [...tricks, currentTrick];
  for (const trick of all) scanTrick(trick, voids);
  const played = all.flatMap((t) => t.cards.map((p) => p.card));
  const single = trump !== null && trump !== "TA" && trump !== "SA";
  return {
    played,
    trumpsPlayed: single ? played.filter((c) => isTrump(c, trump)).length : 0,
    acesDown: suitsWith(played, "A"),
    tensDown: suitsWith(played, "10"),
    voids,
  };
}

function suitsWith(cards: Card[], rank: Rank): Set<Suit> {
  return new Set(cards.filter((c) => c.rank === rank).map((c) => c.suit));
}

/** Trumps neither in `hand` nor played: held by the other three seats. */
export function trumpsOutside(hand: Card[], table: TableState, trump: Suit): number {
  return RANKS.length - hand.filter((c) => c.suit === trump).length - table.trumpsPlayed;
}
