// Emoji pre-drawn once per size onto small canvases, with their coloured
// glow baked in, so a frame only blits images.
const FONT =
  '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", "Twemoji Mozilla", sans-serif';
const PADDING = 1.7;
const cache = new Map();

// `size` is the emoji height in device pixels; it is rounded so a resize
// does not fill the cache with near-identical sprites.
export function sprite(emoji, glow, size) {
  const rounded = Math.max(16, Math.round(size / 4) * 4);
  const key = `${emoji}|${rounded}`;
  let canvas = cache.get(key);
  if (canvas) return canvas;
  canvas = document.createElement("canvas");
  canvas.width = canvas.height = Math.ceil(rounded * PADDING);
  const ctx = canvas.getContext("2d");
  ctx.font = `${rounded}px ${FONT}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = glow;
  ctx.shadowBlur = rounded * 0.28;
  ctx.fillText(emoji, canvas.width / 2, canvas.height / 2 + rounded * 0.06);
  ctx.shadowBlur = 0;
  ctx.fillText(emoji, canvas.width / 2, canvas.height / 2 + rounded * 0.06);
  cache.set(key, canvas);
  return canvas;
}

export const spritePadding = PADDING;

export function clearSprites() {
  cache.clear();
}
