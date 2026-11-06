// Wheel mode ("Roue de la fortune"): no board, a wheel picks the card's
// theme. 10 segments in the board's proportions (the 4 themes twice,
// Challenge and Superbe once), the pointer at 12 o'clock.
export const WHEEL_THEMES = [
  'Improbable',
  'Mature',
  'Plaisir',
  'Scolaire',
  'Challenge',
  'Improbable',
  'Mature',
  'Plaisir',
  'Scolaire',
  'Superbe'
];

const SEGMENT = 360 / WHEEL_THEMES.length;
const RADIUS = 96;
const SVG_NS = 'http://www.w3.org/2000/svg';
const SPIN_MS = 3600;
const TURNS = 5;

const point = (deg, r) => {
  const rad = (deg * Math.PI) / 180;
  return [r * Math.sin(rad), -r * Math.cos(rad)].map((v) => v.toFixed(2)).join(' ');
};

function svgNode(name, attrs) {
  const node = document.createElementNS(SVG_NS, name);
  Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
  return node;
}

// Segment i is centred on i * SEGMENT degrees clockwise from the top.
function drawSegments(svg, themeClass) {
  WHEEL_THEMES.forEach((theme, i) => {
    const from = i * SEGMENT - SEGMENT / 2;
    const to = from + SEGMENT;
    const d = `M0 0 L${point(from, RADIUS)} A${RADIUS} ${RADIUS} 0 0 1 ${point(to, RADIUS)} Z`;
    svg.append(svgNode('path', { d, class: `wheel-segment ${themeClass(theme)}` }));
    const icon = svgNode('image', {
      href: `./assets/icons/${themeClass(theme)}.svg`,
      x: -15,
      y: -RADIUS + 14,
      width: 30,
      height: 30,
      transform: `rotate(${i * SEGMENT})`
    });
    svg.append(icon);
  });
  svg.append(svgNode('circle', { r: RADIUS, class: 'wheel-rim' }));
  svg.append(svgNode('circle', { r: 16, class: 'wheel-hub' }));
}

// A swipe faster than MIN_FLING (degrees per ms) spins the wheel; its
// speed (capped at MAX_FLING) sets how long and how far it turns.
const MIN_FLING = 0.25;
const MAX_FLING = 3;
const DRAG_START_PX = 8;

const norm = (deg) => ((deg % 360) + 360) % 360;
const themeAt = (angle) => WHEEL_THEMES[Math.round(norm(-angle) / SEGMENT) % WHEEL_THEMES.length];

// el: the rotating element. spin() turns it from the button; a swipe on it
// calls onFling(promise) with the same result. Both resolve with the theme
// under the pointer once the wheel stops.
export function createWheel(el, themeClass, { canSpin = () => true, onFling = () => {} } = {}) {
  const svg = svgNode('svg', { viewBox: '-100 -100 200 200', 'aria-hidden': 'true' });
  drawSegments(svg, themeClass);
  el.replaceChildren(svg);
  let angle = 0;
  let busy = false;

  const show = (deg) => (el.style.transform = `rotate(${deg}deg)`);

  // Turns by about `distance` degrees in `duration` ms, slowing down to a
  // stop in the middle of a segment (never on a border).
  function turn(distance, duration, easing = 'cubic-bezier(0.12, 0.8, 0.22, 1)') {
    const raw = angle + distance;
    const centre = Math.round(raw / SEGMENT) * SEGMENT;
    const jitter = (Math.random() - 0.5) * SEGMENT * 0.7;
    const target = centre + jitter;
    const animation = el.animate([{ transform: `rotate(${angle}deg)` }, { transform: `rotate(${target}deg)` }], {
      duration,
      easing,
      fill: 'forwards'
    });
    busy = true;
    return animation.finished.then(() => {
      angle = norm(target);
      show(angle);
      animation.cancel();
      busy = false;
      return themeAt(angle);
    });
  }

  function spin(reducedMotion) {
    if (reducedMotion) return turn(Math.random() * 360, 250);
    return turn(TURNS * 360 + Math.random() * 360, SPIN_MS);
  }

  // Drag: the wheel follows the finger around its centre; the speed of the
  // last ~100 ms decides the fling on release.
  let drag = null;
  const pointerAngle = (event) => {
    const box = el.getBoundingClientRect();
    const x = event.clientX - (box.left + box.width / 2);
    const y = event.clientY - (box.top + box.height / 2);
    return (Math.atan2(x, -y) * 180) / Math.PI;
  };

  el.addEventListener('pointerdown', (event) => {
    if (busy || !canSpin()) return;
    el.setPointerCapture(event.pointerId);
    const a = pointerAngle(event);
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY, moved: false, last: a, start: angle, turned: 0, samples: [{ t: event.timeStamp, turned: 0 }] };
  });

  el.addEventListener('pointermove', (event) => {
    if (!drag || event.pointerId !== drag.id) return;
    if (!drag.moved && Math.hypot(event.clientX - drag.x, event.clientY - drag.y) < DRAG_START_PX) return;
    drag.moved = true;
    const a = pointerAngle(event);
    drag.turned += ((a - drag.last + 540) % 360) - 180;
    drag.last = a;
    drag.samples.push({ t: event.timeStamp, turned: drag.turned });
    while (drag.samples.length > 2 && event.timeStamp - drag.samples[0].t > 100) drag.samples.shift();
    show(drag.start + drag.turned);
  });

  const release = (event) => {
    if (!drag || event.pointerId !== drag.id) return;
    const { samples, start, turned, moved } = drag;
    drag = null;
    if (!moved) return;
    angle = norm(start + turned);
    const first = samples[0];
    const last = samples[samples.length - 1];
    const speed = last.t > first.t ? (last.turned - first.turned) / (last.t - first.t) : 0;
    if (Math.abs(speed) < MIN_FLING) return show(angle);
    const v = Math.sign(speed) * Math.min(MAX_FLING, Math.abs(speed));
    // Constant slowdown from the finger's speed: a slow swipe turns about
    // 2 s and two thirds of a turn, the fastest about 6 s and 25 turns. The
    // ease-out curve starts at that speed, so the wheel does not jump.
    const duration = 1500 + 1500 * Math.abs(v);
    onFling(turn((v * duration) / 2, duration, 'cubic-bezier(0.33, 0.67, 0.67, 1)'));
  };
  el.addEventListener('pointerup', release);
  el.addEventListener('pointercancel', release);

  return { spin, isBusy: () => busy };
}
