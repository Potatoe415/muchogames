// Yatzy online session: matchmaking wiring, session persistence and remote
// state sync. Extracted from app.js. createSessionController(deps) closes
// over app.js's `state` object directly (same instance, mutated in place)
// and calls back into app.js's core game-state/scoring helpers through deps,
// since those are shared with the local/robot/defeat-mode gameplay that
// stays in app.js. CATEGORIES is a getter because rule-setting changes
// rebuild it (see initializeRuntimeDefinitions), and the scoring-animation
// flag is a getter/setter pair because it is also flipped by the local
// scoring flow in app.js - both sides must see the same value.
window.YATZY_SESSION = {
  createSessionController(deps) {
    const {
      state,
      t,
      render,
      storage,
      storageKey,
      playerMeta,
      getCategories,
      isOnlineGame,
      isSplashBusy,
      navigateToHub,
      resetGame,
      resetBonusRollHunt,
      resetDefeatModeTapCount,
      syncRuntimeRulesFromSetup,
      persistPlayerNameFromInput,
      cloneRuleSettings,
      initializeRuntimeDefinitions,
      applySetupSettings,
      createInitialState,
      buildEmptyScorecard,
      isScoreboardFull,
      applyWinnerFromScores,
      recordGameResultIfNeeded,
      animateDiceIntoScoreCell,
      maybeTriggerOnlineYatzyCelebration,
      handleEmojiReceived,
      handleDefeatModeNoticeReceived,
      isScoringAnimationInFlight,
      setScoringAnimationInFlight
    } = deps;

    const MATCHMAKING = window.YATZY_MATCHMAKING;
    const CHARGED_MATCH_KEY = "yatzy-charged-match";
    let remoteSyncPromise = Promise.resolve();
    let pendingRemoteSyncCount = 0;
    let remoteApplyInFlight = false;
  function handleSplashBack(event) {
    event.preventDefault();
    if (state.screen === "splash" && state.splashView === "online" && !isSplashBusy()) {
      state.splashView = "modes";
      state.session.splashError = "";
      render();
      return;
    }
    navigateToHub();
  }

  function handlePlayOnline() {
    state.splashView = "online";
    state.session.splashError = "";
    render();
  }

  async function handleWaitingCancel() {
    await leaveCurrentGame({ deleteCurrent: true });
    clearDeepLinkFromUrl();
    resetGame({
      screen: "splash",
      language: state.setup.language,
      mode: state.setup.mode,
      splashView: "online"
    });
  }

  function handleJoinCodeInput(event) {
    state.session.joinCode = MATCHMAKING.normalizeCode(event.target.value);
    state.session.splashError = "";
    render();
  }

  async function handleShareGame() {
    if (!state.session.gameCode) {
      return;
    }

    const shareUrl = buildGameShareUrl(state.session.gameCode);

    try {
      if (navigator.share) {
        await navigator.share({
          title: t("splash.title"),
          text: t("splash.shareText"),
          url: shareUrl
        });
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        state.session.splashStatus = t("splash.shareSuccess");
        render();
      } else {
        window.prompt("Copy this link", shareUrl);
      }
    } catch (error) {
      if (error?.name === "AbortError") {
        return;
      }

      state.session.splashError = t("splash.shareError");
      render();
    }
  }

  async function handleCreateGame() {
    if (!MATCHMAKING) {
      setSplashError("missing-config");
      return;
    }

    persistPlayerNameFromInput();
    state.setup.mode = "online";
    syncRuntimeRulesFromSetup();
    state.session.connectionState = "creating";
    state.session.role = "creator";
    state.session.resumeToken = "";
    state.session.localPlayerIndex = 0;
    state.session.splashError = "";
    state.session.splashStatus = "";
    render();

    try {
      const createdGame = await MATCHMAKING.createGame(createMatchmakingCallbacks());
      state.session.gameCode = createdGame.code;
      state.session.role = createdGame.role || "creator";
      state.session.localPlayerIndex = createdGame.localPlayerIndex ?? 0;
      state.session.resumeToken = createdGame.resumeToken || "";
      state.session.connectionState = "waiting";
      state.session.splashStatus = t("splash.waitingStatus", { code: createdGame.code });
      updateUrlForGameCode(createdGame.code);
      persistOnlineSession();
      render();
    } catch (error) {
      state.session.connectionState = "idle";
      state.session.role = null;
      state.session.resumeToken = "";
      state.session.localPlayerIndex = null;
      state.session.gameCode = "";
      setSplashError(error?.code);
      render();
    }
  }

  async function handleJoinGame() {
    if (!MATCHMAKING) {
      setSplashError("missing-config");
      return;
    }

    const code = MATCHMAKING.normalizeCode(state.session.joinCode);

    if (code.length !== 3) {
      setSplashError("invalid-code");
      render();
      return;
    }

    persistPlayerNameFromInput();
    state.setup.mode = "online";
    syncRuntimeRulesFromSetup();
    state.session.connectionState = "joining";
    state.session.role = "joiner";
    state.session.resumeToken = "";
    state.session.localPlayerIndex = 1;
    state.session.gameCode = code;
    state.session.splashError = "";
    state.session.splashStatus = t("splash.joiningStatus", { code });
    render();

    try {
      const joinedGame = await MATCHMAKING.joinGame(
        code,
        createMatchmakingCallbacks(),
        readSeatCredentialsFor(code)
      );
      state.session.gameCode = joinedGame.code;
      state.session.role = joinedGame.role || "joiner";
      state.session.localPlayerIndex = joinedGame.localPlayerIndex ?? 1;
      state.session.resumeToken = joinedGame.resumeToken || "";
      state.session.connectionState = "connected";
      state.session.splashStatus = t("splash.connectedStatus", { code: joinedGame.code });
      updateUrlForGameCode(joinedGame.code);
      persistOnlineSession();
      render();
    } catch (error) {
      state.session.connectionState = "idle";
      state.session.role = null;
      state.session.resumeToken = "";
      state.session.localPlayerIndex = null;
      state.session.gameCode = "";
      state.session.splashStatus = "";
      setSplashError(error?.code);
      render();
    }
  }

  function handleDeepLinkJoin() {
    if (state.screen !== "splash" || readPersistedOnlineSession()) {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const linkedCode = MATCHMAKING?.normalizeCode(params.get("game") || "");

    if (!linkedCode || linkedCode.length !== 3) {
      return;
    }

    state.splashView = "online";
    state.session.joinCode = linkedCode;
    render();
    handleJoinGame();
  }

  async function restoreOnlineSession() {
    const persisted = readPersistedOnlineSession();

    if (!persisted || !MATCHMAKING) {
      return;
    }

    state.splashView = "online";
    state.setup.mode = "online";
    state.session.gameCode = persisted.gameCode;
    state.session.joinCode = persisted.gameCode;
    state.session.role = persisted.role;
    state.session.resumeToken = persisted.resumeToken;
    state.session.localPlayerIndex = persisted.localPlayerIndex;
    state.session.connectionState = "restoring";
    state.session.splashError = "";
    state.session.splashStatus = t("splash.restoringStatus", { code: persisted.gameCode });
    render();

    try {
      const resumed = await MATCHMAKING.resumeGame(
        persisted.gameCode,
        persisted.role,
        persisted.resumeToken,
        createMatchmakingCallbacks()
      );
      state.session.gameCode = resumed.code;
      state.session.joinCode = resumed.code;
      state.session.connectionState = resumed.status === "waiting" ? "waiting" : "connected";
      state.session.splashStatus = resumed.status === "waiting"
        ? t("splash.waitingStatus", { code: resumed.code })
        : t("splash.connectedStatus", { code: resumed.code });
      persistOnlineSession();

      if (resumed.status === "waiting") {
        render();
      }
    } catch (error) {
      clearPersistedOnlineSession();
      state.session.connectionState = "idle";
      state.session.gameCode = "";
      state.session.joinCode = "";
      state.session.role = null;
      state.session.resumeToken = "";
      state.session.localPlayerIndex = null;
      state.session.splashStatus = "";
      setSplashError(error?.code);
      render();
    }
  }

  function createMatchmakingCallbacks() {
    return {
      startGameCallback: handleMatchStarted,
      stateChangeCallback: handleMatchStateChange,
      gameClosedCallback: handleMatchClosed,
      emojiReceivedCallback: handleEmojiReceived,
      noticeReceivedCallback: handleDefeatModeNoticeReceived
    };
  }

  function handleMatchStarted(payload) {
    const previousSession = { ...state.session };
    const freshState = createInitialState();
    freshState.screen = "game";
    freshState.setup.mode = "online";
    freshState.setup.language = state.setup.language;
    freshState.setup.reverseDiceSelectionByPlayer = [...state.setup.reverseDiceSelectionByPlayer];
    freshState.setup.extraRollEasterEgg = state.setup.extraRollEasterEgg;
    freshState.setup.defeatModeEnabled = state.setup.defeatModeEnabled;
    freshState.setup.rules = cloneRuleSettings(state.setup.rules);
    initializeRuntimeDefinitions(freshState.setup.rules);
    freshState.session = {
      ...freshState.session,
      ...previousSession,
      gameCode: payload.code,
      connectionState: "connected",
      splashError: "",
      splashStatus: t("splash.connectedStatus", { code: payload.code })
    };
    applySetupSettings(freshState);

    if (payload.gameState) {
      hydrateFromRemoteGameState(freshState, payload.gameState);
    }

    Object.assign(state, freshState);
    persistOnlineSession();
    render();
    chargeOnlineMatchOnce(payload.code);

    if (!payload.gameState && state.session.localPlayerIndex === 0) {
      syncOnlineGameState();
    }
  }

  // Each seat pays once per room, when the match starts (both seats filled).
  // Every online rematch opens a new room, so a code seen again here is a
  // reload/resume of the same match: no second coin. Out of coins, this
  // player leaves, which closes the room for the other one.
  async function chargeOnlineMatchOnce(code) {
    if (storage.readJSON(CHARGED_MATCH_KEY) === code) {
      window.MuchogamesMatch.resume("yatsy");
      return;
    }
    if (await window.MuchogamesMatch.start("yatsy")) {
      storage.writeJSON(CHARGED_MATCH_KEY, code);
      return;
    }
    await leaveCurrentGame();
    resetGame({
      screen: "splash",
      language: state.setup.language,
      mode: "online",
      splashView: "online"
    });
  }

  function handleMatchStateChange(payload) {
    state.session.gameCode = payload.code;
    persistOnlineSession();

    if (state.screen === "splash") {
      if (payload.status === "waiting" && state.session.role === "creator") {
        state.session.connectionState = "waiting";
        state.session.splashStatus = t("splash.waitingStatus", { code: payload.code });
      }

      render();
      return;
    }

    if (payload.gameState) {
      if (isSameGameState(payload.gameState, serializeGameState())) {
        return;
      }

      // While one of our own actions (die toggle/roll/score) is still being
      // written to the DB, an incoming refetch can carry a stale snapshot from
      // before that write. Applying it would visibly un-select a die, or even
      // revert a just-committed turn, since scoring flips currentPlayerIndex
      // locally before the write goes out (so isLocalPlayersTurn() alone can't
      // be used as the guard here). Local state stays authoritative for our
      // own pending action regardless of whose turn it now looks like; the
      // tick broadcast that follows the last write brings the listener back
      // in sync once every pending write has settled.
      // Also skip while an animation is already in flight, local or remote:
      // awaiting the flight animation below opens a window where a second,
      // newer refetch could otherwise interleave and apply out of order, or
      // collide with the local player's own in-progress scoring animation.
      // Dropping it here is safe — the tick broadcast after every write plus
      // the poll timer guarantee a follow-up refetch once this one finishes.
      if (pendingRemoteSyncCount > 0 || remoteApplyInFlight || isScoringAnimationInFlight()) {
        return;
      }

      applyRemoteGameState(payload.gameState);
    }
  }

  // Mirrors the local roll/score visuals (same dimmed "not-rollable" look and
  // the same dice-spin / flight-to-scorecell animations already used for the
  // robot's turn) so the remote player's moves are visible and clearly not the
  // local player's own input, instead of the board silently jumping to a new
  // state.
  async function applyRemoteGameState(remoteState) {
    remoteApplyInFlight = true;
    const previousDiceValues = state.dice.map((die) => die.value);
    const previousScores = state.scores.map((scorecard) => ({ ...scorecard }));
    const previousPlayerIndex = state.currentPlayerIndex;

    // hydrateFromRemoteGameState() reads targetState.players (via
    // applyWinnerFromScores) when the incoming state ends the game, so it
    // must be seeded here even though this object is otherwise just a
    // staging area for the fields hydrate actually writes.
    const nextFields = { players: state.players };
    hydrateFromRemoteGameState(nextFields, remoteState);

    if (nextFields.currentPlayerIndex !== previousPlayerIndex || nextFields.rollsRemaining === 3) {
      resetBonusRollHunt();
      resetDefeatModeTapCount();
    }

    const scoreEvent = findRemoteScoreEvent(previousScores, nextFields.scores);
    if (scoreEvent) {
      await playRemoteScoreAnimation(scoreEvent);
    }

    const rolledRemotely = !scoreEvent
      && previousPlayerIndex === nextFields.currentPlayerIndex
      && nextFields.dice.some((die, index) => die.value !== previousDiceValues[index]);

    Object.assign(state, nextFields);
    state.animateDiceOnRender = rolledRemotely;
    maybeTriggerOnlineYatzyCelebration(previousDiceValues, previousPlayerIndex);
    render();

    if (rolledRemotely) {
      state.animateDiceOnRender = false;
    }

    remoteApplyInFlight = false;
  }

  async function playRemoteScoreAnimation(scoreEvent) {
    setScoringAnimationInFlight(true);
    render();

    try {
      await animateDiceIntoScoreCell(scoreEvent.playerIndex, scoreEvent.categoryKey);
    } finally {
      setScoringAnimationInFlight(false);
    }
  }

  function findRemoteScoreEvent(previousScores, nextScores) {
    for (let playerIndex = 0; playerIndex < nextScores.length; playerIndex += 1) {
      const previousCard = previousScores[playerIndex] || {};
      const nextCard = nextScores[playerIndex] || {};
      const filledCategory = getCategories().find((category) => (
        previousCard[category.key] === null && nextCard[category.key] !== null
      ));

      if (filledCategory) {
        return { playerIndex, categoryKey: filledCategory.key };
      }
    }

    return null;
  }

  function handleMatchClosed({ reason }) {
    window.MuchogamesMatch.finish();
    clearPersistedOnlineSession();
    clearDeepLinkFromUrl();
    resetGame({
      screen: "splash",
      language: state.setup.language
    });

    if (reason) {
      setSplashError(reason === "expired" ? "game-expired" : "roomClosed");
      render();
    }
  }

  async function leaveCurrentGame(options = {}) {
    if (!MATCHMAKING) {
      return;
    }

    try {
      await MATCHMAKING.leaveGame(options);
    } catch (error) {
      // Leaving is best-effort. The local reset below still returns the UI safely.
    }

    clearPersistedOnlineSession();
    clearDeepLinkFromUrl();
  }

  function setSplashError(errorCode) {
    const translationKey = {
      "missing-config": "splash.missingConfig",
      "invalid-code": "splash.invalidCode",
      "game-not-found": "splash.gameNotFound",
      "game-expired": "splash.gameExpired",
      "game-in-progress": "splash.gameInProgress",
      "resume-denied": "splash.gameInProgress",
      replaced: "splash.sessionReplaced",
      missing: "splash.roomClosed",
      expired: "splash.gameExpired"
    }[errorCode] || "splash.genericError";

    state.session.splashError = t(translationKey);
  }

  function persistOnlineSession() {
    if (!state.session.gameCode || !isOnlineGame()) {
      return;
    }

    storage.writeJSON(storageKey, {
      gameCode: state.session.gameCode,
      role: state.session.role,
      resumeToken: state.session.resumeToken,
      localPlayerIndex: state.session.localPlayerIndex
    });
  }

  function buildGameShareUrl(gameCode) {
    const url = new URL(window.location.href);
    url.searchParams.set("game", gameCode);
    return url.toString();
  }

  function updateUrlForGameCode(gameCode) {
    const url = new URL(window.location.href);
    url.searchParams.set("game", gameCode);
    window.history.replaceState({}, "", url);
  }

  function clearDeepLinkFromUrl() {
    const url = new URL(window.location.href);
    if (!url.searchParams.has("game")) {
      return;
    }

    url.searchParams.delete("game");
    window.history.replaceState({}, "", url);
  }

  function readPersistedOnlineSession() {
    const parsed = storage.readJSON(storageKey);
    if (!parsed?.gameCode || !parsed?.role || !parsed?.resumeToken || !Number.isInteger(parsed?.localPlayerIndex)) {
      return null;
    }

    return parsed;
  }

  function clearPersistedOnlineSession() {
    storage.remove(storageKey);
  }

  // A room that is already playing has both seats taken, so joining it by code
  // only works for a player reclaiming the seat they already hold.
  function readSeatCredentialsFor(code) {
    const persisted = readPersistedOnlineSession();

    if (!persisted || persisted.gameCode !== code) {
      return null;
    }

    return { role: persisted.role, resumeToken: persisted.resumeToken };
  }

  function hydrateFromRemoteGameState(targetState, remoteState) {
    targetState.currentPlayerIndex = remoteState.currentPlayerIndex === 1 ? 1 : 0;
    targetState.rollsRemaining = clampRollsRemaining(remoteState.rollsRemaining);
    targetState.turnPhase = remoteState.turnPhase === "scoring" ? "scoring" : "rolling";
    targetState.pendingScoreSelection = null;
    targetState.lastCommittedTurn = null;
    targetState.animateDiceOnRender = false;
    targetState.yatzyCelebration = null;

    targetState.dice = Array.from({ length: 5 }, (_, index) => {
      const remoteDie = Array.isArray(remoteState.dice) ? remoteState.dice[index] : null;
      const value = Number.isInteger(remoteDie?.value) && remoteDie.value >= 1 && remoteDie.value <= 6
        ? remoteDie.value
        : null;

      return {
        value,
        locked: Boolean(remoteDie?.locked),
        lastRolled: Boolean(remoteDie?.lastRolled)
      };
    });

    targetState.scores = playerMeta.map((_, playerIndex) => {
      const emptyCard = buildEmptyScorecard();
      const remoteCard = Array.isArray(remoteState.scores) ? remoteState.scores[playerIndex] : null;

      getCategories().forEach((category) => {
        const value = remoteCard?.[category.key];
        emptyCard[category.key] = Number.isFinite(value) ? value : null;
      });

      return emptyCard;
    });

    // Adopt the remote seat's real name if the payload carries one; the local
    // seat's own name (already set by applySetupSettings from the profile)
    // is never overwritten by a remote payload.
    targetState.players = playerMeta.map((_, playerIndex) => {
      const existing = targetState.players?.[playerIndex] || {};
      const isLocalSeat = playerIndex === state.session.localPlayerIndex;
      const remoteName = remoteState.players?.[playerIndex]?.name;
      return {
        name: !isLocalSeat && remoteName ? remoteName : existing.name,
        isRobot: Boolean(existing.isRobot)
      };
    });

    targetState.gameOver = Boolean(remoteState.gameOver) || isScoreboardFull(targetState.scores);
    targetState.winner = null;

    if (targetState.gameOver) {
      applyWinnerFromScores(targetState);
      recordGameResultIfNeeded(targetState);
    }
  }

  function clampRollsRemaining(value) {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed >= 0 && parsed <= 3 ? parsed : 3;
  }

  function serializeGameState() {
    return {
      currentPlayerIndex: state.currentPlayerIndex,
      dice: state.dice.map((die) => ({
        value: die.value,
        locked: die.locked,
        lastRolled: die.lastRolled
      })),
      rollsRemaining: state.rollsRemaining,
      turnPhase: state.turnPhase,
      scores: state.scores.map((scorecard) => ({ ...scorecard })),
      gameOver: state.gameOver,
      // Only carries each seat's display name so the opponent can see it —
      // see hydrateFromRemoteGameState(), which only ever adopts the *other*
      // seat's name from this and always keeps the local seat's own name.
      players: state.players.map((player) => ({ name: player.name }))
    };
  }

  function isSameGameState(leftState, rightState) {
    return JSON.stringify(leftState) === JSON.stringify(rightState);
  }

  function syncOnlineGameState() {
    if (!isOnlineGame() || !MATCHMAKING) {
      return remoteSyncPromise;
    }

    const gameCode = state.session.gameCode;
    pendingRemoteSyncCount += 1;

    // Chain onto the previous send instead of firing in parallel: quick,
    // repeated die clicks must reach the server in the order they happened,
    // otherwise an earlier request finishing last could overwrite a later one.
    // serializeGameState() is read lazily inside the .then, so it always picks
    // up the freshest local state at send time, not at click time.
    remoteSyncPromise = remoteSyncPromise
      .catch(() => {})
      .then(() => MATCHMAKING.updateGameState(gameCode, serializeGameState()))
      .catch(() => {
        // The listener remains authoritative. If one sync fails, the next local
        // state change will attempt to publish again.
      })
      .finally(() => {
        pendingRemoteSyncCount -= 1;
      });

    return remoteSyncPromise;
  }
    return {
      handlePlayOnline,
      handleCreateGame,
      handleShareGame,
      handleWaitingCancel,
      handleJoinGame,
      handleJoinCodeInput,
      handleSplashBack,
      handleDeepLinkJoin,
      restoreOnlineSession,
      leaveCurrentGame,
      syncOnlineGameState,
      clearPersistedOnlineSession
    };
  }
};