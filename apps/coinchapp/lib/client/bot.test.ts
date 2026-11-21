import { describe, expect, it } from "vitest";
import { DEFAULT_SCORING_RULES } from "@/lib/coinche";
import type { Card, PlayedCard, PlayerView, Rank, Seat, Suit, Trick } from "@/lib/coinche";
import { chooseClientAction } from "./bot";

function card(id: string): Card {
  return { suit: id.slice(-1) as Suit, rank: id.slice(0, -1) as Rank };
}

function trick(leader: Seat, winner: Seat, ids: string[]): Trick {
  const cards: PlayedCard[] = ids.map((id, i) => ({ seat: ((leader + i) % 4) as Seat, card: card(id) }));
  return { leader, winner, cards };
}

/** Deterministic LCG so the test is reproducible across runs. */
function makeRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

/**
 * Trick 7 of 8, hearts trump, seat 0 to lead with the jack of hearts (every other
 * trump is down) and the 7 of spades. Seats 1 and 2 are void in spades, so the
 * last spade (the 8) sits with seat 3 and beats the 7.
 */
function lastTwoTricksView(): PlayerView {
  return {
    mySeat: 0,
    phase: "playing",
    dealer: 3,
    turn: 0,
    trump: "H",
    contract: { seat: 0, team: "A", value: 80, suit: "H", coinche: 1 },
    bids: [],
    myHand: [card("JH"), card("7S")],
    legalCards: [card("JH"), card("7S")],
    bidOptions: null,
    handCounts: [2, 2, 2, 2],
    currentTrick: { leader: 0, cards: [] },
    tricks: [
      trick(0, 2, ["7H", "8H", "10H", "QH"]),
      trick(2, 2, ["9H", "KH", "AH", "9C"]),
      trick(2, 3, ["9S", "10S", "JS", "QS"]),
      trick(3, 3, ["10D", "JD", "QD", "KD"]),
      trick(3, 3, ["10C", "JC", "QC", "KC"]),
      trick(3, 0, ["KS", "AS", "AD", "AC"]),
    ],
    lastTrick: null,
    tricksWon: { A: 1, B: 5 },
    scores: { A: 0, B: 0 },
    targetPoints: 1000,
    scoringRules: DEFAULT_SCORING_RULES,
    lastDeal: null,
    winner: null,
    beloteAnnounced: [],
  };
}

describe("client bot play", () => {
  it("keeps its master trump for the last trick (dix de der) once the contract is decided", () => {
    for (let seed = 1; seed <= 5; seed++) {
      const action = chooseClientAction(lastTwoTricksView(), {
        rng: makeRng(seed),
        maxIterations: 400,
        timeBudgetMs: 5000,
      });
      expect(action).toEqual({ action: "PLAY", card: card("7S") });
    }
  });
});
