// Page shell: language, settings, dictionary loading, screens, end sheet,
// saving and the match lifecycle (docs/PLATFORM_RULES.md). The match on
// screen lives in play.js.
import { createDialogs } from "./dialogs.js";
import { loadDictionary } from "./dict.js";
import { draftFits } from "./draft.js";
import { renderEnd as paintEnd } from "./end.js";
import { createGame, restoreGame } from "./game.js";
import { LANGS, rulesHtml, translate } from "./i18n.js";
import { createPlay } from "./play.js";
import {
  bindChoices,
  matchConfig,
  renderChoices,
  renderLevel,
  renderResume
} from "./setup.js";
import { setSoundEnabled, sound } from "./sound.js";
import {
  clearGame,
  loadSaved,
  loadSettings,
  loadStats,
  readText,
  saveGame,
  saveSettings,
  saveStats,
  writeText
} from "./store.js";

const GAME_ID = "scrabble";
const LANG_KEY = "bergamots-lang";
const END_DELAY_MS = 1100;

const $ = (id) => document.querySelector(`[data-id="${id}"]`);

const storedLang = readText(LANG_KEY, "fr");
const page = {
  lang: LANGS.includes(storedLang) ? storedLang : "fr",
  settings: loadSettings(),
  stats: loadStats(),
  dialogs: createDialogs(),
  dict: null,
  play: null,
  game: null,
  config: null,
  endTimer: 0,
  starting: false
};

const t = (key, vars) => translate(page.lang, key, vars);
const isSolo = () => page.config?.mode === "solo";

function names() {
  if (isSolo()) return [t("you"), t("computer")];
  return page.config.names.map((name, p) => name || t(`player${p + 1}`));
}

const renderEnd = () =>
  page.game && paintEnd(page.game, { solo: isSolo(), names: names(), t });

function renderOver() {
  const over = Boolean(page.game?.over);
  $("scrabble-play-button").hidden = over;
  $("scrabble-again-button").hidden = !over;
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
  document.querySelectorAll("[data-i18n-placeholder]").forEach((node) => {
    node.placeholder = t(node.dataset.i18nPlaceholder);
  });
  document.querySelectorAll("[data-lang]").forEach((button) => {
    button.classList.toggle("active", button.dataset.lang === page.lang);
  });
  $("scrabble-rules-content").innerHTML = rulesHtml(page.lang);
  renderLevel(page.settings.level, page.stats, t);
  page.play?.relabel();
  renderEnd();
}

function applySettings() {
  setSoundEnabled(page.settings.sound === "on");
  renderChoices(page.settings);
  renderLevel(page.settings.level, page.stats, t);
  page.play?.refresh();
}

function choose(setting, value) {
  page.settings[setting] = value;
  saveSettings(page.settings);
  applySettings();
}

function setNames(list) {
  page.settings.names = list;
  saveSettings(page.settings);
}

function showScreen(playing) {
  $("scrabble-start-screen").hidden = playing;
  $("scrabble-stage").hidden = !playing;
}

function saveNow() {
  const { game, play, config } = page;
  if (game && play && !game.over) saveGame(config, game, play.snapshot().draft);
}

function recordResult(winner) {
  if (!isSolo()) return void sound.win();
  const stats = page.stats[page.config.level];
  stats.played += 1;
  if (winner === 0) stats.won += 1;
  saveStats(page.stats);
  renderLevel(page.settings.level, page.stats, t);
  (winner === 0 ? sound.win : sound.end)();
}

function onEnd(game) {
  clearGame();
  const { winner } = game.over;
  recordResult(winner);
  const decided = isSolo() && winner >= 0;
  window.MuchogamesMatch.finish(
    decided ? { won: winner === 0, score: game.scores[0] } : undefined
  );
  renderOver();
  page.endTimer = setTimeout(() => {
    renderEnd();
    $("scrabble-end").hidden = false;
  }, END_DELAY_MS);
}

function unmount() {
  clearTimeout(page.endTimer);
  page.play?.destroy();
  Object.assign(page, { play: null, game: null });
  $("scrabble-end").hidden = true;
}

function mount(game, config, draft) {
  unmount();
  Object.assign(page, { game, config });
  showScreen(true);
  renderOver();
  page.play = createPlay({
    els: {
      stage: $("scrabble-stage"),
      board: $("scrabble-board"),
      rack: $("scrabble-rack")
    },
    game,
    draft,
    config,
    dict: page.dict,
    t,
    names,
    hints: () => page.settings.hints === "on",
    keysActive: () =>
      $("game-options-panel").hidden && $("scrabble-end").hidden,
    dialogs: page.dialogs,
    sound,
    onSave: saveNow,
    onEnd
  });
}

// The saved match, checked tile by tile; a damaged save is dropped.
function loadResumable() {
  const saved = loadSaved();
  const game = saved && restoreGame(saved.game);
  if (!game) {
    clearGame();
    return null;
  }
  const fits = draftFits(saved.draft, game.racks[game.turn], game.board);
  return { config: saved.config, game, draft: fits ? saved.draft : [] };
}

// Quitting mid-match keeps the save (no finish); an ended match already
// cleared it in onEnd. Either way the start screen reflects what is saved.
function returnToStart() {
  saveNow();
  unmount();
  renderResume(loadResumable());
  showScreen(false);
}

async function startMatch() {
  if (page.starting || !page.dict) return;
  page.starting = true;
  if (window.MuchogamesMatch.isInProgress()) window.MuchogamesMatch.finish();
  const config = matchConfig(page.settings);
  const allowed = await window.MuchogamesMatch.start(GAME_ID);
  page.starting = false;
  if (!allowed) return void (page.play && returnToStart());
  const game = createGame();
  saveGame(config, game, []);
  renderResume(null);
  mount(game, config, []);
}

function resumeMatch() {
  const resumable = page.dict && loadResumable();
  renderResume(resumable);
  if (!resumable) return;
  window.MuchogamesMatch.resume(GAME_ID);
  mount(resumable.game, resumable.config, resumable.draft);
}

function loadDict() {
  $("scrabble-dict-status").hidden = false;
  $("scrabble-dict-error").hidden = true;
  loadDictionary()
    .then((dict) => {
      page.dict = dict;
      $("scrabble-dict-status").hidden = true;
      $("scrabble-start-button").disabled = false;
      renderResume(loadResumable());
    })
    .catch(() => {
      $("scrabble-dict-status").hidden = true;
      $("scrabble-dict-error").hidden = false;
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
      writeText(LANG_KEY, page.lang);
      applyLanguage();
    });
  });
  bindChoices(choose, setNames);
  const play = (name) => () => page.play?.actions[name]();
  const actions = {
    "scrabble-start-button": startMatch,
    "scrabble-resume-button": resumeMatch,
    "scrabble-dict-retry": loadDict,
    "scrabble-play-button": play("play"),
    "scrabble-shuffle-button": play("shuffle"),
    "scrabble-recall-button": play("recall"),
    "scrabble-hint-button": play("hint"),
    "scrabble-pass-button": play("pass"),
    "scrabble-bag-button": play("bag"),
    "scrabble-quit-button": returnToStart,
    "scrabble-again-button": startMatch,
    "scrabble-replay-button": startMatch,
    "scrabble-change-settings-button": returnToStart,
    "scrabble-see-board-button": () => ($("scrabble-end").hidden = true)
  };
  Object.entries(actions).forEach(([id, fn]) =>
    $(id).addEventListener("click", fn)
  );
  window.addEventListener("pagehide", saveNow);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") saveNow();
  });
}

bindPage();
applySettings();
applyLanguage();
loadDict();
