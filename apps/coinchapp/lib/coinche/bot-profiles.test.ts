import { describe, expect, it } from "vitest";
import { bidOptions } from "./bidding";
import { decideBid } from "./bot-bidding";
import {
  BOT_PROFILE_CONFIG,
  decodeLocalBotProfiles,
  encodeLocalBotProfiles,
  sanitizeBotProfiles,
} from "./bot-profiles";
import { decideBotBid, evaluateCoinche } from "./coinche-decision";
import { createInitialState } from "./deal";
import { profilePlayBonus } from "./play-bias";
import { redact } from "./redact";
import { card } from "./test-utils";
import type { Bid, Card, GameState, Seat } from "./types";

const { normal, aggressive, conservative, defensive } = BOT_PROFILE_CONFIG;
const SUITS = ["H", "D", "C", "S"] as const;

describe("Test 1 - borderline hand: aggressive opens, conservative passes", () => {
  // J-9-8 of hearts, no side ace: a classic "maybe 80" hand.
  const hand: Card[] = [
    card("J", "H"), card("9", "H"), card("8", "H"),
    card("7", "D"), card("8", "D"), card("K", "C"), card("8", "C"), card("7", "S"),
  ];

  it("aggressive opens at 80/90", () => {
    const d = decideBid(hand, [...SUITS], 80, aggressive);
    expect(d.shouldBid).toBe(true);
    expect([80, 90]).toContain(d.value);
    expect(d.mode).toBe("H");
  });

  it("conservative passes", () => {
    expect(decideBid(hand, [...SUITS], 80, conservative).shouldBid).toBe(false);
  });
});

describe("Test 2 - opponents bid 100/110: defensive coinches, conservative passes", () => {
  // 9-A-10-7 of trumps without the Jack plus a side ace: ~60% to set a 100 (fitted model).
  const hand: Card[] = [
    card("9", "H"), card("A", "H"), card("10", "H"), card("7", "H"),
    card("A", "D"), card("8", "D"), card("7", "C"), card("8", "S"),
  ];

  function auction(value: number): GameState {
    const base = createInitialState(1000);
    const bids: Bid[] = [{ seat: 0, type: "bid", value, suit: "H" }];
    return { ...base, phase: "bidding", dealer: 3, turn: 1, bids, hands: [[], hand, [], []] };
  }

  for (const value of [100, 110]) {
    it(`at ${value}`, () => {
      const state = auction(value);
      const opts = bidOptions(state);
      expect(decideBotBid(hand, state.bids, 1, opts, defensive).type).toBe("coinche");
      expect(decideBotBid(hand, state.bids, 1, opts, conservative).type).toBe("pass");
    });
  }

  it("the gap comes only from the threshold, not the hand estimate", () => {
    expect(evaluateCoinche(hand, 100, "H", defensive)).toBe(true);
    expect(evaluateCoinche(hand, 110, "H", conservative)).toBe(false);
  });
});

describe("Test 3 - attack lead: aggressive pulls trumps, conservative cashes an ace", () => {
  // Seat 0 declarer in spades, on lead at trick 1, holding J-9 of trumps and the side ace of hearts.
  const hand: Card[] = [
    card("J", "S"), card("9", "S"), card("8", "S"),
    card("A", "H"), card("7", "H"), card("8", "D"), card("7", "D"), card("7", "C"),
  ];
  function view() {
    const base = createInitialState(1000);
    const state: GameState = {
      ...base,
      phase: "playing",
      dealer: 3,
      turn: 0,
      trump: "S",
      contract: { seat: 0, team: "A", value: 100, suit: "S", coinche: 1 },
      hands: [hand, [], [], []],
      currentTrick: { leader: 0, cards: [] },
    };
    return redact(state, 0 as Seat);
  }
  const trump = card("J", "S");
  const ace = card("A", "H");

  /** Pick between two root moves the search rates as equal (0.5 win rate each). */
  function pick(cfg: typeof normal): Card {
    const [bTrump, bAce] = profilePlayBonus(view(), [trump, ace], cfg);
    return bTrump > bAce ? trump : ace;
  }

  it("aggressive leads trump", () => expect(pick(aggressive)).toEqual(trump));
  it("conservative cashes the outside ace", () => expect(pick(conservative)).toEqual(ace));
  it("normal adds no bias (search decides alone)", () => {
    expect(profilePlayBonus(view(), view().legalCards, normal).every((b) => b === 0)).toBe(true);
  });
});

describe("profile plumbing", () => {
  it("sanitize keeps only known seats and profiles", () => {
    expect(sanitizeBotProfiles({ 1: "aggressive", 2: "evil", 7: "normal", 3: "defensive" })).toEqual({
      1: "aggressive",
      3: "defensive",
    });
    expect(sanitizeBotProfiles("nope")).toEqual({});
  });

  it("local URL round trip, junk falls back to normal", () => {
    const encoded = encodeLocalBotProfiles({ 1: "aggressive", 3: "conservative" });
    expect(encoded).toBe("aggressive,normal,conservative");
    expect(decodeLocalBotProfiles(encoded)).toEqual({ 1: "aggressive", 2: "normal", 3: "conservative" });
    expect(decodeLocalBotProfiles("x,,defensive")).toEqual({ 3: "defensive" });
  });
});
