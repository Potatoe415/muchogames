import { bidOptions } from "./bidding";
import { chooseBeloteBid } from "./belote-bot";
import { configForSeat, type BotProfiles } from "./bot-profiles";
import { cardId, cardPoints, cardStrength, isTrump, RANKS, teamOf } from "./cards";
import { decideBotBid } from "./coinche-decision";
import { submitBid, submitPlay } from "./engine";
import { legalCards, trickWinner } from "./trick";
import type { Bid, Card, GameState, PlayedCard, Seat, TrumpMode } from "./types";

/** Engine-side bot auction move (server fallback, tests). Reads only the seat's own hand. */
export function chooseBid(state: GameState, profiles?: BotProfiles): Bid {
  const cfg = configForSeat(profiles, state.turn);
  if (state.variant === "belote") return chooseBeloteBid(state, cfg);
  return decideBotBid(state.hands[state.turn], state.bids, state.turn, bidOptions(state), cfg);
}

function weakest(cards: Card[], trump: TrumpMode | null): Card {
  return cards.reduce((lo, c) =>
    cardPoints(c, trump) < cardPoints(lo, trump) ? c : lo,
  );
}

/** Lowest card that would currently win the trick, or null if none can. */
function cheapestWinner(state: GameState, legal: Card[]): Card | null {
  const trick = state.currentTrick.cards;
  if (trick.length === 0) return null;
  const led = trick[0].card.suit;
  const bestStrength = cardStrength(
    trick.find((p) => p.seat === trickWinner(trick, state.trump))!.card,
    led,
    state.trump,
  );
  const winners = legal.filter((c) => cardStrength(c, led, state.trump) > bestStrength);
  if (winners.length === 0) return null;
  return weakest(winners, state.trump);
}

/**
 * Drop trump "cuts" from candidate cards when the bot's partner already wins
 * the trick and a non-trump discard exists, so the bot never ruffs under a
 * master partner. Returns `legal` unchanged when the rule does not apply
 * (leading, trump led, TA/SA, partner not master, or only trumps left).
 */
export function avoidCuttingPartner(
  legal: Card[],
  trick: PlayedCard[],
  trump: TrumpMode | null,
  seat: Seat,
): Card[] {
  if (trick.length === 0 || !trump || trump === "TA" || trump === "SA") return legal;
  if (trick[0].card.suit === trump) return legal;
  if (teamOf(trickWinner(trick, trump)) !== teamOf(seat)) return legal;
  const discards = legal.filter((c) => !isTrump(c, trump));
  return discards.length > 0 ? discards : legal;
}

function trumpCount(cards: Card[], trump: TrumpMode | null): number {
  let count = 0;
  for (const card of cards) if (isTrump(card, trump)) count += 1;
  return count;
}

/** A card no one can beat in its own suit: every higher card of that suit is seen. */
function isMasterCard(card: Card, seen: Set<string>, trump: TrumpMode | null): boolean {
  const own = cardStrength(card, card.suit, trump);
  for (const rank of RANKS) {
    const higher = { suit: card.suit, rank };
    if (cardStrength(higher, card.suit, trump) <= own) continue;
    if (!seen.has(cardId(higher))) return false;
  }
  return true;
}

/**
 * When leading in a single-suit trump contract and the other three players hold
 * no trump left (all accounted for between this hand and played cards), there is
 * nothing to draw: prefer cashing a non-trump master over pulling trumps. Falls
 * back to `legal` when not leading, trumps remain, the mode is TA/SA, or no sure
 * non-trump winner exists (then a trump lead is the safe trick).
 */
export function leadWinnersWhenTrumpsExhausted(
  legal: Card[],
  hand: Card[],
  playedCards: Card[],
  isLeading: boolean,
  trump: TrumpMode | null,
): Card[] {
  if (!trump || trump === "SA" || trump === "TA" || !isLeading) return legal;
  const outstanding = RANKS.length - trumpCount(hand, trump) - trumpCount(playedCards, trump);
  if (outstanding > 0) return legal;
  const nonTrump = legal.filter((c) => !isTrump(c, trump));
  if (nonTrump.length === 0) return legal;
  const seen = new Set([...playedCards, ...hand].map(cardId));
  const hasMaster = nonTrump.some((c) => isMasterCard(c, seen, trump));
  return hasMaster ? nonTrump : legal;
}

/**
 * Two cards left, one of them the master trump (every higher trump is down or in
 * hand): it wins the last trick whatever is led, so keep it for the dix de der and
 * play the other card now when the rules allow. Single-suit trump only.
 */
export function keepMasterTrumpForLast(
  legal: Card[],
  hand: Card[],
  playedCards: Card[],
  trump: TrumpMode | null,
): Card[] {
  if (hand.length !== 2 || !trump || trump === "SA" || trump === "TA") return legal;
  const seen = new Set([...playedCards, ...hand].map(cardId));
  const masters = hand.filter((c) => isTrump(c, trump) && isMasterCard(c, seen, trump));
  if (masters.length !== 1) return legal;
  const others = legal.filter((c) => cardId(c) !== cardId(masters[0]));
  return others.length > 0 ? others : legal;
}

/** Single bot strategy: play the cheapest card that wins, else discard the weakest. */
export function chooseCard(state: GameState): Card {
  const played = [...state.tricks, state.currentTrick].flatMap((t) => t.cards.map((p) => p.card));
  const legal = keepMasterTrumpForLast(
    avoidCuttingPartner(legalCards(state, state.turn), state.currentTrick.cards, state.trump, state.turn),
    state.hands[state.turn],
    played,
    state.trump,
  );
  const winner = cheapestWinner(state, legal);
  return winner ?? weakest(legal, state.trump);
}

/** Auto-play bot seats until it is a human's turn or the deal ends. */
export function advanceBots(
  state: GameState,
  isBot: boolean[],
  rng: () => number = Math.random,
  profiles?: BotProfiles,
): GameState {
  let current = state;
  let guard = 0;
  while (guard++ < 64) {
    const active = current.phase === "bidding" || current.phase === "playing";
    if (!active || !isBot[current.turn]) break;
    if (current.phase === "bidding") {
      current = submitBid(current, chooseBid(current, profiles), rng);
    } else {
      current = submitPlay(current, current.turn as Seat, chooseCard(current));
    }
  }
  return current;
}
