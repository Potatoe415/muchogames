// Scoring and per-level difficulty curve.
export const POINTS = { tile: 50, cross: 500, replace: -50, unused: -100 };
export const FAST_FACTOR = 5;
export const QUEUE_SIZE = 5;
export const LOCK_SECONDS = 0.6;
export const LEAK_SECONDS = 1.3;
export const SWEEP_SECONDS = 0.32;
export const ROCKS_FROM_LEVEL = 3;

// Grid is 10x7 in landscape, transposed to 7x10 on a portrait screen so
// cells stay large enough for a finger.
export const GRID_LONG = 10;
export const GRID_SHORT = 7;

export function levelConfig(level) {
  const step = level - 1;
  return {
    level,
    countdown: Math.max(6, 20 - 1.5 * step),
    secondsPerTile: Math.max(0.55, 2.4 - 0.18 * step),
    quota: Math.min(10 + 2 * step, 30),
    rocks: level >= ROCKS_FROM_LEVEL ? Math.min(level - 1, 9) : 0
  };
}
