// Pure rules (no DOM): the bird, the pipes, collisions and the score, in
// world units. The world is HEIGHT units tall; its width follows the
// screen's aspect ratio, so a wide screen just shows more pipes ahead.
export const HEIGHT = 100;
export const GROUND = 88; // top of the ground strip
export const BIRD_X = 22; // the bird never moves sideways
export const BIRD_R = 3.6;
export const PIPE_W = 14;
export const GAP = 27;
const GRAVITY = 260; // units / s²
const FLAP = -72; // vertical speed right after a flap
const MAX_FALL = 110;
const SPEED = 34; // pipes scroll, units / s
const SPACING = 54; // distance between two pipes
const MARGIN = 9; // a gap never comes closer than this to sky or ground
const DYING = 0.9; // seconds of fall after a hit, before the end card


export function randomGap(rng = Math.random) {
  const low = MARGIN + GAP / 2;
  const high = GROUND - MARGIN - GAP / 2;
  return low + rng() * (high - low);
}

export function newState(width) {
  return {
    phase: "ready", // ready (frozen, waits for a flap) | play | over
    width,
    y: HEIGHT * 0.42,
    vy: 0,
    pipes: [], // { x, gap (centre y), scored }
    nextIn: 24, // distance to scroll before the next pipe appears
    score: 0,
    dist: 0, // total scrolled, drives the ground and clouds
    dying: 0
  };
}

const clamp = (v, low, high) => Math.max(low, Math.min(v, high));

function circleHitsRect(x, y, x0, y0, x1, y1) {
  const dx = x - clamp(x, x0, x1);
  const dy = y - clamp(y, y0, y1);
  return dx * dx + dy * dy < BIRD_R * BIRD_R;
}

// A pipe is two rectangles (above and below its gap).
export function hitsPipe(x, y, pipe) {
  const right = pipe.x + PIPE_W;
  const top = pipe.gap - GAP / 2;
  const bottom = pipe.gap + GAP / 2;
  return (
    circleHitsRect(x, y, pipe.x, -HEIGHT, right, top) ||
    circleHitsRect(x, y, pipe.x, bottom, right, GROUND)
  );
}

export function collides(state) {
  if (state.y - BIRD_R <= 0 || state.y + BIRD_R >= GROUND) return true;
  return state.pipes.some((pipe) => hitsPipe(BIRD_X, state.y, pipe));
}

class Engine {
  constructor(width, saved, rng) {
    this.rng = rng;
    this.events = [];
    this.state = saved ? { ...saved, width, phase: "ready" } : newState(width);
  }

  flap() {
    const s = this.state;
    if (s.phase === "over") return;
    s.phase = "play";
    s.vy = FLAP;
    this.events.push("flap");
  }

  // A pause, a resume: the bird freezes until the next flap.
  hold() {
    if (this.state.phase === "play") this.state.phase = "ready";
  }

  setWidth(width) {
    this.state.width = width;
  }

  scroll(dt) {
    const s = this.state;
    const step = SPEED * dt;
    s.dist += step;
    s.nextIn -= step;
    s.pipes.forEach((pipe) => (pipe.x -= step));
    s.pipes = s.pipes.filter((pipe) => pipe.x + PIPE_W > -2);
    if (s.nextIn <= 0) {
      s.pipes.push({ x: s.width + 2, gap: randomGap(this.rng), scored: false });
      s.nextIn += SPACING;
    }
    s.pipes
      .filter((pipe) => !pipe.scored && pipe.x + PIPE_W < BIRD_X)
      .forEach((pipe) => {
        pipe.scored = true;
        s.score += 1;
        this.events.push("point");
      });
  }

  fall(dt) {
    const s = this.state;
    s.vy = Math.min(MAX_FALL, s.vy + GRAVITY * dt);
    s.y += s.vy * dt;
  }

  tick(dt) {
    const s = this.state;
    if (s.phase === "ready") return;
    if (s.phase === "over") return this.die(dt);
    this.fall(dt);
    this.scroll(dt);
    if (collides(s)) {
      s.phase = "over";
      this.events.push("hit");
    }
  }

  // After a hit the bird drops to the ground, then the match ends.
  die(dt) {
    const s = this.state;
    if (s.dying >= DYING) return;
    s.dying += dt;
    this.fall(dt);
    s.y = Math.min(s.y, GROUND - BIRD_R);
    if (s.dying >= DYING) this.events.push("end");
  }

  drain() {
    return this.events.splice(0);
  }

  snapshot() {
    const s = this.state;
    if (s.phase === "over") return null;
    return { ...s, pipes: s.pipes.map((pipe) => ({ ...pipe })) };
  }
}

export const createEngine = ({ width, saved = null, rng = Math.random }) =>
  new Engine(width, saved, rng);
