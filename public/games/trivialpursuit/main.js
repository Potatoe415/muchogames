// Page shell: language, options panel, players setup and resume, end overlay
// and the match lifecycle (docs/PLATFORM_RULES.md). The match lives in play.js.
import { PAWN_COLORS } from "./board-view.js";
import { loadDeck } from "./deck.js";
import { LANGS, translate } from "./i18n.js";
import { newMatch } from "./model.js";
import { createPlay } from "./play.js";
import { rulesHtml } from "./rules.js";
import * as store from "./store.js";

const GAME_ID = "trivialpursuit";
const LANG_KEY = "bergamots-lang";

const $ = (id) => document.querySelector(`[data-id="${id}"]`);

const storedLang = store.readStorage(LANG_KEY, "fr");
const page = {
  lang: LANGS.includes(storedLang) ? storedLang : "fr",
  saved: store.loadMatch(),
  names: store.loadNames(),
  mode: store.loadMode(),
  count: 2,
  deck: null,
  deckError: false,
  play: null,
  panel: null,
  last: null,
  starting: false
};
page.count = Math.max(1, page.names.length || 2);

const t = (key, vars) => translate(page.lang, key, vars);

function defaultName(i) {
  const profile = i === 0 ? window.PlayerProfile?.getName?.("") : "";
  return (profile || t("playerName", { n: i + 1 })).slice(0, store.NAME_MAX);
}

function renderSetup() {
  const list = $("trivialpursuit-names");
  list.replaceChildren(
    ...Array.from({ length: page.count }, (_, i) => {
      const input = document.createElement("input");
      input.type = "text";
      input.className = "tp-name-input";
      input.maxLength = store.NAME_MAX;
      input.dataset.id = `trivialpursuit-name-${i + 1}`;
      input.style.setProperty("--pawn", PAWN_COLORS[i]);
      input.setAttribute("aria-label", t("playerName", { n: i + 1 }));
      input.placeholder = t("playerName", { n: i + 1 });
      input.value = page.names[i] ?? defaultName(i);
      input.addEventListener("input", () => (page.names[i] = input.value));
      input.addEventListener("keydown", leaveInputWithArrows);
      return input;
    })
  );
  document.querySelectorAll("[data-count]").forEach((chip) => {
    chip.classList.toggle("active", Number(chip.dataset.count) === page.count);
  });
  document.querySelectorAll("[data-mode]").forEach((button) => {
    const active = button.dataset.mode === page.mode;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
}

function renderStart() {
  const resume = $("trivialpursuit-resume-button");
  resume.hidden = !page.saved || !page.deck;
  if (page.saved) {
    resume.querySelector("[data-resume-info]").textContent = t("resumeInfo", {
      mode: t(page.saved.mode),
      count: page.saved.players.length,
      turn: page.saved.turns
    });
  }
  $("trivialpursuit-start-button").disabled = !page.deck;
  const status = $("trivialpursuit-load-status");
  status.hidden = Boolean(page.deck);
  status.textContent = page.deckError ? t("loadError") : t("loading");
  status.classList.toggle("is-error", page.deckError);
  renderSetup();
}

function renderEnd() {
  const s = page.last;
  if (!s) return;
  const solo = s.players.length === 1;
  const winner = s.players[s.winner];
  $("trivialpursuit-end-title").textContent = solo
    ? t("wonSolo")
    : t("won", { name: winner.name });
  $("trivialpursuit-end-line").textContent = t("wonLine");
  $("trivialpursuit-end-stats").replaceChildren(
    ...s.players.map((p) => {
      const item = document.createElement("li");
      const wedges = p.wedges.filter(Boolean).length;
      item.textContent = t("playerStats", { ...p, wedges });
      return item;
    })
  );
}

function applyLanguage() {
  document.documentElement.lang = page.lang;
  document.title = t("title");
  document.querySelectorAll("[data-i18n]").forEach((node) => {
    node.textContent = t(node.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-aria]").forEach((node) => {
    node.setAttribute("aria-label", t(node.dataset.i18nAria));
  });
  document.querySelectorAll("[data-lang]").forEach((button) => {
    button.classList.toggle("active", button.dataset.lang === page.lang);
  });
  $("trivialpursuit-rules-content").innerHTML = rulesHtml(page.lang);
  renderStart();
  renderEnd();
  page.play?.relabel();
}

function showScreen(playing) {
  $("trivialpursuit-start-screen").hidden = playing;
  $("trivialpursuit-stage").hidden = !playing;
  $("trivialpursuit-options-play").hidden = !playing;
  $("game-back-button").hidden = playing;
  $("trivialpursuit-quit-button").hidden = !playing;
}

// A text field keeps the arrows for itself (tv-remote.js too): Up / Down
// still move to the previous / next control of the start screen.
function leaveInputWithArrows(event) {
  const step = { ArrowUp: -1, ArrowDown: 1 }[event.key];
  if (!step) return;
  const controls = [
    ...$("trivialpursuit-start-screen").querySelectorAll("button, input")
  ].filter((el) => !el.disabled && !el.closest("[hidden]"));
  const next = controls[controls.indexOf(event.target) + step];
  if (!next) return;
  event.preventDefault();
  next.focus();
}

function playElements() {
  const q = (name) => $(`trivialpursuit-${name}`);
  return {
    board: q("board"),
    players: q("players"),
    status: q("status"),
    turn: q("turn"),
    die: q("die"),
    roll: q("roll-button"),
    q: {
      question: q("question"),
      card: q("question-card"),
      cat: q("question-category"),
      tag: q("question-tag"),
      text: q("question-text"),
      answer: q("answer"),
      answerText: q("answer-text"),
      info: q("answer-info"),
      reveal: q("show-answer-button"),
      right: q("right-button"),
      wrong: q("wrong-button"),
      other: q("other-question-button"),
      close: q("question-close"),
      choose: q("choose"),
      chooseTitle: q("choose-title"),
      catList: q("category-list")
    }
  };
}

function unmount() {
  page.play?.destroy();
  page.play = null;
  $("trivialpursuit-end").hidden = true;
}

function onWin(state) {
  store.saveMatch(null);
  page.saved = null;
  page.last = state;
  const solo = state.players.length === 1;
  window.MuchogamesMatch.finish(solo ? { won: true } : {});
  renderEnd();
  $("trivialpursuit-end").hidden = false;
  $("trivialpursuit-replay-button").focus({ preventScroll: true });
}

function mount(state) {
  unmount();
  page.saved = state;
  showScreen(true);
  page.play = createPlay({
    els: playElements(),
    state,
    deck: page.deck,
    t,
    save: store.saveMatch,
    onWin
  });
}

// Quitting is not an end (no finish()): the match stays saved and
// "Reprendre" brings it back for free.
function returnToStart() {
  unmount();
  page.saved = store.loadMatch();
  showScreen(false);
  applyLanguage();
}

function playerNames() {
  return Array.from({ length: page.count }, (_, i) => {
    const typed = (page.names[i] ?? defaultName(i))
      .trim()
      .slice(0, store.NAME_MAX);
    return typed || t("playerName", { n: i + 1 });
  });
}

async function startMatch(names, mode) {
  if (page.starting || !page.deck) return;
  window.MuchogamesTv?.play();
  page.starting = true;
  const allowed = await window.MuchogamesMatch.start(GAME_ID);
  page.starting = false;
  if (!allowed) return page.play && returnToStart();
  store.saveNames(names);
  store.saveMode(mode);
  const state = newMatch(names, mode);
  store.saveMatch(state);
  mount(state);
}

function resumeMatch() {
  if (!page.saved || !page.deck || page.starting) return;
  window.MuchogamesTv?.play();
  window.MuchogamesMatch.resume(GAME_ID);
  mount(page.saved);
}

function bindOptions() {
  page.panel = window.GameHeader?.initOptionsPanel(
    $("game-options-button"),
    $("game-options-panel")
  );
  document.querySelectorAll("[data-lang]").forEach((button) => {
    button.addEventListener("click", () => {
      page.lang = button.dataset.lang;
      store.writeStorage(LANG_KEY, page.lang);
      applyLanguage();
      useDeckLanguage();
    });
  });
  $("trivialpursuit-options-quit").addEventListener("click", () => {
    page.panel?.close();
    returnToStart();
  });
  $("trivialpursuit-quit-button").addEventListener("click", returnToStart);
}

function bindStart() {
  document.querySelectorAll("[data-count]").forEach((chip) => {
    chip.addEventListener("click", () => {
      page.count = Number(chip.dataset.count);
      renderSetup();
    });
  });
  document.querySelectorAll("[data-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      page.mode = button.dataset.mode;
      renderSetup();
    });
  });
  $("trivialpursuit-start-button").addEventListener("click", () =>
    startMatch(playerNames(), page.mode)
  );
  $("trivialpursuit-resume-button").addEventListener("click", resumeMatch);
  $("trivialpursuit-replay-button").addEventListener("click", () =>
    startMatch(
      page.last.players.map((p) => p.name),
      page.last.mode
    )
  );
  $("trivialpursuit-new-game-button").addEventListener("click", returnToStart);
}

function bindPage() {
  bindOptions();
  bindStart();
  window.addEventListener("pagehide", () => page.play?.save());
  document.addEventListener("visibilitychange", () => page.play?.save());
  // Back/forward cache: the page comes back with its match still on screen.
  window.addEventListener("pageshow", (event) => {
    if (event.persisted && page.play && page.saved) {
      window.MuchogamesMatch.resume(GAME_ID);
    }
  });
}

// Questions follow the interface language; the match keeps its indexes.
function useDeckLanguage() {
  if (!page.deck) return;
  page.deck
    .setLang(page.lang)
    .then(() => page.play?.relabel())
    .catch((error) => console.error("[trivialpursuit]", error));
}

async function boot() {
  bindPage();
  showScreen(false);
  applyLanguage();
  try {
    page.deck = await loadDeck(page.lang);
  } catch (error) {
    console.error("[trivialpursuit]", error);
    page.deckError = true;
  }
  renderStart();
  // The start button was disabled while loading: the remote focus moves to
  // it (or to Resume) now.
  if (!page.play) window.MuchogamesTv?.focusScreen();
  // The language may have changed while the deck was loading.
  useDeckLanguage();
}

boot();
