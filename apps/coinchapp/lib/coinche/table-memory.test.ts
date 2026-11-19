import { describe, expect, it } from "vitest";
import { analyzeTableState, trumpsOutside } from "./table-memory";
import { card } from "./test-utils";
import type { Trick } from "./types";

describe("analyzeTableState", () => {
  const done: Trick = {
    leader: 0,
    cards: [
      { seat: 0, card: card("A", "D") },
      { seat: 1, card: card("J", "S") }, // seat 1 cuts: void in diamonds
      { seat: 2, card: card("10", "D") },
      { seat: 3, card: card("7", "D") },
    ],
    winner: 1,
  };
  const open: Trick = { leader: 1, cards: [{ seat: 1, card: card("9", "S") }, { seat: 2, card: card("8", "H") }] };

  it("counts fallen trumps, aces and tens from public play only", () => {
    const table = analyzeTableState([done], open, "S");
    expect(table.played).toHaveLength(6);
    expect(table.trumpsPlayed).toBe(2);
    expect([...table.acesDown]).toEqual(["D"]);
    expect([...table.tensDown]).toEqual(["D"]);
  });

  it("infers voids from a failure to follow, current trick included", () => {
    const table = analyzeTableState([done], open, "S");
    expect([...table.voids[1]]).toEqual(["D"]);
    expect([...table.voids[2]]).toEqual(["S"]);
    expect(table.voids[0].size + table.voids[3].size).toBe(0);
  });

  it("trumps outside = 8 - mine - played", () => {
    const table = analyzeTableState([done], open, "S");
    expect(trumpsOutside([card("A", "S"), card("7", "S")], table, "S")).toBe(4);
  });

  it("counts no trumps in sans/tout atout", () => {
    expect(analyzeTableState([done], open, "SA").trumpsPlayed).toBe(0);
    expect(analyzeTableState([done], open, "TA").trumpsPlayed).toBe(0);
  });
});
