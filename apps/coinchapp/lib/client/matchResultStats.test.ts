import { describe, expect, it } from "vitest";
import { pendingSharedDelta } from "./matchResultStats";

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
