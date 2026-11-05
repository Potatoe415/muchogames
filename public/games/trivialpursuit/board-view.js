// Board on screen: a static SVG drawing, one pawn per player (a little pie
// showing its wedges) and, while moving, one button per reachable space.
import {
  CATS,
  HUB,
  RING,
  ROLL,
  angleOf,
  catOf,
  cellPos,
  kindOf,
  polar
} from "./board.js";

export const CAT_COLORS = [
  "#2f7de1",
  "#e5408f",
  "#f5c518",
  "#8e44ad",
  "#2e9e57",
  "#f08a24"
];
export const PAWN_COLORS = [
  "#111827",
  "#dc2626",
  "#0891b2",
  "#92400e",
  "#4b5563",
  "#be185d"
];
const ROLL_FILL = "#eef1f6";
const STEP_MS = 140;
const HALF = 180 / RING;

const pt = ({ x, y }) => `${x.toFixed(2)} ${y.toFixed(2)}`;

function sector(r0, r1, a0, a1) {
  const big = a1 - a0 > 180 ? 1 : 0;
  return (
    `M${pt(polar(r1, a0))}A${r1} ${r1} 0 ${big} 1 ${pt(polar(r1, a1))}` +
    `L${pt(polar(r0, a1))}A${r0} ${r0} 0 ${big} 0 ${pt(polar(r0, a0))}Z`
  );
}

function slice(cx, cy, r, a0, a1) {
  const p = (a) => {
    const rad = (a * Math.PI) / 180;
    return `${(cx + r * Math.cos(rad)).toFixed(2)} ${(cy + r * Math.sin(rad)).toFixed(2)}`;
  };
  return `M${cx} ${cy}L${p(a0)}A${r} ${r} 0 0 1 ${p(a1)}Z`;
}

const fillOf = (id) => (catOf(id) === ROLL ? ROLL_FILL : CAT_COLORS[catOf(id)]);

function ringCell(i) {
  const a = angleOf(i);
  const hq = kindOf(i) === "hq";
  const d = sector(
    hq ? 37.4 : 39.4,
    hq ? 48.6 : 46.6,
    a - HALF + 0.3,
    a + HALF - 0.3
  );
  return `<path d="${d}" fill="${fillOf(i)}"/>`;
}

function spokeCell(id) {
  const c = cellPos(id);
  const k = Math.floor((id - RING) / 5);
  const a = (angleOf(k * 7) * Math.PI) / 180;
  const ux = Math.cos(a) * 2.8;
  const uy = Math.sin(a) * 2.8;
  const vx = -Math.sin(a) * 3;
  const vy = Math.cos(a) * 3;
  const corners = [
    [ux + vx, uy + vy],
    [ux - vx, uy - vy],
    [-ux - vx, -uy - vy],
    [-ux + vx, -uy + vy]
  ].map(([dx, dy]) => `${(c.x + dx).toFixed(2)},${(c.y + dy).toFixed(2)}`);
  return `<polygon points="${corners.join(" ")}" fill="${fillOf(id)}"/>`;
}

function marks() {
  let out = "";
  for (let id = 0; id < RING; id += 1) {
    const { x, y } = cellPos(id);
    if (kindOf(id) === "roll") {
      out += `<rect x="${(x - 1.5).toFixed(2)}" y="${(y - 1.5).toFixed(2)}" width="3" height="3" rx="0.6" fill="#fff" stroke="#6b7280" stroke-width="0.3"/>`;
      out += `<circle cx="${(x - 0.6).toFixed(2)}" cy="${(y - 0.6).toFixed(2)}" r="0.36" fill="#374151"/><circle cx="${(x + 0.6).toFixed(2)}" cy="${(y + 0.6).toFixed(2)}" r="0.36" fill="#374151"/>`;
    } else if (kindOf(id) === "hq") {
      out += `<circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="1.9" fill="none" stroke="#fff" stroke-width="0.6"/>`;
    }
  }
  return out;
}

function hub() {
  let out = "";
  for (let k = 0; k < CATS; k += 1) {
    const a = angleOf(k * 7);
    out += `<path d="${slice(50, 50, 8.6, a - 30, a + 30)}" fill="${CAT_COLORS[k]}" stroke="#1f2a44" stroke-width="0.5"/>`;
  }
  return `${out}<circle cx="50" cy="50" r="2.6" fill="#fff"/>`;
}

function boardSvg() {
  let cells = "";
  for (let id = 0; id < HUB; id += 1) {
    cells += id < RING ? ringCell(id) : spokeCell(id);
  }
  return (
    `<svg class="tp-board-svg" viewBox="0 0 100 100" aria-hidden="true">` +
    `<circle cx="50" cy="50" r="49.6" fill="#1f2a44"/>${cells}${marks()}${hub()}</svg>`
  );
}

export function pawnSvg(wedges, color) {
  let out = `<svg viewBox="-10 -10 20 20" aria-hidden="true"><circle r="9" fill="#fff" stroke="${color}" stroke-width="2.2"/>`;
  for (let k = 0; k < CATS; k += 1) {
    const a = angleOf(k * 7);
    const fill = wedges[k] ? CAT_COLORS[k] : "#e5e7eb";
    out += `<path d="${slice(0, 0, 6.6, a - 30, a + 30)}" fill="${fill}" stroke="#fff" stroke-width="0.6"/>`;
  }
  return `${out}</svg>`;
}

export function cellLabel(id, t) {
  if (id === HUB) return t("cellHub");
  if (kindOf(id) === "roll") return t("cellRoll");
  const cat = t(`cat${catOf(id)}`);
  return kindOf(id) === "hq" ? t("cellHq", { cat }) : cat;
}

const place = (el, { x, y }) => {
  el.style.left = `${x}%`;
  el.style.top = `${y}%`;
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function syncPawns(view, count) {
  if (view.pawns.length === count) return;
  view.pawnLayer.innerHTML = "";
  view.pawns = Array.from({ length: count }, (_, i) => {
    const el = document.createElement("div");
    el.className = "tp-pawn";
    el.dataset.id = `trivialpursuit-pawn-${i + 1}`;
    view.pawnLayer.append(el);
    return el;
  });
}

function renderPawns(view, state) {
  syncPawns(view, state.players.length);
  state.players.forEach((p, i) => {
    const el = view.pawns[i];
    el.innerHTML = pawnSvg(p.wedges, PAWN_COLORS[i]);
    el.classList.toggle("is-current", i === state.cur);
    place(el, spread(state, i));
  });
}

function renderTargets(view, map, onPick) {
  view.targetLayer.innerHTML = "";
  [...map.keys()].forEach((id) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "tp-target";
    button.dataset.id = `trivialpursuit-target-${id}`;
    // Arrows cycle through the targets (moveFocus), on a TV too.
    button.dataset.tvKeys = "left right up down";
    button.setAttribute("aria-label", cellLabel(id, view.t));
    place(button, cellPos(id));
    button.addEventListener("click", () => onPick(id));
    view.targetLayer.append(button);
  });
}

async function animatePawn(view, index, path) {
  const el = view.pawns[index];
  el.classList.add("is-moving");
  for (const id of path) {
    place(el, cellPos(id));
    await wait(STEP_MS);
  }
  el.classList.remove("is-moving");
}

export function createBoardView(boardEl, t) {
  boardEl.innerHTML = `${boardSvg()}<div class="tp-pawns"></div><div class="tp-targets" data-id="trivialpursuit-targets"></div>`;
  const view = {
    t,
    pawns: [],
    pawnLayer: boardEl.querySelector(".tp-pawns"),
    targetLayer: boardEl.querySelector(".tp-targets")
  };
  view.targetLayer.addEventListener("keydown", (event) =>
    moveFocus(view.targetLayer, event)
  );
  return {
    render: (state) => renderPawns(view, state),
    showTargets: (map, onPick) => renderTargets(view, map, onPick),
    clearTargets: () => {
      view.targetLayer.innerHTML = "";
    },
    animate: (index, path) => animatePawn(view, index, path),
    focusTarget: () => view.targetLayer.querySelector("button")?.focus()
  };
}

// Several pawns on one space sit around its centre.
function spread(state, index) {
  const pos = state.players[index].pos;
  const group = state.players.flatMap((p, i) => (p.pos === pos ? [i] : []));
  const c = cellPos(pos);
  if (group.length < 2) return c;
  const a = (group.indexOf(index) / group.length) * 2 * Math.PI;
  return { x: c.x + 2.6 * Math.cos(a), y: c.y + 2.6 * Math.sin(a) };
}

const KEYS = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };

function moveFocus(layer, event) {
  const step = KEYS[event.key];
  if (!step) return;
  const buttons = [...layer.querySelectorAll("button")];
  const at = buttons.indexOf(document.activeElement);
  const next = buttons[(at + step + buttons.length) % buttons.length];
  if (!next) return;
  event.preventDefault();
  next.focus();
}
