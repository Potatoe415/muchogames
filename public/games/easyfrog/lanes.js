// Builders for the river lanes of balance.js / balance-easy.js. Rows are
// grid rows (80 px cells), speeds px/s (negative = moving left), startX px.
export const safe = (sprite, row, speed, startX) => ({
  sprite,
  row,
  speed,
  startX,
  type: "safe"
});

export const croco = (row, speed, startX) => ({
  sprite: "croco",
  row,
  speed,
  startX,
  type: "croco"
});

// A turtle that dives: surfaceTime, then warningTime blinking (still
// safe), then diveTime under water. All in ms.
export const diving = (row, speed, startX, timing) => ({
  sprite: "turtle",
  row,
  speed,
  startX,
  type: "diving",
  ...timing
});
