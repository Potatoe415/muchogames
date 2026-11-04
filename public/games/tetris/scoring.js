// Guideline scoring and speed curve.
export const GOAL_LINES = 40;
export const LINES_PER_LEVEL = 10;

const LINE_POINTS = [0, 100, 300, 500, 800];
const SPIN_POINTS = { full: [400, 800, 1200, 1600], mini: [100, 200, 400, 0] };
const CURVE_MAX_LEVEL = 20;
const MIN_INTERVAL = 0.001;
const SOFT_FACTOR = 20;
const MIN_SOFT_INTERVAL = 0.02;

export const levelFor = (startLevel, lines) =>
  startLevel + Math.floor(lines / LINES_PER_LEVEL);

// Seconds per row of gravity; soft drop is 20x faster.
export function fallInterval(startLevel, lines, soft = false) {
  const level = Math.min(levelFor(startLevel, lines), CURVE_MAX_LEVEL);
  const base = Math.max(MIN_INTERVAL, (0.8 - (level - 1) * 0.007) ** (level - 1));
  if (!soft) return base;
  return Math.min(base, Math.max(base / SOFT_FACTOR, MIN_SOFT_INTERVAL));
}

// Points for one lock. `combo` is -1 when the last lock cleared nothing and
// `b2b` whether the last clear was "difficult" (Tetris or line-clearing
// T-spin). Returns the new combo / b2b states too.
export function scoreLock({ lines, spin, level, combo, b2b }) {
  const base = spin === "none" ? LINE_POINTS[lines] : SPIN_POINTS[spin][lines];
  const difficult = lines > 0 && (lines === 4 || spin !== "none");
  const b2bApplied = difficult && b2b;
  const nextCombo = lines > 0 ? combo + 1 : -1;
  const comboPoints = nextCombo > 0 ? 50 * nextCombo * level : 0;
  return {
    points: Math.floor(base * (b2bApplied ? 1.5 : 1)) * level + comboPoints,
    combo: nextCombo,
    b2b: lines > 0 ? difficult : b2b,
    b2bApplied
  };
}
