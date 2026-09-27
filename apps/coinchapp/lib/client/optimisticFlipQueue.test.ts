import { describe, expect, it } from "vitest";
import type { Card, PlayerView, Rank } from "@/lib/bataillecorse";
import { anchorOf, flipLimit, projectQueue, reconcileFlipQueue } from "./optimisticFlipQueue";

function c(rank: Rank, suit: Card["suit"] = "S"): Card {
  return { rank, suit };
}

function view(overrides: Partial<PlayerView>): PlayerView {
  const myNextCards = overrides.myNextCards ?? [c("9")];
  return {
    phase: "playing",
    mySeat: 0,
    turn: 0,
    myStockCount: 10,
    opponentStockCount: 10,
    myTopCard: myNextCards[0] ?? null,
    myNextCards,
    pile: [],
    tribute: null,
    slapWindow: null,
    slapClaims: [],
    lastClosedSlapWindowId: null,
    winner: null,
    lastPileWin: null,
    lastFalseSlap: null,
    ...overrides,
  };
}

describe("flipLimit", () => {
  it("allows exactly one flip on a normal turn", () => {
    expect(flipLimit(view({}), 0)).toBe(1);
    expect(flipLimit(view({ turn: 1 }), 0)).toBe(0);
  });

  it("allows every plain tribute attempt up front", () => {
    const paying = view({
      tribute: { seat: 0, attemptsLeft: 3, fromRank: "K" },
      myNextCards: [c("7"), c("8"), c("9")],
      myTopCard: c("7"),
    });
    expect(flipLimit(paying, 0)).toBe(3);
  });

  it("stops after the card that answers with a figure", () => {
    const paying = view({
      tribute: { seat: 0, attemptsLeft: 3, fromRank: "K" },
      myNextCards: [c("7"), c("Q"), c("9")],
      myTopCard: c("7"),
    });
    expect(flipLimit(paying, 0)).toBe(2);
  });

  it("includes the card that opens a slap and nothing after it", () => {
    const paying = view({
      pile: [c("7", "H")],
      tribute: { seat: 0, attemptsLeft: 3, fromRank: "K" },
      myNextCards: [c("9"), c("7"), c("8")],
      myTopCard: c("9"),
    });
    expect(flipLimit(paying, 0)).toBe(2);
  });

  it("includes the last failed attempt and then stops", () => {
    const paying = view({
      tribute: { seat: 0, attemptsLeft: 1, fromRank: "J" },
      myNextCards: [c("4"), c("5")],
      myTopCard: c("4"),
    });
    expect(flipLimit(paying, 0)).toBe(1);
  });
});

describe("projectQueue", () => {
  it("counts down the attempts still owed as cards are queued", () => {
    const paying = view({
      myStockCount: 8,
      tribute: { seat: 0, attemptsLeft: 3, fromRank: "K" },
      myNextCards: [c("7"), c("8"), c("9")],
      myTopCard: c("7"),
    });
    const shown = projectQueue(paying, 0, [c("7"), c("8")]);
    expect(shown.pile.map((card) => card.rank)).toEqual(["7", "8"]);
    expect(shown.stockCount).toBe(6);
    expect(shown.tribute).toEqual({ seat: 0, attemptsLeft: 1, fromRank: "K" });
    expect(shown.turn).toBe(0);
  });

  it("hands the turn over as soon as the answering figure is queued", () => {
    const paying = view({
      tribute: { seat: 0, attemptsLeft: 3, fromRank: "K" },
      myNextCards: [c("Q")],
      myTopCard: c("Q"),
    });
    const shown = projectQueue(paying, 0, [c("Q")]);
    expect(shown.turn).toBe(1);
    expect(shown.tribute).toEqual({ seat: 1, attemptsLeft: 2, fromRank: "Q" });
  });
});

describe("reconcileFlipQueue", () => {
  const anchor = { pileLength: 0, lastPileWinId: null };
  const queued = [c("7"), c("8")];

  it("keeps the queue until the server pile grows, then drops the confirmed prefix", () => {
    const waiting = view({ myNextCards: [c("7"), c("8")], myTopCard: c("7"), tribute: { seat: 0, attemptsLeft: 3, fromRank: "K" } });
    const first = reconcileFlipQueue(waiting, 0, queued, anchor);
    expect(first.changed).toBe(false);
    expect(first.queue).toEqual(queued);

    const confirmed = view({
      pile: [c("7")],
      myStockCount: 9,
      tribute: { seat: 0, attemptsLeft: 2, fromRank: "K" },
      myNextCards: [c("8"), c("9")],
      myTopCard: c("8"),
    });
    const next = reconcileFlipQueue(confirmed, 0, queued, anchor);
    expect(next.queue).toEqual([c("8")]);
    expect(next.anchor.pileLength).toBe(1);
    const again = reconcileFlipQueue(confirmed, 0, next.queue, next.anchor);
    expect(again.changed).toBe(false);
  });

  it("clears the queue when the pile is swept", () => {
    const won = view({
      pile: [],
      myStockCount: 14,
      turn: 1,
      lastPileWin: { id: 3, seat: 1, cardCount: 4, cards: [], reason: "tribute" },
    });
    const next = reconcileFlipQueue(won, 0, queued, anchor);
    expect(next.queue).toEqual([]);
    expect(next.anchor).toEqual(anchorOf(won));
  });

  it("drops a tail the server view no longer allows", () => {
    const passed = view({
      pile: [c("Q")],
      turn: 1,
      tribute: { seat: 1, attemptsLeft: 2, fromRank: "Q" },
      myNextCards: [c("8")],
      myTopCard: c("8"),
    });
    const next = reconcileFlipQueue(passed, 0, [c("Q"), c("8")], anchor);
    expect(next.queue).toEqual([]);
  });
});
