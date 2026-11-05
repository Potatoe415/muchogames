// The match on screen: live preview, play / swap / pass / hint, the
// computer's turns in solo and the "pass the device" screen between
// players. Editing the draft lives in edit.js.
import { chooseMove, hintMoves } from "./ai.js";
import { createBoardView } from "./board-view.js";
import { define } from "./define.js";
import { combineDictionaries } from "./dict.js";
import { draftAt, draftTiles } from "./draft.js";
import { makeJuniorDraw } from "./easy-draw.js";
import { createEditor } from "./edit.js";
import {
  canSwap,
  passTurn,
  playTiles,
  swapOne,
  swapTiles,
  unseenLetters
} from "./game.js";
import { lastMoveLine, renderHud } from "./hud.js";
import { bindInput } from "./input.js";
import { bindKeys } from "./keys.js";
import { createRackView } from "./rack-view.js";
import { analyzeMove, invalidWords, wordsAt } from "./rules.js";
import { JUNIOR } from "./tiles.js";

const BOT_DELAY_MS = 750;
const HINTS_PER_TURN = 5;

// hinted: a hint was used this turn. `score` is what the word is worth
// (shown on the board and the guide). Playing still awards 0.
function computePreview(game, draft, dict, hinted) {
  if (!draft.length) return { tone: "idle" };
  const analysis = analyzeMove(game.board, draftTiles(draft));
  if (analysis.error) return { tone: "error", error: analysis.error };
  const bad = invalidWords(analysis, dict);
  const tone = bad.length ? "bad" : "ok";
  return { tone, bad, analysis, score: analysis.score, hinted };
}

function lastCells(game) {
  const last = game.history.at(-1);
  return new Set(last?.kind === "play" ? last.cells : []);
}

// opts: { els, game, draft, config, names(), langs (word languages), dicts
//         (one per word language), t, hints(), hintsUsed (this turn's, from
//         the save), keysActive(), dialogs, sound, onSave(), onEnd(game) }
export function createPlay(opts) {
  const { els, game, config, t, dialogs, sound } = opts;
  const dict = combineDictionaries(opts.dicts);
  const solo = config.players === 1;
  // Junior level: the Hint button is always there and suggests short words;
  // the child's draws are friendlier (easy-draw.js).
  const junior = solo && config.level === "junior";
  const juniorDraw = junior ? makeJuniorDraw(dict) : undefined;
  const s = {
    draft: opts.draft || [],
    cursor: null,
    selected: -1,
    thinking: false,
    hidden: false,
    lookup: false,
    freeSwapUsed: false,
    // This turn's hints: the list (computed on the first tap, again after
    // the rack changes), the next one to show, how many were shown. Any
    // hint used makes this turn's move score 0.
    hints: { list: null, next: 0, used: opts.hintsUsed || 0 },
    notice: "",
    preview: { tone: "idle" },
    timer: 0
  };
  const board = createBoardView(els.board);
  const rack = createRackView(els.rack);

  const humanTurn = () => !game.over && (!solo || game.turn === 0);
  const canAct = () =>
    humanTurn() && !s.thinking && !s.hidden && !dialogs.isOpen();
  const myRack = () => game.racks[game.turn];

  function refresh() {
    s.preview = computePreview(game, s.draft, dict, s.hints.used > 0);
    board.paint({
      board: game.board,
      draft: s.draft,
      last: s.draft.length ? new Set() : lastCells(game),
      cursor: canAct() && !s.lookup ? s.cursor : null,
      preview: s.preview
    });
    rack.paint({
      rack: solo ? game.racks[0] : myRack(),
      draft: s.draft,
      selected: s.selected,
      hidden: s.hidden || game.over !== null
    });
    const names = opts.names();
    const hints = opts.hints() || junior;
    const ctx = { game, names, t, solo, junior, hints };
    renderHud(s, { ...ctx, canAct: canAct(), hintsLeft: hintsLeft() });
  }

  function changed() {
    s.notice = "";
    refresh();
    opts.onSave();
  }

  const edit = createEditor({
    s,
    game,
    myRack,
    canAct,
    dialogs,
    sound,
    changed,
    refresh,
    focusCell: board.focusCell
  });

  function afterMove() {
    Object.assign(s, { draft: [], cursor: null, selected: -1 });
    s.freeSwapUsed = false;
    s.hints = { list: null, next: 0, used: 0 };
    if (game.over) {
      refresh();
      return opts.onEnd(game);
    }
    if (solo && game.turn === 1) return botTurn();
    if (!solo) return handoff();
    changed();
  }

  function play() {
    if (!canAct() || s.preview.tone !== "ok") return false;
    const { analysis, hinted } = s.preview;
    const scored = hinted ? { ...analysis, score: 0 } : analysis;
    playTiles(game, draftTiles(s.draft), scored, juniorDraw);
    (analysis.bingo && !hinted ? sound.bingo : sound.play)();
    afterMove();
    return true;
  }

  function applyBot(move) {
    if (move.kind === "play") {
      playTiles(game, move.tiles, analyzeMove(game.board, move.tiles));
      sound.play();
    } else if (move.kind === "swap") swapTiles(game, move.letters);
    else passTurn(game);
  }

  function botTurn() {
    s.thinking = true;
    changed();
    s.timer = setTimeout(() => {
      const move = chooseMove({
        board: game.board,
        rack: game.racks[1],
        bagCount: game.bag.length,
        level: config.level,
        dict
      });
      s.thinking = false;
      applyBot(move);
      afterMove();
    }, BOT_DELAY_MS);
  }

  function handoff() {
    s.hidden = true;
    changed();
    const names = opts.names();
    const title = t("handoffTitle", { name: names[game.turn] });
    dialogs.handoff(title, lastMoveLine(game, names, t)).then((ok) => {
      if (!ok) return;
      s.hidden = false;
      refresh();
    });
  }

  // Hints left this turn: fewer when the rack has fewer distinct words.
  function hintsLeft() {
    const { list, next, used } = s.hints;
    const left = HINTS_PER_TURN - used;
    return list ? Math.min(left, list.length - next) : left;
  }

  // Each tap lays out the next best word, up to HINTS_PER_TURN per turn.
  function hint() {
    const h = s.hints;
    if (!canAct() || hintsLeft() <= 0) return;
    h.list ??= hintMoves(game.board, myRack(), dict, junior, HINTS_PER_TURN);
    const move = h.list[h.next];
    if (move) {
      h.next += 1;
      h.used += 1;
      return edit.layOut(move.tiles);
    }
    s.draft = [];
    s.notice = "noMove";
    refresh();
  }

  async function swapOrPass() {
    if (!canAct()) return;
    s.draft = [];
    refresh();
    const rules = {
      allowed: canSwap(game),
      max: game.bag.length,
      freeOne: JUNIOR && !s.freeSwapUsed
    };
    const choice = await dialogs.swapOrPass(myRack(), rules, t);
    if (!choice || game.over) return refresh();
    sound.tap();
    if (choice.keepTurn) {
      swapOne(game, choice.letters[0], juniorDraw);
      s.freeSwapUsed = true;
      Object.assign(s.hints, { list: null, next: 0 });
      return changed();
    }
    if (choice.kind === "swap") swapTiles(game, choice.letters, juniorDraw);
    else passTurn(game);
    afterMove();
  }

  function showBag() {
    if (dialogs.isOpen()) return;
    const viewer = solo ? 0 : game.turn;
    dialogs.showBag(unseenLetters(game, viewer), game.bag.length, t);
  }

  // Dictionary: the button arms a "tap a word" mode, open to every player
  // at any time (even during the computer's turn or after the end).
  function toggleLookup() {
    if (s.hidden || dialogs.isOpen()) return;
    s.lookup = !s.lookup;
    s.selected = -1;
    sound.tap();
    refresh();
  }

  // The language a board word belongs to: the first word language that has it.
  function wordLang(word) {
    const n = opts.dicts.findIndex((d) => d.has(word));
    return opts.langs[Math.max(0, n)];
  }

  function lookUpAt(i) {
    const words = wordsAt(game.board, draftTiles(s.draft), i);
    if (!words.length) return;
    s.lookup = false;
    refresh();
    const items = words.map((word) => {
      const lang = wordLang(word);
      return { word, lang, entry: define(word, lang) };
    });
    dialogs.showDefinitions(items, t, opts.langs.length > 1);
  }

  const unbindInput = bindInput(els, {
    canDrag: () => canAct() && !s.lookup,
    slotOf: (i) => draftAt(s.draft, i)?.k ?? -1,
    onRackTap: (k) => {
      s.lookup = false;
      edit.onRackTap(k);
    },
    onCellTap: (i) => (s.lookup ? lookUpAt(i) : edit.onCellTap(i)),
    onDrop: edit.onDrop
  });
  const unbindKeys = bindKeys({
    active: () => canAct() && opts.keysActive(),
    typeLetter: edit.typeLetter,
    backspace: edit.backspace,
    moveCursor: edit.moveCursor,
    play,
    recall: edit.recall
  });

  function start() {
    board.relabel(t);
    if (game.over) return refresh();
    if (solo && game.turn === 1) return botTurn();
    if (!solo) return handoff();
    refresh();
  }

  function destroy() {
    clearTimeout(s.timer);
    dialogs.closeAll();
    unbindInput();
    unbindKeys();
  }

  start();
  return {
    actions: {
      play,
      recall: edit.recall,
      shuffle: edit.shuffle,
      hint,
      pass: swapOrPass,
      bag: showBag,
      define: toggleLookup
    },
    relabel: () => (board.relabel(t), refresh()),
    refresh,
    destroy,
    snapshot: () => ({ draft: s.draft, hintsUsed: s.hints.used })
  };
}
