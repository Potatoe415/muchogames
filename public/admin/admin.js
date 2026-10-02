import {
  AdminRequestError,
  clearToken,
  postAdmin,
  readHubIdToken,
  readStoredToken,
  renderGoogleSignIn,
  signInWithIdToken
} from "./admin-auth.js";
import {
  hideFeedbackInbox,
  initFeedbackInbox,
  loadFeedbackInbox
} from "./admin-feedback.js";
import { renderTrendChart } from "./trend-chart.js";

const HUB_CONFIG_URL = "/hub-config.json";
const OFFLINE_MESSAGE =
  "Could not reach the server. The /api functions don't run under `npm run dev`.";

// Must stay in sync with RANGE_DAYS in api/admin/_stats.js.
const RANGE_CAPTIONS = {
  "7d": "over the last 7 days",
  "30d": "over the last 30 days",
  "6m": "over the last 6 months"
};

const titlesByGameId = new Map();
const gamesList = [];
let selectedRange = "30d";
let selectedGameId = "";
let lastStats = null;

document.addEventListener("DOMContentLoaded", () => {
  document
    .getElementById("admin-logout-button")
    .addEventListener("click", logout);
  document
    .getElementById("admin-refresh-button")
    .addEventListener("click", () => {
      loadStats(readStoredToken());
    });
  document
    .getElementById("admin-range-switch")
    .addEventListener("click", selectRange);
  document
    .getElementById("admin-trend-game-select")
    .addEventListener("change", selectGame);
  initFeedbackInbox({
    titleFor: (gameId) => titlesByGameId.get(gameId) || gameId,
    onError: handleFailure
  });

  const storedToken = readStoredToken();
  const hubIdToken = readHubIdToken();

  if (storedToken) {
    loadStats(storedToken);
  } else if (hubIdToken) {
    signIn(hubIdToken, { quiet: true });
  } else {
    showLogin();
  }
});

// `quiet` is for the hub's reused Google token, which may simply be expired:
// fall back to the sign-in button without showing that as an error.
async function signIn(idToken, { quiet = false } = {}) {
  showError("");

  try {
    await loadStats(await signInWithIdToken(idToken));
  } catch (error) {
    if (quiet && error.status === 401) {
      showLogin();
      return;
    }
    handleFailure(error);
  }
}

function showLogin() {
  document.getElementById("admin-dashboard").hidden = true;
  hideFeedbackInbox();
  document.getElementById("admin-login").hidden = false;
  renderGoogleSignIn(document.getElementById("admin-google-button"), signIn);
}

function logout() {
  clearToken();
  showLogin();
  showError("");
}

async function loadStats(token) {
  if (!token) return;

  showError("");

  try {
    const stats = await postAdmin({
      action: "stats",
      token,
      range: selectedRange
    });
    await loadGameTitles();
    render(stats);
    await loadFeedbackInbox(token);
  } catch (error) {
    handleFailure(error);
  }
}

function handleFailure(error) {
  if (!(error instanceof AdminRequestError)) {
    showError(OFFLINE_MESSAGE);
    return;
  }

  if (error.status === 401 || error.status === 403) {
    clearToken();
    showLogin();
  }

  if (error.status === 404) {
    showError(
      "Endpoint /api/admin not found. Serverless functions don't run under `npm run dev`: use `vercel dev` instead."
    );
    return;
  }

  showError(error.message);
}

function selectRange(event) {
  const option = event.target.closest(".admin-range-option");

  if (!option) return;

  selectedRange = option.dataset.range;
  loadStats(readStoredToken());
}

function selectGame(event) {
  selectedGameId = event.target.value;
  renderTrend();
}

function markActiveRange(range) {
  document
    .querySelectorAll("#admin-range-switch .admin-range-option")
    .forEach((option) => {
      const isActive = option.dataset.range === range;
      option.classList.toggle("is-active", isActive);
      option.setAttribute("aria-pressed", String(isActive));
    });
}

function render(stats) {
  document.getElementById("admin-login").hidden = true;
  document.getElementById("admin-dashboard").hidden = false;
  document.getElementById("admin-total-launches").textContent =
    stats.totalLaunches;

  // The server decides the effective range, so trust its echo over our request.
  selectedRange = stats.range;
  document.getElementById("admin-range-caption").textContent =
    RANGE_CAPTIONS[stats.range] || "";
  markActiveRange(stats.range);

  lastStats = stats;
  renderTrend();
  renderRanking(stats.ranking);
}

function renderTrend() {
  if (!lastStats) return;

  renderTrendChart(
    document.getElementById("admin-trend"),
    trendForSelectedGame(lastStats)
  );
}

// The per-game trend is already in the stats response (no extra request), so
// switching the selector is instant. A game with no launches in the current
// range has no entry there; fall back to a flat zero line on the same dates
// as the all-games trend instead of an empty chart.
function trendForSelectedGame(stats) {
  if (!selectedGameId) return stats.dailyTrend || [];

  const gameTrend = (stats.dailyTrendByGame || {})[selectedGameId];
  if (gameTrend) return gameTrend;

  return (stats.dailyTrend || []).map((point) => ({
    ...point,
    launches: 0
  }));
}

function renderRanking(ranking) {
  const list = document.getElementById("admin-ranking");
  list.innerHTML = "";

  document.getElementById("admin-empty").hidden = ranking.length > 0;

  const topCount = ranking[0]?.launches || 1;
  const fragment = document.createDocumentFragment();

  ranking.forEach((entry, index) => {
    fragment.appendChild(createRankingRow(entry, index + 1, topCount));
  });

  list.appendChild(fragment);
}

function createRankingRow(entry, rank, topCount) {
  const row = document.createElement("li");
  row.className = "admin-ranking-row";
  row.dataset.id = `admin-ranking-row-${entry.gameId}`;

  const rankLabel = document.createElement("span");
  rankLabel.className = "admin-ranking-rank";
  rankLabel.textContent = rank;

  const details = document.createElement("div");
  const name = document.createElement("p");
  name.className = "admin-ranking-name";
  name.textContent = titlesByGameId.get(entry.gameId) || entry.gameId;

  const bar = document.createElement("div");
  bar.className = "admin-ranking-bar";
  const fill = document.createElement("span");
  fill.style.width = `${Math.round((entry.launches / topCount) * 100)}%`;
  bar.appendChild(fill);

  details.append(name, bar);

  const count = document.createElement("span");
  count.className = "admin-ranking-count";
  count.textContent = entry.launches;

  row.append(rankLabel, details, count);
  return row;
}

async function loadGameTitles() {
  if (titlesByGameId.size > 0) return;

  try {
    const response = await fetch(HUB_CONFIG_URL);
    if (!response.ok) return;

    const games = await response.json();
    games.forEach((game) => {
      titlesByGameId.set(game.id, game.title);
      gamesList.push(game);
    });
    populateGameSelect();
  } catch {
    // Titles are cosmetic: fall back to raw game ids.
  }
}

function populateGameSelect() {
  const select = document.getElementById("admin-trend-game-select");

  // Only the "All Games" default option is there until this runs once.
  if (select.options.length > 1) return;

  const fragment = document.createDocumentFragment();

  gamesList.forEach((game) => {
    const option = document.createElement("option");
    option.value = game.id;
    option.textContent = game.title;
    fragment.appendChild(option);
  });

  select.appendChild(fragment);
}

function showError(message) {
  const banner = document.getElementById("admin-error");
  banner.textContent = message;
  banner.hidden = !message;
}
