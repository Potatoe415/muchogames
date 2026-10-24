// Dual-ray wall: from the tapped cell, ray 1 grows left/up and ray 2
// right/down along the active axis. Each ray stops on its own when it meets
// a solid cell. `pivot` is the grid line between the two rays.
import { EMPTY, GROW_1, GROW_2 } from "./grid.js";
import { WALL_SPEED } from "./levels.js";

export function createWall(x, y, axis) {
  const horizontal = axis === "h";
  const ray = (kind, dir) => ({
    kind,
    dir,
    length: 0,
    cells: [],
    growing: true,
    finished: false,
    broken: false
  });
  return {
    axis,
    pivot: (horizontal ? x : y) + 1,
    lane: horizontal ? y : x,
    age: 0,
    solidified: false,
    rays: [ray(GROW_1, -1), ray(GROW_2, 1)]
  };
}

function cellIndex(grid, wall, ray, k) {
  const along = ray.dir < 0 ? wall.pivot - 1 - k : wall.pivot + k;
  return wall.axis === "h"
    ? wall.lane * grid.cols + along
    : along * grid.cols + wall.lane;
}

// Advances every growing ray. Returns how many cells were claimed. A ray
// that meets a non-empty cell snaps to its claimed length and is marked
// `finished`: the caller checks it against the balls, then solidifies it.
export function growWall(grid, wall, dt) {
  let claimed = 0;
  wall.age += dt;
  wall.rays.forEach((ray) => {
    if (!ray.growing) return;
    ray.length += WALL_SPEED * dt;
    while (ray.length > ray.cells.length) {
      const index = cellIndex(grid, wall, ray, ray.cells.length);
      if (grid.cells[index] !== EMPTY) {
        ray.length = ray.cells.length;
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

export function cancelWall(grid, wall) {
  wall.rays.forEach((ray) => breakRay(grid, ray));
}
