// Page shell: i18n, options panel, touch overlay and match coins.
import { LANGS, rulesHtml, translate } from "./i18n.js";
import { emitKey, KEYS } from "./keys.js";
import { bindControls } from "./overlay.js";
import { bindScoreLine } from "./score.js";
import { isMuted, setMuted, setSilenced } from "./sound.js";

const GAME_ID = "spacecadet";
const LANG_KEY = "bergamots-lang";
const $ = (id) => document.querySelector(`[data-id="${id}"]`);

function readLang() {
  try {
    const stored = localStorage.getItem(LANG_KEY) ?? "fr";
    return LANGS.includes(stored) ? stored : "fr";
  } catch {
    return "fr";
  }
}

const page = { lang: readLang(), starting: false };
const t = (key) => translate(page.lang, key);

function writeLang(lang) {
  try {
    localStorage.setItem(LANG_KEY, lang);
  } catch {
    // Storage unavailable: the value only lasts for this visit.
  }
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
  $("spacecadet-rules-content").innerHTML = rulesHtml(page.lang);
  paintMute();
  const status = $("spacecadet-status");
  status.dataset.loading = t("downloading");
  status.dataset.error = t("exception");
}

function paintMute() {
  const button = $("spacecadet-mute");
  button.textContent = t(isMuted() ? "soundOff" : "soundOn");
  button.setAttribute("aria-pressed", String(isMuted()));
}

async function ensureMatch(restart) {
  const match = window.MuchogamesMatch;
  if (!match) return true;
  if (!restart && match.isInProgress()) return true;
  if (page.starting) return false;
  page.starting = true;
  if (match.isInProgress()) window.MuchogamesMatch.finish();
  const allowed = await window.MuchogamesMatch.start(GAME_ID);
  page.starting = false;
  return allowed;
}

async function startPlaying(restart) {
  const allowed = await ensureMatch(restart);
  if (allowed && !document.body.classList.contains("sc-playing")) {
    document.body.classList.add("sc-playing");
    window.dispatchEvent(new Event("resize"));
  }
  return allowed;
}

// Game Dashboard <-> table. The table stays laid out under the dashboard
// (SDL keeps its canvas size); it is only made invisible and inert.
function showScreen(playing) {
  document.body.classList.toggle("sc-dash", !playing);
  $("spacecadet-dashboard-screen").hidden = playing;
  $("spacecadet-play-screen").inert = !playing;
  $("game-back-button").hidden = playing;
  $("spacecadet-quit-button").hidden = !playing;
  setSilenced(!playing);
  if (playing) $("spacecadet-frame").focus({ preventScroll: true });
}

// A new table every time: F2 resets the one left behind by a quit.
async function playFromDashboard() {
  window.MuchogamesTv?.play();
  if (!(await startPlaying(true))) return;
  showScreen(true);
  emitKey("keydown", KEYS.newgame);
  emitKey("keyup", KEYS.newgame);
}

// Runs once game-session.js's "Leave match?" dialog is confirmed. No
// resume (NOTES.md): the next Play deals a new table.
function quitMatch() {
  if (window.MuchogamesMatch?.isInProgress()) window.MuchogamesMatch.finish();
  showScreen(false);
}

function onPress(action) {
  if (action === "newgame") return startPlaying(true);
  if (action === "plunge") return startPlaying(false);
  return Promise.resolve(true);
}

function bindPage() {
  const panel = $("game-options-panel");
  window.GameHeader?.initOptionsPanel($("game-options-button"), panel);
  document.querySelectorAll("[data-lang]").forEach((button) => {
    button.addEventListener("click", () => {
      page.lang = button.dataset.lang;
      writeLang(page.lang);
      applyLanguage();
    });
  });
  $("spacecadet-mute").addEventListener("click", () => {
    setMuted(!isMuted());
    paintMute();
  });
  $("spacecadet-start-button").addEventListener("click", playFromDashboard);
  $("spacecadet-quit-button").addEventListener("click", quitMatch);
  bindControls({
    onPress,
    isPlaying: () => !document.body.classList.contains("sc-dash")
  });
  bindScoreLine();
}

bindPage();
applyLanguage();
showScreen(false);
