// Page shell: i18n, options panel, touch overlay and match coins.
import { LANGS, rulesHtml, translate } from "./i18n.js";
import { bindControls } from "./overlay.js";
import { bindScoreLine } from "./score.js";
import { isMuted, setMuted } from "./sound.js";

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

function onPress(action) {
  if (action === "newgame") return ensureMatch(true);
  if (action === "plunge") return ensureMatch(false);
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
  bindControls({ onPress });
  bindScoreLine();
}

bindPage();
applyLanguage();
