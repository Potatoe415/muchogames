import { describe, expect, it } from "vitest";
import type { Card, Combo, Seat } from "@/lib/president";
import { advancePileHold, endPileHold, initPileHoldState, isBigPlay, type Pile } from "./usePresidentPileHold";

function card(rank: Card["rank"], suit: Card["suit"]): Card {
  return { rank, suit };
}

function combo(rank: Combo["rank"], cards: Card[]): Combo {
  return { rank, cards };
}

function pile(combo: Combo | null, leader: Seat = 0): Pile {
  return { combo, leader };
}

const quad = combo("7", [card("7", "H"), card("7", "D"), card("7", "C"), card("7", "S")]);
const secondQuad = combo("8", [card("8", "H"), card("8", "D"), card("8", "C"), card("8", "S")]);
const single5 = combo("5", [card("5", "H")]);
const singleK = combo("K", [card("K", "S")]);

describe("isBigPlay", () => {
  it("is big for a quad, even when it didn't finish the hand", () => {
    expect(isBigPlay(quad, false)).toBe(true);
  });

  it("is big for a hand-emptying combo, whatever its size", () => {
    expect(isBigPlay(single5, true)).toBe(true);
  });

  it("is not big for an ordinary mid-hand single/pair/triple", () => {
    expect(isBigPlay(single5, false)).toBe(false);
    expect(isBigPlay(combo("6", [card("6", "H"), card("6", "D")]), false)).toBe(false);
  });
});

describe("initPileHoldState", () => {
  it("shows whatever pile it mounts with immediately, not holding yet", () => {
    const state = initPileHoldState(pile(quad), 0);
    expect(state.display).toEqual(pile(quad));
    expect(state.holding).toBe(false);
  });
});

describe("advancePileHold", () => {
  it("reveals an ordinary play immediately when no hold is active", () => {
    const state = initPileHoldState(pile(null), 0);
    const next = advancePileHold(state, pile(single5), 0);
    expect(next.display.combo).toEqual(single5);
    expect(next.holding).toBe(false);
    expect(next.queued).toBeNull();
  });

  it("returns the same state reference when the pile hasn't actually changed", () => {
    const state = initPileHoldState(pile(single5), 0);
    const next = advancePileHold(state, pile(single5), 0);
    expect(next).toBe(state);
  });

  it("starts a hold when a quad is revealed immediately", () => {
    const state = initPileHoldState(pile(null), 0);
    const next = advancePileHold(state, pile(quad), 0);
    expect(next.holding).toBe(true);
    expect(next.holdToken).toBe(1);
  });

  it("starts a hold when a play empties a hand (finishedOrder grew)", () => {
    const state = initPileHoldState(pile(null), 0);
    const next = advancePileHold(state, pile(single5), 1);
    expect(next.holding).toBe(true);
  });

  it("queues the new pile instead of revealing it while a hold is active", () => {
    let state = initPileHoldState(pile(null), 0);
    state = advancePileHold(state, pile(quad), 0); // now holding
    const next = advancePileHold(state, pile(singleK), 0);
    expect(next.display).toBe(state.display); // still showing the quad
    expect(next.holding).toBe(true);
    expect(next.queued).toEqual({ pile: pile(singleK), big: false });
  });

  it("keeps queuing (latest wins) if several plays arrive while still holding", () => {
    let state = initPileHoldState(pile(null), 0);
    state = advancePileHold(state, pile(quad), 0);
    state = advancePileHold(state, pile(singleK), 0);
    state = advancePileHold(state, pile(secondQuad), 0);
    expect(state.queued).toEqual({ pile: pile(secondQuad), big: true });
  });
});

describe("endPileHold", () => {
  it("just stops holding when nothing was queued", () => {
    let state = initPileHoldState(pile(null), 0);
    state = advancePileHold(state, pile(quad), 0);
    const ended = endPileHold(state);
    expect(ended.holding).toBe(false);
    expect(ended.display).toEqual(pile(quad)); // unchanged, nothing to reveal
  });

  it("reveals the queued pile and restarts the hold (fresh holdToken) if it was itself big", () => {
    let state = initPileHoldState(pile(null), 0);
    state = advancePileHold(state, pile(quad), 0); // holding, holdToken 1
    state = advancePileHold(state, pile(secondQuad), 0); // queued (big)
    const ended = endPileHold(state);
    expect(ended.display.combo).toEqual(secondQuad);
    expect(ended.holding).toBe(true);
    expect(ended.holdToken).toBe(2);
  });

  it("reveals the queued pile without restarting the hold if it was ordinary", () => {
    let state = initPileHoldState(pile(null), 0);
    state = advancePileHold(state, pile(quad), 0); // holding, holdToken 1
    state = advancePileHold(state, pile(singleK), 0); // queued (ordinary)
    const ended = endPileHold(state);
    expect(ended.display.combo).toEqual(singleK);
    expect(ended.holding).toBe(false);
    expect(ended.holdToken).toBe(1); // unchanged, not bumped
  });
});
