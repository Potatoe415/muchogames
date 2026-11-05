/* blackstories.js
  Expects these files in the SAME folder:
  - ./black_stories_fr.json
  - ./black_stories_en.json
  - ./black_stories_es.json

  Each file can be either:
  A) { "stories": [ {id,title,short_story,full_story}, ... ] }
  OR
  B) [ {id,title,short_story,full_story}, ... ]

  Required fields per story:
  - title
  - short_story
  - full_story
  - id (recommended; if missing we generate one)
*/

import { loadRulesIfExists } from "../../shared/js/engine.js";

import { COPY } from "./blackstories-i18n.js";
import {
  clearSave,
  idsToIndexes,
  readSave,
  resumeLabel,
  writeSave,
} from "./blackstories-save.js";

const els = {
  title: document.getElementById("title"),
  shortStory: document.getElementById("shortStory"),
  fullStory: document.getElementById("fullStory"),
  revealBox: document.getElementById("revealBox"),
  revealHint: document.getElementById("revealHint"),
  //toggleRevealBtn: document.getElementById("toggleRevealBtn"),
  prevBtn: document.getElementById("prevBtn"),
  nextBtn: document.getElementById("nextBtn"),
  storyCounter: document.getElementById("storyCounter"),
  storyId: document.getElementById("storyId"),
  langBtns: Array.from(document.querySelectorAll(".langBtn")),
  illusWrap: document.getElementById("illusWrap"),
  illusImg: document.getElementById("illusImg"),
  settingsButton: document.getElementById("settingsButton"),
  settingsPanel: document.getElementById("settingsPanel"),
  rulesSection: document.getElementById("rulesSection"),
  rulesContent: document.getElementById("rulesContent"),
  splashScreen: document.getElementById("splashScreen"),
  gameContainer: document.getElementById("gameContainer"),
  startButton: document.getElementById("startButton"),
  resumeButton: document.getElementById("resumeButton"),
  quitButton: document.getElementById("quitButton"),
  backLink: document.querySelector('[data-id="game-back-button"]'),
};

function t(key) {
  return (COPY[currentLang] || COPY.fr)[key];
}

function applyCopy() {
  document.documentElement.lang = currentLang;
  document.querySelectorAll("[data-i18n]").forEach((node) => {
    node.textContent = t(node.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-aria]").forEach((node) => {
    node.setAttribute("aria-label", t(node.dataset.i18nAria));
  });
}

function storeLang(lang) {
  try {
    localStorage.setItem("blackstories_lang", lang);
    localStorage.setItem("bergamots-lang", lang);
  } catch {
    // Storage unavailable: the choice lasts for this visit.
  }
}

const FILES = {
  fr: "./black_stories_fr.json",
  en: "./black_stories_en.json",
  es: "./black_stories_es.json",
};

const ILLUSTRATIONS_DIR = "./assets";
const ILLUSTRATIONS_EXTS = ["png", "jpeg", "png", "webp"];

function setIllustrationVisible(isVisible){
  if (!els.illusWrap) return;
  els.illusWrap.classList.toggle("illusHidden", !isVisible);
}

function updateIllustration(storyId){
  if (!els.illusImg || !els.illusWrap) return;

  const idStr = String(storyId ?? "").trim();
  if (!idStr) {
    setIllustrationVisible(false);
    return;
  }

  // On cache pendant qu’on charge, et on ne montre que si ça marche
  setIllustrationVisible(false);

  let idx = 0;

  const tryNext = () => {
    if (idx >= ILLUSTRATIONS_EXTS.length) {
      // aucune extension trouvée
      els.illusImg.removeAttribute("src");
      setIllustrationVisible(false);
      return;
    }

    const ext = ILLUSTRATIONS_EXTS[idx++];
    const url = `${ILLUSTRATIONS_DIR}/${encodeURIComponent(idStr)}.${ext}`;

    // Important: on force un nouveau chargement
    els.illusImg.onload = () => {
      setIllustrationVisible(true);
    };
    els.illusImg.onerror = () => {
      tryNext();
    };

    els.illusImg.src = url;
  };

  tryNext();
}


let DATA = { fr: [], en: [], es: [] };

let currentLang = "fr";
let revealed = false;

// History as indices in DATA[currentLang]
let history = [];
let historyPos = -1;

// Saving starts only once a session is started or resumed, so the splash
// never overwrites the previous session's save.
let inSession = false;
let pendingSave = null;

function normalizeLang(lang) {
  const l = (lang || "").toLowerCase().trim();
  return (l === "fr" || l === "en" || l === "es") ? l : "fr";
}

function setLangUI(lang) {
  currentLang = normalizeLang(lang);
  storeLang(currentLang);
  applyCopy();
  if (els.resumeButton) els.resumeButton.textContent = resumeLabel(currentLang);

  els.langBtns.forEach(btn => {
    const isActive = normalizeLang(btn.dataset.lang) === currentLang;
    btn.setAttribute("aria-pressed", isActive ? "true" : "false");
  });
}
async function refreshRules() {
  if (!els.rulesSection || !els.rulesContent) return;

  const html = await loadRulesIfExists("blackstories", currentLang);
  if (!html) {
    els.rulesSection.style.display = "none";
    return;
  }

  els.rulesContent.innerHTML = html;
  els.rulesSection.style.display = "";
}

function setReveal(state) {
  revealed = !!state;
  els.fullStory.classList.toggle("hidden", !revealed);
  els.revealHint.textContent = revealed ? t("hideHint") : t("revealHint");
}

function safeText(x) {
  return (typeof x === "string") ? x : "";
}

function getStories() {
  return DATA[currentLang] || [];
}

function ensureIds(stories, lang) {
  return stories.map((s, i) => {
    const id = (s && (s.id ?? s.story_id ?? s._id)) ?? `${lang}-${i+1}`;
    return {
      id: String(id),
      title: safeText(s?.title),
      short_story: safeText(s?.short_story ?? s?.short ?? s?.story_short),
      full_story: safeText(s?.full_story ?? s?.full ?? s?.story_full),
    };
  }).filter(s => s.title || s.short_story || s.full_story);
}

function renderByIndex(idx) {
  const stories = getStories();
  const story = stories[idx];

  if (!story) {
    els.title.textContent = t("noStory");
    els.shortStory.textContent = t("noStoryBody");
    els.fullStory.textContent = "";
    els.storyCounter.textContent = `0 ${t("stories")} (${currentLang.toUpperCase()})`;
    els.storyId.textContent = "ID: —";
    els.prevBtn.disabled = true;
    els.nextBtn.disabled = true;
    setReveal(false);
    return;
  }

  els.title.textContent = story.title || t("untitled");
  els.shortStory.textContent = story.short_story || "—";
  els.fullStory.textContent = story.full_story || "—";

  const total = stories.length;
  els.storyCounter.textContent = `${total} ${t("stories")} (${currentLang.toUpperCase()})`;
  els.storyId.textContent = `ID: ${story.id ?? "—"}`;

  els.prevBtn.disabled = historyPos <= 0;
  els.nextBtn.disabled = total <= 1; // still allow next for random, but if only 1 story, pointless
  
  updateIllustration(story.id);
setIllustrationVisible(false);


  setReveal(false);
}

function pickRandomIndexAvoiding(currentIdx) {
  const stories = getStories();
  const n = stories.length;
  if (n <= 1) return 0;

  let tries = 0;
  while (tries < 20) {
    const idx = Math.floor(Math.random() * n);
    if (idx !== currentIdx) return idx;
    tries++;
  }
  // fallback
  return (currentIdx + 1) % n;
}

function goNext() {
  const stories = getStories();
  if (!stories.length) return;

  // if we're not at the end of history, truncate (classic browser behavior)
  if (historyPos < history.length - 1) {
    history = history.slice(0, historyPos + 1);
  }

  const currentIdx = (historyPos >= 0) ? history[historyPos] : null;
  const nextIdx = pickRandomIndexAvoiding(currentIdx);

  history.push(nextIdx);
  historyPos = history.length - 1;
  renderByIndex(nextIdx);
  saveSession();
}

function goPrev() {
  if (historyPos <= 0) return;
  historyPos -= 1;
  renderByIndex(history[historyPos]);
  // Back at the first story: the disabled button cannot keep the focus.
  if (els.prevBtn.disabled && document.activeElement === els.prevBtn) {
    els.nextBtn.focus({ preventScroll: true });
  }
  saveSession();
}

function historyIds() {
  const stories = getStories();
  return history.map((i) => stories[i]?.id).filter(Boolean);
}

function saveSession() {
  if (!inSession) return;
  if (historyPos < 0) {
    clearSave();
    return;
  }
  writeSave({ lang: currentLang, history: historyIds(), pos: historyPos, revealed });
}

function restoreHistory(ids, pos) {
  const mapped = idsToIndexes(ids, pos, getStories());
  if (!mapped) return false;
  history = mapped.history;
  historyPos = mapped.pos;
  renderByIndex(history[historyPos]);
  return true;
}

async function loadOne(lang, url) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  const json = await res.json();

  let stories = [];
  if (Array.isArray(json)) stories = json;
  else if (json && Array.isArray(json.stories)) stories = json.stories;
  else if (json && Array.isArray(json.stories_list)) {
    // if you ever accidentally give the old format, we try to salvage it
    const block = json.stories_list.find(x => normalizeLang(x.language) === lang);
    stories = block?.stories || [];
  }

  return ensureIds(stories, lang);
}

async function loadAll() {
  const langs = ["fr", "en", "es"];
  const results = await Promise.allSettled(langs.map(l => loadOne(l, FILES[l])));

  results.forEach((r, i) => {
    const lang = langs[i];
    if (r.status === "fulfilled") {
      DATA[lang] = r.value;
    } else {
      // If you mess up filenames or JSON, you’ll see it immediately.
      console.error(`Failed loading ${lang}:`, r.reason);
      DATA[lang] = [];
    }
  });
}

function resetHistoryAndStart() {
  history = [];
  historyPos = -1;

  const stories = getStories();
  if (!stories.length) {
    renderByIndex(-1);
    return;
  }

  // start with a random story
  const first = Math.floor(Math.random() * stories.length);
  history.push(first);
  historyPos = 0;
  renderByIndex(first);
}

// Screens use `hidden` (watched by tv-remote.js) on top of the .hidden class.
function showScreen(playing) {
  els.splashScreen.classList.toggle("hidden", playing);
  els.splashScreen.hidden = playing;
  els.gameContainer.classList.toggle("hidden", !playing);
  els.gameContainer.hidden = !playing;
  els.backLink.hidden = playing;
  els.quitButton.hidden = !playing;
}

function enterSession() {
  inSession = true;
  pendingSave = null;
  els.resumeButton.classList.add("hidden");
  saveSession();
  showScreen(true);
}

async function startGame() {
  window.MuchogamesTv?.play();
  if (!(await window.MuchogamesMatch.start("blackstories"))) return;
  resetHistoryAndStart();
  enterSession();
}

// Runs once game-session.js's "Leave match?" dialog is confirmed: the save
// stays and the dashboard offers Resume (leaving is not an end).
function quitSession() {
  saveSession();
  inSession = false;
  showScreen(false);
  showResumeIfSaved();
  window.MuchogamesTv?.focusScreen();
}

function resumeGame() {
  const save = pendingSave;
  if (!save) return;
  window.MuchogamesTv?.play();
  setLangUI(save.lang);
  if (!restoreHistory(save.history, save.pos)) return;
  const sameStory = getStories()[history[historyPos]].id === save.history[save.pos];
  setReveal(save.revealed && sameStory);
  window.MuchogamesMatch.resume("blackstories");
  enterSession();
  void refreshRules();
}

// Story ids are shared across the language files, so the history survives a
// language change (stories missing in the new language are skipped).
function changeLang(lang) {
  const ids = historyIds();
  setLangUI(lang);
  if (!restoreHistory(ids, historyPos)) resetHistoryAndStart();
  saveSession();
  void refreshRules();
}

function showResumeIfSaved() {
  const save = readSave();
  if (save && !idsToIndexes(save.history, save.pos, DATA[save.lang] || [])) {
    clearSave();
    return;
  }
  pendingSave = save;
  els.resumeButton.classList.toggle("hidden", !save);
}

function bindEvents() {
  els.langBtns.forEach(btn => {
    btn.addEventListener("click", () => changeLang(btn.dataset.lang));
  });

  if (window.GameHeader) {
    window.GameHeader.initOptionsPanel(els.settingsButton, els.settingsPanel);
  }
  els.startButton.addEventListener("click", startGame);
  els.resumeButton.addEventListener("click", resumeGame);
  els.quitButton.addEventListener("click", quitSession);

  els.revealBox.addEventListener("click", () => {
    setReveal(!revealed);
    saveSession();
  });

  window.addEventListener("pagehide", saveSession);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") saveSession();
  });


  els.nextBtn.addEventListener("click", goNext);
  els.prevBtn.addEventListener("click", goPrev);

  // Keyboard shortcut during a session. On a TV the arrows belong to the
  // remote's focus navigation (tv-remote.js): Next / Previous are buttons.
  window.addEventListener("keydown", (e) => {
    if (!inSession || window.MuchogamesTv?.isOn()) return;
    if (e.target.closest?.(".options-panel, input, textarea")) return;
    if (e.key === "ArrowRight") goNext();
    if (e.key === "ArrowLeft") goPrev();
  });
}

function readStoredLang() {
  try {
    return (
      localStorage.getItem("bergamots-lang") ||
      localStorage.getItem("blackstories_lang") ||
      "fr"
    );
  } catch {
    return "fr";
  }
}

async function init() {
  setLangUI(readStoredLang());

  bindEvents();
  showScreen(false);
  await loadAll();
  resetHistoryAndStart();
  showResumeIfSaved();
  // The resume button appears after the stories load: land the remote on it.
  window.MuchogamesTv?.focusScreen();
  await refreshRules();
}

init();
