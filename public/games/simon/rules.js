// Pure Simon rules: pads, the growing sequence, playback speed and the check
// of each press. No DOM, so it runs in Node too.
export const PADS = ["green", "red", "yellow", "blue"];
export const MAX_LENGTH = 999;
// Easy plays everything 1.5x slower; Normal is the classic speed.
export const DIFFICULTIES = ["normal", "easy"];
const SLOWDOWN = { normal: 1, easy: 1.5 };

// Classic Simon speeds up after the 5th, 9th and 13th colour.
const SPEEDS = [
  { from: 1, on: 600, gap: 220 },
  { from: 6, on: 500, gap: 180 },
  { from: 10, on: 410, gap: 150 },
  { from: 14, on: 330, gap: 120 }
];

export const randomPad = (rand = Math.random) =>
  Math.min(PADS.length - 1, Math.floor(rand() * PADS.length));

export function extend(sequence, rand) {
  return [...sequence, randomPad(rand)];
}

export const isDifficulty = (value) => DIFFICULTIES.includes(value);

// Stretches a delay for the difficulty (unchanged on Normal).
export const slowed = (ms, difficulty) =>
  Math.round(ms * (SLOWDOWN[difficulty] ?? 1));

// Milliseconds each colour stays lit, and the dark gap after it.
export function timing(length, difficulty = "normal") {
  const { on, gap } = SPEEDS.reduce((found, speed) =>
    length >= speed.from ? speed : found
  );
  return { on: slowed(on, difficulty), gap: slowed(gap, difficulty) };
}

// "wrong" ends the match, "done" completes the round, "next" waits for the
// following press.
export function check(sequence, step, pad) {
  if (sequence[step] !== pad) return "wrong";
  return step + 1 === sequence.length ? "done" : "next";
}

export const isValidSequence = (sequence) =>
  Array.isArray(sequence) &&
  sequence.length >= 1 &&
  sequence.length <= MAX_LENGTH &&
  sequence.every((pad) => Number.isInteger(pad) && pad >= 0 && pad < 4);
