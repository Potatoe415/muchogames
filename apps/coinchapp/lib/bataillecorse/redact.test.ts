import { describe, expect, it } from "vitest";
import { redact } from "./redact";
import { card, stateWith } from "./test-utils";

describe("redact", () => {
  it("gives each seat only its own stock top, never the opponent's order", () => {
    const state = stateWith({
      turn: 0,
      stocks: [
        [card("9"), card("K", "H")],
        [card("7"), card("A", "D")],
      ],
    });
    const seat0 = redact(state, 0);
    const seat1 = redact(state, 1);
    expect(seat0.myTopCard).toEqual(card("K", "H"));
    expect(seat0.myStockCount).toBe(2);
    expect(seat0.opponentStockCount).toBe(2);
    expect(seat1.myTopCard).toEqual(card("A", "D"));
    expect(seat0.myTopCard).not.toEqual(seat1.myTopCard);
  });

  it("sets myTopCard to null when that stock is empty", () => {
    const state = stateWith({ turn: 0, stocks: [[], [card("9")]] });
    expect(redact(state, 0).myTopCard).toBeNull();
    expect(redact(state, 1).myTopCard).toEqual(card("9"));
  });
});
