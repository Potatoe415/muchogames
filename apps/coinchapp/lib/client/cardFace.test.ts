import { describe, expect, it } from "vitest";
import { faceRank } from "./cardFace";

describe("faceRank", () => {
  it("prints valet, dame and roi in French", () => {
    expect(faceRank("J", "fr")).toBe("V");
    expect(faceRank("Q", "fr")).toBe("D");
    expect(faceRank("K", "fr")).toBe("R");
  });

  it("keeps numbers and the ace in French", () => {
    expect(["7", "10", "A"].map((rank) => faceRank(rank, "fr"))).toEqual(["7", "10", "A"]);
  });

  it("keeps the English faces", () => {
    expect(["J", "Q", "K", "A", "10"].map((rank) => faceRank(rank, "en"))).toEqual(["J", "Q", "K", "A", "10"]);
  });
});
