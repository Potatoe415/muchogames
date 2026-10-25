// Status panel: LEVEL / TIME / CHIPS LEFT counters, the 4x2 inventory
// (keys on top, boots below) and the hint box that covers the counters
// while Chip stands on a "?" square. Redraws only what changed.
import { terrainAt } from "./board.js";
import { drawLed, LED_HEIGHT, LED_WIDTH } from "./led.js";
import { drawTile } from "./sheet.js";
import { T, TILE } from "./tiles.js";

const LOW_TIME = 15;
const KEY_SLOTS = [
  ["blue", T.KEY_BLUE],
  ["red", T.KEY_RED],
  ["yellow", T.KEY_YELLOW],
  ["green", T.KEY_GREEN]
];
const BOOT_SLOTS = [
  ["flippers", T.FLIPPERS],
  ["fire", T.FIRE_BOOTS],
  ["skates", T.SKATES],
  ["suction", T.SUCTION]
];

const pad3 = (n) => String(Math.min(999, Math.max(0, n)));

function setupLeds(root) {
  const leds = {};
  root.querySelectorAll("[data-led]").forEach((canvas) => {
    canvas.width = LED_WIDTH;
    canvas.height = LED_HEIGHT;
    leds[canvas.dataset.led] = canvas;
  });
  return leds;
}

function inventoryKey(w) {
  const keys = KEY_SLOTS.map(([k]) => (w.keys[k] > 0 ? 1 : 0)).join("");
  const boots = BOOT_SLOTS.map(([b]) => (w.boots[b] ? 1 : 0)).join("");
  return keys + boots;
}

function drawInventory(canvas, sheet, w) {
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  [KEY_SLOTS, BOOT_SLOTS].forEach((slots, row) => {
    slots.forEach(([name, tile], col) => {
      const owned = row === 0 ? w.keys[name] > 0 : w.boots[name];
      drawTile(ctx, sheet, owned ? tile : T.FLOOR, col * TILE, row * TILE);
    });
  });
}

export function createPanel(root) {
  const leds = setupLeds(root);
  const inventory = root.querySelector("[data-inventory]");
  inventory.width = 4 * TILE;
  inventory.height = 2 * TILE;
  const counters = root.querySelector("[data-counters]");
  const hintBox = root.querySelector("[data-hint-box]");
  const hintText = root.querySelector("[data-hint-text]");
  const last = {};

  function show(name, text, color) {
    const key = `${text}|${color}`;
    if (last[name] === key) return;
    last[name] = key;
    drawLed(leds[name], text, color);
  }

  function showHint(w) {
    const onHint = terrainAt(w, w.chip.x, w.chip.y) === T.HINT && !w.dead;
    if (last.hint === onHint) return;
    last.hint = onHint;
    hintBox.hidden = !onHint;
    counters.hidden = onHint;
    if (onHint) hintText.textContent = w.def.hint;
  }

  return {
    update(w, sheet) {
      show("level", pad3(w.number), "red");
      const limited = w.def.time > 0;
      const low = limited && w.timeLeft <= LOW_TIME;
      show("time", limited ? pad3(w.timeLeft) : "---", low ? "yellow" : "red");
      show("chips", pad3(w.chipsLeft), w.chipsLeft === 0 ? "yellow" : "red");
      showHint(w);
      const inv = sheet ? inventoryKey(w) : null;
      if (inv !== null && last.inv !== inv) {
        last.inv = inv;
        drawInventory(inventory, sheet, w);
      }
    },
    reset() {
      Object.keys(last).forEach((k) => delete last[k]);
    }
  };
}
