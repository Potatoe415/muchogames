// Dual-ray wall: from the tapped cell, ray 1 grows left/up and ray 2
// right/down along the active axis. Each ray stops on its own when it meets
// a solid cell. `pivot` is the grid line where the rays start. A wall
// launched while another one grows has a single ray (`dir` -1 or 1), like
// the original game.
import { EMPTY, GROW_1, GROW_2, SOLID, cellAt } from "./grid.js";
import { WALL_SPEED } from "./levels.js";

const createRay = (dir) => ({
  kind: dir < 0 ? GROW_1 : GROW_2,
  dir,
  length: 0,
  cells: [],
  blockedBy: -1,
  growing: true,
  finished: false,
  broken: false
});

export function createWall(x, y, axis, dir) {
  const horizontal = axis === "h";
  const along = horizontal ? x : y;
  return {
    axis,
    pivot: dir > 0 ? along : along + 1,
    lane: horizontal ? y : x,
    age: 0,
    solidified: false,
    rays: dir ? [createRay(dir)] : [createRay(-1), createRay(1)]
  };
}

// Direction (-1 left/up, 1 right/down) of the closest solid cell from
// (x, y) along the axis; ties go left/up.
export function nearestDirection(grid, x, y, axis) {
  const step = (d) => (axis === "h" ? [x + d, y] : [x, y + d]);
  for (let k = 1; ; k++) {
    if (cellAt(grid, ...step(-k)) === SOLID) return -1;
    if (cellAt(grid, ...step(k)) === SOLID) return 1;
  }
}

function cellIndex(grid, wall, ray, k) {
  const along = ray.dir < 0 ? wall.pivot - 1 - k : wall.pivot + k;
  return wall.axis === "h"
    ? wall.lane * grid.cols + along
    : along * grid.cols + wall.lane;
}

// Advances every growing ray. Returns how many cells were claimed. A ray
// that meets a solid cell snaps to its claimed length and is marked
// `finished`: the caller checks it against the balls, then solidifies it.
// A ray that meets another wall's growing ray waits until that cell turns
// solid (it then finishes) or breaks (it goes on).
export function growWall(grid, wall, dt) {
  let claimed = 0;
  wall.age += dt;
  wall.rays.forEach((ray) => {
    if (!ray.growing) return;
    ray.length += WALL_SPEED * dt;
    ray.blockedBy = -1;
    while (ray.length > ray.cells.length) {
      const index = cellIndex(grid, wall, ray, ray.cells.length);
      const next = grid.cells[index];
      if (next !== EMPTY) {
        ray.length = ray.cells.length;
        if (next !== SOLID) {
          ray.blockedBy = index;
          return;
        }
        ray.growing = false;
        ray.finished = true;
        return;
      }
      grid.cells[index] = ray.kind;
      ray.cells.push(index);
      claimed += 1;
    }
  });
  return claimed;
}

// Live extent of a ray in grid coordinates.
export function rayRect(wall, ray) {
  const lo = ray.dir < 0 ? wall.pivot - ray.length : wall.pivot;
  const hi = ray.dir < 0 ? wall.pivot : wall.pivot + ray.length;
  return wall.axis === "h"
    ? { x0: lo, y0: wall.lane, x1: hi, y1: wall.lane + 1 }
    : { x0: wall.lane, y0: lo, x1: wall.lane + 1, y1: hi };
}

export const isLive = (ray) => ray.growing || ray.finished;

export function breakRay(grid, ray) {
  ray.cells.forEach((index) => (grid.cells[index] = EMPTY));
  ray.growing = false;
  ray.finished = false;
  ray.broken = true;
}

export const wallOver = (wall) => !wall.rays.some(isLive);

// Two rays on the same line that ran into each other wait on each other
// forever: they now form one complete wall, so both finish.
export function joinHeadOn(walls) {
  const waiting = walls
    .flatMap((wall) => wall.rays)
    .filter((ray) => ray.growing && ray.blockedBy >= 0);
  waiting.forEach((a) => {
    const b = waiting.find(
      (other) =>
        other !== a &&
        other.cells.includes(a.blockedBy) &&
        a.cells.includes(other.blockedBy)
    );
    if (!b) return;
    [a, b].forEach((ray) => {
      ray.growing = false;
      ray.finished = true;
    });
  });
}

export function cancelWall(grid, wall) {
  wall.rays.forEach((ray) => breakRay(grid, ray));
}
