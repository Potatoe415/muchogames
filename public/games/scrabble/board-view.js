// The board (15×15, or 11×11 in Junior): one <button> per cell (data-id
// "scrabble-cell-h8": column letter + row number), repainted in place. Shows
// played tiles, the draft, the last move, the typing cursor and the live
// score bubble. Junior tiles carry no value, coloured squares show points.
import { draftAt } from "./draft.js";
import {
  CELLS,
  CENTER,
  colorPoints,
  JUNIOR,
  PREMIUM,
  SIZE,
  tileValue
} from "./tiles.js";

const PREMIUM_KEY = { T: "premTW", D: "premDW", t: "premTL", d: "premDL" };

function premiumLabel(p, i, t) {
  if (p === "*") return "★";
  return JUNIOR ? String(colorPoints(i)) : t(PREMIUM_KEY[p]);
}

export const cellName = (i) =>
  `${String.fromCharCode(97 + (i % SIZE))}${Math.floor(i / SIZE) + 1}`;

export function tileHtml(letter) {
  const blank = letter === "?" || letter !== letter.toUpperCase();
  const face = letter === "?" ? "" : letter.toUpperCase();
  const value = blank || JUNIOR ? "" : tileValue(letter);
  return `<span class="sc-tile${blank ? " is-blank" : ""}"><b>${face}</b><small>${value}</small></span>`;
}

function makeCell(i) {
  const cell = document.createElement("button");
  cell.type = "button";
  cell.className = "sc-cell";
  cell.tabIndex = -1;
  cell.dataset.cell = String(i);
  cell.dataset.id = `scrabble-cell-${cellName(i)}`;
  if (PREMIUM[i] !== ".") cell.dataset.premium = PREMIUM[i];
  return cell;
}

export function createBoardView(host) {
  const cells = Array.from({ length: CELLS }, (_, i) => makeCell(i));
  const shown = Array(CELLS).fill(null);
  host.replaceChildren(...cells);
  host.style.setProperty("--size", String(SIZE));
  host.classList.toggle("is-junior", JUNIOR);

  function relabel(t) {
    cells.forEach((cell, i) => {
      const p = PREMIUM[i];
      if (p !== ".") cell.dataset.label = premiumLabel(p, i, t);
    });
  }

  function paintCell(i, letter, state) {
    const cell = cells[i];
    if (shown[i] !== letter) {
      cell.innerHTML = letter ? tileHtml(letter) : "";
      shown[i] = letter;
    }
    cell.classList.toggle("is-filled", Boolean(letter));
    cell.classList.toggle("is-draft", state.draft);
    cell.classList.toggle("is-last", state.last);
    cell.setAttribute(
      "aria-label",
      `${cellName(i).toUpperCase()} ${letter ? letter.toUpperCase() : ""}`.trim()
    );
  }

  function paintCursor(cursor) {
    cells.forEach((cell, i) => {
      const on = cursor?.i === i;
      cell.classList.toggle("is-cursor", on);
      cell.dataset.dir = on ? (cursor.dir ? "down" : "across") : "";
      cell.tabIndex = on || (!cursor && i === CENTER) ? 0 : -1;
    });
  }

  function paintScore(draft, preview) {
    const tip =
      preview.tone === "ok" || preview.tone === "bad" ? draft.at(-1) : null;
    cells.forEach((cell, i) => {
      const on = tip?.i === i;
      cell.classList.toggle("has-score", on);
      cell.dataset.score = on ? String(preview.score) : "";
      cell.dataset.tone = on ? preview.tone : "";
    });
  }

  // { board, draft, last: Set<cell>, cursor: { i, dir } | null, preview }
  function paint({ board, draft, last, cursor, preview }) {
    for (let i = 0; i < CELLS; i++) {
      const pending = draftAt(draft, i);
      paintCell(i, board[i] || pending?.l || "", {
        draft: Boolean(pending),
        last: last.has(i)
      });
    }
    paintCursor(cursor);
    paintScore(draft, preview);
  }

  const focusCell = (i) => cells[i]?.focus({ preventScroll: true });

  return { paint, relabel, focusCell };
}
