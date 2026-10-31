import type { BidOptions } from "./bidding";
import { nextSeat, SUITS, teamOf } from "./cards";
import { computeBelote } from "./scoring";
import type { Bid, Card, GameState, Seat, Suit } from "./types";

/** Contract value stored for a belote take: what a taker needs without belote (> 81). */
export const BELOTE_CONTRACT_VALUE = 82;
/** Bids in one go-round of the table; belote has two before a redeal. */
const BIDS_PER_ROUND = 4;
const OPENING_PACKETS = [3, 2];

/** Deal 5 cards per seat (3 then 2), turn the next card face up, keep the other 11. */
export function dealBeloteOpening(deck: Card[]): { hands: Card[][]; turnedCard: Card; stock: Card[] } {
  const hands: Card[][] = [[], [], [], []];
  let index = 0;
  for (const size of OPENING_PACKETS) {
    for (let seat = 0; seat < 4; seat++) {
      for (let n = 0; n < size; n++) hands[seat].push(deck[index++]);
    }
  }
  return { hands, turnedCard: deck[index], stock: deck.slice(index + 1) };
}

/** First go-round: only the turned card's suit. Second: any other suit. */
function allowedSuits(state: GameState, turnedCard: Card): Suit[] {
  if (state.bids.length < BIDS_PER_ROUND) return [turnedCard.suit];
  return SUITS.filter((suit) => suit !== turnedCard.suit);
}

export function beloteBidOptions(state: GameState): BidOptions {
  const none: BidOptions = { canPass: false, minValue: null, suits: [], canCoinche: false, canSurcoinche: false };
  if (state.phase !== "bidding" || !state.turnedCard) return none;
  return { ...none, canPass: true, suits: allowedSuits(state, state.turnedCard) };
}

function validateBeloteBid(state: GameState, bid: Bid): void {
  if (state.phase !== "bidding") throw new Error("not_bidding");
  if (state.turn !== bid.seat) throw new Error("not_your_turn");
  if (!state.turnedCard || !state.stock) throw new Error("no_turned_card");
  if (bid.type === "pass") return;
  if (bid.type !== "bid") throw new Error("not_in_belote");
  if (!allowedSuits(state, state.turnedCard).includes(bid.suit as Suit)) throw new Error("bad_bid_suit");
}

/** The taker gets the turned card plus 2, every other seat 3, dealt from the dealer's left. */
function dealRest(state: GameState, taker: Seat): Card[][] {
  const hands = state.hands.map((hand) => [...hand]);
  const stock = [...state.stock!];
  hands[taker].push(state.turnedCard!);
  let seat = nextSeat(state.dealer);
  for (let i = 0; i < 4; i++) {
    hands[seat].push(...stock.splice(0, seat === taker ? 2 : 3));
    seat = nextSeat(seat);
  }
  return hands;
}

function take(state: GameState, seat: Seat, suit: Suit): GameState {
  const hands = dealRest(state, seat);
  const leader = nextSeat(state.dealer);
  return {
    ...state,
    phase: "playing",
    bids: [...state.bids, { seat, type: "bid", suit }],
    hands,
    stock: [],
    trump: suit,
    contract: { seat, team: teamOf(seat), value: BELOTE_CONTRACT_VALUE, suit, coinche: 1 },
    belote: computeBelote(hands, suit),
    currentTrick: { leader, cards: [] },
    turn: leader,
  };
}

/** Validate and apply a take or a pass. Two full go-rounds of passes ask for a redeal. */
export function applyBeloteBid(state: GameState, bid: Bid): GameState {
  validateBeloteBid(state, bid);
  if (bid.type === "bid") return take(state, bid.seat, bid.suit as Suit);
  const bids = [...state.bids, bid];
  if (bids.length >= 2 * BIDS_PER_ROUND) return { ...state, bids, pendingRedeal: true };
  return { ...state, bids, turn: nextSeat(bid.seat) };
}
