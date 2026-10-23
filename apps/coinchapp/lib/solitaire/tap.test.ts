import { describe, expect, it } from "vitest";
import { resolveTap } from "./tap";
import { card, stateWith, up } from "./test-utils";

describe("resolveTap", () => {
  it("moves a card straight to its only legal destination", () => {
    const state = stateWith({ waste: [card("A", "H")] });
    const result = resolveTap(state, null, { kind: "waste" });
    expect(result.state.foundations.H).toEqual([card("A", "H")]);
    expect(result.selection).toBeNull();
  });

  it("picks a card up when it has several destinations, then drops it on the tapped one", () => {
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
});
