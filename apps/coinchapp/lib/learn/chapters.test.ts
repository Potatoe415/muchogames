import { describe, expect, it } from "vitest";
import {
  applyPlay,
  buildDeck,
  cardId,
  cardPoints,
  chooseCard,
  computeDealResult,
  legalCards,
  trickWinner,
  type Seat,
} from "@/lib/coinche";
import { CHAPTERS } from "./chapters-practice";
import { dealStepState, explainTurn, parseCards, trickStepState } from "./engine";
import type { Step } from "./types";

const steps = CHAPTERS.flatMap((c) => c.steps);
const ofKind = <K extends Step["kind"]>(kind: K) => steps.filter((s): s is Extract<Step, { kind: K }> => s.kind === kind);
const ids = (text: string) => parseCards(text).map(cardId);
const DECK = buildDeck().map(cardId);

describe("learn chapters", () => {
  it("fits the 5-10 minute budget and has unique step ids", () => {
    const minutes = CHAPTERS.reduce((sum, c) => sum + c.minutes, 0);
    expect(minutes).toBeGreaterThanOrEqual(5);
    expect(minutes).toBeLessThanOrEqual(10);
    const all = steps.map((s) => s.id);
    expect(new Set(all).size).toBe(all.length);
  });

  it("only writes real cards", () => {
    for (const s of steps) {
      const texts = [
        "cards" in s ? s.cards : "",
        "hand" in s ? s.hand : "",
        s.kind === "trick" ? `${s.played} ${s.best}` : "",
        s.kind === "deal" ? s.hands.join(" ") : "",
        s.kind === "quiz" ? s.options.map((o) => o.card ?? "").join(" ") : "",
      ].join(" ");
      if (texts.trim()) for (const id of ids(texts)) expect(DECK, `${s.id}: ${id}`).toContain(id);
    }
  });

  it("keeps quiz answers in range", () => {
    for (const q of ofKind("quiz")) expect(q.options[q.answer], q.id).toBeDefined();
  });

  it("agrees with the engine on the card quizzes", () => {
    const strongest = ofKind("quiz").find((q) => q.id === "cards-strongest")!;
    const options = strongest.options.map((o) => parseCards(o.card!)[0]);
    const played = options.map((card, i) => ({ seat: i as Seat, card }));
    expect(trickWinner(played, "H")).toBe(strongest.answer);

    const points = ofKind("quiz").find((q) => q.id === "cards-points")!;
    const values = points.options.map((o) => cardPoints(parseCards(o.card!)[0], "C"));
    expect(values.indexOf(Math.max(...values))).toBe(points.answer);

    const winner = ofKind("quiz").find((q) => q.id === "tricks-winner")!;
    const trick = parseCards("AS 10S 7D KS").map((card, i) => ({ seat: i as Seat, card }));
    const winning = trick[trickWinner(trick, "D")].card;
    expect(cardId(parseCards(winner.options[winner.answer].card!)[0])).toBe(cardId(winning));
  });

  it("makes every trick step's best card legal and winning or right", () => {
    for (const s of ofKind("trick")) {
      const state = trickStepState(s);
      expect(state.hands[0]).toHaveLength(8);
      const legal = legalCards(state, 0).map(cardId);
      for (const id of ids(s.best)) expect(legal, s.id).toContain(id);
      expect(legal.length, `${s.id} must offer a real choice`).toBeGreaterThan(1);
    }
    const rules = Object.fromEntries(ofKind("trick").map((s) => [s.id, explainTurn(trickStepState(s), 0)]));
    expect(rules).toEqual({
      "tricks-follow": "follow",
      "tricks-cut": "must-cut",
      "tricks-partner": "partner-master",
      "tricks-overtrump": "overtrump",
    });
  });

  it("deals the 32 cards in every guided deal and plays it to the end", () => {
    for (const s of ofKind("deal")) {
      const all = ids(s.hands.join(" "));
      expect(new Set(all).size, s.id).toBe(32);
      for (const hand of s.hands) expect(parseCards(hand), s.id).toHaveLength(8);
      let state = dealStepState(s);
      while (state.phase === "playing") state = applyPlay(state, state.turn, chooseCard(state));
      const result = computeDealResult(state);
      expect(result.cardPoints.A + result.cardPoints.B).toBe(162);
    }
  });

  it("gives the belote deal its Belote and the defense deal its coinche", () => {
    const [, belote, defense] = ofKind("deal");
    expect(dealStepState(belote).belote.team).toBe("A");
    expect(dealStepState(defense).contract).toMatchObject({ team: "B", coinche: 2 });
  });
});
