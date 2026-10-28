// Difficulty = how many clues stay on the grid and which techniques solve it.
// `singles`: the grid must fall to naked + hidden singles alone (easy, medium);
// otherwise the generator retries until it needs more than singles.
export const LEVELS = {
  easy: { clues: 40, singles: true },
  medium: { clues: 32, singles: true },
  hard: { clues: 28, singles: false },
  expert: { clues: 17, singles: false }
};

export const LEVEL_IDS = Object.keys(LEVELS);
