// The 7 column buttons and their 6 holes. A column is pressed by tap, click,
// Enter / Space or the digits 1-7; Left / Right move between columns (TV
// remote included: the buttons carry data-tv-keys="left right").
import { COLUMNS, ROWS, discAt } from "./rules.js";

const COLORS = { 1: "red", 2: "yellow" };

function buildColumn(col) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "c4-column";
  button.dataset.col = String(col);
  button.dataset.id = `connectfour-column-${col + 1}`;
  button.dataset.tvKeys = "left right";
  if (col === Math.floor(COLUMNS / 2)) button.dataset.tvFocus = "";
  for (let row = 0; row < ROWS; row += 1) {
    const cell = document.createElement("span");
    cell.className = "c4-cell";
    cell.dataset.id = `connectfour-cell-${col + 1}-${row + 1}`;
    cell.style.setProperty("--fall", String(ROWS - row));
    button.append(cell);
  }
  return button;
}

function onKey(event, columns, onDrop) {
  const col = Number(event.target.dataset?.col);
  if (!Number.isInteger(col)) return;
  const step = { ArrowLeft: -1, ArrowRight: 1 }[event.key];
  if (step) {
    event.preventDefault();
    columns[Math.min(COLUMNS - 1, Math.max(0, col + step))].focus();
  } else if (/^[1-7]$/.test(event.key)) {
    event.preventDefault();
    onDrop(Number(event.key) - 1);
  }
}

function paintColumn(button, match, col, newest) {
  const cells = button.children;
  for (let row = 0; row < ROWS; row += 1) {
    const cell = cells[row];
    const color = COLORS[discAt(match.board, col, row)];
    if (color) cell.dataset.disc = color;
    else delete cell.dataset.disc;
    const inLine = match.line.some(([c, r]) => c === col && r === row);
    cell.classList.toggle("c4-win", inLine);
    cell.classList.toggle("c4-new", newest === row);
  }
}

export function createBoard(root, { onDrop }) {
  const columns = Array.from({ length: COLUMNS }, (_, col) => buildColumn(col));
  root.replaceChildren(...columns);
  root.addEventListener("click", (event) => {
    const button = event.target.closest(".c4-column");
    if (button) onDrop(Number(button.dataset.col));
  });
  root.addEventListener("keydown", (event) => onKey(event, columns, onDrop));

  // `animate`: the last disc played falls into place.
  function render(match, { animate = false, label }) {
    const last = match.moves[match.moves.length - 1];
    columns.forEach((button, col) => {
      const newest = animate && col === last ? match.board[col].length - 1 : -1;
      paintColumn(button, match, col, newest);
      button.classList.toggle("c4-full", match.board[col].length === ROWS);
      button.setAttribute("aria-label", label(col, match.board[col].length));
    });
    root.dataset.turn = COLORS[match.turn];
    root.classList.toggle("c4-over", match.winner !== 0 || match.draw);
  }

  return { render };
}
