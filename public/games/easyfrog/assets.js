// Board images (images/<name>.png), loaded once per page.
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

function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

// A missing image is left out: that sprite is simply not drawn.
export async function loadImages() {
  const entries = await Promise.all(
    Object.entries(IMAGES).map(async ([key, name]) => [
      key,
      await loadImage(`images/${name}.png`)
    ])
  );
  return Object.fromEntries(entries.filter(([, img]) => img));
}
