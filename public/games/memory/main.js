import { mountChips } from "./chips.js";
import { GRID_IDS, LEVELS, MODES } from "./config.js";
import { mountDebug } from "./debug.js";
import { buildDeck } from "./deck.js";
import { BACKS, THEME_IDS, deckUrls } from "./faces.js";
import { createMatch } from "./game.js";
import { translate } from "./i18n.js";
import { idleOnline } from "./online-seat.js";
import { createOnline } from "./online.js";
import { loadSave } from "./persist.js";
import { mountPickers } from "./pickers.js";
import { readLang, readMuted, storeLang, storeMuted } from "./prefs.js";
import { preload } from "./preload.js";
import {
  applyLanguage,
  paintClock,
  paintMute,
  paintPlay,
  paintSetup,
  paintWait,
  reportEnd
} from "./screen.js";
import { shareScore } from "./share-score.js";
import { setMuted, unlock } from "./sound.js";
import { placeBars, watchViewport } from "./viewport.js";

const GAME_ID = "memory";
const VIEWS = ["setup", "wait", "play"];
const CLOCK_MS = 250;
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
  resume: { saved: false, code: "" },
  seat: 0,
  names: ["", ""],
  ticker: 0
};

function showChrome(playing) {
  $("game-back-button").hidden = playing;
  $("memory-quit-button").hidden = !playing;
  $("memory-new-button").hidden =
    !playing || page.state?.config.mode === "online";
}

function paintRoom() {
  page.resume = { saved: Boolean(loadSave()), code: online.storedCode() };
  paintSetup(page);
  paintWait(page);
}

function show(view) {
  showChrome(view === "play");
  clearInterval(page.ticker);
  page.ticker =
    view === "play" ? setInterval(() => paintClock(page), CLOCK_MS) : 0;
  VIEWS.forEach((name) => {
    $(`memory-${name}`).hidden = name !== view;
  });
  if (view !== "play") paintRoom();
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

// Replacing or losing the match: it is no longer in progress, the local save
// stays until a new match overwrites it.
function dropMatch() {
  destroyMatch();
  if (window.MuchogamesMatch.isInProgress()) window.MuchogamesMatch.finish();
}

function closedRoom() {
  dropMatch();
  show("setup");
}

// Quitting is not an end: the save and the online seat stay for "Reprendre".
function toSetup() {
  void online.away();
  destroyMatch();
  show("setup");
}

const online = createOnline({
  page,
  paint: paintRoom,
  repaint: () => paintPlay(page),
  show,
  text: (key) => translate(page.lang, key),
  exit: closedRoom,
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
  dropMatch();
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
  paintSetup(page);
}

function toggleMute() {
  unlock();
  page.muted = !page.muted;
  setMuted(page.muted);
  storeMuted(page.muted);
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
  $("memory-resume-online-button").addEventListener("click", () => {
    unlock();
    online.resume();
  });
}

function bindPlay() {
  $("memory-start-button").addEventListener("click", () => {
    unlock();
    void startFresh();
  });
  $("memory-resume-button").addEventListener("click", resumeLocal);
  $("memory-new-button").addEventListener("click", () => void startFresh());
  $("memory-replay-button").addEventListener("click", () => void startFresh());
  $("memory-setup-button").addEventListener("click", toSetup);
  const share = $("memory-share-score-button");
  share.addEventListener("click", () => void shareScore(page, share));
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
      storeLang(page.lang);
      applyLanguage(page);
    });
  });
  bindChoices();
  bindOnline();
  bindPlay();
  bindLifecycle();
  watchViewport();
  document.addEventListener("click", (event) => {
    const stay = event.target.closest?.("[data-answer='no']");
    if (stay && !$("memory-play").hidden) showChrome(true);
    requestAnimationFrame(placeBars);
  });
  document.addEventListener("pointerdown", () => unlock(), { capture: true });
}

function resumeLocal() {
  const saved = page.starting ? null : loadSave();
  if (!saved) return show("setup");
  unlock();
  const { mode, difficulty, grid, theme, back } = saved.config;
  page.setup = { mode, difficulty, grid, theme, back };
  void preload(deckUrls(saved.config, saved.cards));
  window.MuchogamesMatch.resume(GAME_ID);
  page.match = createMatch({ saved, onUpdate });
  show("play");
}

// Some browsers report the page visible again while it unloads: once hidden
// for good, only a back-forward cache restore says the player is back.
function bindLifecycle() {
  let gone = false;
  document.addEventListener("visibilitychange", () => {
    page.match?.setVisible(!document.hidden && !gone);
    page.match?.save();
    if (!gone) online.presence(!document.hidden);
  });
  window.addEventListener("pagehide", () => {
    gone = true;
    page.match?.setVisible(false);
    page.match?.save();
    online.presence(false);
  });
  window.addEventListener("pageshow", (event) => {
    if (!event.persisted) return;
    gone = false;
    page.match?.setVisible(true);
    online.presence(true);
  });
}

function boot() {
  page.lang = readLang();
  page.muted = readMuted();
  setMuted(page.muted);
  mountChips(page.setup);
  mountPickers();
  bindPage();
  mountDebug(page);
  applyLanguage(page);
  if (!online.joinFromLink()) show("setup");
}

boot();
