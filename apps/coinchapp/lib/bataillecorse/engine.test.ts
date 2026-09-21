import { describe, expect, it } from "vitest";
import { attemptSlap, createInitialState, resolveStaleSlapWindow, submitFlip, SLAP_GRACE_MS } from "./engine";
import { card, seededRng, stateWith } from "./test-utils";

describe("createInitialState", () => {
  it("deals 26 cards to each seat (default 52-card deck) and starts seat 0's turn", () => {
    const state = createInitialState(seededRng(1));
    expect(state.stocks[0]).toHaveLength(26);
    expect(state.stocks[1]).toHaveLength(26);
    expect(state.turn).toBe(0);
    expect(state.phase).toBe("playing");
  });

  it("deals 16 cards to each seat for a 32-card deck", () => {
    const state = createInitialState(seededRng(1), 32);
    expect(state.stocks[0]).toHaveLength(16);
    expect(state.stocks[1]).toHaveLength(16);
  });
});

describe("submitFlip - plain alternation", () => {
  it("moves the flipped card to the pile and passes the turn", () => {
    const state = stateWith({ turn: 0, stocks: [[card("5")], [card("9")]] });
    const next = submitFlip(state, 0, 1000);
    expect(next.pile).toEqual([card("5")]);
    expect(next.stocks[0]).toEqual([]);
    expect(next.turn).toBe(1);
  });

  it("rejects a flip out of turn, with no cards left, or while a slap window is open", () => {
    const state = stateWith({ turn: 0, stocks: [[card("5")], [card("9")]] });
    expect(() => submitFlip(state, 1, 1000)).toThrow();
    expect(() => submitFlip(stateWith({ turn: 0, stocks: [[], [card("9")]] }), 0, 1000)).toThrow();
    const withWindow = stateWith({
      turn: 0,
      stocks: [[card("5")], [card("9")]],
      slapWindow: { id: 0, pattern: "double", openedAtMs: 0 },
    });
    expect(() => submitFlip(withWindow, 0, 1000)).toThrow();
  });
});

describe("submitFlip - tribute (figure/ace challenges)", () => {
  it("a figure opens a tribute owed by the other seat, with the right attempt count", () => {
    const state = stateWith({ turn: 0, stocks: [[card("K")], [card("9")]] });
    const next = submitFlip(state, 0, 1000);
    expect(next.tribute).toEqual({ seat: 1, attemptsLeft: 3, fromRank: "K" });
    expect(next.turn).toBe(1);
  });

  it("a plain card during a tribute uses up an attempt and keeps the payer's turn", () => {
    const state = stateWith({
      turn: 1,
      stocks: [[card("K")], [card("3"), card("4")]],
      pile: [card("K")],
      tribute: { seat: 1, attemptsLeft: 3, fromRank: "K" },
    });
    const next = submitFlip(state, 1, 1000);
    expect(next.tribute).toEqual({ seat: 1, attemptsLeft: 2, fromRank: "K" });
    expect(next.turn).toBe(1);
  });

  it("running out of attempts awards the whole pile to the challenger", () => {
    const state = stateWith({
      turn: 1,
      stocks: [[card("K")], [card("3")]],
      pile: [card("K"), card("4"), card("5")],
      tribute: { seat: 1, attemptsLeft: 1, fromRank: "K" },
    });
    const next = submitFlip(state, 1, 1000);
    expect(next.tribute).toBeNull();
    expect(next.pile).toEqual([]);
    expect(next.turn).toBe(0);
    expect(next.stocks[0]).toEqual([card("K"), card("4"), card("5"), card("3"), card("K")]);
    expect(next.lastPileWin).toEqual({
      id: 0,
      seat: 0,
      cardCount: 4,
      cards: [card("K"), card("4"), card("5"), card("3")],
      reason: "tribute",
    });
  });

  it("answering with a figure flips the tribute obligation onto the challenger", () => {
    const state = stateWith({
      turn: 1,
      stocks: [[card("K")], [card("Q")]],
      pile: [card("K")],
      tribute: { seat: 1, attemptsLeft: 3, fromRank: "K" },
    });
    const next = submitFlip(state, 1, 1000);
    expect(next.tribute).toEqual({ seat: 0, attemptsLeft: 2, fromRank: "Q" });
    expect(next.turn).toBe(0);
  });
});

describe("submitFlip - opening a slap window", () => {
  it("opens a window when the flip creates a double", () => {
    const state = stateWith({ turn: 1, stocks: [[card("7")], [card("7")]], pile: [card("7")] });
    const next = submitFlip(state, 1, 1234);
    expect(next.slapWindow).toEqual({ id: 0, pattern: "double", openedAtMs: 1234 });
  });

  it("opens a window when the flip creates a sandwich", () => {
    const state = stateWith({ turn: 1, stocks: [[card("K")], [card("K")]], pile: [card("K"), card("5")] });
    const next = submitFlip(state, 1, 1234);
    expect(next.slapWindow?.pattern).toBe("sandwich");
  });

  it("opens a window when a tribute's final attempt matches the original challenge rank, even with plain attempts in between", () => {
    // Payer's own 3 plain attempts (3/5/9) sit between the original As and
    // the As that finally answers it - still a double once filler is ignored.
    const state = stateWith({
      turn: 1,
      stocks: [[card("K")], [card("A")]],
      pile: [card("A"), card("3"), card("5"), card("9")],
      tribute: { seat: 1, attemptsLeft: 1, fromRank: "A" },
    });
    const next = submitFlip(state, 1, 1234);
    expect(next.slapWindow).toEqual({ id: 0, pattern: "double", openedAtMs: 1234 });
  });
});

describe("attemptSlap", () => {
  const openWindowState = stateWith({
    turn: 0,
    stocks: [[card("3")], [card("4")]],
    pile: [card("9"), card("9")],
    slapWindow: { id: 5, pattern: "double", openedAtMs: 1000 },
  });

  it("a single claim just waits - no winner yet", () => {
    const next = attemptSlap(openWindowState, 0, 300);
    expect(next.slapWindow).not.toBeNull();
    expect(next.slapClaims).toEqual([{ seat: 0, reactionMs: 300 }]);
  });

  it("resolves to the LOWEST reactionMs, regardless of which claim arrived first", () => {
    // Seat 1 claims first (arrives first) but with a slower reaction time -
    // seat 0's later-arriving claim still wins because its reactionMs is lower.
    const afterFirst = attemptSlap(openWindowState, 1, 900);
    const resolved = attemptSlap(afterFirst, 0, 150);
    expect(resolved.winner).toBeNull();
    expect(resolved.slapWindow).toBeNull();
    expect(resolved.turn).toBe(0);
    expect(resolved.lastPileWin).toEqual({
      id: 0,
      seat: 0,
      cardCount: 2,
      cards: [card("9"), card("9")],
      reason: "slap",
      reactionMsBySeat: { 0: 150, 1: 900 },
    });
    expect(resolved.stocks[0]).toEqual([card("9"), card("9"), card("3")]);
  });

  it("ignores a duplicate claim from the same seat", () => {
    const once = attemptSlap(openWindowState, 0, 300);
    const twice = attemptSlap(once, 0, 100);
    expect(twice.slapClaims).toEqual([{ seat: 0, reactionMs: 300 }]);
  });

  it("a false slap awards the whole pile to the opponent", () => {
    const state = stateWith({ turn: 0, stocks: [[card("2")], [card("3"), card("K")]], pile: [card("9"), card("7")] });
    const next = attemptSlap(state, 1, 200);
    expect(next.lastFalseSlap).toEqual({ id: 0, seat: 1 });
    expect(next.pile).toEqual([]);
    expect(next.turn).toBe(0);
    expect(next.lastPileWin).toEqual({
      id: 1,
      seat: 0,
      cardCount: 2,
      cards: [card("9"), card("7")],
      reason: "falseSlap",
    });
    expect(next.stocks[0]).toEqual([card("9"), card("7"), card("2")]);
    expect(next.stocks[1]).toEqual([card("3"), card("K")]);
  });

  it("flags a false slap on an empty pile without moving any stock cards", () => {
    const state = stateWith({ turn: 0, stocks: [[card("2")], [card("3")]], pile: [] });
    const next = attemptSlap(state, 1, 200);
    expect(next.lastFalseSlap).toEqual({ id: 0, seat: 1 });
    expect(next.lastPileWin).toBeNull();
    expect(next.stocks[1]).toEqual([card("3")]);
  });

  it("does not penalize a claim for an already-closed window it correctly recognizes as late", () => {
    const closed = { ...openWindowState, slapWindow: null, lastClosedSlapWindowId: 5 };
    const next = attemptSlap(closed, 0, 500, 5);
    expect(next).toEqual(closed);
  });
});

describe("resolveStaleSlapWindow", () => {
  it("does nothing before the grace period elapses", () => {
    const state = stateWith({
      turn: 0,
      stocks: [[card("3")], [card("4")]],
      pile: [card("9"), card("9")],
      slapWindow: { id: 0, pattern: "double", openedAtMs: 1000 },
    });
    expect(resolveStaleSlapWindow(state, 1000 + SLAP_GRACE_MS - 1)).toBe(state);
  });

  it("awards the pile to a lone claimant once the grace period elapses", () => {
    const state = stateWith({
      turn: 0,
      stocks: [[card("3")], [card("4")]],
      pile: [card("9"), card("9")],
      slapWindow: { id: 0, pattern: "double", openedAtMs: 1000 },
      slapClaims: [{ seat: 1, reactionMs: 400 }],
    });
    const next = resolveStaleSlapWindow(state, 1000 + SLAP_GRACE_MS);
    expect(next.slapWindow).toBeNull();
    expect(next.turn).toBe(1);
    expect(next.lastPileWin?.seat).toBe(1);
    expect(next.lastPileWin?.reactionMsBySeat).toEqual({ 1: 400 });
  });

  it("closes with no winner when nobody claimed in time", () => {
    const state = stateWith({
      turn: 0,
      stocks: [[card("3")], [card("4")]],
      pile: [card("9"), card("9")],
      slapWindow: { id: 7, pattern: "double", openedAtMs: 1000 },
    });
    const next = resolveStaleSlapWindow(state, 1000 + SLAP_GRACE_MS);
    expect(next.slapWindow).toBeNull();
    expect(next.pile).toEqual([card("9"), card("9")]);
    expect(next.lastClosedSlapWindowId).toBe(7);
  });
});

describe("elimination", () => {
  it("a false slap does not empty the slapper's stock (the pile goes to the opponent instead)", () => {
    const state = stateWith({ turn: 0, stocks: [[card("2")], [card("3")]], pile: [card("9")] });
    const next = attemptSlap(state, 1, 200);
    expect(next.phase).toBe("playing");
    expect(next.stocks[1]).toEqual([card("3")]);
    expect(next.stocks[0]).toEqual([card("9"), card("2")]);
  });

  it("ends the game when a flip empties the flipping seat's stock", () => {
    const state = stateWith({ turn: 0, stocks: [[card("5")], [card("9"), card("2")]] });
    const next = submitFlip(state, 0, 1000);
    expect(next.phase).toBe("finished");
    expect(next.winner).toBe(1);
  });
});
