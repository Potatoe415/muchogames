// Page shell: language, options panel, start screen, overlays and the match
// lifecycle (docs/PLATFORM_RULES.md). The match itself lives in game.js and
// is destroyed whenever the page is left or a new match starts.
import { createGame } from "./game.js";
import { createHowto } from "./howto.js";
import { createHud } from "./hud.js";
import { LANGS, fruitName, rulesHtml, tips, translate } from "./i18n.js";
import * as prefs from "./prefs.js";
import { clearMatch, loadMatch, storeMatch } from "./save.js";
import { paintIcon } from "./sprites.js";

const GAME_ID = "fruitmerge";
const SAVE_EVERY_MS = 1000;
const PARADE = [0, 3, 6, 8, 10];
const OVERLAYS = { paused: "fruitmerge-paused", end: "fruitmerge-end" };

const $ = (id) => document.querySelector(`[data-id="${id}"]`);

const stored = prefs.loadPrefs();
const page = {
  ...stored,
  lang: LANGS.includes(stored.lang) ? stored.lang : "fr",
  game: null,
  saved: loadMatch(),
  saveTimer: 0,
  summary: null,
  overlay: null,
  newBest: false,
  starting: false
};

const t = (key, vars) => translate(page.lang, key, vars);
const nameOf = (level) => fruitName(page.lang, level);
const hud = createHud({ t, fruitName: nameOf });
const howto = createHowto({
  t,
  tips: () => tips(page.lang),
  onClose: () => {
    prefs.saveHowtoSeen();
    page.howtoSeen = true;
    syncPause();
    if (page.game && page.overlay === null) $("fruitmerge-canvas").focus();
  }
});

function renderStart() {
  $("fruitmerge-start-best").textContent = t("bestLine", { best: page.best });
  const resume = $("fruitmerge-resume-button");
  resume.hidden = !page.saved;
  if (page.saved) {
    resume.querySelector("[data-resume-info]").textContent = t("resumeInfo", {
      score: page.saved.score
    });
  }
  document.querySelectorAll("[data-parade]").forEach((canvas, i) => {
    paintIcon(canvas, PARADE[i]);
  });
}

function renderEnd() {
  const s = page.summary;
  if (!s) return;
  $("fruitmerge-end-score").textContent = t("endScore", s);
  $("fruitmerge-end-top").textContent = t("endTop", { fruit: nameOf(s.top) });
  $("fruitmerge-end-best").textContent = page.newBest
    ? t("newBest")
    : t("best", { best: page.best });
  if (page.overlay === "end") paintIcon($("fruitmerge-end-fruit"), s.top);
}

function applyLanguage() {
  document.documentElement.lang = page.lang;
  document.querySelectorAll("[data-i18n]").forEach((node) => {
    node.textContent = t(node.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-aria]").forEach((node) => {
    node.setAttribute("aria-label", t(node.dataset.i18nAria));
  });
  document.querySelectorAll("[data-lang]").forEach((button) => {
    const chosen = button.dataset.lang === page.lang;
    button.classList.toggle("active", chosen);
    button.setAttribute("aria-pressed", String(chosen));
  });
  $("fruitmerge-rules-content").innerHTML = rulesHtml(page.lang);
  const sound = $("fruitmerge-sound-toggle");
  sound.textContent = t(page.muted ? "off" : "on");
  sound.setAttribute("aria-pressed", String(!page.muted));
  renderStart();
  renderEnd();
  hud.repaint();
  howto.render();
}

function syncPause() {
  const optionsOpen = !$("game-options-panel").hidden;
  const blocked = optionsOpen || page.overlay !== null || howto.isOpen();
  page.game?.setPaused(blocked);
}

function showOverlay(name) {
  page.overlay = name;
  Object.entries(OVERLAYS).forEach(([key, id]) => {
    $(id).hidden = key !== name;
  });
  renderEnd();
  syncPause();
  if (name === null && page.game) $("fruitmerge-canvas").focus();
}

function showScreen(playing) {
  $("fruitmerge-start-screen").hidden = playing;
  $("fruitmerge-stage").hidden = !playing;
}

// A finished match has no snapshot, so this only ever stores one in play.
function saveMatch() {
  const world = page.game?.snapshot();
  if (world) storeMatch(world);
}

function onEnd(summary) {
  page.summary = summary;
  page.newBest = summary.score > page.best;
  if (page.newBest) {
    page.best = summary.score;
    prefs.saveBest(summary.score);
  }
  clearMatch();
  page.saved = null;
  window.MuchogamesMatch.finish({ score: summary.score });
  showOverlay("end");
}

function onHud(state) {
  hud.render(state);
  saveMatch();
}

function mountGame(saved) {
  unmountGame();
  page.summary = null;
  page.newBest = false;
  showScreen(true);
  hud.repaint();
  page.game = createGame({
    canvas: $("fruitmerge-canvas"),
    host: $("fruitmerge-board"),
    saved,
    muted: page.muted,
    onHud,
    onEnd
  });
  showOverlay(null);
  saveMatch();
  page.saveTimer = setInterval(saveMatch, SAVE_EVERY_MS);
}

async function startMatch() {
  if (page.starting) return;
  window.MuchogamesTv?.play();
  page.starting = true;
  const allowed = await window.MuchogamesMatch.start(GAME_ID);
  page.starting = false;
  if (!allowed) return;
  mountGame(null);
  if (!page.howtoSeen) openHowto();
}

// A resumed match always comes back paused.
function resumeMatch() {
  if (page.starting) return;
  const saved = loadMatch();
  page.saved = saved;
  if (!saved) return renderStart();
  window.MuchogamesTv?.play();
  window.MuchogamesMatch.resume(GAME_ID);
  mountGame(saved);
  showOverlay("paused");
}

function unmountGame() {
  saveMatch();
  clearInterval(page.saveTimer);
  page.game?.destroy();
  page.game = null;
  page.overlay = null;
}

// Quitting is not an end: no finish(), the save stays for the resume
// button.
function returnToStart() {
  unmountGame();
  page.saved = loadMatch();
  Object.values(OVERLAYS).forEach((id) => ($(id).hidden = true));
  showScreen(false);
  applyLanguage();
}

function openHowto() {
  howto.open();
  syncPause();
}

function toggleSound() {
  page.muted = !page.muted;
  prefs.saveMuted(page.muted);
  page.game?.setMuted(page.muted);
  applyLanguage();
}

function setLanguage(lang) {
  page.lang = lang;
  prefs.saveLang(lang);
  applyLanguage();
}

function pauseIfPlaying() {
  if (page.game && page.overlay === null && !howto.isOpen()) {
    showOverlay("paused");
  }
}

function onVisibility() {
  if (!document.hidden) return;
  saveMatch();
  pauseIfPlaying();
}

function bindStart() {
  document.querySelectorAll("[data-lang]").forEach((button) => {
    button.addEventListener("click", () => setLanguage(button.dataset.lang));
  });
  $("fruitmerge-sound-toggle").addEventListener("click", toggleSound);
  $("fruitmerge-play-button").addEventListener("click", startMatch);
  $("fruitmerge-resume-button").addEventListener("click", resumeMatch);
  $("fruitmerge-howto-button").addEventListener("click", openHowto);
}

function bindStage() {
  $("fruitmerge-sweep-button").addEventListener("click", () =>
    page.game?.sweep()
  );
  $("fruitmerge-undo-button").addEventListener("click", () =>
    page.game?.undo()
  );
  $("fruitmerge-pause-button").addEventListener("click", pauseIfPlaying);
  $("fruitmerge-continue-button").addEventListener("click", () =>
    showOverlay(null)
  );
  $("fruitmerge-paused-howto-button").addEventListener("click", openHowto);
  $("fruitmerge-paused-menu-button").addEventListener("click", returnToStart);
  $("fruitmerge-replay-button").addEventListener("click", startMatch);
  $("fruitmerge-end-menu-button").addEventListener("click", returnToStart);
}

function bindPage() {
  const panel = $("game-options-panel");
  window.GameHeader?.initOptionsPanel($("game-options-button"), panel);
  new MutationObserver(syncPause).observe(panel, {
    attributes: true,
    attributeFilter: ["hidden"]
  });
  document.addEventListener("visibilitychange", onVisibility);
  document.addEventListener("keydown", (event) => {
    if (event.key === "p" || event.key === "P") pauseIfPlaying();
  });
  window.addEventListener("pagehide", unmountGame);
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) returnToStart();
  });
  window.addEventListener("resize", () => hud.repaint());
}

bindStart();
bindStage();
bindPage();
applyLanguage();
