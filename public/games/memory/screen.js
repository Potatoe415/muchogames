import { GRID_IDS, LEVELS, MODES } from "./config.js";
import { BACKS, THEME_IDS } from "./faces.js";
import { rulesHtml, translate } from "./i18n.js";
import { clockText, soloPoints } from "./points.js";
import { paintBoard } from "./view.js";

const $ = (id) => document.querySelector(`[data-id="${id}"]`);
const text = (page, key, vars) => translate(page.lang, key, vars);

function mark(id, on) {
  const button = $(id);
  button.classList.toggle("is-selected", on);
  button.setAttribute("aria-pressed", on ? "true" : "false");
}

function paintPickers(page) {
  THEME_IDS.forEach((theme) =>
    mark(`memory-theme-${theme}`, page.setup.theme === theme)
  );
  BACKS.forEach((back) => {
    mark(`memory-back-${back}`, page.setup.back === back);
    $(`memory-back-${back}`).setAttribute(
      "aria-label",
      text(page, "backN", { n: Number(back) })
    );
  });
}

function paintResume(page) {
  const { saved, code } = page.resume;
  $("memory-resume").hidden = !saved && !code;
  $("memory-resume-button").hidden = !saved;
  const online = $("memory-resume-online-button");
  online.hidden = !code;
  online.textContent = text(page, "resumeOnline", { code });
}

export function paintSetup(page) {
  paintResume(page);
  paintPickers(page);
  MODES.forEach((mode) =>
    mark(`memory-mode-${mode}`, page.setup.mode === mode)
  );
  LEVELS.forEach((level) =>
    mark(`memory-level-${level}`, page.setup.difficulty === level)
  );
  GRID_IDS.forEach((grid) =>
    mark(`memory-grid-${grid}`, page.setup.grid === grid)
  );
  const online = page.setup.mode === "online";
  $("memory-difficulty").hidden = page.setup.mode !== "bot";
  $("memory-online").hidden = !online;
  const start = $("memory-start-button");
  start.disabled = page.starting;
  start.textContent = text(
    page,
    page.starting ? "loading" : online ? "create" : "start"
  );
  $("memory-app").dataset.loading = page.starting ? "true" : "false";
  const error = $("memory-online-error");
  error.hidden = !page.online.error;
  error.textContent = page.online.error ? text(page, page.online.error) : "";
}

export function paintWait(page) {
  const { status, code, note } = page.online;
  $("memory-wait-code").textContent = code || "···";
  $("memory-wait-status").textContent = text(
    page,
    status === "waiting" ? "waiting" : "connecting"
  );
  $("memory-share-button").hidden = status !== "waiting";
  $("memory-wait-note").hidden = !note;
  $("memory-wait-note").textContent = note ? text(page, note) : "";
}

// Online, the local player sits at the bottom in blue whichever seat they hold.
function mySeat(page, state) {
  return state.config.mode === "online" ? (page.seat ?? 0) : 0;
}

// Live while playing; the stamped time once the match is over or not built yet.
function soloMs(page, state) {
  return page.match?.elapsed() ?? state.elapsedMs;
}

function names(page, state) {
  if (state.config.mode === "solo") {
    return { top: "", bottom: text(page, "you") };
  }
  if (state.config.mode === "bot") {
    return { top: text(page, "robot"), bottom: text(page, "you") };
  }
  if (state.config.mode === "online") {
    const me = mySeat(page, state);
    return {
      top: page.names[1 - me] || text(page, "opponent"),
      bottom: page.names[me] || text(page, "you")
    };
  }
  return { top: text(page, "player2"), bottom: text(page, "player1") };
}

function topScore(page, state) {
  if (state.config.mode !== "solo") {
    return String(state.scores[1 - mySeat(page, state)]);
  }
  const left = state.cards.length / 2 - state.scores[0];
  return text(page, "left", { n: left });
}

function paintSoloPills(page, state) {
  const solo = state.config.mode === "solo";
  const ms = solo ? soloMs(page, state) : 0;
  const n = solo ? soloPoints(state, ms) : 0;
  const points = $("memory-points");
  const clock = $("memory-clock");
  points.hidden = !solo;
  clock.hidden = !solo;
  points.dataset.negative = String(n < 0);
  points.textContent = solo ? text(page, "points", { n }) : "";
  clock.textContent = solo ? clockText(ms) : "";
}

export function paintMute(page) {
  const button = $("memory-mute-button");
  button.dataset.muted = page.muted ? "true" : "false";
  button.setAttribute("aria-pressed", page.muted ? "true" : "false");
  button.setAttribute("aria-label", text(page, page.muted ? "unmute" : "mute"));
}

function paintBars(page, state) {
  const label = names(page, state);
  const live = state.phase !== "GAME_OVER";
  const me = mySeat(page, state);
  const mine = state.active === me;
  $("memory-p1-name").textContent = label.bottom;
  $("memory-p2-name").textContent = label.top;
  $("memory-p1-score").textContent = String(state.scores[me]);
  $("memory-p2-score").textContent = topScore(page, state);
  paintSoloPills(page, state);
  $("memory-player-one").dataset.active = live && mine ? "true" : "false";
  $("memory-player-two").dataset.active = live && !mine ? "true" : "false";
  $("memory-play").dataset.active = live ? (mine ? "0" : "1") : "";
}

function endTitle(page, state) {
  if (state.config.mode === "solo") return text(page, "soloWin");
  if (state.winner === "tie") return text(page, "tie");
  if (state.config.mode === "pass") {
    return text(page, state.winner === 0 ? "p1wins" : "p2wins");
  }
  return text(page, state.winner === mySeat(page, state) ? "win" : "lose");
}

export function soloDetail(page, state) {
  return text(page, "soloDetail", {
    pairs: state.scores[0],
    misses: state.misses,
    forgotten: state.forgotten,
    time: clockText(state.elapsedMs)
  });
}

function paintEnd(page) {
  if (!page.ended || !page.state) return;
  const state = page.state;
  const me = mySeat(page, state);
  const solo = state.config.mode === "solo";
  const n = solo ? soloPoints(state, state.elapsedMs) : 0;
  const line = $("memory-end-line");
  $("memory-end-title").textContent = endTitle(page, state);
  line.dataset.negative = String(n < 0);
  line.textContent = solo
    ? text(page, "endPoints", { n })
    : `${state.scores[me]} – ${state.scores[1 - me]}`;
  const detail = $("memory-end-detail");
  detail.hidden = !solo;
  detail.textContent = solo ? soloDetail(page, state) : "";
  $("memory-share-score-button").hidden = !solo;
  $("memory-end").hidden = false;
}

export function paintClock(page) {
  if (page.state?.config.mode === "solo") paintBars(page, page.state);
}

export function paintPlay(page) {
  if (!page.state) return;
  const state = page.state;
  paintBars(page, state);
  paintBoard($("memory-board"), state, {
    hidden: text(page, "hiddenCard"),
    face: (faceId) => text(page, "card", { n: Number(faceId) }),
    theirs:
      state.config.mode === "online" && state.active !== mySeat(page, state)
  });
  $("memory-away-banner").hidden = !(
    state.config.mode === "online" &&
    page.online.away &&
    state.phase !== "GAME_OVER"
  );
  paintMute(page);
  paintEnd(page);
}

export function applyLanguage(page) {
  document.documentElement.lang = page.lang;
  document.title = text(page, "title");
  document.querySelectorAll("[data-i18n]").forEach((node) => {
    node.textContent = text(page, node.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-aria]").forEach((node) => {
    node.setAttribute("aria-label", text(page, node.dataset.i18nAria));
  });
  document.querySelectorAll("[data-lang]").forEach((button) => {
    button.classList.toggle("is-selected", button.dataset.lang === page.lang);
  });
  $("memory-rules").innerHTML = rulesHtml(page.lang);
  $("memory-join-input").placeholder = text(page, "codePlaceholder");
  paintSetup(page);
  paintWait(page);
  paintPlay(page);
}

export function reportEnd(page) {
  const state = page.state;
  const me = mySeat(page, state);
  const score =
    state.config.mode === "solo"
      ? soloPoints(state, state.elapsedMs)
      : state.scores[me];
  if (state.config.mode === "pass") {
    window.MuchogamesMatch.finish();
    return;
  }
  if (state.config.mode === "solo" || state.winner === me) {
    window.MuchogamesMatch.finish({ won: true, score });
    return;
  }
  if (state.winner === "tie") {
    window.MuchogamesMatch.finish({ score });
    return;
  }
  window.MuchogamesMatch.finish({ won: false, score });
}
