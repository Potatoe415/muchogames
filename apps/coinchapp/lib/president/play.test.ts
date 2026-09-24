import { describe, expect, it } from "vitest";
import { applyPass, applyPlay, canPass, legalCombos } from "./play";
import { card, combo, playingState } from "./test-utils";

describe("legalCombos / canPass", () => {
  it("only offers combos that match the pile's count and outrank it", () => {
    const state = playingState({
      turn: 1,
      hands: [[], [card("K", "S"), card("K", "H"), card("5", "D")], [], []],
      pile: { combo: combo("7", [card("7", "H"), card("7", "D")]), leader: 0 },
    });
    const combos = legalCombos(state, 1);
    expect(combos).toHaveLength(1);
    expect(combos[0].rank).toBe("K");
    expect(combos[0].cards).toHaveLength(2);
  });

  it("cannot pass when leading a freshly cleared pile", () => {
    const state = playingState({ turn: 0, hands: [[card("5", "H")], [], [], []] });
    expect(canPass(state, 0)).toBe(false);
  });

  it("can pass onto an existing pile", () => {
    const state = playingState({
      turn: 1,
      hands: [[], [card("5", "H")], [], []],
      pile: { combo: combo("7", [card("7", "H")]), leader: 0 },
    });
    expect(canPass(state, 1)).toBe(true);
  });
});

describe("applyPlay", () => {
  it("rejects a combo with the wrong count or a weaker rank", () => {
    const state = playingState({
      turn: 1,
      hands: [[], [card("K", "S"), card("5", "D")], [], []],
      pile: { combo: combo("7", [card("7", "H"), card("7", "D")]), leader: 0 },
    });
    expect(() => applyPlay(state, 1, combo("K", [card("K", "S")]))).toThrow("illegal_combo");
    expect(() => applyPlay(state, 1, combo("5", [card("5", "D"), card("K", "S")]))).toThrow();
  });

  it("toggles the revolution when a quad is played", () => {
    const state = playingState({
      turn: 0,
      hands: [[card("7", "H"), card("7", "D"), card("7", "C"), card("7", "S")], [], [], []],
    });
    const next = applyPlay(state, 0, combo("7", state.hands[0]));
    expect(next.revolution).toBe(true);
  });

  it("ends the round the instant a 3rd seat empties its hand, auto-ranking the 4th last", () => {
    const state = playingState({
      turn: 0,
      hands: [[card("5", "H")], [], [], [card("K", "S"), card("2", "H")]],
      finishedOrder: [1, 2],
    });
    const next = applyPlay(state, 0, combo("5", [card("5", "H")]));
    expect(next.phase).toBe("scoring");
    expect(next.finishedOrder).toEqual([1, 2, 0, 3]);
  });

  it("still flags a losing finish that also happens to end the round (3rd seat out on a '2')", () => {
    const state = playingState({
      turn: 0,
      hands: [[card("2", "H")], [], [], [card("K", "S"), card("3", "D")]],
      finishedOrder: [1, 2],
    });
    const next = applyPlay(state, 0, combo("2", [card("2", "H")]));
    expect(next.phase).toBe("scoring");
    expect(next.finishedOrder).toEqual([1, 2, 0, 3]);
    expect(next.losingFinishSeats).toEqual([0]);
  });

  it("a '2' burns the pile instantly: clears it and the same seat leads again", () => {
    const state = playingState({
      turn: 1,
      hands: [[], [card("2", "H"), card("3", "D")], [card("5", "C")], [card("6", "S")]],
      pile: { combo: combo("7", [card("7", "H")]), leader: 0 },
    });
    const next = applyPlay(state, 1, combo("2", [card("2", "H")]));
    expect(next.pile).toEqual({ combo: null, leader: null });
    expect(next.turn).toBe(1);
    expect(next.passStreak).toBe(0);
    expect(next.lastBurn).toEqual({ seat: 1, combo: combo("2", [card("2", "H")]) });
  });

  it("a double or triple '2' also burns the pile (a quad still just revolutions)", () => {
    const state = playingState({
      turn: 0,
      hands: [[card("2", "H"), card("2", "D"), card("3", "C")], [], [], []],
    });
    const next = applyPlay(state, 0, combo("2", [card("2", "H"), card("2", "D")]));
    expect(next.pile.combo).toBeNull();
    expect(next.turn).toBe(0);
  });

  it("does not burn when playing a '2' empties the hand (finishing play keeps the normal flow), but flags the seat as a losing finish", () => {
    const state = playingState({
      turn: 0,
      hands: [[card("2", "H")], [card("5", "D")], [card("6", "C")], [card("7", "S")]],
    });
    const next = applyPlay(state, 0, combo("2", [card("2", "H")]));
    expect(next.pile.combo).not.toBeNull();
    expect(next.lastBurn).toBeNull();
    expect(next.turn).not.toBe(0);
    expect(next.finishedOrder).toEqual([0]);
    expect(next.losingFinishSeats).toEqual([0]);
  });

  it("flags a losing finish on a pair or triple of 2s the same way as a single", () => {
    const state = playingState({
      turn: 0,
      hands: [[card("2", "H"), card("2", "D")], [card("5", "D")], [card("6", "C")], [card("7", "S")]],
    });
    const next = applyPlay(state, 0, combo("2", [card("2", "H"), card("2", "D")]));
    expect(next.losingFinishSeats).toEqual([0]);
  });

  it("does not flag a losing finish on a quad of 2s (still just revolutions)", () => {
    const state = playingState({
      turn: 0,
      hands: [[card("2", "H"), card("2", "D"), card("2", "C"), card("2", "S")], [card("5", "D")], [card("6", "C")], [card("7", "S")]],
    });
    const next = applyPlay(state, 0, combo("2", state.hands[0]));
    expect(next.revolution).toBe(true);
    expect(next.losingFinishSeats).toEqual([]);
  });

  it("does not flag a normal (non-finishing) rank as a losing finish", () => {
    const state = playingState({
      turn: 0,
      hands: [[card("5", "H")], [card("6", "D")], [card("7", "C")], [card("8", "S")]],
    });
    const next = applyPlay(state, 0, combo("5", [card("5", "H")]));
    expect(next.losingFinishSeats).toEqual([]);
  });

  it("the 'double' rule: replaying the pile's rank skips the very next active seat", () => {
    const state = playingState({
      turn: 1,
      hands: [[card("K", "S")], [card("6", "D"), card("3", "H")], [card("Q", "C")], [card("J", "H")]],
      pile: { combo: combo("6", [card("6", "H")]), leader: 0 },
    });
    const next = applyPlay(state, 1, combo("6", [card("6", "D")]));
    expect(next.pile).toEqual({ combo: combo("6", [card("6", "D")]), leader: 1, stackCount: 2 });
    expect(next.lastSkip).toEqual({ seat: 1, skippedSeat: 2, combo: combo("6", [card("6", "D")]) });
    expect(next.turn).toBe(3); // seat 2 skipped entirely
    expect(next.passStreak).toBe(0);
  });

  it("the 'double' rule: completing all 4 cards of the rank burns the pile instead of skipping", () => {
    const state = playingState({
      turn: 1,
      hands: [[card("K", "S")], [card("6", "D"), card("6", "C"), card("3", "H")], [card("Q", "C")], [card("J", "H")]],
      pile: { combo: combo("6", [card("6", "H"), card("6", "S")]), leader: 0, stackCount: 2 },
    });
    const next = applyPlay(state, 1, combo("6", [card("6", "D"), card("6", "C")]));
    expect(next.pile).toEqual({ combo: null, leader: null });
    expect(next.lastBurn).toEqual({ seat: 1, combo: combo("6", [card("6", "D"), card("6", "C")]) });
    expect(next.lastSkip).toBeNull();
    expect(next.turn).toBe(1);
  });

  it("the 'double' rule spares the skip when the would-be-skipped seat also holds that rank", () => {
    const state = playingState({
      turn: 1,
      hands: [[card("K", "S")], [card("6", "D"), card("3", "H")], [card("6", "C"), card("Q", "S")], [card("J", "H")]],
      pile: { combo: combo("6", [card("6", "H")]), leader: 0 },
    });
    const next = applyPlay(state, 1, combo("6", [card("6", "D")]));
    expect(next.pile).toEqual({ combo: combo("6", [card("6", "D")]), leader: 1, stackCount: 2 });
    expect(next.lastSkip).toBeNull();
    expect(next.turn).toBe(2); // seat 2 keeps its turn instead of being skipped
  });

  it("the 'double' rule's spared skip can chain: seat 2 replays and now seat 3 lacks the rank, so it is skipped", () => {
    let state = playingState({
      turn: 1,
      hands: [[card("K", "S")], [card("6", "D"), card("3", "H")], [card("6", "C"), card("Q", "S")], [card("J", "H")]],
      pile: { combo: combo("6", [card("6", "H")]), leader: 0 },
    });
    state = applyPlay(state, 1, combo("6", [card("6", "D")]));
    expect(state.turn).toBe(2);
    state = applyPlay(state, 2, combo("6", [card("6", "C")]));
    expect(state.lastSkip).toEqual({ seat: 2, skippedSeat: 3, combo: combo("6", [card("6", "C")]) });
    expect(state.turn).toBe(0); // seat 3 (no 6 left) skipped, back around to seat 0
  });

  it("the 'double' rule does not skip or burn when the matching play also empties the hand", () => {
    const state = playingState({
      turn: 1,
      hands: [[card("K", "S")], [card("6", "D")], [card("Q", "C")], [card("J", "H")]],
      pile: { combo: combo("6", [card("6", "H")]), leader: 0 },
    });
    const next = applyPlay(state, 1, combo("6", [card("6", "D")]));
    expect(next.pile.combo).not.toBeNull();
    expect(next.lastSkip).toBeNull();
    expect(next.lastBurn).toBeNull();
    expect(next.turn).toBe(2);
    expect(next.finishedOrder).toEqual([1]);
  });
});

describe("applyPass", () => {
  it("clears the pile once every other active seat has passed, turn returns to the leader", () => {
    let state = playingState({
      turn: 1,
      hands: [[card("K", "S")], [card("3", "H")], [card("3", "D")], [card("3", "C")]],
      pile: { combo: combo("7", [card("7", "H"), card("7", "D")]), leader: 0 },
    });
    state = applyPass(state, 1);
    expect(state.pile.combo).not.toBeNull();
    state = applyPass(state, 2);
    expect(state.pile.combo).not.toBeNull();
    state = applyPass(state, 3);
    expect(state.pile.combo).toBeNull();
    expect(state.passStreak).toBe(0);
    expect(state.turn).toBe(0);
  });

  it("after a skip, the winner leads once everyone else has passed, not the skipped seat", () => {
    let state = playingState({
      turn: 1,
      hands: [[card("K", "S")], [card("6", "D"), card("3", "H")], [card("Q", "C")], [card("J", "H")]],
      pile: { combo: combo("6", [card("6", "H")]), leader: 0 },
    });
    state = applyPlay(state, 1, combo("6", [card("6", "D")]));
    expect(state.turn).toBe(3);
    expect(state.pile.leader).toBe(1);

    state = applyPass(state, 3);
    expect(state.pile.combo).not.toBeNull();
    expect(state.turn).toBe(0);

    state = applyPass(state, 0);
    // Seat 2 was skipped and still owes a pass. The winner must not be asked
    // to act on their own pile, and must not lose the lead to that skipped seat.
    expect(state.pile.combo).not.toBeNull();
    expect(state.turn).toBe(2);

    state = applyPass(state, 2);
    expect(state.pile.combo).toBeNull();
    expect(state.turn).toBe(1);
  });

  it("when the winner has already finished, the next active seat leads", () => {
    let state = playingState({
      turn: 2,
      hands: [[card("K", "S")], [], [card("3", "D")], [card("3", "C")]],
      pile: { combo: combo("6", [card("6", "H")]), leader: 1 },
      finishedOrder: [1],
    });
    state = applyPass(state, 2);
    state = applyPass(state, 3);
    state = applyPass(state, 0);
    expect(state.pile.combo).toBeNull();
    expect(state.turn).toBe(2);
  });
});
