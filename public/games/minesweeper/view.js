// DOM grid of cell buttons sized to fit the board host. Reads the model,
// never changes it.
import { FLAGGED, OPEN } from "./board.js";

const MIN_CELL = 14;
const MAX_CELL = 44;

function cellLabel(board, index, t) {
  const state = board.state[index];
  if (state === FLAGGED) return t("cellFlag");
  if (state !== OPEN) return t("cellHidden");
  if (board.mine[index]) return t("cellMine");
  return board.adjacent[index] ? String(board.adjacent[index]) : t("cellEmpty");
}

function paintCell(board, cell, index, t) {
  const state = board.state[index];
  const isOpen = state === OPEN;
  const count = isOpen && !board.mine[index] ? board.adjacent[index] : 0;
  cell.className = "ms-cell";
  cell.classList.toggle("is-open", isOpen);
  cell.classList.toggle("is-flag", state === FLAGGED);
  cell.classList.toggle("is-mine", isOpen && board.mine[index] === 1);
  if (count) cell.classList.add(`n${count}`);
  cell.textContent = count ? String(count) : "";
  cell.setAttribute("aria-label", cellLabel(board, index, t));
}

function buildGrid(board) {
  const grid = document.createElement("div");
  grid.className = "ms-grid";
  grid.dataset.id = "minesweeper-grid";
  grid.setAttribute("role", "grid");
  grid.style.gridTemplateColumns = `repeat(${board.cols}, var(--cell))`;
  const cells = [];
  for (let i = 0; i < board.rows * board.cols; i++) {
    const cell = document.createElement("button");
    cell.type = "button";
    cell.dataset.index = String(i);
    cell.dataset.id = `minesweeper-cell-${Math.floor(i / board.cols)}-${i % board.cols}`;
    cells.push(cell);
  }
  grid.append(...cells);
  return { grid, cells };
}

export function createView({ host, board, t }) {
  const { grid, cells } = buildGrid(board);
  host.replaceChildren(grid);

  function fit() {
    const style = getComputedStyle(host);
    const padX = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
    const padY = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
    const fitW = (host.clientWidth - padX - 8) / board.cols;
    const fitH = (host.clientHeight - padY - 8) / board.rows;
    const size = Math.floor(Math.min(fitW, fitH, MAX_CELL));
    grid.style.setProperty("--cell", `${Math.max(MIN_CELL, size)}px`);
  }

  const observer = new ResizeObserver(fit);
  observer.observe(host);

  function update(indices) {
    indices.forEach((i) => paintCell(board, cells[i], i, t));
  }

  function relabel() {
    cells.forEach((cell, i) => {
      cell.setAttribute("aria-label", cellLabel(board, i, t));
    });
  }

  // End of match: a loss shows every mine and wrong flag, a win flags
  // every mine.
  function revealEnd(won) {
    cells.forEach((cell, i) => {
      const mine = board.mine[i] === 1;
      const flagged = board.state[i] === FLAGGED;
      if (won && mine) cell.classList.add("is-flag");
      if (!won && mine && !flagged) cell.classList.add("is-open", "is-mine");
      if (!won && flagged && !mine) cell.classList.add("is-wrong");
    });
    if (board.exploded >= 0) cells[board.exploded].classList.add("is-exploded");
    grid.classList.add("is-over");
  }

  cells.forEach((cell, i) => paintCell(board, cell, i, t));
  fit();

  return {
    update,
    relabel,
    revealEnd,
    destroy() {
      observer.disconnect();
      host.replaceChildren();
    }
  };
}
