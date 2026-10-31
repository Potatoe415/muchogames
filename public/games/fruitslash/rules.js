// Match rules: the two modes, points, combos and the end-screen stars.
// Positions are fractions of the play area (x of its width, y of its
// height, y down), so a resize or a resume on another screen keeps the
// throws the same. `radius` is a fraction of the shorter side.
export const MATCH_SECONDS = 60;
// Bonus stars add time; the clock never holds more than this.
export const MAX_SECONDS = MATCH_SECONDS * 2;
export const BOMB_PENALTY = 5;
export const BONUS_POINTS = 5;
export const BONUS_TIME = 2;
export const COMBO_MIN = 3;
// A stroke's combo closes this long after its last cut.
export const COMBO_WINDOW = 0.35;

export const MODES = {
  kids: {
    icon: "🐣",
    gravity: 1.45,
    radius: 0.095,
    wave: [1.25, 1.75],
    waveSize: [1, 3],
    bombChance: 0,
    bonusChance: 0.07,
    stars: [35, 70]
  },
  ninja: {
    icon: "🥷",
    gravity: 2.1,
    radius: 0.075,
    wave: [0.8, 1.25],
    waveSize: [2, 5],
    bombChance: 0.3,
    bonusChance: 0.05,
    stars: [60, 120]
  }
};
export const MODE_IDS = Object.keys(MODES);

// Waves come up to a quarter faster as the clock runs down.
export const waveDelay = (mode, elapsed) => {
  const [min, max] = MODES[mode].wave;
  const ramp = 1 - 0.25 * Math.min(1, elapsed / MATCH_SECONDS);
  return (min + Math.random() * (max - min)) * ramp;
};

// Three or more items in one stroke: as many bonus points as items.
export const comboBonus = (count) => (count >= COMBO_MIN ? count : 0);

// Every match earns at least one star.
export function starsFor(mode, score) {
  const [two, three] = MODES[mode].stars;
  return 1 + (score >= two ? 1 : 0) + (score >= three ? 1 : 0);
}
