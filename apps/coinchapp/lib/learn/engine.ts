import { computeBelote, createInitialState, partnerOf, teamOf, trickWinner, trumpStrength } from "@/lib/coinche";
import type { Step } from "./types";
import type { Card, Contract, GameState, PlayedCard, Rank, ScoringRules, Seat, Suit } from "@/lib/coinche";

/** Scoring used by the "Apprendre à jouer" tutorial: the local-game defaults
 *  (`DEFAULT_GAME_SETUP` in `components/GameSettingsPanel.tsx`), so what the
 *  tutorial teaches is what a first local match scores. Keep both in sync. */
export const TUTORIAL_SCORING: Partial<ScoringRules> = {
  countContractOnlyIfMade: true,
  zeroPointsForNonContractingTeamWhenContractMade: true,
};

/** "JH 9H 10S" -> cards. Last char is the suit (H, D, C, S), the rest the rank. */
export function parseCards(text: string): Card[] {
  return text
    .trim()
    .split(/\s+/)
    .map((token) => ({ rank: token.slice(0, -1) as Rank, suit: token.slice(-1) as Suit }));
}

/** A playing-phase state for a scripted tutorial trick or deal. `played` are the
 *  cards already on the felt (the first one is the leader's); `turn` follows them. */
export function practiceState(opts: {
  hands: Card[][];
  trump: Suit;
  leader: Seat;
  played?: PlayedCard[];
  contract?: Contract;
}): GameState {
  const played = opts.played ?? [];
  const leader = (played[0]?.seat ?? opts.leader) as Seat;
  return {
    ...createInitialState(1000, TUTORIAL_SCORING),
    phase: "playing",
    trump: opts.trump,
    contract: opts.contract ?? { seat: 0, team: "A", value: 80, suit: opts.trump, coinche: 1 },
    hands: opts.hands,
    belote: computeBelote(opts.hands, opts.trump),
    currentTrick: { leader, cards: played },
    turn: ((leader + played.length) % 4) as Seat,
  };
}

/** Why the seat may play what `legalCards` allows, for the coach bubble. Mirrors
 *  `legalCards` for a single-suit trump (the only mode the tutorial uses). */
export type TurnRule =
  | "lead"
  | "follow"
  | "overtrump"
  | "undertrump"
  | "partner-master"
  | "must-cut"
  | "must-undercut"
  | "free-discard";

export function explainTurn(state: GameState, seat: Seat): TurnRule {
  const trick = state.currentTrick.cards;
  if (trick.length === 0) return "lead";
  const hand = state.hands[seat];
  const trump = state.trump as Suit;
  const led = trick[0].card.suit;
  const myTrumps = hand.filter((c) => c.suit === trump);
  const topTrump = Math.max(-1, ...trick.filter((p) => p.card.suit === trump).map((p) => trumpStrength(p.card)));
  const canOvertrump = myTrumps.some((c) => trumpStrength(c) > topTrump);

  if (led === trump) {
    if (myTrumps.length === 0) return "free-discard";
    return canOvertrump ? "overtrump" : "undertrump";
  }
  if (hand.some((c) => c.suit === led)) return "follow";
  if (trickWinner(trick, trump) === partnerOf(seat)) return "partner-master";
  if (myTrumps.length === 0) return "free-discard";
  return canOvertrump ? "must-cut" : "must-undercut";
}

/** Starting state of a scripted trick step: you (seat 0) play last. */
export function trickStepState(step: Extract<Step, { kind: "trick" }>): GameState {
  const hands: Card[][] = [parseCards(step.hand), [], [], []];
  const played = parseCards(step.played).map((card, i) => ({ seat: (i + 1) as Seat, card }));
  return practiceState({ hands, trump: step.trump, leader: 1, played });
}

/** Starting state of a scripted full deal. */
export function dealStepState(step: Extract<Step, { kind: "deal" }>): GameState {
  const contract: Contract = {
    seat: step.taker,
    team: teamOf(step.taker),
    value: step.value,
    suit: step.trump,
    coinche: step.coinche ?? 1,
  };
  return practiceState({ hands: step.hands.map(parseCards), trump: step.trump, leader: step.leader, contract });
}
