import type { BidOptions } from "./bidding";
import {
  baseSupportRaise,
  decideBidWithSupport,
  evaluateMode,
  PARTNER_CONTRIBUTION,
  standingBid,
} from "./bot-bidding";
import { NORMAL_CONFIG, type BotProfileConfig } from "./bot-profiles";
import { cardPoints, isTrump } from "./cards";
import type { Bid, Card, Seat, TrumpMode } from "./types";

/**
 * Logistic fit of "the contract fails" on one defender's hand, 21.8k simulated
 * deals (heuristic play, base fail rate 16.6%). Calibrated: predicted 0.5-0.6
 * fails ~71% of the time. Inputs: trump points /10, trump length, side aces,
 * side tens. The fitted contract-level term was slightly negative (high bids
 * come from strong hands); it is replaced by a small positive one so higher
 * contracts read as riskier, as the spec asks.
 */
const FAIL_BIAS = -2.708;
const FAIL_PER_TRUMP_10_POINTS = 0.371;
const FAIL_PER_TRUMP = 0.419;
const FAIL_PER_SIDE_ACE = 0.028;
const FAIL_PER_SIDE_TEN = 0.019;
const FAIL_PER_10_ABOVE_90 = 0.1;
const CAPOT_THRESHOLD = 250;
/** Points of margin that move the surcoinche success probability by one logistic unit. */
const POINTS_SLOPE = 10;
/** An opponent's coinche shows defence: read our team as this much weaker. */
const COINCHED_PENALTY = 10;

function logistic(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

function trumpFeatures(hand: Card[], mode: TrumpMode): { points: number; length: number } {
  const trumps = hand.filter((c) => isTrump(c, mode));
  return { points: trumps.reduce((sum, c) => sum + cardPoints(c, mode), 0), length: trumps.length };
}

/** Probability (0..1) that an opposing contract of `value` in `mode` fails. */
export function estimateFailProb(hand: Card[], value: number, mode: TrumpMode): number {
  if (value >= CAPOT_THRESHOLD) return 1 - Math.pow(1 - estimateFailProb(hand, 160, mode), 4);
  const { points, length } = trumpFeatures(hand, mode);
  const sideAces = hand.filter((c) => !isTrump(c, mode) && c.rank === "A").length;
  const sideTens = hand.filter((c) => !isTrump(c, mode) && c.rank === "10").length;
  const z =
    FAIL_BIAS +
    FAIL_PER_TRUMP_10_POINTS * (points / 10) +
    FAIL_PER_TRUMP * length +
    FAIL_PER_SIDE_ACE * sideAces +
    FAIL_PER_SIDE_TEN * sideTens +
    FAIL_PER_10_ABOVE_90 * ((value - 90) / 10);
  return logistic(z);
}

export function evaluateCoinche(hand: Card[], value: number, mode: TrumpMode, cfg: BotProfileConfig = NORMAL_CONFIG): boolean {
  return estimateFailProb(hand, value, mode) >= cfg.coincheThreshold;
}

/** Probability (0..1) that our own standing bid makes, from this seat's hand. */
export function estimateSuccessProb(hand: Card[], bid: Bid, seat: Seat, cfg: BotProfileConfig = NORMAL_CONFIG): number {
  const value = bid.value!;
  const team =
    bid.seat === seat
      ? evaluateMode(hand, bid.suit!, cfg) + PARTNER_CONTRIBUTION
      : value + baseSupportRaise(hand, value, bid.suit!) - POINTS_SLOPE;
  return logistic((team - COINCHED_PENALTY - value) / POINTS_SLOPE);
}

export function evaluateSurcoinche(hand: Card[], bid: Bid, seat: Seat, cfg: BotProfileConfig = NORMAL_CONFIG): boolean {
  return estimateSuccessProb(hand, bid, seat, cfg) >= cfg.surcoincheThreshold;
}

/**
 * Full auction move for a bot seat: surcoinche when offered and confident,
 * coinche a likely-failing opposing bid, else bid (own or support), else pass.
 */
export function decideBotBid(
  hand: Card[],
  bids: Bid[],
  seat: Seat,
  options: BidOptions,
  cfg: BotProfileConfig = NORMAL_CONFIG,
): Bid {
  const highest = standingBid(bids);
  if (options.canSurcoinche && highest) {
    return { seat, type: evaluateSurcoinche(hand, highest, seat, cfg) ? "surcoinche" : "pass" };
  }
  if (options.canCoinche && highest && evaluateCoinche(hand, highest.value!, highest.suit!, cfg)) {
    return { seat, type: "coinche" };
  }
  const d = decideBidWithSupport(hand, bids, seat, options.suits, options.minValue, cfg);
  return d.shouldBid ? { seat, type: "bid", value: d.value, suit: d.mode } : { seat, type: "pass" };
}
