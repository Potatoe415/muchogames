import { describe, expect, it } from "vitest";
import { autoFinishStep, canAutoFinish } from "./autoFinish";
import { RANK_ORDER } from "./cards";
import { card, down, stateWith, up } from "./test-utils";
import type { GameState, Suit } from "./types";

const upTo = (suit: Suit, count: number) => RANK_ORDER.slice(0, count).map((rank) => card(rank, suit));

describe("canAutoFinish", () => {
  it("needs an empty stock and waste and every column card face up", () => {
    const tableau = [[up("K", "S")]];
    expect(canAutoFinish(stateWith({ tableau }))).toBe(true);
    expect(canAutoFinish(stateWith({ tableau, stock: [card("2", "H")] }))).toBe(false);
    expect(canAutoFinish(stateWith({ tableau, waste: [card("2", "H")] }))).toBe(false);
    expect(canAutoFinish(stateWith({ tableau: [[down("Q", "H"), up("K", "S")]] }))).toBe(false);
  });
});

describe("autoFinishStep", () => {
  it("moves the lowest column top first", () => {
    const state = stateWith({
      foundations: { H: upTo("H", 4), S: upTo("S", 2) },
      tableau: [[up("6", "S"), up("5", "H")], [up("4", "C"), up("3", "S")]],
    });
    expect(autoFinishStep(state)?.foundations.S).toEqual(upTo("S", 3));
  });

  it("always reaches a won game from an all-face-up position", () => {
    let state: GameState | null = stateWith({
      foundations: { H: upTo("H", 11), D: upTo("D", 11), C: upTo("C", 12), S: upTo("S", 11) },
      tableau: [[up("K", "H"), up("Q", "S")], [up("K", "S"), up("Q", "D")], [up("K", "D"), up("Q", "H")], [up("K", "C")]],
    });
    for (let i = 0; i < 7 && state?.phase === "playing"; i++) state = autoFinishStep(state);
    expect(state?.phase).toBe("finished");
  });
});
