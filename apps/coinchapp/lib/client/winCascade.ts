/** Physics of the Windows Solitaire win cascade: a card jumps off its
 *  foundation sideways, falls, bounces along the bottom of the screen losing
 *  height each time, and is gone once it leaves the screen sideways. Units are
 *  CSS pixels per 60 Hz frame, scaled from the original 71 px wide card. */

export const ORIGINAL_CARD_WIDTH = 71;
export const FRAME_MS = 1000 / 60;
const GRAVITY = 0.98;

export interface Flyer {
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Share of vertical speed kept on each bounce. */
  bounce: number;
}

export function launchFlyer(x: number, y: number, scale: number, rng: () => number): Flyer {
  // A bit faster than the 1990 original so the whole cascade lasts about
  // half a minute on a phone instead of well over a minute.
  const speed = (4 + rng() * 6) * scale;
  return {
    x,
    y,
    vx: rng() < 0.5 ? -speed : speed,
    vy: -rng() * 10 * scale,
    bounce: 0.6 + rng() * 0.25,
  };
}

/** One frame. `floorY` is the highest `y` the card's top edge may reach. */
export function stepFlyer(flyer: Flyer, floorY: number, scale: number): Flyer {
  const vy = flyer.vy + GRAVITY * scale;
  const y = flyer.y + vy;
  const x = flyer.x + flyer.vx;
  if (y < floorY) return { ...flyer, x, y, vy };
  return { ...flyer, x, y: floorY, vy: -vy * flyer.bounce };
}

export function isFlyerGone(flyer: Flyer, cardWidth: number, screenWidth: number): boolean {
  return flyer.x + cardWidth < 0 || flyer.x > screenWidth;
}

/** Windows order: the top card of each foundation in turn, left to right,
 *  Kings first, down to the Aces. Returns `[pileIndex, depthFromTop]`. */
export function launchOrder(pileSizes: number[]): Array<[number, number]> {
  const order: Array<[number, number]> = [];
  const tallest = Math.max(0, ...pileSizes);
  for (let depth = 0; depth < tallest; depth++) {
    pileSizes.forEach((size, pile) => {
      if (depth < size) order.push([pile, depth]);
    });
  }
  return order;
}
