import { describe, expect, it } from "vitest";
import { bidOptions } from "./bidding";
import { cardId } from "./cards";
import { beginNextDeal, createInitialState } from "./deal";
import { submitBid } from "./engine";
import { computeDealResult } from "./scoring";
import { dealWithWinners, seededRng } from "./test-utils";
import type { GameState, Seat, Suit } from "./types";

function opened(seed = 1): GameState {
  return beginNextDeal(createInitialState(1000, {}, "belote"), seededRng(seed));
}

function passTimes(state: GameState, count: number): GameState {
  let s = state;
  for (let i = 0; i < count; i++) s = submitBid(s, { seat: s.turn, type: "pass" });
  return s;
}

function otherSuit(suit: Suit): Suit {
  return suit === "H" ? "S" : "H";
}

describe("belote deal", () => {
  it("deals 5 cards each, one turned card and an 11-card stock", () => {
    const s = opened();
    expect(s.phase).toBe("bidding");
    expect(s.hands.map((h) => h.length)).toEqual([5, 5, 5, 5]);
    expect(s.stock).toHaveLength(11);
    const ids = new Set([...s.hands.flat(), s.turnedCard!, ...s.stock!].map(cardId));
    expect(ids.size).toBe(32);
  });

  it("keeps Coinche's 8-card deal when no variant is set", () => {
    const s = beginNextDeal(createInitialState(1000), seededRng(1));
    expect(s.hands.map((h) => h.length)).toEqual([8, 8, 8, 8]);
    expect(s.turnedCard).toBeUndefined();
  });
});

describe("belote bidding", () => {
  it("offers only the turned suit on the first go-round", () => {
    const s = opened();
    expect(bidOptions(s).suits).toEqual([s.turnedCard!.suit]);
    expect(() => submitBid(s, { seat: s.turn, type: "bid", suit: otherSuit(s.turnedCard!.suit) })).toThrow(
      "bad_bid_suit",
    );
  });

  it("offers every other suit on the second go-round", () => {
    const s = passTimes(opened(), 4);
    const suits = bidOptions(s).suits;
    expect(suits).toHaveLength(3);
    expect(suits).not.toContain(s.turnedCard!.suit);
  });

  it("rejects coinche calls", () => {
    const s = opened();
    expect(() => submitBid(s, { seat: s.turn, type: "coinche" })).toThrow("not_in_belote");
  });

  it("completes every hand once someone takes, the taker holding the turned card", () => {
    const s = opened();
    const taker = s.turn;
    const turned = s.turnedCard!;
    const next = submitBid(s, { seat: taker, type: "bid", suit: turned.suit });
    expect(next.phase).toBe("playing");
    expect(next.hands.map((h) => h.length)).toEqual([8, 8, 8, 8]);
    expect(next.hands[taker].map(cardId)).toContain(cardId(turned));
    expect(next.stock).toEqual([]);
    expect(next.trump).toBe(turned.suit);
    expect(next.contract).toMatchObject({ seat: taker, suit: turned.suit, coinche: 1 });
    expect(next.turn).toBe(((s.dealer + 1) % 4) as Seat);
    expect(new Set(next.hands.flat().map(cardId)).size).toBe(32);
  });

  it("redeals with the next dealer after two go-rounds of passes", () => {
    const s = opened();
    const next = passTimes(s, 8);
    expect(next.phase).toBe("bidding");
    expect(next.bids).toEqual([]);
    expect(next.dealer).toBe(((s.dealer + 1) % 4) as Seat);
    expect(next.hands.map((h) => h.length)).toEqual([5, 5, 5, 5]);
  });
});

/** A scored belote deal: team A took (seat 0) with hearts, `winners` per trick. */
function beloteDeal(winners: Seat[], belote: { A: number; B: number } = { A: 0, B: 0 }): GameState {
  const base = dealWithWinners(winners, "H");
  return {
    ...base,
    variant: "belote",
    contract: { seat: 0, team: "A", value: 82, suit: "H", coinche: 1 },
    belote: { team: null, points: belote, announced: [] },
  };
}

describe("belote scoring", () => {
  it("scores each side its own points when the taker makes it", () => {
    const s = beloteDeal([0, 0, 0, 0, 0, 1, 1, 0]);
    const r = computeDealResult(s);
    expect(r.contractMade).toBe(true);
    expect(r.gained.A + r.gained.B).toBe(162);
    expect(r.gained.A).toBe(r.cardPoints.A);
  });

  it("gives the defence 162 when the taker goes dedans, belote kept by its holder", () => {
    const s = beloteDeal([1, 1, 1, 1, 1, 0, 1, 1], { A: 20, B: 0 });
    const r = computeDealResult(s);
    expect(r.contractMade).toBe(false);
    expect(r.gained).toEqual({ A: 20, B: 162 });
  });

  it("counts belote towards the taker, a tie scoring each side its own points", () => {
    const s = beloteDeal([1, 1, 1, 1, 0, 0, 0, 0]);
    const { cardPoints } = computeDealResult(s);
    const gap = cardPoints.B - cardPoints.A;
    expect(gap).toBeGreaterThan(0);
    const r = computeDealResult({ ...s, belote: { team: "A", points: { A: gap, B: 0 }, announced: [] } });
    expect(r.contractMade).toBe(true);
    expect(r.gained).toEqual({ A: cardPoints.A + gap, B: cardPoints.B });
  });

  it("scores 252 for the taker's capot", () => {
    const r = computeDealResult(beloteDeal([0, 2, 0, 2, 0, 2, 0, 0]));
    expect(r.capot).toBe(true);
    expect(r.gained).toEqual({ A: 252, B: 0 });
  });

  it("scores 252 for the defence when the taker wins no trick", () => {
    const r = computeDealResult(beloteDeal([1, 3, 1, 3, 1, 3, 1, 1]));
    expect(r.contractMade).toBe(false);
    expect(r.gained).toEqual({ A: 0, B: 252 });
  });
});
