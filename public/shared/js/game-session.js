/* Match lifecycle shared by every in-repo game (docs/PLATFORM_RULES.md):
   start() spends the daily coin and counts the match, finish() records the
   result, and a back button (data-id="game-back-button") or an in-match quit
   control (data-match-quit) asks before leaving a match in progress. Plain global script (window.MuchogamesMatch) so module
   and classic game scripts can both call it. */
(function () {
  const ENDPOINT = "/api/match";
  const STYLESHEET_URL = "/shared/css/game-session.css";
  const PROFILE_SCRIPT_URL = "/shared/js/profile-results.js";
  const DEVICE_KEY = "muchogames-device-id";
  const MATCH_COUNTS_KEY = "muchogames-match-counts";
  const LANG_STORAGE_KEY = "bergamots-lang";
  const REQUEST_TIMEOUT_MS = 4000;

  const COPY = {
    fr: {
      outOfCoins:
        "Vous n'avez plus de pièces pour aujourd'hui. Revenez demain !",
      ok: "OK",
      quit: "Quitter la partie ?",
      leave: "Quitter",
      stay: "Continuer"
    },
    en: {
      outOfCoins: "You're out of coins for today. Come back tomorrow!",
      ok: "OK",
      quit: "Leave the match?",
      leave: "Leave",
      stay: "Keep playing"
    },
    es: {
      outOfCoins: "No te quedan monedas por hoy. ¡Vuelve mañana!",
      ok: "OK",
      quit: "¿Salir de la partida?",
      leave: "Salir",
      stay: "Seguir jugando"
    }
  };

  const state = {
    gameId: "",
    inProgress: false,
    pendingStart: null,
    bypassBack: false
  };
  let profileBridge = null;
  let dialog = null;

  function copy() {
    try {
      return COPY[localStorage.getItem(LANG_STORAGE_KEY)] || COPY.fr;
    } catch {
      return COPY.fr;
    }
  }

  function inferGameId() {
    const match = window.location.pathname.match(/\/games\/([^/]+)\//);
    if (match) return match[1];
    return new URLSearchParams(window.location.search).get("game") || "";
  }

  // Same key on every same-origin page; the hub forwards it to coinchapp and
  // Tranquil so an anonymous player has one coin counter everywhere.
  function readDeviceId() {
    try {
      let id = localStorage.getItem(DEVICE_KEY);
      if (!id && typeof crypto.randomUUID === "function") {
        id = crypto.randomUUID();
        localStorage.setItem(DEVICE_KEY, id);
      }
      return id || "";
    } catch {
      return "";
    }
  }

  function loadProfileBridge() {
    if (window.MuchogamesProfileResults) {
      return Promise.resolve(window.MuchogamesProfileResults);
    }
    if (!profileBridge) {
      profileBridge = new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = PROFILE_SCRIPT_URL;
        script.onload = script.onerror = () =>
          resolve(window.MuchogamesProfileResults || null);
        document.head.appendChild(script);
      });
    }
    return profileBridge;
  }

  function countLocalMatch(gameId) {
    try {
      const counts = JSON.parse(localStorage.getItem(MATCH_COUNTS_KEY) || "{}");
      counts[gameId] = (Number(counts[gameId]) || 0) + 1;
      localStorage.setItem(MATCH_COUNTS_KEY, JSON.stringify(counts));
    } catch {
      // Storage unavailable — only the local "matches started" count is lost.
    }
  }

  // Only an explicit `started: false` refuses the match: a server or network
  // failure lets the player through rather than blocking play.
  async function spendCoin(gameId) {
    try {
      const bridge = await loadProfileBridge();
      const response = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "start",
          gameId,
          deviceId: readDeviceId(),
          idToken: bridge?.readLiveIdToken() || ""
        }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
      });
      const data = await response.json().catch(() => null);
      return !(response.ok && data && data.started === false);
    } catch {
      return true;
    }
  }

  async function requestStart(gameId) {
    state.gameId = gameId;
    if (!(await spendCoin(gameId))) {
      showOutOfCoins();
      return false;
    }
    state.inProgress = true;
    countLocalMatch(gameId);
    return true;
  }

  /** Resolves true when the match may start. Concurrent calls share one spend. */
  function start(gameId) {
    if (!state.pendingStart) {
      state.pendingStart = requestStart(gameId || inferGameId()).finally(() => {
        state.pendingStart = null;
      });
    }
    return state.pendingStart;
  }

  /** `won` only when there is one unambiguous local player; omit otherwise. */
  function finish(result) {
    state.inProgress = false;
    const won = result?.won;
    if (typeof won !== "boolean") return;
    window.PlayerProfile?.recordGameResult(won);
    const details = {
      gameId: state.gameId || inferGameId(),
      score: result.score
    };
    loadProfileBridge().then((bridge) =>
      bridge?.recordSharedResult(won, details)
    );
  }

  function ensureStylesheet() {
    if (document.querySelector(`link[href="${STYLESHEET_URL}"]`)) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = STYLESHEET_URL;
    document.head.appendChild(link);
  }

  function buildDialog() {
    ensureStylesheet();
    dialog = document.createElement("div");
    dialog.className = "mg-match-dialog";
    dialog.setAttribute("role", "alertdialog");
    dialog.setAttribute("aria-modal", "true");
    dialog.hidden = true;
    dialog.innerHTML = `
      <div class="mg-match-dialog__backdrop" data-answer="no"></div>
      <div class="mg-match-dialog__sheet">
        <p class="mg-match-dialog__text"></p>
        <div class="mg-match-dialog__actions">
          <button type="button" class="mg-match-dialog__cancel" data-answer="no"></button>
          <button type="button" class="mg-match-dialog__confirm" data-answer="yes"></button>
        </div>
      </div>`;
    document.body.appendChild(dialog);
  }

  // One dialog element serves both uses; `id` names the current purpose so
  // its data-ids stay descriptive. Resolves true on confirm.
  function showDialog({ id, message, confirm, cancel }) {
    if (!dialog) buildDialog();
    const cancelButton = dialog.querySelector(".mg-match-dialog__cancel");
    const confirmButton = dialog.querySelector(".mg-match-dialog__confirm");
    dialog.dataset.id = id;
    dialog.querySelector(".mg-match-dialog__text").textContent = message;
    dialog.querySelector(".mg-match-dialog__text").dataset.id = `${id}-message`;
    confirmButton.textContent = confirm;
    confirmButton.dataset.id = `${id}-confirm`;
    cancelButton.textContent = cancel || "";
    cancelButton.dataset.id = `${id}-cancel`;
    cancelButton.hidden = !cancel;
    dialog.hidden = false;
    confirmButton.focus();
    return new Promise((resolve) => {
      dialog.onclick = (event) => answerFrom(event.target, resolve);
      dialog.onkeydown = (event) => {
        if (event.key === "Escape") answer(false, resolve);
      };
    });
  }

  function answerFrom(target, resolve) {
    const choice = target.closest("[data-answer]")?.dataset.answer;
    if (choice) answer(choice === "yes", resolve);
  }

  function answer(value, resolve) {
    dialog.hidden = true;
    dialog.onclick = dialog.onkeydown = null;
    resolve(value);
  }

  function showOutOfCoins() {
    const strings = copy();
    return showDialog({
      id: "out-of-coins-dialog",
      message: strings.outOfCoins,
      confirm: strings.ok
    });
  }

  async function confirmLeave(backButton) {
    const strings = copy();
    const leave = await showDialog({
      id: "quit-match-dialog",
      message: strings.quit,
      confirm: strings.leave,
      cancel: strings.stay
    });
    if (!leave) return;
    state.inProgress = false;
    state.bypassBack = true;
    backButton.click();
    state.bypassBack = false;
  }

  // Capture phase on document runs before the game's own click handlers.
  // `data-match-quit` marks an in-match quit control (e.g. a ✖ returning to
  // the game's own start screen): it gets the same confirmation.
  function interceptBack(event) {
    const backButton = event.target.closest?.(
      '[data-id="game-back-button"], [data-match-quit]'
    );
    if (!backButton || !state.inProgress || state.bypassBack) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    confirmLeave(backButton);
  }

  document.addEventListener("click", interceptBack, true);
  loadProfileBridge();

  window.MuchogamesMatch = {
    start,
    finish,
    isInProgress: () => state.inProgress,
    showOutOfCoins
  };
})();
