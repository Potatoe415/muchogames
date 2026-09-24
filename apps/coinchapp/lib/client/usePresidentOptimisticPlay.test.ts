import { describe, expect, it } from "vitest";
import type { Combo, PlayerView } from "@/lib/president";
import { pileWithPendingCombo } from "./usePresidentOptimisticPlay";

function combo(rank: Combo["rank"], suit: "S" | "H" | "D" | "C"): Combo {
  return { rank, cards: [{ rank, suit }] };
}

describe("pileWithPendingCombo", () => {
  it("slides the just-played combo in from the seat that played it", () => {
    const pile: PlayerView["pile"] = { combo: combo("7", "H"), leader: 3, stackCount: 1 };
    const pending = combo("9", "S");
    expect(pileWithPendingCombo(pile, pending, 0)).toEqual({ combo: pending, leader: 0, stackCount: 1 });
  });
});
