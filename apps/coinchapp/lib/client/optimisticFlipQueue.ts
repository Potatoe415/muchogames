import { detectSlapPattern, type Card, type PlayerView, type Seat, type Tribute } from "@/lib/bataillecorse";
import { resolveTributeEffect } from "@/lib/bataillecorse/tribute";

/** Whether this seat may flip right now. `blocked` covers UI-only holds the
 *  engine does not know about (the pile-win sweep), so taps during that
 *  animation cannot queue real flips. */
export function canFlip(view: PlayerView, mySeat: number, blocked = false): boolean {
  return !blocked && view.phase === "playing" && view.turn === mySeat && view.slapWindow === null;
}

/** Own upcoming cards in play order. Falls back to `myTopCard` when a view
 *  was built before `myNextCards` existed. */
export function nextCards(view: PlayerView): Card[] {
  if (view.myNextCards.length > 0) return view.myNextCards;
  return view.myTopCard ? [view.myTopCard] : [];
}

interface Chain {
  pile: Card[];
  tribute: Tribute | null;
  turn: number;
  stop: boolean;
}

function stepChain(state: Chain, card: Card, mySeat: Seat): Chain {
  const outcome = resolveTributeEffect(card, mySeat, state.tribute);
  const pile = [...state.pile, card];
  const slap = detectSlapPattern(pile) !== null;
  const stop = outcome.challengeFailedWinner !== null || slap || outcome.turn !== mySeat;
  return { pile, tribute: outcome.tribute, turn: outcome.turn, stop };
}

/** How many flips this seat can paint from the current view without waiting:
 *  one on a normal turn, or every tribute attempt still owed until a card
 *  would pass the turn, open a slap, or fail the tribute. */
export function flipLimit(view: PlayerView, mySeat: number): number {
  if (!canFlip(view, mySeat)) return 0;
  let state: Chain = { pile: view.pile, tribute: view.tribute, turn: view.turn, stop: false };
  let count = 0;
  for (const card of nextCards(view)) {
    if (state.turn !== mySeat) break;
    state = stepChain(state, card, mySeat as Seat);
    count += 1;
    if (state.stop) break;
  }
  return count;
}

export interface FlipProjection {
  pile: Card[];
  stockCount: number;
  tribute: Tribute | null;
  turn: number;
}

/** Applies `queue` onto the server view for display. Stops at the first card
 *  that ends the chain, so an illegal tail never appears on the pile. */
export function projectQueue(view: PlayerView, mySeat: number, queue: Card[]): FlipProjection {
  let state: Chain = { pile: view.pile, tribute: view.tribute, turn: view.turn, stop: false };
  let applied = 0;
  for (const card of queue) {
    if (state.turn !== mySeat) break;
    state = stepChain(state, card, mySeat as Seat);
    applied += 1;
    if (state.stop) break;
  }
  return {
    pile: applied === 0 ? view.pile : state.pile,
    stockCount: Math.max(0, view.myStockCount - applied),
    tribute: state.tribute,
    turn: state.turn,
  };
}

export interface FlipAnchor {
  pileLength: number;
  lastPileWinId: number | null;
}

export function anchorOf(view: PlayerView): FlipAnchor {
  return { pileLength: view.pile.length, lastPileWinId: view.lastPileWin?.id ?? null };
}

function sameCard(a: Card | undefined, b: Card | undefined): boolean {
  return Boolean(a) && Boolean(b) && a!.rank === b!.rank && a!.suit === b!.suit;
}

/** Drops a prefix of `queue` once those cards are the new tail of `view.pile`.
 *  A swept pile, a new win, or a card we did not predict clears the queue. */
export function reconcileFlipQueue(
  view: PlayerView,
  mySeat: number,
  queue: Card[],
  anchor: FlipAnchor,
): { queue: Card[]; anchor: FlipAnchor; changed: boolean } {
  const fresh = anchorOf(view);
  if (queue.length === 0) {
    const changed = fresh.pileLength !== anchor.pileLength || fresh.lastPileWinId !== anchor.lastPileWinId;
    return { queue, anchor: changed ? fresh : anchor, changed };
  }
  if (view.phase !== "playing" || view.pile.length < anchor.pileLength || fresh.lastPileWinId !== anchor.lastPileWinId) {
    return { queue: [], anchor: fresh, changed: true };
  }
  const grown = view.pile.length - anchor.pileLength;
  if (!prefixMatches(view.pile, anchor.pileLength, queue, grown) || grown > queue.length) {
    return { queue: [], anchor: fresh, changed: true };
  }
  const tail = grown === 0 ? queue : queue.slice(grown);
  const rest = capQueue(view, mySeat, tail);
  if (rest === queue) return { queue, anchor, changed: false };
  return { queue: rest, anchor: { pileLength: anchor.pileLength + grown, lastPileWinId: fresh.lastPileWinId }, changed: true };
}

function prefixMatches(pile: Card[], start: number, queue: Card[], grown: number): boolean {
  for (let i = 0; i < grown; i++) {
    if (!sameCard(pile[start + i], queue[i])) return false;
  }
  return true;
}

/** Keeps only the tail that is still this seat's own next cards, in order. */
function capQueue(view: PlayerView, mySeat: number, queue: Card[]): Card[] {
  const limit = flipLimit(view, mySeat);
  const cards = nextCards(view);
  let i = 0;
  while (i < queue.length && i < limit && sameCard(cards[i], queue[i])) i += 1;
  return i === queue.length ? queue : queue.slice(0, i);
}
