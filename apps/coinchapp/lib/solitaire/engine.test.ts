import { describe, expect, it } from "vitest";
import { RANK_ORDER } from "./cards";
import { applyMove, draw, legalTargets, movableCards } from "./engine";
import { card, down, stateWith, up } from "./test-utils";

describe("draw", () => {
  it("turns one card in draw-1 mode", () => {
    const state = draw(stateWith({ stock: [card("2", "H"), card("3", "H")] }));
    expect(state.stock).toEqual([card("2", "H")]);
    expect(state.waste).toEqual([card("3", "H")]);
  });

  it("turns three cards in draw-3 mode, the stock's top card ending deepest", () => {
    const stock = [card("2", "H"), card("3", "H"), card("4", "H"), card("5", "H")];
    const state = draw(stateWith({ stock, drawCount: 3 }));
    expect(state.stock).toEqual([card("2", "H")]);
    expect(state.waste).toEqual([card("5", "H"), card("4", "H"), card("3", "H")]);
  });

  it("turns the waste back over into the stock once the stock is empty", () => {
    const state = draw(stateWith({ waste: [card("5", "H"), card("4", "H")] }));
    expect(state.waste).toEqual([]);
    expect(state.stock).toEqual([card("4", "H"), card("5", "H")]);
    expect(draw(state).waste).toEqual([card("5", "H")]);
  });
});

describe("legalTargets", () => {
  it("sends an Ace to its own foundation", () => {
    const state = stateWith({ waste: [card("A", "S")] });
    expect(legalTargets(state, { kind: "waste" })).toEqual([{ kind: "foundation", suit: "S" }]);
  });

  it("stacks a card on the next rank up of the other colour only", () => {
    const state = stateWith({ waste: [card("7", "H")], tableau: [[up("8", "S")], [up("8", "D")], [up("9", "C")]] });
    expect(legalTargets(state, { kind: "waste" })).toEqual([{ kind: "tableau", col: 0 }]);
  });

  it("only lets a King onto an empty column", () => {
    const king = stateWith({ waste: [card("K", "H")], tableau: [[up("2", "S")]] });
    expect(legalTargets(king, { kind: "waste" }).map((t) => t.kind === "tableau" && t.col)).toEqual([1, 2, 3, 4, 5, 6]);
    const queen = stateWith({ waste: [card("Q", "H")] });
    expect(legalTargets(queen, { kind: "waste" })).toEqual([]);
  });

  it("never picks up a face-down card, and moves a run only to a column", () => {
    const state = stateWith({ tableau: [[down("4", "C"), up("6", "S"), up("5", "H")], [up("7", "D")]], foundations: { H: [card("A", "H"), card("2", "H"), card("3", "H"), card("4", "H")] } });
    expect(movableCards(state, { kind: "tableau", col: 0, index: 0 })).toEqual([]);
    expect(legalTargets(state, { kind: "tableau", col: 0, index: 1 })).toEqual([{ kind: "tableau", col: 1 }]);
    expect(legalTargets(state, { kind: "tableau", col: 0, index: 2 })).toEqual([{ kind: "foundation", suit: "H" }]);
  });
});

describe("applyMove", () => {
  it("flips the column card the move uncovers", () => {
    const state = stateWith({ tableau: [[down("4", "C"), up("A", "D")]] });
    const next = applyMove(state, { kind: "tableau", col: 0 }, { kind: "foundation", suit: "D" });
    expect(next?.tableau[0]).toEqual([up("4", "C")]);
    expect(next?.foundations.D).toEqual([card("A", "D")]);
    expect(next?.moves).toBe(1);
  });

  it("rejects an illegal move", () => {
    const state = stateWith({ waste: [card("2", "S")] });
    expect(applyMove(state, { kind: "waste" }, { kind: "foundation", suit: "S" })).toBeNull();
  });

  it("finishes the game once every foundation holds its 13 cards", () => {
    const fullBut = (suit: "H" | "D" | "C" | "S", last: number) => RANK_ORDER.slice(0, last).map((rank) => card(rank, suit));
    const state = stateWith({
      waste: [card("K", "S")],
      foundations: { H: fullBut("H", 13), D: fullBut("D", 13), C: fullBut("C", 13), S: fullBut("S", 12) },
    });
    expect(applyMove(state, { kind: "waste" }, { kind: "foundation", suit: "S" })?.phase).toBe("finished");
  });
});
