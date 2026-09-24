import { describe, expect, it } from "vitest";
import type { Combo, Rank, Seat } from "@/lib/president";
import { COLLECT_ANIMATION_MS, PLAY_ENTER_MS } from "./usePresidentPileDisplay";
import { PILE_HOLD_MS } from "./usePresidentPileHold";
import {
  PRESIDENT_CROWNED_ANIMATION_MS,
  SKIP_ANIMATION_MS,
  animSnap,
  presidentAnimationLockMs,
  presidentBotPaceMs,
  type PresidentAnimSource,
} from "./presidentAnimationLock";

function card(rank: Rank, suit: "S" | "H" | "D" | "C") {
  return { rank, suit };
}

function combo(rank: Rank, suits: Array<"S" | "H" | "D" | "C">): Combo {
  return { rank, cards: suits.map((suit) => card(rank, suit)) };
}

function source(partial: Partial<PresidentAnimSource> = {}): PresidentAnimSource {
  return {
    phase: "playing",
    pile: { combo: null },
    lastBurn: null,
    lastSkip: null,
    finishedOrder: [],
    ...partial,
  };
}

describe("presidentAnimationLockMs", () => {
  const empty = animSnap(source());

  it("is zero when nothing visible changed", () => {
    expect(presidentAnimationLockMs(empty, empty)).toBe(0);
  });

  it("waits out a normal play-enter", () => {
    const next = animSnap(source({ pile: { combo: combo("7", ["S"]) } }));
    expect(presidentAnimationLockMs(empty, next)).toBe(PLAY_ENTER_MS);
  });

  it("plays a burn in, then collects it", () => {
    const prev = animSnap(source({ pile: { combo: combo("6", ["S", "H"]) } }));
    const burning = combo("6", ["D", "C"]);
    const next = animSnap(source({ lastBurn: { seat: 1 as Seat, combo: burning } }));
    expect(presidentAnimationLockMs(prev, next)).toBe(PLAY_ENTER_MS + COLLECT_ANIMATION_MS);
  });

  it("collects a pile won by passes", () => {
    const prev = animSnap(source({ pile: { combo: combo("9", ["H"]) } }));
    expect(presidentAnimationLockMs(prev, empty)).toBe(COLLECT_ANIMATION_MS);
  });

  it("waits out the skip banner, which outlasts the play-enter", () => {
    const prev = animSnap(source({ pile: { combo: combo("8", ["S"]) } }));
    const next = animSnap(
      source({
        pile: { combo: combo("8", ["H"]) },
        lastSkip: { seat: 0 as Seat, skippedSeat: 1 as Seat, combo: combo("8", ["H"]) },
      }),
    );
    expect(presidentAnimationLockMs(prev, next)).toBe(SKIP_ANIMATION_MS);
  });

  it("holds a quad at least as long as the pile-hold window", () => {
    const next = animSnap(source({ pile: { combo: combo("K", ["S", "H", "D", "C"]) } }));
    expect(presidentAnimationLockMs(empty, next)).toBe(PILE_HOLD_MS);
  });

  it("waits out the crown when someone finishes first", () => {
    const next = animSnap(
      source({
        pile: { combo: combo("5", ["D"]) },
        finishedOrder: [2 as Seat],
      }),
    );
    expect(presidentAnimationLockMs(empty, next)).toBe(PRESIDENT_CROWNED_ANIMATION_MS);
  });
});

describe("presidentBotPaceMs", () => {
  it("subtracts think time that already overlaps the animation", () => {
    const prev = source({ pile: { combo: combo("9", ["H"]) } });
    const next = source();
    expect(presidentBotPaceMs(prev, next, 800)).toBe(COLLECT_ANIMATION_MS - 800);
  });

  it("does not wait when think time already covers the animation", () => {
    const prev = source();
    const next = source({ pile: { combo: combo("7", ["S"]) } });
    expect(presidentBotPaceMs(prev, next, 800)).toBe(0);
  });
});
