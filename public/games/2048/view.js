// DOM board: 16 empty cells plus one element per tile, positioned with CSS
// variables so moves are plain transform transitions. A merge slides both
// tiles onto the same cell, then the survivor takes the new value and the
// other one is removed.
import { SIZE } from "./board.js";

// Keep in step with the tile transition in stage.css.
const SLIDE_MS = 130;
const PAD_RATIO = 0.03;
const MIN_SIZE = 120;

function place(el, index) {
  el.style.setProperty("--r", String(Math.floor(index / SIZE)));
  el.style.setProperty("--c", String(index % SIZE));
}

function setValue(el, value) {
  el.dataset.value = value > 2048 ? "big" : String(value);
  el.dataset.digits = String(String(value).length);
  el.firstChild.textContent = String(value);
}

function createTile() {
  const el = document.createElement("div");
  el.className = "t2-tile";
  const face = document.createElement("span");
  face.className = "t2-tile-face";
  el.append(face);
  return el;
}

function createCells() {
  return Array.from({ length: SIZE * SIZE }, (_, index) => {
    const cell = document.createElement("div");
    cell.className = "t2-cell";
    place(cell, index);
    return cell;
  });
}

function pop(el) {
  el.classList.remove("is-merged");
  void el.offsetWidth;
  el.classList.add("is-merged");
}

export function createView(board, host) {
  const layer = document.createElement("div");
  layer.className = "t2-tiles";
  board.replaceChildren(...createCells(), layer);
  const tiles = new Map();
  let pending = [];

  function later(run) {
    const task = { run, timer: 0 };
    task.timer = setTimeout(() => {
      pending = pending.filter((item) => item !== task);
      run();
    }, SLIDE_MS);
    pending.push(task);
  }

  // A new move finishes the previous animation at once.
  function flush() {
    const tasks = pending;
    pending = [];
    tasks.forEach((task) => {
      clearTimeout(task.timer);
      task.run();
    });
  }

  function absorb({ id, at }) {
    const el = tiles.get(id);
    if (!el) return;
    tiles.delete(id);
    el.classList.add("is-absorbed");
    place(el, at);
    later(() => el.remove());
  }

  function show(tile, index, change) {
    let el = tiles.get(tile.id);
    if (!el) {
      el = createTile();
      tiles.set(tile.id, el);
      place(el, index);
      setValue(el, tile.value);
      if (!change.instant && index === change.spawned) {
        el.classList.add("is-spawned");
      }
      layer.append(el);
      return;
    }
    place(el, index);
    if (change.merged.includes(tile.id)) {
      later(() => {
        setValue(el, tile.value);
        pop(el);
      });
    } else {
      setValue(el, tile.value);
    }
  }

  function render(cells, change = {}) {
    flush();
    const full = { merged: [], absorbed: [], spawned: -1, ...change };
    full.absorbed.forEach(absorb);
    const alive = new Set(cells.filter(Boolean).map((tile) => tile.id));
    for (const [id, el] of tiles) {
      if (!alive.has(id)) {
        el.remove();
        tiles.delete(id);
      }
    }
    cells.forEach((tile, index) => tile && show(tile, index, full));
  }

  function fit() {
    const size = Math.max(
      MIN_SIZE,
      Math.floor(Math.min(host.clientWidth, host.clientHeight))
    );
    const pad = size * PAD_RATIO;
    board.style.width = `${size}px`;
    board.style.height = `${size}px`;
    board.style.setProperty("--pad", `${pad}px`);
    board.style.setProperty("--cell", `${(size - pad * (SIZE + 1)) / SIZE}px`);
  }

  const observer = new ResizeObserver(fit);
  observer.observe(host);
  fit();

  return {
    render,
    destroy() {
      flush();
      observer.disconnect();
      board.replaceChildren();
    }
  };
}
