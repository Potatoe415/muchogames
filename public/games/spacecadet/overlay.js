// Win95 touch bar + canvas halves → SDL2 keyboard events.
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

function bindPad(el, onPress) {
  const spec = KEYS[el.dataset.key];
  if (!spec) return;
  el.addEventListener("pointerdown", (e) => startHold(e, el, spec, onPress), {
    passive: false
  });
  const end = (e) => endHold(e, el);
  el.addEventListener("pointerup", end);
  el.addEventListener("pointercancel", end);
  el.addEventListener("pointerleave", end);
}

async function startHold(e, el, spec, onPress) {
  if (e.pointerType === "mouse" && e.button !== 0) return;
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
