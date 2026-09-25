import { RANK_ORDER, rankValue } from "./cards";
import { submitExchangeReturn, submitPass, submitPlay } from "./engine";
import { redact, type PlayerView } from "./redact";
import type { Card, Combo, GameState, Rank, Seat } from "./types";

export type PresidentBotAction =
  | { action: "COMBO"; combo: Combo }
  | { action: "PASS" }
  | { action: "EXCHANGE_RETURN"; cards: Card[] };

/** How many cards of `combo.rank` are still in `hand` (before the play). */
function groupSize(hand: Card[], rank: Rank): number {
  return hand.filter((c) => c.rank === rank).length;
}

/** True if `combo` only spends part of its rank's group in `hand` (e.g. one
 *  card out of a pair) - it fractures a combo instead of fully cashing it in. */
function breaksGroup(hand: Card[], combo: Combo): boolean {
  return combo.cards.length < groupSize(hand, combo.rank);
}

/** The top two ranks under the current rules - 2 and Ace normally, or their
 *  mirror once a revolution flips the order - the scarce "control" cards
 *  worth hoarding for a critical moment instead of spending on demand. */
function isMasterRank(rank: Rank, revolution: boolean): boolean {
  return rankValue(rank, revolution) >= RANK_ORDER.length - 2;
}

/** Give back the lowest-value cards owed, but only after every true singleton
 *  is spent first - never breaks a pair/triple/quad while a lone card can be
 *  given instead, so combos survive intact into the round ahead. */
function chooseReturnCards(view: PlayerView): Card[] {
  const owed = view.pendingExchange?.owed[view.mySeat] ?? 0;
  const priority = [...view.myHand].sort(
    (a, b) =>
      groupSize(view.myHand, a.rank) - groupSize(view.myHand, b.rank) ||
      rankValue(a.rank, false) - rankValue(b.rank, false),
  );
  return priority.slice(0, owed);
}

/** Cost of playing `combo` right now: 0 for an intact, non-master play (free -
 *  always worth taking), higher once it fractures a group and/or spends a
 *  master rank. Breaking a group outweighs spending an intact master, since
 *  fracturing destroys a combo's latent value while a master card was only
 *  ever going to be spent once anyway. */
/** Finishing the hand on one, two, or three 2s. A quad still only revolutions. */
function isLosingTwoFinish(hand: Card[], combo: Combo): boolean {
  return combo.cards.length === hand.length && combo.rank === "2" && combo.cards.length <= 3;
}

/** Playing `combo` would leave only 1–3 twos, so the next finish is a forced
 *  losing 2. Spending the twos while a non-two remains avoids that. */
function leavesOnlyLosingTwos(hand: Card[], combo: Combo): boolean {
  const remaining = hand.length - combo.cards.length;
  if (remaining < 1 || remaining > 3) return false;
  const twosLeft = groupSize(hand, "2") - (combo.rank === "2" ? combo.cards.length : 0);
  return remaining === twosLeft;
}

function comboCost(view: PlayerView, combo: Combo): number {
  if (isLosingTwoFinish(view.myHand, combo)) return 100;
  const stranded = leavesOnlyLosingTwos(view.myHand, combo) ? 20 : 0;
  const breaking = breaksGroup(view.myHand, combo) ? 2 : 0;
  const master = isMasterRank(combo.rank, view.revolution) ? 1 : 0;
  return stranded + breaking + master;
}

/** Cheapest legal combo: smallest cost first (see `comboCost`), then the
 *  existing smallest-count/weakest-rank rule of thumb as a tiebreak. */
function cheapestCombo(view: PlayerView): Combo {
  return [...view.legalCombos].sort(
    (a, b) =>
      comboCost(view, a) - comboCost(view, b) ||
      a.cards.length - b.cards.length ||
      rankValue(a.rank, view.revolution) - rankValue(b.rank, view.revolution),
  )[0];
}

const LOW_HAND_THRESHOLD = 3;
const OPPONENT_ENDGAME_THRESHOLD = 2;

/** True once hoarding no longer pays off: our own hand is nearly empty (worth
 *  taking control to plan a clean finish) or an opponent is close enough to
 *  going out that letting a free trick through is too risky. */
function endgameLooming(view: PlayerView): boolean {
  if (view.myHand.length <= LOW_HAND_THRESHOLD) return true;
  return view.handCounts.some((count, seat) => seat !== view.mySeat && count > 0 && count <= OPPONENT_ENDGAME_THRESHOLD);
}

/** Whether to actually play `best` or pass instead. Opening a fresh pile
 *  forces a play; otherwise a free combo (cost 0) is always worth taking, and
 *  a costly one (breaks a group and/or spends a master) is only worth it once
 *  the endgame is looming - otherwise pass and protect it for later. */
function shouldTakeThePile(view: PlayerView, best: Combo): boolean {
  if (isLosingTwoFinish(view.myHand, best)) return !view.canPass;
  if (!view.canPass) return true;
  if (comboCost(view, best) === 0) return true;
  return endgameLooming(view);
}

/** Heuristic bot: protects pairs/triples/quads and master ranks (2s, Aces)
 *  from casual spending, but never hoards past the point it can afford to. */
export function chooseAction(view: PlayerView): PresidentBotAction {
  if (view.phase === "exchange") return { action: "EXCHANGE_RETURN", cards: chooseReturnCards(view) };
  if (view.legalCombos.length === 0) {
    if (!view.canPass) throw new Error("no_legal_action");
    return { action: "PASS" };
  }
  const best = cheapestCombo(view);
  if (!shouldTakeThePile(view, best)) return { action: "PASS" };
  return { action: "COMBO", combo: best };
}

function applyBotAction(state: GameState, seat: Seat, action: PresidentBotAction): GameState {
  if (action.action === "PASS") return submitPass(state, seat);
  if (action.action === "COMBO") return submitPlay(state, seat, action.combo);
  return submitExchangeReturn(state, seat, action.cards);
}

/** Auto-play bot seats (through the exchange phase too) until it is a human's
 *  turn or the round ends. */
export function advanceBots(state: GameState, isBot: boolean[]): GameState {
  let current = state;
  let guard = 0;
  while (guard++ < 500) {
    const seat = current.phase === "exchange" ? current.pendingExchange?.awaiting[0] : current.turn;
    const isActive = current.phase === "playing" || current.phase === "exchange";
    if (seat === undefined || !isActive || !isBot[seat]) break;
    current = applyBotAction(current, seat, chooseAction(redact(current, seat as Seat)));
  }
  return current;
}
