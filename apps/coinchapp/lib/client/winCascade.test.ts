import { describe, expect, it } from "vitest";
import { isFlyerGone, launchFlyer, launchOrder, stepFlyer } from "./winCascade";

describe("win cascade", () => {
  it("launches the foundations' top cards in turn, Kings first", () => {
    expect(launchOrder([2, 2, 1, 2])).toEqual([[0, 0], [1, 0], [2, 0], [3, 0], [0, 1], [1, 1], [3, 1]]);
  });

  it("launches sideways and upwards, never straight down", () => {
    const flyer = launchFlyer(10, 20, 1, () => 0.9);
    expect(Math.abs(flyer.vx)).toBeGreaterThanOrEqual(2);
    expect(flyer.vy).toBeLessThanOrEqual(0);
  });

  it("falls, then bounces back up off the floor with less speed", () => {
    let flyer = { x: 0, y: 95, vx: 3, vy: 10, bounce: 0.75 };
    flyer = stepFlyer(flyer, 100, 1);
    expect(flyer.y).toBe(100);
    expect(flyer.vy).toBeCloseTo(-10.98 * 0.75);
    expect(flyer.x).toBe(3);
  });

  it("is gone only once fully off either side", () => {
    const at = (x: number) => ({ x, y: 0, vx: 0, vy: 0, bounce: 0.7 });
    expect(isFlyerGone(at(-49), 50, 400)).toBe(false);
    expect(isFlyerGone(at(-51), 50, 400)).toBe(true);
    expect(isFlyerGone(at(401), 50, 400)).toBe(true);
  });
});
