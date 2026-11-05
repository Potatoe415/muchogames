// Editing the player's draft: tap a tile then a cell, tap a cell to set the
// typing cursor (tap again to turn it) then tap or type letters, drag tiles
// between the rack and the board, take tiles back, shuffle.
import * as D from "./draft.js";
import { isBoardEmpty } from "./rules.js";
import { BLANK, CENTER, LETTERS, SIZE, shuffle } from "./tiles.js";

// ctx: { s, game, myRack(), canAct(), dialogs, sound, changed(), refresh(),
//        focusCell(i) }
export function createEditor(ctx) {
  const { s, game, dialogs, sound } = ctx;
  const taken = (i) => game.board[i] || D.draftAt(s.draft, i);
  const tv = () => window.MuchogamesTv?.isOn();
  // TV: after a tile goes down the focus returns to the rack, and the next
  // tile picked jumps to the cursor, else the square after the last tile
  // put down (along its word), else the centre.
  const focusRack = () =>
    document
      .querySelector('[data-id="scrabble-rack"] button:not(:disabled)')
      ?.focus({ preventScroll: true });
  function boardTarget() {
    const { cursor } = s;
    if (cursor && !taken(cursor.i)) return cursor.i;
    if (cursor) {
      const next = D.nextFree(game.board, s.draft, cursor.i, cursor.dir);
      if (next >= 0) return next;
    }
    const [a, b] = s.draft.slice(-2);
    if (!a) return CENTER;
    const dir = b && Math.abs(b.i - a.i) >= SIZE ? 1 : 0;
    const next = D.nextFree(game.board, s.draft, (b || a).i, dir);
    return next < 0 ? (b || a).i : next;
  }

  function putDown(k, i, l) {
    s.draft = D.place(s.draft, k, i, l);
    s.selected = -1;
    sound.place();
    ctx.changed();
  }

  // Puts rack slot k on cell i (a blank asks for its letter first).
  function placeSlot(k, i, after) {
    const there = D.draftAt(s.draft, i);
    if (game.board[i] || (there && there.k !== k)) return void sound.invalid();
    const moving = s.draft.find((d) => d.k === k);
    if (ctx.myRack()[k] !== BLANK || moving) {
      putDown(k, i, moving ? moving.l : ctx.myRack()[k]);
      return void after?.();
    }
    dialogs.pickBlank().then((letter) => {
      if (!letter) return;
      putDown(k, i, letter.toLowerCase());
      after?.();
    });
  }

  function advanceCursor() {
    if (!s.cursor) return;
    const next = D.nextFree(game.board, s.draft, s.cursor.i, s.cursor.dir);
    s.cursor = next < 0 ? null : { i: next, dir: s.cursor.dir };
    ctx.refresh();
  }

  function onRackTap(k) {
    if (!ctx.canAct()) return;
    if (s.cursor && !taken(s.cursor.i))
      return placeSlot(k, s.cursor.i, advanceCursor);
    s.selected = s.selected === k ? -1 : k;
    sound.tap();
    ctx.refresh();
    // On a TV the remote goes straight to the board: OK on a square puts
    // the tile there.
    if (s.selected >= 0 && tv()) ctx.focusCell(boardTarget());
  }

  function onCellTap(i) {
    if (!ctx.canAct() || game.board[i]) return;
    const pending = D.draftAt(s.draft, i);
    if (pending) {
      s.draft = D.unplace(s.draft, pending.k);
      sound.tap();
      return ctx.changed();
    }
    if (s.selected >= 0)
      return placeSlot(s.selected, i, tv() ? focusRack : null);
    s.cursor = s.cursor?.i === i ? { i, dir: 1 - s.cursor.dir } : { i, dir: 0 };
    ctx.refresh();
  }

  function onDrop(k, target) {
    if (!ctx.canAct()) return;
    if (target.cell !== undefined) return placeSlot(k, target.cell);
    const rack = ctx.myRack();
    const moved = D.moveSlot(rack, D.unplace(s.draft, k), k, target.rack);
    game.racks[game.turn] = moved.rack;
    s.draft = moved.draft;
    s.selected = -1;
    ctx.changed();
  }

  function typeLetter(letter) {
    if (!LETTERS.includes(letter)) return void sound.invalid();
    if (!s.cursor && isBoardEmpty(game.board)) s.cursor = { i: CENTER, dir: 0 };
    if (s.cursor && taken(s.cursor.i)) advanceCursor();
    const pick = s.cursor && D.slotFor(ctx.myRack(), s.draft, letter);
    if (!pick) return void sound.invalid();
    putDown(pick.k, s.cursor.i, pick.l);
    advanceCursor();
  }

  function backspace() {
    const last = s.draft.at(-1);
    if (!last) return;
    s.draft = D.unplace(s.draft, last.k);
    s.cursor = { i: last.i, dir: s.cursor?.dir ?? 0 };
    ctx.changed();
  }

  // from: the focused board cell, if any (a TV remote lands on any cell).
  function moveCursor(dr, dc, from = s.cursor?.i ?? CENTER) {
    const r = Math.min(SIZE - 1, Math.max(0, Math.floor(from / SIZE) + dr));
    const c = Math.min(SIZE - 1, Math.max(0, (from % SIZE) + dc));
    s.cursor = { i: r * SIZE + c, dir: dr ? 1 : 0 };
    ctx.refresh();
    ctx.focusCell(s.cursor.i);
  }

  function recall() {
    if (!ctx.canAct() || !s.draft.length) return;
    s.draft = [];
    s.selected = -1;
    ctx.changed();
  }

  function shuffleRack() {
    if (!ctx.canAct() || s.draft.length) return;
    game.racks[game.turn] = shuffle(ctx.myRack());
    s.selected = -1;
    sound.tap();
    ctx.changed();
  }

  // Lays a whole move (a hint) out as the draft.
  function layOut(tiles) {
    s.draft = [];
    tiles.forEach(({ i, l }) => {
      const letter = l === l.toLowerCase() ? BLANK : l;
      const k = D.slotFor(ctx.myRack(), s.draft, letter)?.k;
      if (k !== undefined) s.draft = D.place(s.draft, k, i, l);
    });
    ctx.changed();
  }

  return {
    onRackTap,
    onCellTap,
    onDrop,
    typeLetter,
    backspace,
    moveCursor,
    recall,
    shuffle: shuffleRack,
    layOut
  };
}
