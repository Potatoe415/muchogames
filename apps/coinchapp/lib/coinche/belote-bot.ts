import { BELOTE_CONTRACT_VALUE, beloteBidOptions } from "./belote";
import { NORMAL_CONFIG, type BotProfileConfig } from "./bot-profiles";
import { cardPoints } from "./cards";
import type { Bid, Card, GameState, Suit } from "./types";

/* Take threshold comes from `BotProfileConfig.beloteTakeThreshold`. Calibrated over 3000
 * simulated deals (heuristic play): 50 takes 78% of deals / makes 90%, 45 91% / 86%, 40 97% / 83%. */
const TRUMP_LENGTH_BONUS = 6;
const OFF_SUIT_ACE_BONUS = 10;
const BELOTE_BONUS = 20;

/** Rough worth of `cards` with `suit` as trump: trump points and length, side aces, belote. */
function takeScore(cards: Card[], suit: Suit): number {
  let score = 0;
  let honours = 0;
  for (const card of cards) {
    if (card.suit === suit) {
      score += cardPoints(card, suit) + TRUMP_LENGTH_BONUS;
      if (card.rank === "K" || card.rank === "Q") honours++;
    } else if (card.rank === "A") {
      score += OFF_SUIT_ACE_BONUS;
    }
  }
  return honours === 2 ? score + BELOTE_BONUS : score;
}

/** Suit the bot takes, or null to pass. The taker always gets the turned card, so it
 *  counts whatever the suit. Never takes without the trump Jack or 9. */
export function decideBeloteTake(
  hand: Card[],
  turnedCard: Card,
  suits: Suit[],
  cfg: BotProfileConfig = NORMAL_CONFIG,
): Suit | null {
  const cards = [...hand, turnedCard];
  let best: Suit | null = null;
  let bestScore = -1;
  for (const suit of suits) {
    if (!cards.some((c) => c.suit === suit && (c.rank === "J" || c.rank === "9"))) continue;
    const score = takeScore(cards, suit);
    if (score > bestScore) {
      best = suit;
      bestScore = score;
    }
  }
  return bestScore >= cfg.beloteTakeThreshold ? best : null;
}

export function chooseBeloteBid(state: GameState, cfg: BotProfileConfig = NORMAL_CONFIG): Bid {
  const seat = state.turn;
  const { suits } = beloteBidOptions(state);
  const suit = state.turnedCard ? decideBeloteTake(state.hands[seat], state.turnedCard, suits as Suit[], cfg) : null;
  return suit ? { seat, type: "bid", value: BELOTE_CONTRACT_VALUE, suit } : { seat, type: "pass" };
}
