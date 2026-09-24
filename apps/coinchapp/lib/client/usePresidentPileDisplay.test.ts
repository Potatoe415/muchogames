import { describe, expect, it } from "vitest";
import type { Card, Combo, Seat } from "@/lib/president";
import {
  advancePileDisplay,
  beginPendingCollect,
  endCollect,
  initPileDisplayState,
  type BurnEvent,
  type Pile,
} from "./usePresidentPileDisplay";

function card(rank: Card["rank"], suit: Card["suit"]): Card {
  return { rank, suit };
}

function combo(rank: Combo["rank"], cards: Card[]): Combo {
  return { rank, cards };
}

function pileOf(c: Combo | null, leader: Seat | null = 0): Pile {
  return { combo: c, leader };
}

const pair6 = combo("6", [card("6", "H"), card("6", "S")]);
const close6 = combo("6", [card("6", "D"), card("6", "C")]);
const single2 = combo("2", [card("2", "H")]);
const singleK = combo("K", [card("K", "S")]);
const burnClose: BurnEvent = { seat: 1, combo: close6 };
const burn2: BurnEvent = { seat: 2, combo: single2 };

describe("advancePileDisplay", () => {
  it("shows a new combo immediately, not collecting", () => {
    const state = initPileDisplayState(pileOf(null, null), null);
    const next = advancePileDisplay(state, pileOf(pair6, 0), null);
    expect(next.stack).toEqual([pair6]);
    expect(next.phase).toBe("show");
    expect(next.enterSeat).toBe(0);
    expect(next.pendingCollectSeat).toBeNull();
  });

  it("returns the same state reference when the pile hasn't actually changed", () => {
    const state = initPileDisplayState(pileOf(pair6, 0), null);
    const next = advancePileDisplay(state, pileOf(pair6, 0), null);
    expect(next).toBe(state);
  });

  it("keeps a closing combo on screen and arms collect when lastBurn lands while it is still showing", () => {
    let state = initPileDisplayState(pileOf(pair6, 0), null);
    state = advancePileDisplay(state, pileOf(close6, 1), null);
    state = advancePileDisplay(state, pileOf(close6, 1), burnClose);
    expect(state.stack.at(-1)).toEqual(close6);
    expect(state.phase).toBe("show");
    expect(state.pendingCollectSeat).toBe(1);
    expect(state.enterSeat).toBe(1);
    state = advancePileDisplay(state, pileOf(null, null), burnClose);
    expect(state.stack.at(-1)).toEqual(close6);
    expect(state.pendingCollectSeat).toBe(1);
    expect(state.phase).toBe("show");
  });

  it("puts an unseen burn combo on the stack so it can play-enter before collect", () => {
    let state = initPileDisplayState(pileOf(pair6, 0), null);
    state = advancePileDisplay(state, pileOf(null, null), burnClose);
    expect(state.stack).toEqual([pair6, close6]);
    expect(state.pendingCollectSeat).toBe(1);
    expect(state.enterSeat).toBe(1);
    expect(state.phase).toBe("show");
  });

  it("does not re-trigger the same lastBurn", () => {
    let state = initPileDisplayState(pileOf(pair6, 0), null);
    state = advancePileDisplay(state, pileOf(null, null), burnClose);
    const again = advancePileDisplay(state, pileOf(null, null), burnClose);
    expect(again).toBe(state);
  });

  it("collects toward the previous leader when the pile clears without a new burn", () => {
    let state = initPileDisplayState(pileOf(null, null), null);
    state = advancePileDisplay(state, pileOf(pair6, 3), null);
    state = advancePileDisplay(state, pileOf(null, null), null);
    expect(state.phase).toBe("collect");
    expect(state.collectSeat).toBe(3);
    expect(state.stack).toEqual([pair6]);
  });

  it("queues a later play instead of replacing the pile while collecting", () => {
    let state = initPileDisplayState(pileOf(pair6, 0), null);
    state = advancePileDisplay(state, pileOf(null, null), null);
    expect(state.phase).toBe("collect");
    const next = advancePileDisplay(state, pileOf(singleK, 2), null);
    expect(next.stack).toEqual([pair6]);
    expect(next.phase).toBe("collect");
    expect(next.queued).toEqual(pileOf(singleK, 2));
  });

  it("queues a later play that arrives during the burn's play-enter window", () => {
    let state = initPileDisplayState(pileOf(pair6, 0), null);
    state = advancePileDisplay(state, pileOf(null, null), burn2);
    const next = advancePileDisplay(state, pileOf(singleK, 2), burn2);
    expect(next.pendingCollectSeat).toBe(2);
    expect(next.stack.at(-1)).toEqual(single2);
    expect(next.queued).toEqual(pileOf(singleK, 2));
  });
});

describe("beginPendingCollect", () => {
  it("starts the collect sweep toward the armed seat", () => {
    let state = initPileDisplayState(pileOf(pair6, 0), null);
    state = advancePileDisplay(state, pileOf(null, null), burnClose);
    const next = beginPendingCollect(state);
    expect(next.phase).toBe("collect");
    expect(next.collectSeat).toBe(1);
    expect(next.pendingCollectSeat).toBeNull();
    expect(next.collectToken).toBe(state.collectToken + 1);
  });
});

describe("endCollect", () => {
  it("clears the stack when nothing was queued", () => {
    let state = initPileDisplayState(pileOf(pair6, 0), null);
    state = advancePileDisplay(state, pileOf(null, null), null);
    const ended = endCollect(state);
    expect(ended.stack).toEqual([]);
    expect(ended.phase).toBe("show");
    expect(ended.collectSeat).toBeNull();
  });

  it("reveals the queued combo after the collect finishes", () => {
    let state = initPileDisplayState(pileOf(pair6, 0), null);
    state = advancePileDisplay(state, pileOf(null, null), null);
    state = advancePileDisplay(state, pileOf(singleK, 2), null);
    const ended = endCollect(state);
    expect(ended.stack).toEqual([singleK]);
    expect(ended.phase).toBe("show");
    expect(ended.enterSeat).toBe(2);
    expect(ended.queued).toBeNull();
  });
});
