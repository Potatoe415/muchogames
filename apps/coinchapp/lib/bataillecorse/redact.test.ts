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
    expect(redact(state, 0).myNextCards).toEqual([]);
    expect(redact(state, 1).myTopCard).toEqual(card("9"));
  });

  it("previews only the attempts this seat still owes, in play order, never the opponent's stock", () => {
    const state = stateWith({
      turn: 1,
      stocks: [
        [card("2"), card("3"), card("4")],
        [card("5"), card("6"), card("7"), card("8"), card("9")],
      ],
      tribute: { seat: 1, attemptsLeft: 3, fromRank: "K" },
    });
    const payer = redact(state, 1);
    expect(payer.myNextCards).toEqual([card("9"), card("8"), card("7")]);
    expect(payer.myTopCard).toEqual(card("9"));
    expect(redact(state, 0).myNextCards).toEqual([card("4")]);
    expect(JSON.stringify(redact(state, 0))).not.toContain('"rank":"9"');
  });
});
