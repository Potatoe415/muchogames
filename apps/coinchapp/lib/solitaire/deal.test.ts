import { describe, expect, it } from "vitest";
import { createInitialState } from "./deal";
import { seededRng } from "./test-utils";

describe("createInitialState", () => {
  it("deals 1..7 cards per column with only the top card face up", () => {
    const state = createInitialState(seededRng(1), 1);
    state.tableau.forEach((column, col) => {
      expect(column).toHaveLength(col + 1);
      expect(column.map((entry) => entry.faceUp)).toEqual(column.map((_, row) => row === col));
    });
  });

  it("leaves the other 24 cards in the stock, with no duplicate across the table", () => {
    const state = createInitialState(seededRng(2), 3);
    expect(state.stock).toHaveLength(24);
    expect(state.waste).toHaveLength(0);
    const ids = new Set([...state.stock, ...state.tableau.flat().map((entry) => entry.card)].map((c) => `${c.rank}${c.suit}`));
    expect(ids.size).toBe(52);
    expect(state.drawCount).toBe(3);
  });

  it("is deterministic for a given seed", () => {
    expect(createInitialState(seededRng(42), 1)).toEqual(createInitialState(seededRng(42), 1));
  });
});
