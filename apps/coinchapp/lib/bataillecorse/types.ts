import type { CardOf } from "@/lib/cards";

export type { Suit } from "@/lib/cards";

/** Full 52-card pack, or a piquet-style 32-card pack (7 and up only) - the
 *  table's own deck-size setting picks between the two, no jokers either way
 *  (see docs/DECISIONS.md), see `DeckSize`/`buildDeck` in `cards.ts`. */
export type Rank = "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K" | "A";

export type Card = CardOf<Rank>;

/** The only two deck sizes the table offers (see docs/DECISIONS.md): 32
 *  (piquet-style, 7 and up) or 52 (the full pack). No jokers either way. */
export type DeckSize = 32 | 52;

/** Only ever 2 players (see docs/DECISIONS.md) - deliberately not the shared
 *  4-seat `Seat` from `@/lib/cards`. */
export type Seat = 0 | 1;

export type Phase = "playing" | "finished";

export type SlapPattern = "double" | "sandwich";

/** Owed by `seat`: they must produce a figure/ace within `attemptsLeft` plays,
 *  or the other seat wins the whole pile. `fromRank` is the challenge card's
 *  rank, kept only for display. */
export interface Tribute {
  seat: Seat;
  attemptsLeft: number;
  fromRank: Rank;
}

/** A live "everyone can slap" opportunity, opened the instant a double/sandwich
 *  appears on top of the pile. `openedAtMs` is a wall-clock instant (not
 *  network-dependent - see `resolveStaleSlapWindow`) used only to auto-resolve
 *  a window nobody (or only one seat) reacted to in time. */
export interface SlapWindow {
  id: number;
  pattern: SlapPattern;
  openedAtMs: number;
}

/** A seat's self-measured local reaction time (ms from when *that seat's own
 *  client* first rendered the open window to when it tapped) - never a
 *  network/arrival-order comparison, see docs/DECISIONS.md. */
export interface SlapClaim {
  seat: Seat;
  reactionMs: number;
}

/** Display-only event markers, diffed by `id` (a monotonic counter) rather
 *  than content, so the UI can flash exactly once per occurrence even across
 *  network round-trips - same pattern as Président's `lastBurn`/`lastSkip`. */
export interface PileWinEvent {
  id: number;
  seat: Seat;
  cardCount: number;
  reason: "tribute" | "slap" | "falseSlap";
  /** Only set when `reason === "slap"`: each seat's own locally-measured
   *  reaction time that decided the race (see `SlapClaim`) - lets both
   *  players' UI show the opponent's reflex too, not just their own. Missing
   *  a seat's entry means that seat never claimed (the other won
   *  uncontested via `resolveStaleSlapWindow`). */
  reactionMsBySeat?: Partial<Record<Seat, number>>;
}

export interface FalseSlapEvent {
  id: number;
  seat: Seat;
}

export interface GameState {
  phase: Phase;
  /** Whose turn it is to flip the next card - either a plain flip, or paying
   *  the current `tribute` (always the same seat as `tribute.seat` while one
   *  is pending). Irrelevant to who may attempt a slap: that's open to either
   *  seat at any time a `slapWindow` is live. */
  turn: Seat;
  /** stocks[seat] = that seat's face-down draw pile. Last element = top (next
   *  to be flipped). Remaining order is hidden from the opponent; the owner's
   *  redacted view gets only that top card as `myTopCard` (see `redact.ts`). */
  stocks: [Card[], Card[]];
  /** Center pile, face up. Last element = top (most recently played). */
  pile: Card[];
  tribute: Tribute | null;
  slapWindow: SlapWindow | null;
  /** Claims collected for the *current* `slapWindow` (cleared once it closes). */
  slapClaims: SlapClaim[];
  /** Id of the most recently closed window (resolved or missed) - lets a
   *  legitimately-late claim for an already-decided window be ignored instead
   *  of penalized as a false slap. */
  lastClosedSlapWindowId: number | null;
  nextSlapWindowId: number;
  nextEventId: number;
  winner: Seat | null;
  lastPileWin: PileWinEvent | null;
  lastFalseSlap: FalseSlapEvent | null;
}

/** How long a slap window stays open collecting claims before it auto-resolves
 *  (1 claim = that seat wins uncontested; 0 claims = missed, game continues) -
 *  see `resolveStaleSlapWindow`. Comfortably above real-world round-trip times
 *  so two genuine human claims are (in practice) always both collected and
 *  compared purely on `reactionMs`, never on arrival order. */
export const SLAP_GRACE_MS = 3000;
