import { describe, expect, it } from "vitest";
import { keepMasterTrumpForLast, leadWinnersWhenTrumpsExhausted } from "./bot";
import type { Card, Rank, Suit } from "./types";

function card(suit: Suit, rank: Rank): Card {
  return { suit, rank };
}

/** All trump (spades) ranks except the two kept in hand, as already-played cards. */
const SIX_SPADES_PLAYED: Card[] = (["7", "8", "9", "10", "J", "Q"] as Rank[]).map((r) =>
  card("S", r),
);

describe("leadWinnersWhenTrumpsExhausted", () => {
  it("drops trump leads when no trump is left outside and a non-trump master exists", () => {
    const hand = [card("S", "A"), card("S", "K"), card("H", "A"), card("H", "7")];
    const result = leadWinnersWhenTrumpsExhausted(hand, hand, SIX_SPADES_PLAYED, true, "S");
    expect(result).toEqual([card("H", "A"), card("H", "7")]);
  });

  it("keeps trumps when no sure non-trump winner exists", () => {
    const hand = [card("S", "A"), card("S", "K"), card("H", "7")];
    const result = leadWinnersWhenTrumpsExhausted(hand, hand, SIX_SPADES_PLAYED, true, "S");
    expect(result).toEqual(hand);
  });

  it("does nothing while trumps are still outstanding", () => {
    const hand = [card("S", "A"), card("H", "A"), card("H", "7")];
    const played = [card("S", "7"), card("S", "8")];
    const result = leadWinnersWhenTrumpsExhausted(hand, hand, played, true, "S");
    expect(result).toEqual(hand);
  });

  it("does nothing when not leading", () => {
    const hand = [card("S", "A"), card("S", "K"), card("H", "A")];
    const result = leadWinnersWhenTrumpsExhausted(hand, hand, SIX_SPADES_PLAYED, false, "S");
    expect(result).toEqual(hand);
  });

  it("does nothing in sans-atout or tout-atout", () => {
    const hand = [card("H", "A"), card("H", "7")];
    expect(leadWinnersWhenTrumpsExhausted(hand, hand, [], true, "SA")).toEqual(hand);
    expect(leadWinnersWhenTrumpsExhausted(hand, hand, [], true, "TA")).toEqual(hand);
  });
});

describe("keepMasterTrumpForLast", () => {
  const OTHER_SPADES: Card[] = (["7", "8", "9", "10", "A", "K", "Q"] as Rank[]).map((r) => card("S", r));

  it("plays the other card and keeps the master trump for the last trick", () => {
    const hand = [card("S", "J"), card("H", "7")];
    expect(keepMasterTrumpForLast(hand, hand, OTHER_SPADES, "S")).toEqual([card("H", "7")]);
  });

  it("does nothing while a higher trump is still out", () => {
    const hand = [card("S", "9"), card("H", "7")];
    const played = OTHER_SPADES.filter((c) => c.rank !== "7"); // jack of spades unseen
    expect(keepMasterTrumpForLast(hand, hand, played, "S")).toEqual(hand);
  });

  it("does nothing when the other card is not legal now", () => {
    const hand = [card("S", "J"), card("H", "7")];
    expect(keepMasterTrumpForLast([card("S", "J")], hand, OTHER_SPADES, "S")).toEqual([card("S", "J")]);
  });

  it("does nothing before the last two tricks or without a single trump suit", () => {
    const hand = [card("S", "J"), card("H", "7"), card("D", "8")];
    expect(keepMasterTrumpForLast(hand, hand, OTHER_SPADES, "S")).toEqual(hand);
    const two = [card("S", "J"), card("H", "7")];
    expect(keepMasterTrumpForLast(two, two, OTHER_SPADES, "SA")).toEqual(two);
  });
});
