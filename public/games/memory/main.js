import { mountChips } from "./chips.js";
import { GRID_IDS, LEVELS, MODES } from "./config.js";
import { createMatch } from "./game.js";
import { LANGS } from "./i18n.js";
import { clearSave, loadSave } from "./persist.js";
import {
  applyLanguage,
  paintMute,
  paintPlay,
  paintSetup,
  reportEnd
} from "./screen.js";
import { setMuted, unlock } from "./sound.js";

const GAME_ID = "memory";
const LANG_KEY = "bergamots-lang";
const MUTE_KEY = "muchogames_memory_mute";
const $ = (id) => document.querySelector(`[data-id="${id}"]`);

const page = {
  lang: "fr",
  setup: { mode: "solo", difficulty: "medium", grid: "4x4" },
  muted: false,
  rotated: false,
  match: null,
  state: null,
  ended: false,
  starting: false
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

function showSetup() {
  $("memory-setup").hidden = false;
  $("memory-play").hidden = true;
}

function showPlay() {
  $("memory-setup").hidden = true;
  $("memory-play").hidden = false;
}

function onUpdate(state) {
  page.state = state;
  paintPlay(page);
  if (state.phase !== "GAME_OVER" || page.ended) return;
  page.ended = true;
  reportEnd(state);
  paintPlay(page);
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

async function startFresh() {
  if (page.starting) return;
  page.starting = true;
  destroyMatch();
  if (window.MuchogamesMatch.isInProgress()) window.MuchogamesMatch.finish();
  clearSave();
  const allowed = await window.MuchogamesMatch.start(GAME_ID);
  page.starting = false;
  if (!allowed) {
    showSetup();
    return;
  }
  page.match = createMatch({ config: { ...page.setup }, onUpdate });
  showPlay();
}

function toSetup() {
  destroyMatch();
  if (window.MuchogamesMatch.isInProgress()) window.MuchogamesMatch.finish();
  clearSave();
  showSetup();
  paintSetup(page);
}

function choose(group, value) {
  page.setup[group] = value;
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

function toggleRotate() {
  page.rotated = !page.rotated;
  $("memory-player-two").classList.toggle("is-rotated", page.rotated);
}

function bindChoices() {
  MODES.forEach((mode) => {
    $(`memory-mode-${mode}`).addEventListener("click", () =>
      choose("mode", mode)
    );
  });
  LEVELS.forEach((level) => {
    $(`memory-level-${level}`).addEventListener("click", () =>
      choose("difficulty", level)
    );
  });
  GRID_IDS.forEach((grid) => {
    $(`memory-grid-${grid}`).addEventListener("click", () =>
      choose("grid", grid)
    );
  });
}

function bindPlay() {
  $("memory-start-button").addEventListener("click", () => {
    unlock();
    void startFresh();
  });
  $("memory-new-button").addEventListener("click", () => void startFresh());
  $("memory-replay-button").addEventListener("click", () => void startFresh());
  $("memory-setup-button").addEventListener("click", toSetup);
  $("memory-mute-button").addEventListener("click", toggleMute);
  $("memory-rotate-button").addEventListener("click", toggleRotate);
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
  bindPlay();
  document.addEventListener("pointerdown", () => unlock(), { capture: true });
}

function restore(saved) {
  page.setup = {
    mode: saved.config.mode,
    difficulty: saved.config.difficulty,
    grid: saved.config.grid
  };
  window.MuchogamesMatch.resume(GAME_ID);
  page.match = createMatch({ saved, onUpdate });
  showPlay();
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
  bindPage();
  applyLanguage(page);
  const saved = loadSave();
  if (saved) restore(saved);
  else showSetup();
}

boot();
