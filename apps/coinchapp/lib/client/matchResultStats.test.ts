import { describe, expect, it } from "vitest";
import { toCoinchappGame } from "@/lib/profileGames";
import { pendingSharedDelta, planSharedSync, sanitizeByGame } from "./matchResultStats";

describe("pendingSharedDelta", () => {
  it("returns only the results not yet sent to the shared profile", () => {
    expect(pendingSharedDelta({ wins: 4, losses: 2 }, { wins: 1, losses: 2 })).toEqual({
      wins: 3,
      losses: 0,
    });
  });

  it("never returns a negative delta", () => {
    expect(pendingSharedDelta({ wins: 1, losses: 0 }, { wins: 3, losses: 1 })).toEqual({
      wins: 0,
      losses: 0,
    });
  });
});

describe("planSharedSync", () => {
  it("sends one batch per game with pending results", () => {
    expect(
      planSharedSync(
        { wins: 3, losses: 1 },
        { wins: 0, losses: 0 },
        { coinche: { wins: 2, losses: 0 }, president: { wins: 1, losses: 1 } },
        {},
      ),
    ).toEqual([
      { game: "coinche", wins: 2, losses: 0 },
      { game: "president", wins: 1, losses: 1 },
    ]);
  });

  it("puts results recorded before the per-game split in a game-less batch", () => {
    expect(
      planSharedSync(
        { wins: 5, losses: 2 },
        { wins: 1, losses: 0 },
        { bouilla: { wins: 1, losses: 0 } },
        {},
      ),
    ).toEqual([
      { game: "bouilla", wins: 1, losses: 0 },
      { game: null, wins: 3, losses: 2 },
    ]);
  });

  it("skips games that are already synced", () => {
    expect(
      planSharedSync(
        { wins: 2, losses: 0 },
        { wins: 1, losses: 0 },
        { coinche: { wins: 1, losses: 0 }, bataillecorse: { wins: 1, losses: 0 } },
        { coinche: { wins: 1, losses: 0 } },
      ),
    ).toEqual([{ game: "bataillecorse", wins: 1, losses: 0 }]);
  });

  it("returns nothing when everything is synced", () => {
    expect(
      planSharedSync(
        { wins: 1, losses: 1 },
        { wins: 1, losses: 1 },
        { coinche: { wins: 1, losses: 1 } },
        { coinche: { wins: 1, losses: 1 } },
      ),
    ).toEqual([]);
  });
});

describe("sanitizeByGame", () => {
  it("keeps known games only and clamps bad numbers", () => {
    expect(
      sanitizeByGame({ coinche: { wins: "2", losses: -1 }, chess: { wins: 9, losses: 9 } }),
    ).toEqual({ coinche: { wins: 2, losses: 0 } });
  });
});

describe("toCoinchappGame", () => {
  it("accepts the four hub game ids and rejects anything else", () => {
    expect(toCoinchappGame("president")).toBe("president");
    expect(toCoinchappGame("tranquil")).toBeNull();
    expect(toCoinchappGame(undefined)).toBeNull();
  });
});
