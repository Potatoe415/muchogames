import { describe, expect, it } from "vitest";
import { simulateBotReactionMs, shouldBotFlip } from "./bot";
import type { PlayerView } from "./redact";

function view(overrides: Partial<PlayerView>): PlayerView {
  return {
    phase: "playing",
    mySeat: 1,
    turn: 1,
    myStockCount: 10,
    opponentStockCount: 10,
    myTopCard: null,
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

describe("shouldBotFlip", () => {
  it("true only when it's the bot's turn, playing, and no slap window is open", () => {
    expect(shouldBotFlip(view({}), 1)).toBe(true);
    expect(shouldBotFlip(view({ turn: 0 }), 1)).toBe(false);
    expect(shouldBotFlip(view({ phase: "finished" }), 1)).toBe(false);
    expect(shouldBotFlip(view({ slapWindow: { id: 0, pattern: "double", openedAtMs: 0 } }), 1)).toBe(false);
  });
});

describe("simulateBotReactionMs", () => {
  it("stays within a bounded, always-positive range", () => {
    for (let i = 0; i < 50; i++) {
      const ms = simulateBotReactionMs(800);
      expect(ms).toBeGreaterThanOrEqual(150);
      expect(ms).toBeLessThanOrEqual(2500);
    }
  });
});
