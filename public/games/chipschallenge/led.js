// Three-digit seven-segment display on a 51x28 canvas, red on black like
// the original counters (yellow when the value needs attention). Unlit
// segments stay faintly visible.
const DIGIT_X = [3, 20, 37];
const TOP = 3;
const SEGMENT_RECTS = {
  a: [2, 0, 9, 2],
  b: [11, 2, 2, 8],
  c: [11, 12, 2, 8],
  d: [2, 20, 9, 2],
  e: [0, 12, 2, 8],
  f: [0, 2, 2, 8],
  g: [2, 10, 9, 2]
};
const GLYPHS = {
  0: "abcdef",
  1: "bc",
  2: "abdeg",
  3: "abcdg",
  4: "bcfg",
  5: "acdfg",
  6: "acdefg",
  7: "abc",
  8: "abcdefg",
  9: "abcdfg",
  "-": "g",
  " ": ""
};
const COLORS = {
  red: { on: "#ff0000", off: "#400000" },
  yellow: { on: "#ffff00", off: "#404000" }
};

export const LED_WIDTH = 51;
export const LED_HEIGHT = 28;

function drawDigit(ctx, glyph, x, palette) {
  Object.entries(SEGMENT_RECTS).forEach(([name, [dx, dy, w, h]]) => {
    ctx.fillStyle = glyph.includes(name) ? palette.on : palette.off;
    ctx.fillRect(x + dx, TOP + dy, w, h);
  });
}

// `text` is up to three characters among 0-9, "-" and " ".
export function drawLed(canvas, text, color = "red") {
  const ctx = canvas.getContext("2d");
  const palette = COLORS[color];
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, LED_WIDTH, LED_HEIGHT);
  const chars = text.padStart(3, " ").slice(-3);
  [...chars].forEach((ch, i) =>
    drawDigit(ctx, GLYPHS[ch] ?? "", DIGIT_X[i], palette)
  );
}
