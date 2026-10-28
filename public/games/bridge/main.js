// Page shell: language, settings, screens, overlays, stats, saving and the
// match lifecycle (docs/PLATFORM_RULES.md). The deal on screen lives in flow.js.
import { createBidBox } from "./bidbox.js";
import { createMatch, currentDeal, totals } from "./chicago.js";
import { dealState } from "./deal.js";
import { createFlow } from "./flow.js";
import {
  contractLabel,
  LANGS,
  rulesHtml,
  seatName,
  translate
} from "./i18n.js";
import {
  fillDealResult,
  fillDiagram,
  fillMatchEnd,
  fillScore,
  resultMark
} from "./panels.js";
import { createRobot } from "./robot.js";
import {
  bindChoices,
  buildOptions,
  renderChoices,
  renderLevel,
  renderResume
} from "./setup.js";
import { setSoundEnabled, sound } from "./sound.js";
import {
  clearMatch,
  loadSaved,
  loadSettings,
  loadStats,
  readText,
  saveMatch,
  saveSettings,
  saveStats,
  writeText
} from "./store.js";

const GAME_ID = "bridge";
const LANG_KEY = "bergamots-lang";
const OVERLAYS = [
  "bridge-deal-result",
  "bridge-hands-panel",
  "bridge-score-panel",
  "bridge-match-end"
];

const $ = (id) => document.querySelector(`[data-id="${id}"]`);

const storedLang = readText(LANG_KEY, "fr");
const page = {
  lang: LANGS.includes(storedLang) ? storedLang : "fr",
  settings: loadSettings(),
  stats: loadStats(),
  result: null,
  starting: false
};

const t = (key, vars) => translate(page.lang, key, vars);
const showLevel = () => renderLevel(page.settings.level, page.stats, t);
const bidBox = createBidBox((call) => flow.call(call));
const flow = createFlow({
  t,
  lang: () => page.lang,
  settings: () => page.settings,
  bidBox,
  robot: createRobot(),
  save: saveMatch,
  onDealEnd,
  onMatchEnd
});

function showOverlay(id, on = true) {
  $(id).hidden = !on;
}

function fillResult() {
  const match = flow.match();
  if (!page.result || !match) return;
  fillDealResult({
    t,
    lang: page.lang,
    result: page.result,
    last: match.results.length === 3
  });
}

function onDealEnd(result) {
  page.result = result;
  (result.ns > 0 ? sound.made : sound.down)();
  fillResult();
  showOverlay("bridge-deal-result");
}

function recordResult(won) {
  const stats = page.stats[flow.match().level];
  stats.played += 1;
  if (won) stats.won += 1;
  saveStats(page.stats);
  showLevel();
}

function onMatchEnd(match) {
  page.result = null;
  clearMatch();
  const sum = totals(match);
  const tie = sum.ns === sum.ew;
  recordResult(sum.ns > sum.ew);
  window.MuchogamesMatch.finish(
    tie ? undefined : { won: sum.ns > sum.ew, score: sum.ns - sum.ew }
  );
  if (!tie) (sum.ns > sum.ew ? sound.win : sound.lose)();
  fillMatchEnd(match, page.lang, t);
  showOverlay("bridge-match-end");
}

function showHands() {
  const match = flow.match();
  const deal = currentDeal(match);
  const trump = dealState(deal).trump ?? -1;
  const result = page.result || match.results[match.results.length - 1];
  const { contract } = result;
  $("bridge-hands-contract").textContent =
    `${contractLabel(page.lang, contract)} ${seatName(page.lang, contract.declarer)} ${resultMark(result)}`;
  fillDiagram($("bridge-hands-diagram"), deal, page.lang, trump);
  showOverlay("bridge-hands-panel");
}

function showScore() {
  const match = flow.match();
  if (!match) return;
  const shown = page.result
    ? { ...match, results: [...match.results, page.result] }
    : match;
  fillScore($("bridge-score-table"), shown, page.lang, t);
  showOverlay("bridge-score-panel");
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
  $("bridge-rules-content").innerHTML = rulesHtml(page.lang);
  bidBox.relabel(page.lang);
  showLevel();
  flow.render();
  fillResult();
  if (!$("bridge-match-end").hidden) fillMatchEnd(flow.match(), page.lang, t);
}

function applySettings() {
  $("bridge-app").dataset.deck = page.settings.deck;
  setSoundEnabled(page.settings.sound === "on");
  renderChoices(page.settings);
  showLevel();
  flow.render();
}

function choose(setting, value) {
  page.settings[setting] = value;
  saveSettings(page.settings);
  applySettings();
}

function showScreen(playing) {
  $("bridge-start-screen").hidden = playing;
  $("bridge-stage").hidden = !playing;
}

function mount(match) {
  OVERLAYS.forEach((id) => showOverlay(id, false));
  page.result = null;
  showScreen(true);
  flow.mount(match);
}

function returnToStart() {
  flow.unmount();
  if (window.MuchogamesMatch.isInProgress()) window.MuchogamesMatch.finish();
  clearMatch();
  page.result = null;
  OVERLAYS.forEach((id) => showOverlay(id, false));
  renderResume(null);
  showScreen(false);
}

async function startMatch() {
  if (page.starting) return;
  page.starting = true;
  if (window.MuchogamesMatch.isInProgress()) window.MuchogamesMatch.finish();
  const allowed = await window.MuchogamesMatch.start(GAME_ID);
  page.starting = false;
  if (!allowed) return void (flow.match() && returnToStart());
  const match = createMatch(page.settings.level);
  saveMatch(match);
  renderResume(null);
  mount(match);
}

function resumeMatch() {
  const saved = loadSaved();
  if (!saved) {
    clearMatch();
    return void renderResume(null);
  }
  window.MuchogamesMatch.resume(GAME_ID);
  mount(saved);
}

function nextDeal() {
  showOverlay("bridge-deal-result", false);
  page.result = null;
  flow.next();
}

function onKey(event) {
  if (!flow.match() || !$("game-options-panel").hidden || event.altKey) return;
  const key = event.key.toLowerCase();
  if ((event.ctrlKey || event.metaKey) && key === "z") flow.undo();
  else if (
    !event.ctrlKey &&
    !event.metaKey &&
    key === "h" &&
    page.settings.hints === "on"
  ) {
    flow.hint();
  } else return;
  event.preventDefault();
}

function bindPage() {
  buildOptions();
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
  bindChoices(choose);
  const actions = {
    "bridge-play-button": startMatch,
    "bridge-resume-button": resumeMatch,
    "bridge-undo-button": () => flow.undo(),
    "bridge-hint-button": () => flow.hint(),
    "bridge-last-trick-button": () => flow.lastTrick(),
    "bridge-score-button": showScore,
    "bridge-status-contract": () => flow.toggleAuction(),
    "bridge-claim-button": () => flow.claim(),
    "bridge-quit-button": returnToStart,
    "bridge-next-deal-button": nextDeal,
    "bridge-see-hands-button": showHands,
    "bridge-result-score-button": showScore,
    "bridge-hands-close": () => showOverlay("bridge-hands-panel", false),
    "bridge-score-close": () => showOverlay("bridge-score-panel", false),
    "bridge-replay-button": startMatch,
    "bridge-change-settings-button": returnToStart,
    "bridge-match-hands-button": showHands
  };
  Object.entries(actions).forEach(([id, fn]) =>
    $(id).addEventListener("click", fn)
  );
  document.addEventListener("keydown", onKey);
}

bindPage();
applySettings();
applyLanguage();
renderResume(loadSaved());
