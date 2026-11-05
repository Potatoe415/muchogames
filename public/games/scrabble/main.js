// Page shell: language, settings, dictionary loading, screens, end sheet,
// saving and the match lifecycle (docs/PLATFORM_RULES.md). The match on
// screen lives in play.js.
import { createDialogs } from "./dialogs.js";
import { combineDictionaries, loadDictionary } from "./dict.js";
import { draftFits } from "./draft.js";
import { makeJuniorDraw } from "./easy-draw.js";
import { renderEnd as paintEnd } from "./end.js";
import { createGame, restoreGame } from "./game.js";
import { LANGS, rulesHtml, translate } from "./i18n.js";
import { createPlay } from "./play.js";
import {
  bindChoices,
  isJunior,
  matchConfig,
  renderChoices,
  renderLevel,
  renderPlayers,
  renderResume,
  seatsOf,
  useRules
} from "./setup.js";
import { setSoundEnabled, sound } from "./sound.js";
import {
  clearGame,
  hintsUsedOf,
  loadBest,
  loadSaved,
  loadSettings,
  loadStats,
  readText,
  saveBest,
  saveGame,
  saveSettings,
  saveStats,
  toggleWord,
  writeText
} from "./store.js";

const GAME_ID = "scrabble";
const LANG_KEY = "bergamots-lang";
const END_DELAY_MS = 1100;

const $ = (id) => document.querySelector(`[data-id="${id}"]`);

const storedLang = readText(LANG_KEY, "fr");
const uiLang = LANGS.includes(storedLang) ? storedLang : "fr";
const page = {
  lang: uiLang,
  settings: loadSettings(uiLang),
  stats: loadStats(),
  dialogs: createDialogs(),
  dicts: {},
  play: null,
  game: null,
  config: null,
  endTimer: 0,
  endBest: null,
  starting: false
};

const t = (key, vars) => translate(page.lang, key, vars);
const isSolo = () => page.config?.players === 1;
function names() {
  if (isSolo()) return [t("you"), t("computer")];
  return page.config.names
    .slice(0, page.config.players)
    .map((name, p) => name || t(`player${p + 1}`));
}

// The end card; in solo, the level's best score under it (page.endBest).
function renderEnd() {
  if (!page.game) return;
  paintEnd(page.game, { solo: isSolo(), names: names(), t });
  const line = $("scrabble-final-best-score");
  const best = isSolo() ? page.endBest : null;
  line.hidden = !best;
  if (best) line.textContent = t(best.isNew ? "newBest" : "bestScore", best);
}

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
  renderPlayers(page.settings.players, t);
  renderLevel(page.settings.level, page.stats, t);
  page.play?.relabel();
  renderEnd();
}

function applySettings() {
  setSoundEnabled(page.settings.sound === "on");
  renderChoices(page.settings);
  renderPlayers(page.settings.players, t);
  renderLevel(page.settings.level, page.stats, t);
  page.play?.refresh();
}

function choose(setting, value) {
  const { settings } = page;
  settings[setting] =
    setting === "words" ? toggleWord(settings.words, value) : value;
  saveSettings(settings);
  applySettings();
  if (setting === "words") loadDict();
}

function setNames(list) {
  page.settings.names = list;
  saveSettings(page.settings);
}

// In a match the header arrow returns to this start screen; here, to the hub.
function showScreen(playing) {
  $("scrabble-start-screen").hidden = playing;
  $("scrabble-stage").hidden = !playing;
  $("game-back-button").hidden = playing;
  $("scrabble-quit-button").hidden = !playing;
}

function saveNow() {
  const { game, play, config } = page;
  if (game && play && !game.over) saveGame(config, game, play.snapshot());
}

// Solo: the level's best score (your final score, end adjustment included).
function recordBest(score) {
  const { level } = page.config;
  const old = loadBest(level);
  const isNew = score > old;
  if (isNew) saveBest(level, score);
  page.endBest = { score: Math.max(old, score), isNew };
}

function recordResult(winner) {
  if (!isSolo()) return void sound.win();
  recordBest(Math.max(0, Math.round(page.game.scores[0])));
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
  // Solo: the score always; won only when there is a winner (not a draw).
  const score = Math.max(0, Math.round(game.scores[0]));
  const result = winner >= 0 ? { won: winner === 0, score } : { score };
  window.MuchogamesMatch.finish(isSolo() ? result : undefined);
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

function mount(game, config, draft, hintsUsed = 0) {
  unmount();
  useRules(config);
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
    hintsUsed,
    config,
    langs: config.words,
    dicts: config.words.map((l) => page.dicts[l]),
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
  if (saved) useRules(saved.config);
  const game = saved && restoreGame(saved.game, seatsOf(saved.config));
  if (!game) {
    clearGame();
    return null;
  }
  const fits = draftFits(saved.draft, game.racks[game.turn], game.board);
  return {
    config: saved.config,
    game,
    draft: fits ? saved.draft : [],
    hintsUsed: hintsUsedOf(saved.hintsUsed)
  };
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
  const config = matchConfig(page.settings);
  if (page.starting || !dictsReady(config.words)) return;
  window.MuchogamesTv?.play();
  page.starting = true;
  if (window.MuchogamesMatch.isInProgress()) window.MuchogamesMatch.finish();
  const allowed = await window.MuchogamesMatch.start(GAME_ID);
  page.starting = false;
  if (!allowed) return void (page.play && returnToStart());
  useRules(config);
  const dict = combineDictionaries(config.words.map((l) => page.dicts[l]));
  const game = createGame(
    seatsOf(config),
    isJunior(config) ? makeJuniorDraw(dict) : undefined
  );
  saveGame(config, game, { draft: [], hintsUsed: 0 });
  renderResume(null);
  mount(game, config, []);
}

async function resumeMatch() {
  const resumable = loadResumable();
  renderResume(resumable);
  if (resumable) window.MuchogamesTv?.play();
  if (!resumable || !(await loadDict(resumable.config.words))) return;
  window.MuchogamesMatch.resume(GAME_ID);
  const { game, config, draft, hintsUsed } = resumable;
  mount(game, config, draft, hintsUsed);
}

const dictsReady = (words) => words.every((l) => page.dicts[l]);

// Loads the word lists of the word languages (the selected ones by default);
// the start button waits for them. Resolves false when a list cannot load.
async function loadDict(words = page.settings.words) {
  const selected = () => words.join() === page.settings.words.join();
  $("scrabble-dict-status").hidden = dictsReady(words);
  $("scrabble-dict-error").hidden = true;
  if (selected()) $("scrabble-start-button").disabled = !dictsReady(words);
  try {
    for (const lang of words) page.dicts[lang] = await loadDictionary(lang);
    if (selected()) $("scrabble-start-button").disabled = false;
    // The start button was disabled while loading: the remote focus moves
    // to it (or to Resume) now.
    if (!page.play) window.MuchogamesTv?.focusScreen();
    return true;
  } catch {
    $("scrabble-dict-error").hidden = false;
    return false;
  } finally {
    $("scrabble-dict-status").hidden = true;
  }
}

// A text field keeps the arrows for itself (tv-remote.js too): Up / Down
// still move to the previous / next control of the start screen.
function leaveInput(event) {
  const step = { ArrowUp: -1, ArrowDown: 1 }[event.key];
  if (!step) return;
  const controls = [
    ...$("scrabble-start-screen").querySelectorAll("button, input")
  ].filter((el) => !el.disabled && !el.closest("[hidden]"));
  const next = controls[controls.indexOf(event.target) + step];
  if (!next) return;
  event.preventDefault();
  next.focus();
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
  document
    .querySelectorAll(".sc-input")
    .forEach((input) => input.addEventListener("keydown", leaveInput));
  const play = (name) => () => page.play?.actions[name]();
  const actions = {
    "scrabble-start-button": startMatch,
    "scrabble-resume-button": resumeMatch,
    "scrabble-dict-retry": () => loadDict(),
    "scrabble-play-button": play("play"),
    "scrabble-shuffle-button": play("shuffle"),
    "scrabble-recall-button": play("recall"),
    "scrabble-hint-button": play("hint"),
    "scrabble-pass-button": play("pass"),
    "scrabble-bag-button": play("bag"),
    "scrabble-define-button": play("define"),
    "scrabble-again-button": startMatch,
    "scrabble-replay-button": startMatch,
    "scrabble-change-settings-button": returnToStart,
    "scrabble-quit-button": returnToStart,
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
renderResume(loadResumable());
loadDict();
