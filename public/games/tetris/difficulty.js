// The start screen's three difficulties: starting level and ghost piece.
export const DIFFICULTIES = ["easy", "medium", "hard"];

const SETTINGS = {
  easy: { startLevel: 1, ghost: true },
  medium: { startLevel: 4, ghost: false },
  hard: { startLevel: 7, ghost: false }
};

// Matches saved before difficulties existed played with the ghost: easy.
export const settingsOf = (difficulty) => SETTINGS[difficulty] ?? SETTINGS.easy;

export const isDifficulty = (value) => DIFFICULTIES.includes(value);
