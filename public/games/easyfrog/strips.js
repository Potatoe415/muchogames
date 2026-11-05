// The background strips (road, verges, top hedge) are hand-cut: their
// edges are ragged, with transparent pixels along the borders, and the
// canvas colour showed through them as thin blue lines between the bands.
// Each strip is trimmed of its mostly-empty edge lines, then every pixel
// still see-through takes the colour of the nearest solid pixel of its
// column, so a stretched strip covers its whole band without distortion.
const OPAQUE = 250; // alpha from which a pixel counts as solid
const KEEP = 0.5; // share of solid pixels an edge row / column needs to stay

function readPixels(img) {
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(img, 0, 0);
  return ctx.getImageData(0, 0, img.width, img.height);
}

// First and last index in [0, size) whose line is solid enough.
function keptRange(size, share) {
  let first = 0;
  let last = size - 1;
  while (first < last && share(first) < KEEP) first++;
  while (last > first && share(last) < KEEP) last--;
  return [first, last];
}

function trimBox({ data, width, height }) {
  const solid = (x, y) => data[(y * width + x) * 4 + 3] >= OPAQUE;
  const share = (count, test) => {
    let n = 0;
    for (let i = 0; i < count; i++) if (test(i)) n++;
    return n / count;
  };
  const [top, bottom] = keptRange(height, (y) =>
    share(width, (x) => solid(x, y))
  );
  const rows = bottom - top + 1;
  const [left, right] = keptRange(width, (x) =>
    share(rows, (i) => solid(x, top + i))
  );
  return { x: left, y: top, w: right - left + 1, h: rows };
}

// Index (row) of the nearest solid pixel to `y` in column `x`, or -1.
function nearestSolid(image, x, y) {
  const { data, width, height } = image;
  for (let d = 1; d < height; d++) {
    for (const row of [y - d, y + d]) {
      if (row < 0 || row >= height) continue;
      if (data[(row * width + x) * 4 + 3] >= OPAQUE) return row;
    }
  }
  return -1;
}

// Fills every see-through pixel of `image` in place.
function fillGaps(image) {
  const { data, width, height } = image;
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      const at = (y * width + x) * 4;
      if (data[at + 3] >= OPAQUE) continue;
      const row = nearestSolid(image, x, y);
      const from = row < 0 ? (y * width + Math.max(0, x - 1)) * 4 : (row * width + x) * 4;
      data[at] = data[from];
      data[at + 1] = data[from + 1];
      data[at + 2] = data[from + 2];
      data[at + 3] = 255;
    }
  }
}

// Returns a canvas drawable like an image; the original if reading its
// pixels fails.
export function solidStrip(img) {
  try {
    const box = trimBox(readPixels(img));
    const canvas = document.createElement("canvas");
    canvas.width = box.w;
    canvas.height = box.h;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(img, box.x, box.y, box.w, box.h, 0, 0, box.w, box.h);
    const image = ctx.getImageData(0, 0, box.w, box.h);
    fillGaps(image);
    ctx.putImageData(image, 0, 0);
    return canvas;
  } catch {
    return img;
  }
}
