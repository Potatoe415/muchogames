// Wheel mode: a category wheel in place of the board. Drag it with a finger
// and let go fast enough to spin it, or call spin() (the button). The pointer
// sits at 12 o'clock; spin() resolves with the category under it.
import { CAT_COLORS } from "./board-view.js";

const SEGMENTS = [0, 1, 2, 3, 4, 5, 0, 1, 2, 3, 4, 5];
const SEG = 360 / SEGMENTS.length;
const EDGE = 2.5;
const FLING_MIN = 0.3;
const SAMPLE_MS = 100;
const REDUCED_MS = 300;

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

function pointerAngle(el, event) {
  const box = el.getBoundingClientRect();
  const x = event.clientX - (box.left + box.width / 2);
  const y = event.clientY - (box.top + box.height / 2);
  return (Math.atan2(y, x) * 180) / Math.PI;
}

export function createWheelView(boardEl, { canSpin, onFling }, signal) {
  boardEl.innerHTML =
    `<div class="tp-wheel" data-id="trivialpursuit-wheel" role="img">` +
    `<div class="tp-wheel-disc">${wheelSvg()}</div>` +
    `<div class="tp-wheel-pointer">${POINTER_SVG}</div></div>`;
  const wheel = boardEl.querySelector(".tp-wheel");
  const disc = wheel.querySelector(".tp-wheel-disc");
  const view = { rot: -SEG / 2, drag: null };

  const paint = () => (disc.style.transform = `rotate(${view.rot}deg)`);
  paint();

  wheel.addEventListener(
    "pointerdown",
    (event) => {
      if (!canSpin()) return;
      wheel.setPointerCapture(event.pointerId);
      wheel.classList.add("is-dragging");
      disc.style.transition = "none";
      view.drag = {
        last: pointerAngle(wheel, event),
        samples: [{ t: event.timeStamp, rot: view.rot }]
      };
    },
    { signal }
  );

  wheel.addEventListener(
    "pointermove",
    (event) => {
      const drag = view.drag;
      if (!drag) return;
      const angle = pointerAngle(wheel, event);
      view.rot += norm(angle - drag.last + 180) - 180;
      drag.last = angle;
      drag.samples.push({ t: event.timeStamp, rot: view.rot });
      drag.samples = drag.samples.filter(
        (s) => s.t >= event.timeStamp - SAMPLE_MS
      );
      paint();
    },
    { signal }
  );

  const release = (event) => {
    const drag = view.drag;
    if (!drag) return;
    view.drag = null;
    wheel.classList.remove("is-dragging");
    if (event.type !== "pointerup") return;
    const recent = drag.samples.filter(
      (s) => s.t >= event.timeStamp - SAMPLE_MS
    );
    const first = recent[0];
    const last = recent[recent.length - 1];
    const ms = last && last.t - first.t;
    const speed = ms > 0 ? (last.rot - first.rot) / ms : 0;
    if (Math.abs(speed) >= FLING_MIN && canSpin()) onFling(speed);
  };
  wheel.addEventListener("pointerup", release, { signal });
  wheel.addEventListener("pointercancel", release, { signal });

  // `speed` in degrees per ms; its sign gives the direction. The random
  // last turn makes every category equally likely whatever the swipe.
  async function spin(speed = 1.2 + Math.random() * 1.2) {
    const strength = Math.min(3, Math.max(0.6, Math.abs(speed)));
    const dir = speed < 0 ? -1 : 1;
    const distance = 1080 + strength * 600 + Math.random() * 360;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ms = reduced ? REDUCED_MS : Math.round(3200 + strength * 400);
    view.rot = landing(view.rot, dir * distance);
    wheel.style.removeProperty("--landed");
    disc.style.transition = `transform ${ms}ms cubic-bezier(0.12, 0.8, 0.2, 1)`;
    paint();
    await wait(ms);
    const cat = catAt(view.rot);
    wheel.style.setProperty("--landed", CAT_COLORS[cat]);
    return cat;
  }

  return {
    spin,
    setLabel: (text) => wheel.setAttribute("aria-label", text)
  };
}
