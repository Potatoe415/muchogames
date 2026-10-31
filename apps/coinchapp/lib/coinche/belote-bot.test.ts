import { describe, expect, it } from "vitest";
import { decideBeloteTake } from "./belote-bot";
import { chooseBid, chooseCard } from "./bot";
import { beginNextDeal, createInitialState } from "./deal";
import { submitBid, submitPlay } from "./engine";
import { card, seededRng } from "./test-utils";
import type { GameState } from "./types";

/** Bots bid and play one deal to its end, redeals included. */
function playDeal(seed: number): GameState {
  const rng = seededRng(seed);
  let s = beginNextDeal(createInitialState(1000, {}, "belote"), rng);
  for (let guard = 0; guard < 1000 && (s.phase === "bidding" || s.phase === "playing"); guard++) {
    s = s.phase === "bidding" ? submitBid(s, chooseBid(s), rng) : submitPlay(s, s.turn, chooseCard(s));
  }
  return s;
}

describe("belote bot", () => {
  it("passes without the trump Jack or 9", () => {
    const hand = [card("A", "H"), card("10", "H"), card("K", "H"), card("A", "S"), card("A", "D")];
    expect(decideBeloteTake(hand, card("Q", "H"), ["H"])).toBeNull();
  });

  it("takes a hand led by the trump Jack and 9", () => {
    const hand = [card("J", "H"), card("9", "H"), card("8", "D"), card("7", "S"), card("A", "C")];
    expect(decideBeloteTake(hand, card("7", "H"), ["H"])).toBe("H");
  });

  it("counts the turned card even when naming another suit", () => {
    const hand = [card("J", "S"), card("9", "S"), card("A", "S"), card("7", "D"), card("8", "D")];
    expect(decideBeloteTake(hand, card("J", "H"), ["S", "D", "C"])).toBe("S");
  });

  it("plays many deals to a score without an illegal move", () => {
    for (let seed = 1; seed <= 60; seed++) {
      const done = playDeal(seed);
      expect(done.tricks).toHaveLength(8);
      expect(["scoring", "finished"]).toContain(done.phase);
      expect(done.lastDeal).toBeDefined();
      expect(done.lastDeal!.gained.A + done.lastDeal!.gained.B).toBeGreaterThanOrEqual(162);
    }
  });

  it("makes most of the contracts it takes", () => {
    let made = 0;
    const deals = 400;
    for (let seed = 1; seed <= deals; seed++) {
      if (playDeal(seed).lastDeal!.contractMade) made++;
    }
    expect(made / deals).toBeGreaterThan(0.7);
  });
});
