import { describe, expect, it } from "vitest";
import { detectSlapPattern } from "./pattern";
import { card } from "./test-utils";

describe("detectSlapPattern", () => {
  it("returns null on an empty or single-card pile", () => {
    expect(detectSlapPattern([])).toBeNull();
    expect(detectSlapPattern([card("7")])).toBeNull();
  });

  it("detects a double (top 2 cards share a rank)", () => {
    const pile = [card("3"), card("7"), card("7")];
    expect(detectSlapPattern(pile)).toBe("double");
  });

  it("detects a sandwich (top and 2-below share a rank, 1 card between)", () => {
    const pile = [card("5"), card("K"), card("9"), card("K")];
    expect(detectSlapPattern(pile)).toBe("sandwich");
  });

  it("returns null when neither pattern is present", () => {
    const pile = [card("3"), card("5"), card("9"), card("J")];
    expect(detectSlapPattern(pile)).toBeNull();
  });

  it("prefers double over sandwich when both would technically match", () => {
    // top 2 share a rank (double) AND top/3rd-from-top also happen to match.
    const pile = [card("9"), card("9"), card("9")];
    expect(detectSlapPattern(pile)).toBe("double");
  });

  it("detects a figure double across a tribute chain's ordinary filler cards", () => {
    // As opens a tribute (4 attempts); the payer burns 3 plain attempts
    // before finally answering with another As - not adjacent on the real
    // pile, but "right after" once the plain filler is ignored.
    const pile = [card("A"), card("3"), card("5"), card("9"), card("A")];
    expect(detectSlapPattern(pile)).toBe("double");
  });

  it("does not detect a figure sandwich across a tribute chain, even with just one other figure between - a sandwich only ever counts with exactly one real card in the middle", () => {
    const pile = [card("K"), card("7"), card("Q"), card("K")];
    expect(detectSlapPattern(pile)).toBeNull();
  });

  it("still detects a literal sandwich for figures with no filtering involved (exactly one real card between)", () => {
    const pile = [card("K"), card("Q"), card("K")];
    expect(detectSlapPattern(pile)).toBe("sandwich");
  });

  it("does not resurrect a stale figure pair once a plain card is on top", () => {
    // The two Kings already had their moment - a later, unrelated plain
    // card on top must not retroactively open a window for them.
    const pile = [card("K"), card("K"), card("7")];
    expect(detectSlapPattern(pile)).toBeNull();
  });

  it("ignores mismatched figures separated by filler (Valet then As doesn't match)", () => {
    const pile = [card("J"), card("3"), card("5"), card("A")];
    expect(detectSlapPattern(pile)).toBeNull();
  });
});
