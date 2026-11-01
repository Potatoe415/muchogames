import { describe, expect, it } from "vitest";
import { CARD_BACKS, cardBackSrc, parseCardBack } from "./cardBack";

describe("parseCardBack", () => {
  it("keeps every known back", () => {
    expect(CARD_BACKS.map(parseCardBack)).toEqual([...CARD_BACKS]);
  });

  it("falls back to classic on a missing or unknown value", () => {
    expect([null, undefined, "", "rainbow", 3].map(parseCardBack)).toEqual([
      "classic",
      "classic",
      "classic",
      "classic",
      "classic",
    ]);
  });
});

describe("cardBackSrc", () => {
  it("has no picture for the classic back", () => {
    expect(cardBackSrc("classic")).toBeNull();
  });

  it("points every other back at its picture", () => {
    expect(cardBackSrc("hogwarts")).toBe("/card-backs/hogwarts.webp");
  });
});
