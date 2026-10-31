const PAIR_POINTS = 100;
const MISS_POINTS = 20;
const FORGOTTEN_POINTS = 30;
const SECOND_POINTS = 1;

export function soloPoints(state, ms) {
  const seconds = Math.floor(ms / 1000);
  const total =
    state.scores[0] * PAIR_POINTS -
    state.misses * MISS_POINTS -
    state.forgotten * FORGOTTEN_POINTS -
    seconds * SECOND_POINTS;
  return Math.max(0, total);
}

export function clockText(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
}
