import { describe, expect, it } from "vitest";
import { computeRoundResult, finalizeRound } from "./scoring";
import { scoringState } from "./test-utils";

describe("computeRoundResult", () => {
  it("assigns titles in finish order: President, Vice-President, Vice-Trou du Cul, Trou du Cul", () => {
    const state = scoringState([2, 0, 3, 1]);
    const result = computeRoundResult(state);
    expect(result.titles).toEqual(["vicePresident", "trouDuCul", "president", "viceTrouDuCul"]);
  });

  it("demotes a seat that finished on a losing 2 behind every seat that did not, becoming Trou du Cul", () => {
    // seat2 actually finished 1st, but flagged as a losing finish - it drops
    // behind 0,3,1 (kept in their relative order), landing last.
    const state = scoringState([2, 0, 3, 1], { losingFinishSeats: [2] });
    const result = computeRoundResult(state);
    expect(result.finishedOrder).toEqual([0, 3, 1, 2]);
    expect(result.titles).toEqual(["president", "viceTrouDuCul", "trouDuCul", "vicePresident"]);
  });

  it("preserves each group's relative order when several seats finished on a losing 2", () => {
    // seat2 (1st) and seat1 (4th) both flagged: non-losers 0,3 keep their
    // relative order first, then losers 2,1 keep theirs, worst last.
    const state = scoringState([2, 0, 3, 1], { losingFinishSeats: [2, 1] });
    const result = computeRoundResult(state);
    expect(result.finishedOrder).toEqual([0, 3, 2, 1]);
  });

  it("is a no-op when nobody finished on a losing 2", () => {
    const state = scoringState([2, 0, 3, 1], { losingFinishSeats: [] });
    const result = computeRoundResult(state);
    expect(result.finishedOrder).toEqual([2, 0, 3, 1]);
  });
});

describe("finalizeRound", () => {
  it("adds each seat's finishing rank (1..4) to its cumulative total", () => {
    const state = scoringState([2, 0, 3, 1], { roundsToPlay: 4 });
    const next = finalizeRound(state);
    // seat0 finished 2nd (2 pts), seat1 4th (4), seat2 1st (1), seat3 3rd (3).
    expect(next.totalScores).toEqual([2, 4, 1, 3]);
    expect(next.phase).toBe("scoring");
    expect(next.winners).toBeUndefined();
  });

  it("scores a losing-2 finisher at its demoted rank (4 pts), not its raw finish order", () => {
    // seat2 finished 1st but on a losing 2 - demoted order is [0,3,1,2], so
    // seat2 scores 4 (worst) instead of 1 (best).
    const state = scoringState([2, 0, 3, 1], { roundsToPlay: 4, losingFinishSeats: [2] });
    const next = finalizeRound(state);
    expect(next.totalScores).toEqual([1, 3, 4, 2]);
  });

  it("finishes the match and picks the lowest cumulative total as winner", () => {
    const state = scoringState([2, 0, 3, 1], { roundIndex: 3, roundsToPlay: 4 });
    const next = finalizeRound({ ...state, totalScores: [6, 10, 3, 5] });
    expect(next.phase).toBe("finished");
    // seat2 (3+1=4) is the new lowest total.
    expect(next.winners).toEqual([2]);
  });
});
