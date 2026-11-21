import {
  BELOTE_CONTRACT_VALUE,
  BOT_PROFILE_CONFIG,
  decideBeloteTake,
  decideBotBid,
  DEFAULT_BOT_PROFILE,
  profilePlayBonus,
  refinePlayCandidates,
} from "@/lib/coinche";
import type { BotProfile, BotProfileConfig, Card, PlayerView, Suit, TrumpMode } from "@/lib/coinche";
import { buildDeterminizer, simulateRootMove } from "./botSim";

/**
 * Client-side bot brain. Runs entirely in the browser from the redacted seat
 * view, then the UI submits the chosen move through a Server Action exactly as
 * a human would. Bidding uses fast heuristics; playing uses time-boxed ISMCTS.
 */
export type BotAction =
  | { action: "BID"; value: number; suit: TrumpMode }
  | { action: "PASS" }
  | { action: "COINCHE" }
  | { action: "SURCOINCHE" }
  | { action: "PLAY"; card: Card };

export interface BotOptions {
  /** Hard wall-clock budget for the play search (ms). */
  timeBudgetMs?: number;
  /** Hard cap on simulated determinizations. */
  maxIterations?: number;
  /** Injectable RNG for deterministic tests. */
  rng?: () => number;
  /** Personality of the seat being decided; defaults to "normal". */
  profile?: BotProfile;
}

const DEFAULT_TIME_BUDGET_MS = 800;
const DEFAULT_MAX_ITERATIONS = 2000;
const UCB_C = Math.SQRT2;
/** Scale of the profile bias against the 0..1 win rate: a full-weight term
 *  (+-0.4 from normal) tips moves within ~0.06 of each other, never a blunder. */
const PROFILE_BIAS_WEIGHT = 0.15;

/** `wins` sums the simulation reward (see `simulateRootMove`), not a 0/1 count. */
export interface RootStat {
  wins: number;
  visits: number;
}

export function chooseClientAction(view: PlayerView, options: BotOptions = {}): BotAction {
  if (view.turn !== view.mySeat) throw new Error("not_your_turn");
  if (view.phase === "bidding") return chooseBidAction(view, options);
  if (view.phase === "playing") return choosePlayAction(view, options);
  throw new Error("no_action_available");
}

function configOf(options: BotOptions): BotProfileConfig {
  return BOT_PROFILE_CONFIG[options.profile ?? DEFAULT_BOT_PROFILE] ?? BOT_PROFILE_CONFIG[DEFAULT_BOT_PROFILE];
}

function chooseBidAction(view: PlayerView, options: BotOptions): BotAction {
  const opts = view.bidOptions;
  const cfg = configOf(options);
  if (view.variant === "belote") {
    const suits = (opts?.suits ?? []) as Suit[];
    const suit = view.turnedCard ? decideBeloteTake(view.myHand, view.turnedCard, suits, cfg) : null;
    return suit ? { action: "BID", value: BELOTE_CONTRACT_VALUE, suit } : { action: "PASS" };
  }
  if (!opts) return { action: "PASS" };
  const bid = decideBotBid(view.myHand, view.bids, view.mySeat, opts, cfg);
  if (bid.type === "coinche") return { action: "COINCHE" };
  if (bid.type === "surcoinche") return { action: "SURCOINCHE" };
  if (bid.type === "bid") return { action: "BID", value: bid.value!, suit: bid.suit! };
  return { action: "PASS" };
}

function choosePlayAction(view: PlayerView, options: BotOptions): BotAction {
  if (!view.contract) throw new Error("missing_contract");
  if (view.legalCards.length === 0) throw new Error("no_legal_cards");
  // Deterministic tactics narrow the candidate set the search will explore.
  const played = [...view.tricks, view.currentTrick].flatMap((t) => t.cards.map((p) => p.card));
  const legal = refinePlayCandidates(view, played, view.currentTrick.cards.length === 0);
  if (legal.length === 1) return { action: "PLAY", card: legal[0] };

  const rng = options.rng ?? Math.random;
  const timeBudgetMs = options.timeBudgetMs ?? DEFAULT_TIME_BUDGET_MS;
  const maxIterations = options.maxIterations ?? DEFAULT_MAX_ITERATIONS;
  const stats: RootStat[] = legal.map(() => ({ wins: 0, visits: 0 }));
  const determinizer = buildDeterminizer(view, rng);

  const start = performance.now();
  let iterations = 0;
  while (iterations < maxIterations && performance.now() - start < timeBudgetMs) {
    const index = selectRootIndex(stats, iterations);
    stats[index].visits += 1;
    stats[index].wins += simulateRootMove(determinizer.next(), legal[index], rng);
    iterations += 1;
  }
  const bias = profilePlayBonus(view, legal, configOf(options)).map((b) => b * PROFILE_BIAS_WEIGHT);
  return { action: "PLAY", card: legal[bestIndex(stats, bias)] };
}

/** UCB1 selection, trying each root move once before exploiting. */
function selectRootIndex(stats: RootStat[], totalIterations: number): number {
  for (let i = 0; i < stats.length; i++) {
    if (stats[i].visits === 0) return i;
  }
  const logN = Math.log(totalIterations + 1);
  let best = 0;
  let bestScore = -Infinity;
  for (let i = 0; i < stats.length; i++) {
    const mean = stats[i].wins / stats[i].visits;
    const score = mean + UCB_C * Math.sqrt(logN / stats[i].visits);
    if (score > bestScore) {
      bestScore = score;
      best = i;
    }
  }
  return best;
}

/** Root move with the highest observed win rate (plus profile bias) across determinizations. */
export function bestIndex(stats: RootStat[], bias: number[] = []): number {
  let best = 0;
  let bestRate = -Infinity;
  for (let i = 0; i < stats.length; i++) {
    const rate = stats[i].visits === 0 ? -Infinity : stats[i].wins / stats[i].visits + (bias[i] ?? 0);
    if (rate > bestRate) {
      bestRate = rate;
      best = i;
    }
  }
  return best;
}
