// DOM for the grid (nine 3×3 boxes of cell buttons) and the digit pad, and
// painting them from the model plus the UI selection.
import { SIZE, boxOf, colOf, rowOf } from "./grid.js";

const FLASH_MS = 700;
const DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

function el(tag, className, attrs = {}) {
  const node = document.createElement(tag);
  node.className = className;
  Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
  return node;
}

function buildCell(i) {
  const cell = el("button", "sd-cell", {
    type: "button",
    "data-index": i,
    "data-id": `sudoku-cell-${rowOf(i) + 1}-${colOf(i) + 1}`
  });
  const notes = el("span", "sd-notes", { "aria-hidden": "true" });
  DIGITS.forEach(() => notes.append(el("span", "sd-note")));
  cell.append(el("span", "sd-value", { "aria-hidden": "true" }), notes);
  return cell;
}

function buildBoard(board) {
  const boxes = DIGITS.map(() => el("div", "sd-box"));
  const cells = [];
  for (let i = 0; i < SIZE; i++) {
    cells.push(buildCell(i));
    boxes[boxOf(i)].append(cells[i]);
  }
  board.replaceChildren(...boxes);
  return cells;
}

function buildPad(pad) {
  const keys = DIGITS.map((d) => {
    const key = el("button", "sd-key", {
      type: "button",
      "data-digit": d,
      "data-id": `sudoku-pad-${d}`
    });
    key.append(el("span", "sd-key-digit"), el("span", "sd-key-left"));
    key.firstChild.textContent = d;
    return key;
  });
  pad.replaceChildren(...keys);
  return keys;
}

const sharesUnit = (a, b) =>
  rowOf(a) === rowOf(b) || colOf(a) === colOf(b) || boxOf(a) === boxOf(b);

function cellLabel(model, i, t) {
  const { values, notes } = model.state;
  const where = t("cellLabel", { row: rowOf(i) + 1, col: colOf(i) + 1 });
  if (values[i]) return `${where}, ${values[i]}`;
  const pencil = DIGITS.filter((d) => notes[i] & (1 << d)).join(" ");
  return `${where}, ${pencil ? t("cellNotes", { notes: pencil }) : t("cellEmpty")}`;
}

function paintCell(cell, i, model, view) {
  const { values, notes, hinted } = model.state;
  const { selected, focus, showErrors } = view;
  const c = cell.classList;
  c.toggle("is-given", model.isGiven(i));
  c.toggle("is-selected", i === selected);
  c.toggle("is-peer", selected >= 0 && i !== selected && sharesUnit(i, selected));
  c.toggle("is-same", focus > 0 && values[i] === focus);
  c.toggle("is-wrong", showErrors && model.isWrong(i));
  c.toggle("is-hinted", hinted[i] === 1);
  cell.firstChild.textContent = values[i] || "";
  [...cell.lastChild.children].forEach((note, k) => {
    const on = !values[i] && notes[i] & (1 << (k + 1));
    note.textContent = on ? k + 1 : "";
    note.classList.toggle("is-focus", Boolean(on) && k + 1 === focus);
  });
}

export function createView({ board, pad }) {
  const cells = buildBoard(board);
  const keys = buildPad(pad);

  function paint(model, ui, t) {
    const sel = ui.selected;
    const focus = ui.digit || (sel >= 0 && model.state.values[sel]) || 0;
    const view = { selected: sel, focus, showErrors: ui.showErrors };
    cells.forEach((cell, i) => {
      paintCell(cell, i, model, view);
      cell.setAttribute("aria-label", cellLabel(model, i, t));
    });
    keys.forEach((key, k) => {
      const left = model.remaining(k + 1);
      key.lastChild.textContent = left > 0 ? left : "";
      key.classList.toggle("is-done", left <= 0);
      key.classList.toggle("is-focus", focus === k + 1);
      key.setAttribute("aria-label", t("padLabel", { digit: k + 1, left }));
    });
  }

  function flash(units) {
    const lit = new Set(units.flat());
    lit.forEach((i) => cells[i].classList.add("is-flash"));
    setTimeout(
      () => lit.forEach((i) => cells[i].classList.remove("is-flash")),
      FLASH_MS
    );
  }

  return { paint, flash, focusCell: (i) => cells[i]?.focus({ preventScroll: true }) };
}
