// The match on screen: live preview, play / swap / pass / hint, the
// computer's turns in solo and the "pass the device" screen between two
// players. Editing the draft lives in edit.js.
import { bestMove, chooseMove } from "./ai.js";
import { createBoardView } from "./board-view.js";
import { define } from "./define.js";
import { draftAt, draftTiles } from "./draft.js";
import { createEditor } from "./edit.js";
import {
  canSwap,
  passTurn,
  playTiles,
  swapTiles,
  unseenLetters
} from "./game.js";
import { lastMoveLine, renderHud } from "./hud.js";
import { bindInput } from "./input.js";
import { bindKeys } from "./keys.js";
import { createRackView } from "./rack-view.js";
import { analyzeMove, invalidWords, wordsAt } from "./rules.js";

const BOT_DELAY_MS = 750;

function computePreview(game, draft, dict) {
  if (!draft.length) return { tone: "idle" };
  const analysis = analyzeMove(game.board, draftTiles(draft));
  if (analysis.error) return { tone: "error", error: analysis.error };
  const bad = invalidWords(analysis, dict);
  const tone = bad.length ? "bad" : "ok";
  return { tone, bad, analysis, score: analysis.score };
}

function lastCells(game) {
  const last = game.history.at(-1);
  return new Set(last?.kind === "play" ? last.cells : []);
}

// opts: { els, game, draft, config, names(), langs, dicts (one per player),
//         t, hints(), keysActive(), dialogs, sound, onSave(), onEnd(game) }
export function createPlay(opts) {
  const { els, game, config, t, dialogs, sound } = opts;
  const dict = () => opts.dicts[game.turn];
  const solo = config.mode === "solo";
  const s = {
    draft: opts.draft || [],
    cursor: null,
    selected: -1,
    thinking: false,
    hidden: false,
    lookup: false,
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
    s.preview = computePreview(game, s.draft, dict());
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
    const hints = opts.hints();
    const { langs } = opts;
    renderHud(s, { game, names, langs, t, solo, canAct: canAct(), hints });
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
    const { analysis } = s.preview;
    playTiles(game, draftTiles(s.draft), analysis);
    (analysis.bingo ? sound.bingo : sound.play)();
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
        dict: dict()
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
    const name = names[game.turn];
    const lang = opts.langs[game.turn];
    const title =
      opts.langs[0] === opts.langs[1]
        ? t("handoffTitle", { name })
        : t("handoffTitleLang", { name, lang: t(`lang_${lang}`) });
    dialogs.handoff(title, lastMoveLine(game, names, t)).then((ok) => {
      if (!ok) return;
      s.hidden = false;
      refresh();
    });
  }

  function hint() {
    if (!canAct()) return;
    const move = bestMove(game.board, myRack(), dict());
    if (move) return edit.layOut(move.tiles);
    s.draft = [];
    s.notice = "noMove";
    refresh();
  }

  async function swapOrPass() {
    if (!canAct()) return;
    s.draft = [];
    refresh();
    const choice = await dialogs.swapOrPass(myRack(), canSwap(game), t);
    if (!choice || game.over) return refresh();
    if (choice.kind === "swap") swapTiles(game, choice.letters);
    else passTurn(game);
    sound.tap();
    afterMove();
  }

  function showBag() {
    if (dialogs.isOpen()) return;
    const viewer = solo ? 0 : game.turn;
    dialogs.showBag(unseenLetters(game, viewer), game.bag.length, t);
  }

  // Dictionary: the button arms a "tap a word" mode, open to both players
  // at any time (even during the computer's turn or after the end).
  function toggleLookup() {
    if (s.hidden || dialogs.isOpen()) return;
    s.lookup = !s.lookup;
    s.selected = -1;
    sound.tap();
    refresh();
  }

  // The language a board word belongs to: the current player's if valid there.
  function wordLang(word) {
    const order = [game.turn, 1 - game.turn];
    const p = order.find((n) => opts.dicts[n].has(word)) ?? game.turn;
    return opts.langs[p];
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
    dialogs.showDefinitions(items, t, opts.langs[0] !== opts.langs[1]);
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
    snapshot: () => ({ draft: s.draft })
  };
}
