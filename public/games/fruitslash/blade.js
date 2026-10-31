// The blade: the recent path of the finger, mouse or keyboard cursor, in
// CSS pixels. Each new point yields the segment the game tests for cuts;
// the points fade out after TRAIL_LIFE seconds (render.js draws them).
const TRAIL_LIFE = 0.2;
const MIN_STEP = 3;

export function createBlade() {
  let points = [];
  let active = false;

  return {
    get points() {
      return points;
    },
    get active() {
      return active;
    },
    start(x, y, now) {
      active = true;
      points.push({ x, y, t: now, first: true });
    },
    // The segment from the previous point, or null if the blade is up or
    // has barely moved.
    add(x, y, now) {
      const last = points[points.length - 1];
      if (!active || !last) return null;
      if (Math.hypot(x - last.x, y - last.y) < MIN_STEP) return null;
      const point = { x, y, t: now, first: false };
      points.push(point);
      return [last, point];
    },
    end() {
      active = false;
    },
    // A held, still blade keeps its last point so the next move still cuts.
    prune(now) {
      const fresh = points.findIndex((p) => now - p.t <= TRAIL_LIFE);
      const stale = active ? points.length - 1 : points.length;
      points = points.slice(Math.max(0, fresh === -1 ? stale : fresh));
      if (points[0]) points[0] = { ...points[0], first: true };
    },
    clear() {
      points = [];
      active = false;
    }
  };
}

export const TRAIL_SECONDS = TRAIL_LIFE;
