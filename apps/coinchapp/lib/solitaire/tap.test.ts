import { describe, expect, it } from "vitest";
import { resolveTap } from "./tap";
import { card, stateWith, up } from "./test-utils";

describe("resolveTap", () => {
  it("sends an Ace straight to its foundation, even when a 2 could also take it", () => {
    const state = stateWith({ waste: [card("A", "H")], tableau: [[up("2", "S")]] });
    const result = resolveTap(state, null, { kind: "waste" });
    expect(result.state.foundations.H).toEqual([card("A", "H")]);
    expect(result.state.waste).toEqual([]);
    expect(result.state.tableau[0]).toEqual([up("2", "S")]);
    expect(result.selection).toBeNull();
  });

  it("does not pull an Ace back off its foundation", () => {
    const state = stateWith({ foundations: { H: [card("A", "H")] }, tableau: [[up("2", "S")]] });
    const result = resolveTap(state, null, { kind: "foundation", suit: "H" });
    expect(result.state).toBe(state);
    expect(result.selection).toEqual({ kind: "foundation", suit: "H" });
  });

  it("only picks a non-Ace up, even with a single legal destination, until that destination is tapped", () => {
    const state = stateWith({ waste: [card("2", "H")], foundations: { H: [card("A", "H")] } });
    const picked = resolveTap(state, null, { kind: "waste" });
    expect(picked).toEqual({ state, selection: { kind: "waste" } });
    const dropped = resolveTap(picked.state, picked.selection, { kind: "foundation", suit: "H" });
    expect(dropped.state.foundations.H).toEqual([card("A", "H"), card("2", "H")]);
    expect(dropped.selection).toBeNull();
  });

  it("drops a picked-up card on whichever of its destinations is tapped", () => {
    const state = stateWith({ waste: [card("7", "H")], tableau: [[up("8", "S")], [up("8", "C")]] });
    const picked = resolveTap(state, null, { kind: "waste" });
    expect(picked.selection).toEqual({ kind: "waste" });
    expect(picked.state).toBe(state);
    const dropped = resolveTap(picked.state, picked.selection, { kind: "tableau", col: 1, index: 0 });
    expect(dropped.state.tableau[1]).toEqual([up("8", "C"), up("7", "H")]);
    expect(dropped.selection).toBeNull();
  });

  it("puts a picked-up card back down when it is tapped again", () => {
    const state = stateWith({ waste: [card("7", "H")], tableau: [[up("8", "S")], [up("8", "C")]] });
    expect(resolveTap(state, { kind: "waste" }, { kind: "waste" })).toEqual({ state, selection: null });
  });

  it("ignores a tap on a card with nowhere to go", () => {
    const state = stateWith({ waste: [card("7", "H")] });
    expect(resolveTap(state, null, { kind: "waste" })).toEqual({ state, selection: null });
  });

  it("drops the selection for an illegal destination's own card instead of moving", () => {
    const state = stateWith({ waste: [card("7", "H")], tableau: [[up("8", "S")], [up("9", "D")]] });
    const result = resolveTap(state, { kind: "waste" }, { kind: "tableau", col: 1, index: 0 });
    expect(result.state).toBe(state);
    expect(result.selection).toBeNull();
  });
});
