import { nextSeat } from "@/lib/cards";
import { cardId } from "./cards";
import { combosInHand, isLegalCombo, isValidComboShape } from "./combos";
import type { Card, Combo, GameState, Pile, Rank, Seat } from "./types";

const SEATS: Seat[] = [0, 1, 2, 3];

function activeSeats(state: GameState): Seat[] {
  const finished = new Set(state.finishedOrder);
  return SEATS.filter((s) => !finished.has(s));
}

/** Next seat after `seat` that still has cards this round, wrapping around. */
function nextActiveSeat(finishedOrder: Seat[], from: Seat): Seat {
  const finished = new Set(finishedOrder);
  let next = nextSeat(from);
  while (finished.has(next) && next !== from) next = nextSeat(next);
  return next;
}

/** How many active seats other than the pile's leader must still pass before
 *  it clears (all of them, if the leader has since emptied their hand). */
function othersStillOwingAPass(state: GameState): number {
  const active = activeSeats(state);
  const leaderStillActive = state.pile.leader !== null && active.includes(state.pile.leader);
  return active.length - (leaderStillActive ? 1 : 0);
}

function removeFromHand(hand: Card[], combo: Combo): Card[] {
  const ids = new Set(combo.cards.map(cardId));
  return hand.filter((c) => !ids.has(cardId(c)));
}

/** Combos `seat` could legally play right now (empty outside its own turn). */
export function legalCombos(state: GameState, seat: Seat): Combo[] {
  if (state.phase !== "playing" || state.turn !== seat) return [];
  return combosInHand(state.hands[seat]).filter((c) => isLegalCombo(state.pile, state.revolution, c));
}

/** True if `seat` may pass right now: always allowed except when leading a
 *  freshly cleared pile (there is nothing yet to pass on). */
export function canPass(state: GameState, seat: Seat): boolean {
  return state.phase === "playing" && state.turn === seat && state.pile.combo !== null;
}

/** A "2" (single, pair, or triple - a quad already has its own revolution
 *  effect) always burns the pile: nobody can ever beat it, so instead of
 *  making every other active seat pass it in turn, the pile clears the
 *  instant it lands and the same seat leads again right away. */
const BURN_RANK = "2";
const BURN_MAX_COUNT = 3;

function burnsThePile(combo: Combo, handEmptied: boolean): boolean {
  return combo.rank === BURN_RANK && combo.cards.length <= BURN_MAX_COUNT && !handEmptied;
}

/** True if finishing your hand with `combo` is the house-rule losing 2: a
 *  single, pair, or triple of 2s (a quad still only toggles revolution) as
 *  the very last combo. Play continues normally for the rest of the round -
 *  see `computeRoundResult` for where this actually costs the seat its
 *  rank. */
function losesOnFinish(combo: Combo, handEmptied: boolean): boolean {
  return handEmptied && combo.rank === BURN_RANK && combo.cards.length <= BURN_MAX_COUNT;
}

/** True when `combo` replays the pile's current rank instead of beating it -
 *  the "double" rule (see `isLegalCombo`). */
function matchesPile(pile: Pile, combo: Combo): boolean {
  return pile.combo !== null && combo.rank === pile.combo.rank;
}

/** Total cards of `combo.rank` down on the pile once `combo` (a match) lands
 *  on top of it. */
function stackedCount(pile: Pile, combo: Combo): number {
  return (pile.stackCount ?? pile.combo?.cards.length ?? 0) + combo.cards.length;
}

/** True if `hand` holds at least one card of `rank` - the "double" rule's skip
 *  is called off for a seat that could have defended itself the same way. */
function hasRank(hand: Card[], rank: Rank): boolean {
  return hand.some((c) => c.rank === rank);
}

const RANK_COUNT_IN_DECK = 4;

/** Shared by both burn triggers (a "2", or the "double" rule completing all
 *  4 cards of a rank): clears the pile, the same seat leads again. */
function burnResult(state: GameState, hands: Card[][], seat: Seat, combo: Combo, revolution: boolean, finishedOrder: Seat[]): GameState {
  return { ...state, hands, pile: { combo: null, leader: null }, lastBurn: { seat, combo }, passStreak: 0, revolution, finishedOrder, turn: seat };
}

/** Apply a combo play: removes it from hand, updates the pile, toggles the
 *  revolution on a quad, and ends the round the instant only one active seat
 *  is left holding cards (that seat is automatically last/Trou du Cul - no
 *  need to keep playing out a foregone conclusion).
 *
 *  The "double" rule: replaying the pile's exact rank (`matchesPile`) is
 *  legal alongside beating it (`isLegalCombo`) and skips the very next
 *  active seat's turn entirely - unless that seat itself holds a card of the
 *  same rank, in which case it is spared the skip and simply gets its normal
 *  turn (`hasRank`); or unless the play instead completes all 4 cards of
 *  that rank, in which case it burns the pile just like a "2" instead
 *  (`burnResult`, checked first, so it takes priority over the skip/spare
 *  check either way). Finishing your hand always takes priority over any of
 *  these effects, same precedent as a hand-emptying "2" never burning.
 *
 *  House rule: finishing on a losing 2 (single/pair/triple, see
 *  `losesOnFinish`) does not change anything about how the round plays out -
 *  it only records the seat in `losingFinishSeats`, so `computeRoundResult`
 *  can demote it once the round actually ends. */
export function applyPlay(state: GameState, seat: Seat, combo: Combo): GameState {
  if (state.phase !== "playing") throw new Error("not_playing");
  if (state.turn !== seat) throw new Error("not_your_turn");
  if (!isValidComboShape(state.hands[seat], combo)) throw new Error("invalid_combo");
  if (!isLegalCombo(state.pile, state.revolution, combo)) throw new Error("illegal_combo");

  const hands = state.hands.map((h, i) => (i === seat ? removeFromHand(h, combo) : h));
  const revolution = combo.cards.length === 4 ? !state.revolution : state.revolution;
  const finished = hands[seat].length === 0;
  const finishedOrder = finished ? [...state.finishedOrder, seat] : state.finishedOrder;
  const losingFinishSeats = losesOnFinish(combo, finished)
    ? [...state.losingFinishSeats, seat]
    : state.losingFinishSeats;

  if (finishedOrder.length === 3) {
    const lastSeat = SEATS.find((s) => !finishedOrder.includes(s))!;
    const pile = { combo, leader: seat };
    return { ...state, hands, pile, revolution, finishedOrder: [...finishedOrder, lastSeat], losingFinishSeats, phase: "scoring" };
  }
  if (burnsThePile(combo, finished)) return burnResult(state, hands, seat, combo, revolution, finishedOrder);

  const matched = matchesPile(state.pile, combo);
  const stackCount = matched ? stackedCount(state.pile, combo) : combo.cards.length;
  if (matched && !finished && stackCount >= RANK_COUNT_IN_DECK) return burnResult(state, hands, seat, combo, revolution, finishedOrder);
  if (matched && !finished) {
    const skippedSeat = nextActiveSeat(finishedOrder, seat);
    const pile = { combo, leader: seat, stackCount };
    // Exception: a seat holding a card of the same rank can't be skipped - it
    // gets its normal turn instead (and may chain the "double" itself, which
    // re-runs this same check against the seat after it).
    if (hasRank(hands[skippedSeat], combo.rank)) {
      return { ...state, hands, pile, passStreak: 0, revolution, finishedOrder, turn: skippedSeat };
    }
    const turn = nextActiveSeat(finishedOrder, skippedSeat);
    return { ...state, hands, pile, lastSkip: { seat, skippedSeat, combo }, passStreak: 0, revolution, finishedOrder, turn };
  }
  const pile = { combo, leader: seat, stackCount };
  return { ...state, hands, pile, passStreak: 0, revolution, finishedOrder, losingFinishSeats, turn: nextActiveSeat(finishedOrder, seat) };
}

/** Apply a pass: clears the pile once every other active seat has passed in a
 *  row, otherwise just advances the turn. */
export function applyPass(state: GameState, seat: Seat): GameState {
  if (!canPass(state, seat)) throw new Error("cannot_pass");

  const passStreak = state.passStreak + 1;
  const cleared = passStreak >= othersStillOwingAPass(state);
  return {
    ...state,
    passStreak: cleared ? 0 : passStreak,
    pile: cleared ? { combo: null, leader: null } : state.pile,
    turn: nextActiveSeat(state.finishedOrder, seat),
  };
}
