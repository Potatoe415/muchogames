import { mountChips } from "./chips.js";
import { GRID_IDS, LEVELS, MODES } from "./config.js";
import { buildDeck } from "./deck.js";
import { BACKS, THEME_IDS, deckUrls } from "./faces.js";
import { createMatch } from "./game.js";
import { LANGS } from "./i18n.js";
import { clearSave, loadSave } from "./persist.js";
import { mountPickers } from "./pickers.js";
import { preload } from "./preload.js";
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
  setup: {
    mode: "solo",
    difficulty: "medium",
    grid: "4x4",
    theme: THEME_IDS[0],
    back: BACKS[0]
  },
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
  paintSetup(page);
  destroyMatch();
  if (window.MuchogamesMatch.isInProgress()) window.MuchogamesMatch.finish();
  clearSave();
  const config = { ...page.setup };
  const cards = buildDeck(config.grid, config.theme);
  await preload(deckUrls(config, cards));
  const allowed = await window.MuchogamesMatch.start(GAME_ID);
  page.starting = false;
  paintSetup(page);
  if (!allowed) {
    showSetup();
    return;
  }
  page.match = createMatch({ config, cards, onUpdate });
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
    grid: saved.config.grid,
    theme: saved.config.theme,
    back: saved.config.back
  };
  void preload(deckUrls(saved.config, saved.cards));
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
  mountPickers();
  bindPage();
  applyLanguage(page);
  const saved = loadSave();
  if (saved) restore(saved);
  else showSetup();
}

boot();
