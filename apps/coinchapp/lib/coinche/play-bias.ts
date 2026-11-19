import { NORMAL_CONFIG, type BotProfileConfig } from "./bot-profiles";
import { cardId, isTrump, partnerOf, teamOf } from "./cards";
import type { PlayerView } from "./redact";
import { analyzeTableState, trumpsOutside, type TableState } from "./table-memory";
import { trickWinner } from "./trick";
import type { Card, Suit } from "./types";

/**
 * Profile bias on the real (root) move, blended with the ISMCTS win rate.
 * Every term is (profile value - normal value) x feature, so `normal` adds
 * exactly 0 and keeps the calibrated search untouched; other profiles only tip
 * moves the search rates close to each other.
 */

/** Trumps in hand that make the bot "long" enough to try shortening the taker. */
const LONG_TRUMPS = 3;
/** Side suit length that counts as a long suit to force the taker to ruff. */
const LONG_SUIT = 3;

interface Ctx {
  view: PlayerView;
  cfg: BotProfileConfig;
  table: TableState;
  seen: Set<string>;
  attacking: boolean;
}

function delta(cfg: BotProfileConfig, key: keyof BotProfileConfig): number {
  return cfg[key] - NORMAL_CONFIG[key];
}

function suitCards(hand: Card[], suit: Suit): Card[] {
  return hand.filter((c) => c.suit === suit);
}

/** A ten whose ace is neither down nor in my hand: it can be captured. */
function isUnguardedTen(card: Card, ctx: Ctx): boolean {
  return card.rank === "10" && !ctx.seen.has(cardId({ suit: card.suit, rank: "A" }));
}

function singleTrumpSuit(ctx: Ctx): Suit | null {
  const t = ctx.view.trump;
  return t && t !== "TA" && t !== "SA" ? t : null;
}

/** Attack lead: hunt trumps (trumpHuntPriority), cash side aces / shun unguarded tens (riskTolerance). */
function attackLeadBonus(card: Card, ctx: Ctx): number {
  const trump = singleTrumpSuit(ctx);
  const risk = delta(ctx.cfg, "riskTolerance");
  if (trump && card.suit === trump) {
    return trumpsOutside(ctx.view.myHand, ctx.table, trump) > 0 ? delta(ctx.cfg, "trumpHuntPriority") : 0;
  }
  if (card.rank === "A") return -risk;
  if (isUnguardedTen(card, ctx)) return risk;
  return 0;
}

/** Defence lead: long side suit when long at trump (shortening), no lead away from a bare 10/K. */
function defenceLeadBonus(card: Card, ctx: Ctx): number {
  const trump = singleTrumpSuit(ctx);
  const hand = ctx.view.myHand;
  let bonus = 0;
  if (trump && card.suit !== trump && suitCards(hand, trump).length >= LONG_TRUMPS) {
    if (suitCards(hand, card.suit).length >= LONG_SUIT) bonus += delta(ctx.cfg, "shorteningDefensePriority");
  }
  const suit = suitCards(hand, card.suit);
  const exposes = card.rank !== "A" && card.rank !== "10" && card.rank !== "K";
  const holdsHonour = suit.some((c) => c.rank === "10" || c.rank === "K") && !suit.some((c) => c.rank === "A");
  if (exposes && holdsHonour) bonus += delta(ctx.cfg, "riskTolerance");
  return bonus;
}

/** Discard while the partner wins the trick: a careful bot sheds its bare (unguarded) tens. */
function discardBonus(card: Card, ctx: Ctx): number {
  const trick = ctx.view.currentTrick.cards;
  const led = trick[0].card.suit;
  if (card.suit === led || isTrump(card, ctx.view.trump)) return 0;
  if (trickWinner(trick, ctx.view.trump) !== partnerOf(ctx.view.mySeat)) return 0;
  const bare = suitCards(ctx.view.myHand, card.suit).length === 1;
  return bare && isUnguardedTen(card, ctx) ? -delta(ctx.cfg, "riskTolerance") : 0;
}

/** Bias per candidate card, same order as `cards`. All zeros for `normal`. */
export function profilePlayBonus(view: PlayerView, cards: Card[], cfg: BotProfileConfig): number[] {
  if (!view.contract) return cards.map(() => 0);
  const table = analyzeTableState(view.tricks, view.currentTrick, view.trump);
  const seen = new Set([...view.myHand, ...table.played].map(cardId));
  const ctx: Ctx = { view, cfg, table, seen, attacking: teamOf(view.mySeat) === view.contract.team };
  const leading = view.currentTrick.cards.length === 0;
  return cards.map((card) => {
    if (!leading) return discardBonus(card, ctx);
    return ctx.attacking ? attackLeadBonus(card, ctx) : defenceLeadBonus(card, ctx);
  });
}
