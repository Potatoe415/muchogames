import { mountChips } from "./chips.js";
import { GRID_IDS, LEVELS, MODES } from "./config.js";
import { mountDebug } from "./debug.js";
import { buildDeck } from "./deck.js";
import { BACKS, THEME_IDS, deckUrls } from "./faces.js";
import { createMatch } from "./game.js";
import { LANGS, translate } from "./i18n.js";
import { createOnline, idleOnline } from "./online.js";
import { clearSave, loadSave } from "./persist.js";
import { mountPickers } from "./pickers.js";
import { preload } from "./preload.js";
import {
  applyLanguage,
  paintMute,
  paintPlay,
  paintSetup,
  paintWait,
  reportEnd
} from "./screen.js";
import { setMuted, unlock } from "./sound.js";
import { placeBars, watchViewport } from "./viewport.js";

const GAME_ID = "memory";
const LANG_KEY = "bergamots-lang";
const MUTE_KEY = "muchogames_memory_mute";
const VIEWS = ["setup", "wait", "play"];
const $ = (id) => document.querySelector(`[data-id="${id}"]`);

const page = {
  lang: "fr",
  setup: {
    mode: "solo",
    difficulty: "medium",
    grid: "4x4",
    theme: THEME_IDS[0],
    back: BACKS[3]
  },
  muted: false,
  match: null,
  state: null,
  ended: false,
  starting: false,
  online: idleOnline(),
  seat: 0,
  names: ["", ""]
};

function store(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage unavailable.
  }
}

function readLang() {
  try {
    const value = localStorage.getItem(LANG_KEY);
    return LANGS.includes(value) ? value : "fr";
  } catch {
    return "fr";
  }
}

function showChrome(playing) {
  $("game-back-button").hidden = playing;
  $("memory-quit-button").hidden = !playing;
  $("memory-new-button").hidden =
    !playing || page.state?.config.mode === "online";
}

function show(view) {
  showChrome(view === "play");
  VIEWS.forEach((name) => {
    $(`memory-${name}`).hidden = name !== view;
  });
}

function paintRoom() {
  paintSetup(page);
  paintWait(page);
}

function onUpdate(state) {
  page.state = state;
  paintPlay(page);
  if (state.phase !== "GAME_OVER" || page.ended) return;
  page.ended = true;
  reportEnd(page);
  paintPlay(page);
  if (state.config.mode === "online") void online.ended();
}

function destroyMatch() {
  page.match?.destroy();
  page.match = null;
  page.state = null;
  page.ended = false;
  $("memory-end").hidden = true;
  const board = $("memory-board");
  board.replaceChildren();
  delete board.dataset.deck;
}

function finishMatch() {
  destroyMatch();
  if (window.MuchogamesMatch.isInProgress()) window.MuchogamesMatch.finish();
  clearSave();
}

function backToSetup() {
  finishMatch();
  show("setup");
  paintRoom();
}

function toSetup() {
  void online.leave();
  backToSetup();
}

const online = createOnline({
  page,
  paint: paintRoom,
  show,
  text: (key) => translate(page.lang, key),
  exit: backToSetup,
  enter(state) {
    destroyMatch();
    page.match = createMatch({
      saved: state,
      onUpdate,
      online: { seat: page.seat, publish: (next) => online.publish(next) }
    });
    show("play");
  }
});

async function startFresh() {
  if (page.starting) return;
  finishMatch();
  if (page.setup.mode === "online") {
    await online.leave();
    void online.create();
    return;
  }
  page.starting = true;
  paintSetup(page);
  const config = { ...page.setup };
  const cards = buildDeck(config.grid, config.theme);
  await preload(deckUrls(config, cards));
  const allowed = await window.MuchogamesMatch.start(GAME_ID);
  page.starting = false;
  paintSetup(page);
  if (!allowed) {
    show("setup");
    return;
  }
  page.match = createMatch({ config, cards, onUpdate });
  show("play");
}

function choose(group, value) {
  page.setup[group] = value;
  page.online.error = "";
  clearSave();
  paintSetup(page);
}

function toggleMute() {
  unlock();
  page.muted = !page.muted;
  setMuted(page.muted);
  store(MUTE_KEY, page.muted ? "1" : "0");
  paintMute(page);
}

const CHOICES = [
  ["mode", "mode", MODES],
  ["difficulty", "level", LEVELS],
  ["grid", "grid", GRID_IDS],
  ["theme", "theme", THEME_IDS],
  ["back", "back", BACKS]
];

function bindChoices() {
  CHOICES.forEach(([group, prefix, values]) => {
    values.forEach((value) => {
      $(`memory-${prefix}-${value}`).addEventListener("click", () =>
        choose(group, value)
      );
    });
  });
}

function bindOnline() {
  const input = $("memory-join-input");
  input.addEventListener("input", () => {
    input.value = window.MuchogamesRoom?.normalizeCode(input.value) ?? "";
    page.online.error = "";
    paintSetup(page);
  });
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") void online.join(input.value);
  });
  $("memory-join-button").addEventListener("click", () => {
    unlock();
    void online.join(input.value);
  });
  $("memory-share-button").addEventListener("click", () => void online.share());
  $("memory-cancel-button").addEventListener("click", toSetup);
}

function bindPlay() {
  $("memory-start-button").addEventListener("click", () => {
    unlock();
    void startFresh();
  });
  $("memory-new-button").addEventListener("click", () => void startFresh());
  $("memory-replay-button").addEventListener("click", () => void startFresh());
  $("memory-setup-button").addEventListener("click", toSetup);
  $("memory-quit-button").addEventListener("click", toSetup);
  $("memory-mute-button").addEventListener("click", toggleMute);
  $("memory-board").addEventListener("click", (event) => {
    const card = event.target.closest("[data-instance-id]");
    if (!card) return;
    unlock();
    page.match?.flip(card.dataset.instanceId);
  });
}

function bindPage() {
  window.GameHeader?.initOptionsPanel(
    $("game-options-button"),
    $("game-options-panel")
  );
  document.querySelectorAll("[data-lang]").forEach((button) => {
    button.addEventListener("click", () => {
      page.lang = button.dataset.lang;
      store(LANG_KEY, page.lang);
      applyLanguage(page);
    });
  });
  bindChoices();
  bindOnline();
  bindPlay();
  watchViewport();
  document.addEventListener("click", (event) => {
    const stay = event.target.closest?.("[data-answer='no']");
    if (stay && !$("memory-play").hidden) showChrome(true);
    requestAnimationFrame(placeBars);
  });
  document.addEventListener("pointerdown", () => unlock(), { capture: true });
}

function restore(saved) {
  page.setup = {
    mode: saved.config.mode,
    difficulty: saved.config.difficulty,
    grid: saved.config.grid,
    theme: saved.config.theme,
    back: saved.config.back
  };
  void preload(deckUrls(saved.config, saved.cards));
  window.MuchogamesMatch.resume(GAME_ID);
  page.match = createMatch({ saved, onUpdate });
  show("play");
}

function boot() {
  page.lang = readLang();
  try {
    page.muted = localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    page.muted = false;
  }
  setMuted(page.muted);
  mountChips(page.setup);
  mountPickers();
  bindPage();
  mountDebug(page);
  applyLanguage(page);
  if (online.restore() || online.joinFromLink()) return;
  const saved = loadSave();
  if (saved) restore(saved);
  else show("setup");
}

boot();
