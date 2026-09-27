import { describe, expect, it } from "vitest";
import type { PlayerView } from "@/lib/bataillecorse";
import { canFlip } from "./useOptimisticFlip";

function view(overrides: Partial<PlayerView>): PlayerView {
  return {
    phase: "playing",
    mySeat: 0,
    turn: 0,
    myStockCount: 10,
    opponentStockCount: 10,
    myTopCard: { rank: "9", suit: "S" },
    myNextCards: [{ rank: "9", suit: "S" }],
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

describe("canFlip", () => {
  it("allows a flip on this seat's turn with no slap window", () => {
    expect(canFlip(view({}), 0)).toBe(true);
  });

  it("blocks a flip while the pile-win sweep is in flight", () => {
    expect(canFlip(view({}), 0, true)).toBe(false);
  });

  it("blocks a flip when it is not this seat's turn, a window is open, or the match ended", () => {
    expect(canFlip(view({ turn: 1 }), 0)).toBe(false);
    expect(canFlip(view({ slapWindow: { id: 1, pattern: "double", openedAtMs: 0 } }), 0)).toBe(false);
    expect(canFlip(view({ phase: "finished" }), 0)).toBe(false);
  });
});
