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

// el: the rotating element. spin() resolves with the theme under the
// pointer once the wheel stops.
export function createWheel(el, themeClass) {
  const svg = svgNode('svg', { viewBox: '-100 -100 200 200', 'aria-hidden': 'true' });
  drawSegments(svg, themeClass);
  el.replaceChildren(svg);
  let angle = 0;

  function spin(reducedMotion) {
    const index = Math.floor(Math.random() * WHEEL_THEMES.length);
    // Land inside the segment, never on a border.
    const jitter = (Math.random() - 0.5) * SEGMENT * 0.7;
    const wanted = (((-index * SEGMENT + jitter) % 360) + 360) % 360;
    const delta = (((wanted - angle) % 360) + 360) % 360;
    const target = angle + delta + (reducedMotion ? 0 : TURNS * 360);
    const animation = el.animate([{ transform: `rotate(${angle}deg)` }, { transform: `rotate(${target}deg)` }], {
      duration: reducedMotion ? 250 : SPIN_MS,
      easing: 'cubic-bezier(0.12, 0.8, 0.22, 1)',
      fill: 'forwards'
    });
    angle = target % 360;
    return animation.finished.then(() => {
      el.style.transform = `rotate(${angle}deg)`;
      animation.cancel();
      return WHEEL_THEMES[index];
    });
  }

  return { spin };
}
