// Touch halves, plunger corner, and PC mouse buttons → SDL2 keys.
import { emitKey, KEYS } from "./keys.js";

const held = Object.create(null);
const pointers = new Map();
const live = new Set();

export function unlockAudio() {
  const sdl = window.Module?.SDL2;
  if (!sdl) return;
  [sdl.audioContext, sdl.audio?.context, sdl.capture?.audioContext].forEach(
    (ctx) => {
      if (ctx?.state === "suspended") ctx.resume();
    }
  );
}

function down(spec) {
  held[spec.code] = (held[spec.code] || 0) + 1;
  if (held[spec.code] === 1) emitKey("keydown", spec);
}

function up(spec) {
  if (!held[spec.code]) return;
  held[spec.code] -= 1;
  if (held[spec.code] === 0) emitKey("keyup", spec);
}

function paint(el) {
  let on = false;
  pointers.forEach((rec) => {
    if (rec.el === el) on = true;
  });
  el.classList.toggle("held", on);
}

function trackPointer(e) {
  if (e.type === "pointerdown") live.add(e.pointerId);
  else live.delete(e.pointerId);
}

export function bindControls({ onPress }) {
  document.querySelectorAll("[data-key]").forEach((el) => bindPad(el, onPress));
  document
    .querySelector("[data-id='spacecadet-frame']")
    .addEventListener("contextmenu", (event) => event.preventDefault());
  window.addEventListener("pointerdown", trackPointer, true);
  window.addEventListener("pointerup", trackPointer, true);
  window.addEventListener("pointercancel", trackPointer, true);
  window.addEventListener("pointerdown", unlockAudio, true);
  window.addEventListener("touchstart", unlockAudio, true);
  window.addEventListener("keydown", blockPageScroll, { passive: false });
}

function blockPageScroll(e) {
  if (e.isTrusted && e.code === "Space") e.preventDefault();
}

function controlSpec(el, event) {
  const side =
    el.classList.contains("sc-zone") &&
    (el.dataset.key === "left" || el.dataset.key === "right");
  if (event.pointerType === "mouse" && side) {
    if (event.button === 0) return KEYS.left;
    if (event.button === 2) return KEYS.right;
    return null;
  }
  if (event.pointerType === "mouse" && event.button !== 0) return null;
  return KEYS[el.dataset.key] ?? null;
}

function bindPad(el, onPress) {
  if (!KEYS[el.dataset.key]) return;
  el.addEventListener("pointerdown", (e) => startHold(e, el, onPress), {
    passive: false
  });
  const end = (e) => endHold(e, el);
  el.addEventListener("pointerup", end);
  el.addEventListener("pointercancel", end);
  el.addEventListener("pointerleave", end);
}

async function startHold(e, el, onPress) {
  const spec = controlSpec(el, e);
  if (!spec) return;
  if (pointers.has(e.pointerId)) return;
  e.preventDefault();
  unlockAudio();
  const pointerId = e.pointerId;
  if (!(await onPress(el.dataset.key))) return;
  if (!live.has(pointerId)) {
    down(spec);
    up(spec);
    return;
  }
  pointers.set(pointerId, { spec, el });
  paint(el);
  down(spec);
  document.getElementById("canvas")?.focus({ preventScroll: true });
}

function endHold(e, el) {
  const rec = pointers.get(e.pointerId);
  if (!rec || rec.el !== el) return;
  pointers.delete(e.pointerId);
  paint(el);
  up(rec.spec);
}
