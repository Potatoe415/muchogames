import { shuffle, type Rng } from "@/lib/cards";
import { dealBeloteOpening } from "./belote";
import { buildDeck, nextSeat } from "./cards";
import type { Card, GameState, ScoringRules, Variant } from "./types";

export type { Rng } from "@/lib/cards";
export { shuffle };
export const DEFAULT_SCORING_RULES: ScoringRules = {
  countContractOnlyIfMade: false,
  failedContractDefensePoints: 160,
  zeroPointsForNonContractingTeamWhenContractMade: false,
  capotMadePoints: 250,
  capotFailedDefensePoints: 250,
  allowToutAtoutSansAtout: false,
  requireMorePointsToWin: true,
};

/** Deal 8 cards per seat in the classic 3-2-3 pattern. */
export function dealHands(deck: Card[]): Card[][] {
  const hands: Card[][] = [[], [], [], []];
  const packets = [3, 2, 3];
  let index = 0;
  for (const size of packets) {
    for (let seat = 0; seat < 4; seat++) {
      for (let n = 0; n < size; n++) {
        hands[seat].push(deck[index++]);
      }
    }
  }
  return hands;
}

export function createInitialState(
  targetPoints: number,
  scoringRules: Partial<ScoringRules> = {},
  variant: Variant = "coinche",
): GameState {
  return {
    ...(variant === "belote" ? { variant } : {}),
    phase: "lobby",
    dealer: 3,
    turn: 0,
    trump: null,
    contract: null,
    bids: [],
    hands: [[], [], [], []],
    currentTrick: { leader: 0, cards: [] },
    tricks: [],
    belote: { team: null, points: { A: 0, B: 0 }, announced: [] },
    scores: { A: 0, B: 0 },
    targetPoints,
    scoringRules: { ...DEFAULT_SCORING_RULES, ...scoringRules },
    lastDeal: undefined,
    winner: undefined,
  };
}

/** Rotate the dealer, deal a fresh hand and open the bidding phase.
 *  Belote deals 5 cards each plus a face-up card instead of the full 8. */
export function beginNextDeal(state: GameState, rng: Rng = Math.random): GameState {
  const dealer = nextSeat(state.dealer);
  const opener = nextSeat(dealer);
  const deck = shuffle(buildDeck(), rng);
  const next: GameState = {
    ...state,
    phase: "bidding",
    dealer,
    turn: opener,
    trump: null,
    contract: null,
    bids: [],
    hands: [],
    currentTrick: { leader: opener, cards: [] },
    tricks: [],
    belote: { team: null, points: { A: 0, B: 0 }, announced: [] },
    lastDeal: undefined,
  };
  if (state.variant === "belote") return { ...next, ...dealBeloteOpening(deck) };
  return { ...next, hands: dealHands(deck) };
}
