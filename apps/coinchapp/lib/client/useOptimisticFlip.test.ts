import { describe, expect, it } from "vitest";
import type { PlayerView } from "@/lib/bataillecorse";
import { flipHasLanded, type PendingFlip } from "./useOptimisticFlip";

function view(overrides: Partial<PlayerView>): PlayerView {
  return {
    phase: "playing",
    mySeat: 0,
    turn: 0,
    myStockCount: 10,
    opponentStockCount: 10,
    myTopCard: { rank: "9", suit: "S" },
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

const pending: PendingFlip = {
  card: { rank: "9", suit: "S" },
  pileLength: 0,
  stockCount: 10,
  lastPileWinId: null,
};

describe("flipHasLanded", () => {
  it("stays pending until the pile or stock actually changes", () => {
    expect(flipHasLanded(view({}), pending)).toBe(false);
    expect(flipHasLanded(view({ tribute: { seat: 0, attemptsLeft: 2, fromRank: "K" } }), pending)).toBe(false);
  });

  it("confirms as soon as the pile grew, even when tribute keeps this seat's turn", () => {
    expect(flipHasLanded(view({ pile: [{ rank: "9", suit: "S" }], myStockCount: 9, turn: 0 }), pending)).toBe(true);
  });

  it("does not treat an already-echoed pile as still pending (avoids a duplicate top card)", () => {
    const echoed = view({ pile: [{ rank: "9", suit: "S" }], myStockCount: 9 });
    expect(flipHasLanded(echoed, pending)).toBe(true);
  });

  it("confirms when a pile-win id appears (tribute fail / slap) even if pile was cleared", () => {
    expect(
      flipHasLanded(
        view({
          pile: [],
          myStockCount: 14,
          lastPileWin: { id: 3, seat: 1, cardCount: 4, cards: [], reason: "tribute" },
        }),
        pending,
      ),
    ).toBe(true);
  });
});
