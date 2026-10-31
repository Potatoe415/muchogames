// Yatzy save/resume (docs/PLATFORM_RULES.md section 8): the local match save,
// the splash "Reprendre" buttons and the online away/back presence notices.
// The online seat itself stays owned by session.js (yatzy-online-session).
window.YATZY_RESUME = {
  createResumeController(deps) {
    const {
      state,
      t,
      render,
      storage,
      saveKey,
      matchmaking,
      isOnlineGame,
      isSplashBusy,
      createInitialState,
      applySetupSettings,
      initializeRuntimeDefinitions,
      cloneRuleSettings,
      getUndoRemainingMs,
      startUndoWindow,
      getBonusRollState,
      setBonusRollState,
      readOnlineSeat,
      resumeOnlineSession,
      leaveCurrentGame
    } = deps;

    const SAVE_VERSION = 2;
    const MATCH_FIELDS = [
      "dice",
      "rollsRemaining",
      "turnPhase",
      "scores",
      "currentPlayerIndex",
      "defeatMode",
      "pendingScoreSelection",
      "lastCommittedTurn"
    ];
    const elements = {
      localButton: document.getElementById("resume-game-button"),
      onlineButton: document.getElementById("resume-online-button"),
      awayBanner: document.getElementById("opponent-away-banner")
    };

    elements.localButton?.addEventListener("click", resumeLocalMatch);
    elements.onlineButton?.addEventListener("click", () => resumeOnlineMatch());
    window.addEventListener("pagehide", handlePageHidden);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        handlePageHidden();
        return;
      }
      sendPresence(false);
    });

  function isLocalMatchOnScreen() {
    return state.screen === "game" && !isOnlineGame();
  }

  function buildLocalSave() {
    const save = {
      version: SAVE_VERSION,
      mode: state.setup.mode,
      diceTheme: state.setup.diceTheme,
      rules: cloneRuleSettings(state.setup.rules),
      reverseDiceSelectionByPlayer: [...state.setup.reverseDiceSelectionByPlayer],
      undoRemainingMs: state.lastCommittedTurn ? getUndoRemainingMs() : 0,
      bonusRoll: getBonusRollState()
    };
    MATCH_FIELDS.forEach((field) => {
      save[field] = state[field];
    });
    return save;
  }

  // Runs after every render. Only the end of the match deletes the save; the
  // splash screen never does, so the home button keeps it.
  function persistLocal() {
    if (!isLocalMatchOnScreen()) {
      return;
    }
    if (state.gameOver) {
      storage.remove(saveKey);
      return;
    }
    storage.writeJSON(saveKey, buildLocalSave());
  }

  function readLocalSave() {
    const saved = storage.readJSON(saveKey);
    return isValidLocalSave(saved) ? saved : null;
  }

  function isValidLocalSave(saved) {
    return Boolean(saved)
      && saved.version === SAVE_VERSION
      && (saved.mode === "solo" || saved.mode === "robot")
      && (saved.currentPlayerIndex === 0 || saved.currentPlayerIndex === 1)
      && Array.isArray(saved.dice) && saved.dice.length === 5
      && Array.isArray(saved.scores) && saved.scores.length === 2
      && Array.isArray(saved.defeatMode)
      && Number.isInteger(saved.rollsRemaining) && saved.rollsRemaining >= 0 && saved.rollsRemaining <= 3;
  }

  // Rules come from the save, not the splash settings: the scorecard keys
  // depend on which categories were enabled when the match started.
  function resumeLocalMatch() {
    const saved = readLocalSave();
    if (!saved) {
      render();
      return;
    }

    const rules = cloneRuleSettings(saved.rules);
    initializeRuntimeDefinitions(rules);
    const fresh = createInitialState();
    fresh.screen = "game";
    fresh.setup = {
      ...state.setup,
      mode: saved.mode,
      diceTheme: saved.diceTheme === "watercolor" ? "watercolor" : "default",
      rules,
      reverseDiceSelectionByPlayer: [0, 1].map((index) => Boolean(saved.reverseDiceSelectionByPlayer?.[index]))
    };
    applySetupSettings(fresh);
    MATCH_FIELDS.forEach((field) => {
      fresh[field] = saved[field] ?? fresh[field];
    });
    Object.assign(state, fresh);
    setBonusRollState(saved.bonusRoll);
    restoreUndoWindow(saved.undoRemainingMs);
    window.MuchogamesMatch.resume("yatsy");
    render();
  }

  function restoreUndoWindow(remainingMs) {
    if (state.lastCommittedTurn && remainingMs > 0) {
      startUndoWindow(remainingMs);
      return;
    }
    state.lastCommittedTurn = null;
  }

  async function resumeOnlineMatch() {
    await resumeOnlineSession();
    sendPresence(false);
  }

  // A finished match has nothing to come back to, so its seat is dropped.
  async function leaveOnlineMatch() {
    if (state.gameOver) {
      await leaveCurrentGame();
      return;
    }
    sendPresence(true);
    await leaveCurrentGame({ keepSeat: true });
  }

  function sendPresence(away) {
    if (state.screen !== "game" || !isOnlineGame() || state.gameOver) {
      return;
    }
    matchmaking?.sendNotice({ type: "presence", seat: state.session.localPlayerIndex, away });
  }

  // True when the notice is a presence one, so other notice handlers skip it.
  function handlePresenceNotice(payload) {
    if (payload?.type !== "presence") {
      return false;
    }
    const seat = payload.seat;
    if ((seat === 0 || seat === 1) && seat !== state.session.localPlayerIndex && typeof payload.away === "boolean") {
      state.opponentAway = payload.away;
      render();
    }
    return true;
  }

  function handlePageHidden() {
    persistLocal();
    sendPresence(true);
  }

  function renderResumeUi() {
    const onSplash = state.screen === "splash" && !isSplashBusy();
    const seat = onSplash ? readOnlineSeat() : null;
    const hasLocalSave = onSplash && state.splashView === "modes" && Boolean(readLocalSave());
    toggleButton(elements.localButton, hasLocalSave, t("resume.local"));
    toggleButton(elements.onlineButton, Boolean(seat), seat ? t("resume.online", { code: seat.gameCode }) : "");
    renderAwayBanner();
  }

  function toggleButton(button, visible, label) {
    if (!button) {
      return;
    }
    button.classList.toggle("is-hidden", !visible);
    button.disabled = !visible;
    button.textContent = label;
  }

  function renderAwayBanner() {
    const banner = elements.awayBanner;
    if (!banner) {
      return;
    }
    const visible = state.screen === "game" && isOnlineGame() && Boolean(state.opponentAway) && !state.gameOver;
    const opponent = state.players[state.session.localPlayerIndex === 0 ? 1 : 0];
    banner.classList.toggle("is-hidden", !visible);
    banner.textContent = visible ? t("resume.opponentAway", { name: opponent?.name || "" }) : "";
  }
    return {
      persistLocal,
      renderResumeUi,
      leaveOnlineMatch,
      handlePresenceNotice
    };
  }
};
