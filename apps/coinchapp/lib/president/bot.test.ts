import { describe, expect, it } from "vitest";
import { chooseAction } from "./bot";
import { redact } from "./redact";
import { card, exchangeState, playingState } from "./test-utils";
import type { Titles } from "./types";

describe("chooseAction", () => {
  it("plays the smallest legal combo when one is available", () => {
    const state = playingState({
      turn: 1,
      hands: [[], [card("K", "S"), card("A", "D")], [], []],
    });
    const action = chooseAction(redact(state, 1));
    expect(action.action).toBe("COMBO");
    if (action.action === "COMBO") expect(action.combo.rank).toBe("K");
  });

  it("passes when no legal combo exists", () => {
    const state = playingState({
      turn: 1,
      hands: [[], [card("3", "H")], [], []],
      pile: { combo: { rank: "A", cards: [card("A", "S")] }, leader: 0 },
    });
    const action = chooseAction(redact(state, 1));
    expect(action).toEqual({ action: "PASS" });
  });

  it("returns the lowest-ranked owed cards during the exchange phase", () => {
    const titles: Titles = ["president", "vicePresident", "viceTrouDuCul", "trouDuCul"];
    const state = exchangeState({
      hands: [[card("2", "H"), card("3", "H"), card("K", "H")], [], [], []],
      titles,
      awaiting: [0, 1],
      owed: { 0: 2, 1: 0, 2: 0, 3: 0 },
    });
    const action = chooseAction(redact(state, 0));
    expect(action).toEqual({ action: "EXCHANGE_RETURN", cards: [card("3", "H"), card("K", "H")] });
  });

  it("gives away a lone higher card before breaking a lower pair during the exchange", () => {
    const titles: Titles = ["president", "vicePresident", "viceTrouDuCul", "trouDuCul"];
    const state = exchangeState({
      hands: [[card("4", "S"), card("4", "D"), card("9", "H")], [], [], []],
      titles,
      awaiting: [0, 1],
      owed: { 0: 1, 1: 0, 2: 0, 3: 0 },
    });
    const action = chooseAction(redact(state, 0));
    expect(action).toEqual({ action: "EXCHANGE_RETURN", cards: [card("9", "H")] });
  });

  it("passes rather than breaking a pair when the hand is not close to the endgame", () => {
    const state = playingState({
      turn: 1,
      hands: [[], [card("7", "S"), card("7", "D"), card("9", "C"), card("9", "D"), card("3", "H")], [], []],
      pile: { combo: { rank: "6", cards: [card("6", "S")] }, leader: 0 },
    });
    const action = chooseAction(redact(state, 1));
    expect(action).toEqual({ action: "PASS" });
  });

  it("prefers a spare single over breaking a pair, even at a higher rank", () => {
    const state = playingState({
      turn: 1,
      hands: [[], [card("7", "S"), card("7", "D"), card("9", "C")], [], []],
      pile: { combo: { rank: "6", cards: [card("6", "S")] }, leader: 0 },
    });
    const action = chooseAction(redact(state, 1));
    expect(action.action).toBe("COMBO");
    if (action.action === "COMBO") expect(action.combo.rank).toBe("9");
  });

  it("breaks the pair once the hand is down to the endgame threshold", () => {
    const state = playingState({
      turn: 1,
      hands: [[], [card("7", "S"), card("7", "D"), card("3", "H")], [], []],
      pile: { combo: { rank: "6", cards: [card("6", "S")] }, leader: 0 },
    });
    const action = chooseAction(redact(state, 1));
    expect(action.action).toBe("COMBO");
    if (action.action === "COMBO") expect(action.combo.rank).toBe("7");
  });

  it("hoards an intact Ace rather than spending it when nobody is close to going out", () => {
    const state = playingState({
      turn: 1,
      hands: [[], [card("A", "S"), card("3", "H"), card("3", "D"), card("3", "C"), card("3", "S")], [], []],
      pile: { combo: { rank: "K", cards: [card("K", "S")] }, leader: 0 },
    });
    const action = chooseAction(redact(state, 1));
    expect(action).toEqual({ action: "PASS" });
  });

  it("spends its last Ace instead of passing once its own hand is down to the endgame threshold", () => {
    const state = playingState({
      turn: 1,
      hands: [[], [card("A", "S"), card("3", "H")], [], []],
      pile: { combo: { rank: "K", cards: [card("K", "S")] }, leader: 0 },
    });
    const action = chooseAction(redact(state, 1));
    expect(action).toEqual({ action: "COMBO", combo: { rank: "A", cards: [card("A", "S")] } });
  });

  it("breaks its own pair rather than passing once an opponent is close to going out", () => {
    const state = playingState({
      turn: 1,
      hands: [
        [card("Q", "H")],
        [card("7", "S"), card("7", "D"), card("9", "C"), card("9", "D"), card("3", "H")],
        [],
        [],
      ],
      pile: { combo: { rank: "6", cards: [card("6", "S")] }, leader: 0 },
    });
    const action = chooseAction(redact(state, 1));
    expect(action.action).toBe("COMBO");
  });

  it("passes rather than finishing on a lone 2 when a pass is allowed", () => {
    const state = playingState({
      turn: 1,
      hands: [[], [card("2", "H")], [], []],
      pile: { combo: { rank: "K", cards: [card("K", "S")] }, leader: 0 },
    });
    expect(chooseAction(redact(state, 1))).toEqual({ action: "PASS" });
  });

  it("spends its twos before the last non-two so it does not finish on them", () => {
    const state = playingState({
      turn: 1,
      hands: [[], [card("2", "H"), card("2", "S"), card("5", "D")], [], []],
    });
    const action = chooseAction(redact(state, 1));
    expect(action.action).toBe("COMBO");
    if (action.action === "COMBO") expect(action.combo.rank).toBe("2");
  });

  it("still plays a lone 2 when it is leading and has nothing else", () => {
    const state = playingState({
      turn: 1,
      hands: [[], [card("2", "H")], [], []],
    });
    const action = chooseAction(redact(state, 1));
    expect(action).toEqual({ action: "COMBO", combo: { rank: "2", cards: [card("2", "H")] } });
  });
});
