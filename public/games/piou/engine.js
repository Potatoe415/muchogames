// Pure rules (no DOM): the bird, the pipes, collisions and the score, in
// world units. The world is HEIGHT units tall; its width follows the
// screen's aspect ratio, so a wide screen just shows more pipes ahead.
// Difficulty = the original Flappy Bird's (288x512 px, ground at 79%),
// converted at 1 px = 88 / 404.5 units: 100 px gap, 52 px pipes, 128 px/s
// scroll, ~147 px apart, flap rises 45 px in 0.3 s, gap within 20-80 % of
// the playfield. As there, the sky is no wall: the bird may rise a little
// above the screen (flaps stop working there) and only the ground kills.
export const HEIGHT = 100;
export const GROUND = 88; // top of the ground strip
export const BIRD_X = 16; // the bird never moves sideways (its centre)
export const BIRD_R = 2.6;
export const PIPE_W = 11.3;
export const GAP = 21.8;
const GRAVITY = 218; // units / s²
const FLAP = -65; // vertical speed right after a flap
const MAX_FALL = 65;
const SPEED = 28; // pipes scroll, units / s
const SPACING = 32; // distance between two pipes
const MARGIN = 17.5; // a gap never comes closer than this to sky or ground
export const CEILING = -10.4; // highest the top of the bird may be to flap
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
    nextIn: 41, // distance to scroll before the next pipe appears
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
  if (state.y + BIRD_R >= GROUND) return true;
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
    if (s.y - BIRD_R <= CEILING) return;
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
