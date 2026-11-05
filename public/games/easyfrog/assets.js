// Board images. "Modern look" swaps each one for its `_mod1` version when
// it exists, and falls back to the classic one otherwise.
const IMAGES = {
  frog: "frog",
  frogWin: "frog_win",
  frogDeadRoad: "frog_dead_road",
  frogDeadWater: "frog_dead_water",
  waterBg: "bg_water",
  roadBg: "bg_road",
  border_middle: "border_middle",
  border_top: "border_top",
  car_blue: "car_blue",
  car_green: "car_green",
  car_red: "car_red",
  car_lambo: "car_lambo",
  car_taxi: "car_taxi",
  car_f1: "car_f1",
  car_pink: "car_pink",
  car_bus: "car_bus",
  train: "train",
  log: "log",
  turtle: "turtle",
  croco: "croco",
  nenuphar: "nenuphar",
  fly: "fly"
};

// Classic images with no `_mod1` version: don't request what can't exist.
const CLASSIC_ONLY = new Set(["fly", "frog_win", "car_f1", "car_green"]);

function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

async function loadOne(name, modern) {
  if (modern && !CLASSIC_ONLY.has(name)) {
    const img = await loadImage(`images/${name}_mod1.png`);
    if (img) return img;
  }
  return loadImage(`images/${name}.png`);
}

export async function loadImages(modern) {
  const entries = await Promise.all(
    Object.entries(IMAGES).map(async ([key, name]) => [
      key,
      await loadOne(name, modern)
    ])
  );
  return Object.fromEntries(entries.filter(([, img]) => img));
}
