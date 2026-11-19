import { NORMAL_CONFIG, type BotProfileConfig } from "./bot-profiles";
import { cardPoints, partnerOf, SUITS } from "./cards";
import type { Bid, Card, Seat, Suit, TrumpMode } from "./types";

/** Lowest contract a bot will open, and the highest it will bid unprompted. */
const MIN_OPEN_BID = 80;
const MAX_AUTO_BID = 160;

/**
 * Points a partner + the 10 de der are assumed to add on top of the bidder's
 * own hand strength. Calibrated by simulation (decision 0011): ~99% of deals
 * reach a contract, avg ~92. Profiles move the estimate, not this constant.
 */
export const PARTNER_CONTRIBUTION = 26;

const TRUMP_LENGTH_POINTS = 3;
const VOID_POINTS = 4;
const SINGLETON_POINTS = 2;
const OUTSIDE_ACE_POINTS = 11;
/** Outside ten worth this x riskTolerance (normal 0.5 => 5, the calibrated value). */
const OUTSIDE_TEN_RISK_POINTS = 10;
const BELOTE_POINTS = 20;
/** `partnerTrustBonus` of the calibrated support raise (normal). */
const BASE_PARTNER_TRUST = 15;
/** Trap pass: tendency above this, on a hand clearing the floor by less than the margin. */
const TRAP_CUTOFF = 0.5;
const TRAP_BORDERLINE = 20;

export interface BidDecision {
  shouldBid: boolean;
  value: number;
  mode: TrumpMode;
}

const NO_BID: BidDecision = { shouldBid: false, value: 0, mode: "H" };

/** Does the hand hold the K+Q of `suit` (belote, worth a guaranteed 20)? */
function hasBelote(hand: Card[], suit: Suit): boolean {
  return hand.some((c) => c.suit === suit && c.rank === "K") && hand.some((c) => c.suit === suit && c.rank === "Q");
}

function suitLength(hand: Card[], suit: Suit): number {
  return hand.filter((c) => c.suit === suit).length;
}

function shortSuitPoints(hand: Card[], trump: Suit): number {
  let points = 0;
  for (const suit of SUITS) {
    if (suit === trump) continue;
    const len = suitLength(hand, suit);
    if (len === 0) points += VOID_POINTS;
    else if (len === 1) points += SINGLETON_POINTS;
  }
  return points;
}

/**
 * Trump length plus voids/singletons (cutting chances). The calibrated baseline
 * only counts trump length, so short suits weigh (multiplier - 1): zero for
 * normal (unchanged bidding), a bonus above 1, a distrust below 1.
 */
function distributionPoints(hand: Card[], trump: Suit, multiplier: number): number {
  const length = suitLength(hand, trump) * TRUMP_LENGTH_POINTS * multiplier;
  return length + shortSuitPoints(hand, trump) * (multiplier - 1);
}

/** Estimate of a suit's value as trump: trump points, side aces/tens, distribution, belote. */
function evaluateSuit(hand: Card[], suit: Suit, cfg: BotProfileConfig): number {
  let points = 0;
  for (const card of hand) {
    if (card.suit === suit) points += cardPoints(card, suit);
    else if (card.rank === "A") points += OUTSIDE_ACE_POINTS;
    else if (card.rank === "10") points += OUTSIDE_TEN_RISK_POINTS * cfg.riskTolerance;
  }
  const distribution = distributionPoints(hand, suit, cfg.distributionMultiplier);
  return points + distribution + (hasBelote(hand, suit) ? BELOTE_POINTS : 0);
}

/** Tout atout potential, normalized to the /162 scale; jacks and nines dominate. */
function evaluateToutAtout(hand: Card[]): number {
  let raw = 0;
  for (const card of hand) raw += cardPoints(card, "TA");
  const jacks = hand.filter((c) => c.rank === "J").length;
  const nines = hand.filter((c) => c.rank === "9").length;
  return Math.round(raw * (162 / 214)) + jacks * 5 + nines * 3;
}

/** Sans atout potential: aces and tens carry the hand, no cutting. */
function evaluateSansAtout(hand: Card[]): number {
  let points = 0;
  for (const card of hand) points += cardPoints(card, "SA");
  const aces = hand.filter((c) => c.rank === "A").length;
  const tens = hand.filter((c) => c.rank === "10").length;
  return points + aces * 4 + tens * 2;
}

export function evaluateMode(hand: Card[], mode: TrumpMode, cfg: BotProfileConfig = NORMAL_CONFIG): number {
  if (mode === "TA") return evaluateToutAtout(hand);
  if (mode === "SA") return evaluateSansAtout(hand);
  return evaluateSuit(hand, mode, cfg);
}

/** Best trump mode among the allowed ones, or null when none can be announced. */
function bestMode(hand: Card[], allowed: TrumpMode[], cfg: BotProfileConfig): { mode: TrumpMode; estimate: number } | null {
  let best: { mode: TrumpMode; estimate: number } | null = null;
  for (const mode of allowed) {
    const estimate = evaluateMode(hand, mode, cfg);
    if (!best || estimate > best.estimate) best = { mode, estimate };
  }
  return best;
}

/** Hand looks better in defence than in attack: 4+ trumps without the Jack, or 2+ side aces. */
function isAmbiguous(hand: Card[], mode: TrumpMode): boolean {
  if (mode === "TA" || mode === "SA") return false;
  const trumps = hand.filter((c) => c.suit === mode);
  const noJack = trumps.length >= 4 && !trumps.some((c) => c.rank === "J");
  const sideAces = hand.filter((c) => c.suit !== mode && c.rank === "A").length;
  return noJack || sideAces >= 2;
}

/**
 * Decide whether to announce, and at what value, from a hand alone.
 * `minValue` is the lowest legal bid (null when bidding is locked or no bid is
 * possible). The hand estimate is lifted by the partner contribution, lowered by
 * the profile's safety margin, rounded to a contract step and capped at 160.
 */
export function decideBid(
  hand: Card[],
  allowed: TrumpMode[],
  minValue: number | null,
  cfg: BotProfileConfig = NORMAL_CONFIG,
): BidDecision {
  if (minValue === null) return NO_BID;
  const best = bestMode(hand, allowed, cfg);
  if (!best) return NO_BID;
  const teamEstimate = best.estimate + PARTNER_CONTRIBUTION - cfg.bidSafetyMargin;
  const value = Math.min(MAX_AUTO_BID, Math.round(teamEstimate / 10) * 10);
  const floor = Math.max(MIN_OPEN_BID, minValue);
  const trap = cfg.trapPassTendency > TRAP_CUTOFF && value - floor < TRAP_BORDERLINE && isAmbiguous(hand, best.mode);
  return { shouldBid: value >= floor && !trap, value, mode: best.mode };
}

/** Hand holds the trump Jack or 9 of `suit` (the two strongest trumps). */
function hasTrumpHonor(hand: Card[], suit: Suit): boolean {
  return hand.some((c) => c.suit === suit && (c.rank === "J" || c.rank === "9"));
}

/**
 * Calibrated support raise on a partner's standing suit bid: +10 when the
 * partner opened 80/90 and we hold the trump Jack or 9; +10 per ace once the
 * partner announced 90 or more. Tout/sans atout: no support.
 */
export function baseSupportRaise(hand: Card[], value: number, mode: TrumpMode): number {
  if (mode === "TA" || mode === "SA") return 0;
  let bonus = 0;
  if ((value === 80 || value === 90) && hasTrumpHonor(hand, mode)) bonus += 10;
  if (value >= 90) bonus += 10 * hand.filter((c) => c.rank === "A").length;
  return bonus;
}

/** Last standing "bid" (highest), or null if the auction has no bid yet. */
export function standingBid(bids: Bid[]): Bid | null {
  let highest: Bid | null = null;
  for (const bid of bids) {
    if (bid.type === "bid" && bid.value !== undefined) highest = bid;
  }
  return highest;
}

/** Raise on top of a partner's standing bid, or null when no rule fires. */
function supportDecision(hand: Card[], bids: Bid[], seat: Seat, minValue: number, cfg: BotProfileConfig): BidDecision | null {
  if (bids.some((b) => b.seat === seat && b.type === "bid")) return null;
  const highest = standingBid(bids);
  if (!highest || highest.seat !== partnerOf(seat) || highest.suit === undefined) return null;
  const base = baseSupportRaise(hand, highest.value!, highest.suit);
  const raise = Math.round((base * cfg.partnerTrustBonus) / BASE_PARTNER_TRUST / 10) * 10;
  if (raise === 0) return null;
  const value = Math.min(MAX_AUTO_BID, highest.value! + raise);
  if (value < minValue) return null;
  return { shouldBid: true, value, mode: highest.suit };
}

/** Hand-only decision, upgraded by partner-support conventions when they apply. */
export function decideBidWithSupport(
  hand: Card[],
  bids: Bid[],
  seat: Seat,
  allowed: TrumpMode[],
  minValue: number | null,
  cfg: BotProfileConfig = NORMAL_CONFIG,
): BidDecision {
  const base = decideBid(hand, allowed, minValue, cfg);
  if (minValue === null) return base;
  const support = supportDecision(hand, bids, seat, minValue, cfg);
  if (!support) return base;
  if (!base.shouldBid || support.value >= base.value) return support;
  return base;
}
