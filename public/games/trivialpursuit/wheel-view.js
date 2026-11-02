// Wheel mode: a category wheel in place of the board. Drag it with a finger
// and let go fast enough to spin it (or call spin() from the button), or tap
// a colour to pick it. The pointer sits at 12 o'clock; spin() and turnTo()
// resolve with the category under it.
import { CAT_COLORS } from "./board-view.js";

const SEGMENTS = [0, 1, 2, 3, 4, 5, 0, 1, 2, 3, 4, 5];
const SEG = 360 / SEGMENTS.length;
const EDGE = 2.5;
const FLING_MIN = 0.2;
const SPEED_MAX = 3;
const TAP_PX = 8;
const HUB_SHARE = 0.2;
const SAMPLE_MS = 100;
const REDUCED_MS = 300;
// Exact quadratic ease-out = constant deceleration: the wheel leaves at the
// finger's speed (deg/ms) and slows to a stop, so a faster swipe spins
// longer and farther.
const DECELERATE = "cubic-bezier(0.333, 0.667, 0.667, 1)";
const spinMs = (speed) => 1500 + 2000 * speed;

const norm = (deg) => ((deg % 360) + 360) % 360;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function at(r, deg) {
  const a = (deg * Math.PI) / 180;
  return `${(r * Math.sin(a)).toFixed(2)} ${(-r * Math.cos(a)).toFixed(2)}`;
}

function wheelSvg() {
  let out = "";
  SEGMENTS.forEach((cat, k) => {
    const a0 = k * SEG;
    out += `<path d="M0 0L${at(46, a0)}A46 46 0 0 1 ${at(46, a0 + SEG)}Z" fill="${CAT_COLORS[cat]}" stroke="#fff" stroke-width="0.8"/>`;
  });
  for (let k = 0; k < SEGMENTS.length * 2; k += 1) {
    const [x, y] = at(47.8, (k * SEG) / 2).split(" ");
    out += `<circle cx="${x}" cy="${y}" r="0.9" fill="#ffe9a8"/>`;
  }
  return (
    `<svg viewBox="-50 -50 100 100" aria-hidden="true">` +
    `<circle r="49.6" fill="#1f2a44"/>${out}` +
    `<circle r="10" fill="#fff" stroke="#1f2a44" stroke-width="1.6"/>` +
    `<circle r="4" fill="#1f2a44"/></svg>`
  );
}

const POINTER_SVG =
  `<svg viewBox="0 0 20 24" aria-hidden="true">` +
  `<path d="M2 2H18L10 22Z" fill="var(--landed, #fff)" stroke="#1f2a44" stroke-width="2" stroke-linejoin="round"/></svg>`;

const catAt = (rot) => SEGMENTS[Math.floor(norm(-rot) / SEG)];

// Rotation that ends `distance` degrees away, never on a segment border.
function landing(rot, distance) {
  const end = rot + distance;
  const off = norm(-end) % SEG;
  if (off < EDGE) return end - (EDGE - off);
  if (off > SEG - EDGE) return end + (off - (SEG - EDGE));
  return end;
}

function offset(el, event) {
  const box = el.getBoundingClientRect();
  return {
    x: event.clientX - (box.left + box.width / 2),
    y: event.clientY - (box.top + box.height / 2),
    radius: box.width / 2
  };
}

const pointerAngle = (el, event) => {
  const { x, y } = offset(el, event);
  return (Math.atan2(y, x) * 180) / Math.PI;
};

// Segment under a tap, or -1 on the centre circle.
function segmentAt(view, event) {
  const { x, y, radius } = offset(view.wheel, event);
  if (Math.hypot(x, y) < radius * HUB_SHARE) return -1;
  const screen = (Math.atan2(x, -y) * 180) / Math.PI;
  return Math.floor(norm(screen - view.rot) / SEG);
}

const paint = (view) => (view.disc.style.transform = `rotate(${view.rot}deg)`);

async function rotate(view, to, ms, easing) {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const time = reduced ? Math.min(ms, REDUCED_MS) : ms;
  view.rot = to;
  view.wheel.style.removeProperty("--landed");
  view.disc.style.transition = `transform ${time}ms ${easing}`;
  paint(view);
  await wait(time);
  const cat = catAt(view.rot);
  view.wheel.style.setProperty("--landed", CAT_COLORS[cat]);
  return cat;
}

// `speed` in degrees per ms; its sign gives the direction. A ±10 % spread on
// the time keeps the result out of reach of a practised swipe.
function spin(view, speed = 1 + Math.random()) {
  const v = Math.min(SPEED_MAX, Math.max(FLING_MIN, Math.abs(speed)));
  const dir = speed < 0 ? -1 : 1;
  const ms = Math.round(spinMs(v) * (0.9 + Math.random() * 0.2));
  return rotate(view, landing(view.rot, (dir * v * ms) / 2), ms, DECELERATE);
}

// Shortest turn that brings `segment` under the pointer.
function turnTo(view, segment) {
  const delta = norm(-(segment + 0.5) * SEG - view.rot + 180) - 180;
  return rotate(view, view.rot + delta, 250 + Math.abs(delta) * 3, "ease-out");
}

function release(view, event, on) {
  const drag = view.drag;
  if (!drag) return;
  view.drag = null;
  view.wheel.classList.remove("is-dragging");
  if (event.type !== "pointerup" || !on.canSpin()) return;
  if (drag.moved < TAP_PX) {
    const segment = segmentAt(view, event);
    if (segment >= 0) on.onPick(segment);
    return;
  }
  const recent = drag.samples.filter((s) => s.t >= event.timeStamp - SAMPLE_MS);
  const first = recent[0];
  const last = recent[recent.length - 1];
  const ms = last && last.t - first.t;
  const speed = ms > 0 ? (last.rot - first.rot) / ms : 0;
  if (Math.abs(speed) >= FLING_MIN) on.onFling(speed);
}

function bindPointer(view, on, signal) {
  const { wheel } = view;
  const opts = { signal };
  wheel.addEventListener(
    "pointerdown",
    (event) => {
      if (!on.canSpin()) return;
      wheel.setPointerCapture(event.pointerId);
      wheel.classList.add("is-dragging");
      view.disc.style.transition = "none";
      view.drag = {
        x: event.clientX,
        y: event.clientY,
        moved: 0,
        last: pointerAngle(wheel, event),
        samples: [{ t: event.timeStamp, rot: view.rot }]
      };
    },
    opts
  );
  wheel.addEventListener(
    "pointermove",
    (event) => {
      const drag = view.drag;
      if (!drag) return;
      const angle = pointerAngle(wheel, event);
      view.rot += norm(angle - drag.last + 180) - 180;
      drag.last = angle;
      drag.moved = Math.max(
        drag.moved,
        Math.hypot(event.clientX - drag.x, event.clientY - drag.y)
      );
      drag.samples.push({ t: event.timeStamp, rot: view.rot });
      drag.samples = drag.samples.filter(
        (s) => s.t >= event.timeStamp - SAMPLE_MS
      );
      paint(view);
    },
    opts
  );
  const end = (event) => release(view, event, on);
  wheel.addEventListener("pointerup", end, opts);
  wheel.addEventListener("pointercancel", end, opts);
}

// on = { canSpin(), onFling(speed), onPick(segment) }
export function createWheelView(boardEl, on, signal) {
  boardEl.innerHTML =
    `<div class="tp-wheel" data-id="trivialpursuit-wheel" role="img">` +
    `<div class="tp-wheel-disc">${wheelSvg()}</div>` +
    `<div class="tp-wheel-pointer">${POINTER_SVG}</div></div>`;
  const wheel = boardEl.querySelector(".tp-wheel");
  const view = {
    wheel,
    disc: wheel.querySelector(".tp-wheel-disc"),
    rot: -SEG / 2,
    drag: null
  };
  paint(view);
  bindPointer(view, on, signal);
  return {
    spin: (speed) => spin(view, speed),
    turnTo: (segment) => turnTo(view, segment),
    setLabel: (text) => wheel.setAttribute("aria-label", text)
  };
}
