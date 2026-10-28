// One grid in play: values, pencil notes, undo history, hints and mistakes.
// `state` is plain JSON so store.js can save it as is.
import { PEERS, SIZE, UNITS, freeMask, indexes } from "./grid.js";

const HISTORY_LIMIT = 300;

export function newState(level, { puzzle, solution }) {
  return {
    level,
    puzzle,
    solution,
    values: puzzle.slice(),
    notes: new Array(SIZE).fill(0),
    hinted: new Array(SIZE).fill(0),
    seconds: 0,
    hints: 0,
    mistakes: 0
  };
}

export function createModel(state) {
  const history = [];
  const s = state;

  const isGiven = (i) => s.puzzle[i] !== 0;
  const isWrong = (i) => s.values[i] !== 0 && s.values[i] !== s.solution[i];
  const isWon = () => s.values.every((v, i) => v === s.solution[i]);
  const remaining = (v) => 9 - s.values.filter((x) => x === v).length;

  function snapshot(cells) {
    history.push(
      cells.map((i) => ({ i, v: s.values[i], n: s.notes[i], h: s.hinted[i] }))
    );
    if (history.length > HISTORY_LIMIT) history.shift();
  }

  function completedUnits(i) {
    return UNITS.filter(
      (unit) =>
        unit.includes(i) && unit.every((j) => s.values[j] === s.solution[j])
    );
  }

  function write(i, v) {
    const bit = 1 << v;
    const touched = PEERS[i].filter((p) => s.notes[p] & bit);
    snapshot([i, ...touched]);
    s.values[i] = v;
    s.notes[i] = 0;
    touched.forEach((p) => (s.notes[p] &= ~bit));
    if (isWrong(i)) s.mistakes++;
    return { wrong: isWrong(i), completed: completedUnits(i), won: isWon() };
  }

  function erase(i) {
    if (isGiven(i) || (!s.values[i] && !s.notes[i])) return false;
    snapshot([i]);
    s.values[i] = 0;
    s.notes[i] = 0;
    s.hinted[i] = 0;
    return true;
  }

  // Typing the digit a cell already holds clears it.
  function setValue(i, v) {
    if (isGiven(i)) return null;
    if (s.values[i] === v) return erase(i) ? { cleared: true } : null;
    return write(i, v);
  }

  function toggleNote(i, v) {
    if (isGiven(i) || s.values[i]) return false;
    snapshot([i]);
    s.notes[i] ^= 1 << v;
    return true;
  }

  function hintTarget(i) {
    if (i >= 0 && !isGiven(i) && s.values[i] !== s.solution[i]) return i;
    const open = indexes().filter((j) => s.values[j] !== s.solution[j]);
    return open.length ? open[Math.floor(Math.random() * open.length)] : -1;
  }

  function hint(selected) {
    const i = hintTarget(selected);
    if (i < 0) return null;
    const result = write(i, s.solution[i]);
    s.hinted[i] = 1;
    s.hints++;
    return { index: i, ...result };
  }

  function fillNotes() {
    const empty = indexes().filter((i) => !s.values[i]);
    snapshot(empty);
    empty.forEach((i) => (s.notes[i] = freeMask(s.values, i)));
    return empty.length > 0;
  }

  function undo() {
    const cells = history.pop();
    if (!cells) return -1;
    cells.forEach(({ i, v, n, h }) => {
      s.values[i] = v;
      s.notes[i] = n;
      s.hinted[i] = h;
    });
    return cells[0].i;
  }

  return {
    state: s,
    isGiven,
    isWrong,
    isWon,
    remaining,
    setValue,
    toggleNote,
    erase,
    hint,
    fillNotes,
    undo,
    canUndo: () => history.length > 0
  };
}
