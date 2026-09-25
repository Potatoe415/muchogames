// Yatzy DOM rendering: render() and every build*/create*/render* helper it
// calls. Extracted from app.js. This module owns no game state of its own ?
// createRenderer(deps) closes over the state/elements objects and the game
// logic functions app.js passes in, so it stays a pure projection of state
// (see the comment on render() below). CATEGORIES change identity whenever
// rule settings change (initializeRuntimeDefinitions), so those come in as
// getters (getUpperCategories/getLowerCategories) rather than plain values.
window.YATZY_RENDER = {
  createRenderer(deps) {
    const {
      state,
      elements,
      t,
      playerMeta: playerMetaList,
      bonusConfig,
      lowerRuleOptions,
      emojiController,
      getUpperCategories,
      getLowerCategories,
      isScoringAnimationInFlight,
      isOnlineGame,
      isLocalPlayersTurn,
      isRobotTurn,
      isInteractionLocked,
      isCategoryScoreable,
      previewScore,
      categoryIconText,
      categoryLabel,
      getRuleDisplayName,
      calculateUpperSection,
      calculateGrandTotal,
      getDieAriaLabel,
      canKeepSecretRollClicks,
      handleScoreSelection,
      handleDieToggle,
      scheduleRobotTurnIfNeeded,
      scheduleDefeatModeTurnIfNeeded
    } = deps;
  function render() {
    // Centralized rendering makes the UI a pure projection of current state.
    // Any state mutation is followed by a render so visuals always stay in sync.
    renderTheme();
    renderSplash();
    elements.homeButton.classList.toggle("is-hidden", state.screen !== "game");

    elements.gameCard.classList.toggle("is-hidden", state.screen !== "game");
    if (state.screen !== "game") {
      return;
    }

    renderHeader();
    renderGameSettingsPanel();
    renderScoreSummary();
    renderScoreboard();
    renderDice();
    renderRollControls();
    renderCelebration();
    scheduleRobotTurnIfNeeded();
    scheduleDefeatModeTurnIfNeeded();
  }

  function renderTheme() {
    document.documentElement.lang = state.setup.language;
    document.title = t("meta.title");
    document.body.classList.toggle("dice-theme-watercolor", state.setup.diceTheme === "watercolor");

    if (state.screen !== "game") {
      document.body.classList.remove("player-two-turn", "player-one-turn", "scoring-phase");
      elements.gameCard.classList.remove("yatzy-hit");
      return;
    }

    const isPlayerTwoTurn = !state.gameOver && state.currentPlayerIndex === 1;
    const isPlayerOneTurn = !state.gameOver && state.currentPlayerIndex === 0;
    const isScoringPhase = state.turnPhase === "scoring" || Boolean(state.pendingScoreSelection);

    document.body.classList.toggle("player-two-turn", isPlayerTwoTurn);
    document.body.classList.toggle("player-one-turn", isPlayerOneTurn);
    document.body.classList.toggle("scoring-phase", isScoringPhase);
    elements.gameCard.classList.toggle("yatzy-hit", Boolean(state.yatzyCelebration));
  }


  function renderSplash() {
    const inGame = state.screen === "game";
    elements.splashScreen.classList.toggle("is-hidden", inGame);
    document.body.classList.toggle("is-splash", !inGame);
    elements.splashTitle.textContent = t("splash.title");
    if (elements.playerNameLabel) {
      elements.playerNameLabel.textContent = t("splash.yourName");
    }
    if (elements.playerNameInput) {
      elements.playerNameInput.placeholder = t("splash.namePlaceholder");
    }
    elements.soloGameButton.textContent = t("splash.soloGame");
    elements.robotGameButton.textContent = t("splash.robotGame");
    if (elements.playOnlineButton) {
      elements.playOnlineButton.textContent = t("splash.playOnline");
    }
    elements.joinLabel.textContent = t("splash.joinLabel");
    elements.joinCodeInput.placeholder = t("splash.codePlaceholder");
    elements.joinCodeInput.value = state.session.joinCode;
    if (elements.settingsButton) {
      elements.settingsButton.setAttribute("aria-label", t("splash.settings"));
      elements.settingsButton.setAttribute("title", t("splash.settings"));
    }
    if (elements.splashBackButton) {
      elements.splashBackButton.setAttribute("aria-label", t("splash.backToHub"));
      elements.splashBackButton.setAttribute("title", t("splash.backToHub"));
    }
    elements.splashStatus.textContent = state.session.splashStatus;
    elements.splashError.textContent = state.session.splashError;
    elements.splashStatus.classList.toggle("is-visible", Boolean(state.session.splashStatus));
    elements.splashError.classList.toggle("is-visible", Boolean(state.session.splashError));

    const isCreating = state.session.connectionState === "creating";
    const isJoining = state.session.connectionState === "joining";
    const isRestoring = state.session.connectionState === "restoring";
    const isWaiting = state.session.connectionState === "waiting";
    const isBusy = isCreating || isJoining || isRestoring || isWaiting;
    const showOnline = state.splashView === "online" || isBusy;
    renderSettingsRows();

    elements.soloGameButton.classList.toggle("is-hidden", showOnline);
    elements.robotGameButton.classList.toggle("is-hidden", showOnline);
    if (elements.playOnlineButton) {
      elements.playOnlineButton.classList.toggle("is-hidden", showOnline);
    }
    if (elements.playerNameRow) {
      elements.playerNameRow.classList.toggle("is-hidden", !showOnline);
    }
    renderOnlineAvatar(elements.playerNameAvatar, showOnline);
    elements.createGameButton.classList.toggle("is-hidden", !showOnline);
    if (elements.splashJoin) {
      elements.splashJoin.classList.toggle("is-hidden", !showOnline || isWaiting || isCreating || isRestoring);
    }

    elements.soloGameButton.disabled = isBusy;
    elements.robotGameButton.disabled = isBusy;
    if (elements.playOnlineButton) {
      elements.playOnlineButton.disabled = isBusy;
    }
    elements.createGameButton.textContent = isCreating
      ? t("splash.createBusy")
      : isWaiting
        ? state.session.gameCode
        : t("splash.createGame");
    elements.createGameButton.classList.toggle("is-waiting-code", isWaiting);
    elements.shareGameButton.textContent = t("splash.shareLink");
    elements.cancelCreateButton.textContent = t("splash.cancelWaiting");
    elements.joinGameButton.textContent = isJoining ? t("splash.joinBusy") : t("splash.joinGame");
    elements.shareGameButton.classList.toggle("is-visible", isWaiting);
    elements.shareGameButton.disabled = !isWaiting;
    elements.cancelCreateButton.classList.toggle("is-visible", isWaiting);
    elements.cancelCreateButton.disabled = !isWaiting;
    elements.createGameButton.disabled = isBusy;
    elements.joinCodeInput.disabled = isBusy;
    elements.joinGameButton.disabled = isBusy || state.session.joinCode.length !== 3;
    if (elements.settingsButton) {
      elements.settingsButton.disabled = isBusy;
    }
  }

  function renderSettingsRows() {
    if (!elements.settingsList) {
      return;
    }

    elements.settingsList.innerHTML = "";

    lowerRuleOptions.forEach((option) => {
      const setting = state.setup.rules[option.key];
      const row = document.createElement("label");
      row.className = "settings-row";
      row.innerHTML = `
        <span class="settings-check">
          <input type="checkbox" data-rule-key="${option.key}" data-rule-field="enabled" ${setting.enabled ? "checked" : ""}>
        </span>
        <span class="settings-name">${getRuleDisplayName(option.key)}</span>
        <input class="settings-points" type="number" min="0" step="1" data-rule-key="${option.key}" data-rule-field="points" value="${setting.points}">
      `;
      elements.settingsList.appendChild(row);
    });

    appendSettingsToggleRow(
      "reverseDiceSelection",
      t("splash.reverseSelection"),
      state.setup.reverseDiceSelectionByPlayer[0]
    );
    appendSettingsToggleRow(
      "extraRollEasterEgg",
      t("splash.extraRollEasterEgg"),
      state.setup.extraRollEasterEgg,
      "settings-extra-roll-easter-egg"
    );
    appendSettingsToggleRow(
      "defeatModeEnabled",
      t("splash.defeatModeEnabled"),
      state.setup.defeatModeEnabled,
      "settings-defeat-mode-enabled"
    );
  }

  function appendSettingsToggleRow(settingKey, name, enabled, dataId) {
    const row = document.createElement("label");
    row.className = "settings-row settings-row-toggle";
    const dataIdAttr = dataId ? ` data-id="${dataId}"` : "";
    row.innerHTML = `
      <span class="settings-check">
        <input type="checkbox"${dataIdAttr} data-setting-key="${settingKey}" ${enabled ? "checked" : ""}>
      </span>
      <span class="settings-name">${name}</span>
      <span class="settings-points settings-pill">${enabled ? "ON" : "OFF"}</span>
    `;
    elements.settingsList.appendChild(row);
  }

  function renderHeader() {
    elements.gameTitle.textContent = isOnlineGame()
      ? `${t("header.gameTitle")} - ${state.session.gameCode}`
      : t("header.gameTitle");
    // Icon-only (YAM-UI-02): the restart/leave distinction is conveyed via
    // the accessible label, never a visible text label on the button.
    const restartLabel = isOnlineGame() ? t("controls.leaveGame") : t("controls.restart");
    elements.restartButton.setAttribute("aria-label", restartLabel);
    elements.restartButton.setAttribute("title", restartLabel);
    elements.emojiButton.setAttribute("aria-label", t("controls.sendEmoji"));
    elements.emojiButton.setAttribute("title", t("controls.sendEmoji"));
    emojiController?.syncLabels();
  }

  // The in-game settings panel (gear button on the header's top row): lets
  // whichever player is currently taking their turn change the language, or
  // flip their own dice-selection convention (select dice to reroll instead
  // of dice to keep) without touching the other player's preference - see
  // reverseDiceSelectionByPlayer on state.setup.
  function renderGameSettingsPanel() {
    if (!elements.gameSettingsButton) {
      return;
    }

    elements.gameSettingsButton.setAttribute("aria-label", t("splash.settings"));
    elements.gameSettingsButton.setAttribute("title", t("splash.settings"));
    if (elements.gameSettingsTitle) {
      elements.gameSettingsTitle.textContent = t("splash.settings");
    }
    if (elements.gameSettingsClose) {
      elements.gameSettingsClose.setAttribute("aria-label", t("game.close"));
    }
    if (elements.gameSettingsLanguageTitle) {
      elements.gameSettingsLanguageTitle.textContent = t("splash.language");
    }

    renderGameLangSelector();

    const currentPlayerName = state.players[state.currentPlayerIndex]?.name || "";
    const enabled = Boolean(state.setup.reverseDiceSelectionByPlayer[state.currentPlayerIndex]);
    if (elements.reverseSelectionLabel) {
      elements.reverseSelectionLabel.textContent = currentPlayerName
        ? `${t("splash.reverseSelection")} - ${currentPlayerName}`
        : t("splash.reverseSelection");
    }
    if (elements.reverseSelectionToggle) {
      elements.reverseSelectionToggle.checked = enabled;
    }
    if (elements.reverseSelectionPill) {
      elements.reverseSelectionPill.textContent = enabled ? "ON" : "OFF";
    }
  }

  function renderGameLangSelector() {
    if (!elements.gameLangSelector) {
      return;
    }

    const languages = [
      { code: "fr", title: t("splash.french") },
      { code: "en", title: t("splash.english") },
      { code: "es", title: t("splash.spanish") }
    ];

    elements.gameLangSelector.replaceChildren(...languages.map((language) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `lang-btn${state.setup.language === language.code ? " active" : ""}`;
      button.dataset.lang = language.code;
      button.textContent = language.code.toUpperCase();
      button.title = language.title;
      button.setAttribute("aria-label", language.title);
      return button;
    }));
  }

  function renderScoreSummary() {
    const playerOneTotal = calculateGrandTotal(state.scores[0]);
    const playerTwoTotal = calculateGrandTotal(state.scores[1]);
    const article = document.createElement("article");
    article.className = `score-card${!state.gameOver ? " is-active" : ""}`;
    article.appendChild(buildScoreHeader(playerOneTotal, playerTwoTotal));
    elements.scoreSummary.replaceChildren(article);
  }

  function buildPlayerNameChip() {
    const chip = document.createElement("span");
    chip.className = "score-card-player";
    chip.dataset.id = "yatsy-score-local-name";
    appendAvatarImg(chip, localAvatarSrc());
    const label = document.createElement("span");
    label.textContent = state.players[state.session.localPlayerIndex].name;
    chip.appendChild(label);
    return chip;
  }

  function buildScoreHeader(playerOneTotal, playerTwoTotal) {
    const header = document.createElement("div");
    header.className = "score-card-header";
    if (isOnlineGame() && Number.isInteger(state.session.localPlayerIndex)) {
      header.appendChild(buildPlayerNameChip());
    }
    const scoreline = document.createElement("span");
    scoreline.className = "score-card-scoreline";
    scoreline.innerHTML = `
        <span class="score-card-value player-one-score">${playerOneTotal}</span>
        <span class="score-card-divider">/</span>
        <span class="score-card-value player-two-score">${playerTwoTotal}</span>
    `;
    header.appendChild(scoreline);
    return header;
  }

  function localAvatarSrc() {
    return window.PlayerProfile?.getAvatarThumb?.() || window.PlayerProfile?.getAvatar?.() || "";
  }

  function renderOnlineAvatar(img, visible) {
    if (!img) return;
    const src = visible ? localAvatarSrc() : "";
    img.src = src;
    img.hidden = !src;
  }

  function appendAvatarImg(parent, src) {
    if (!src) return;
    const img = document.createElement("img");
    img.className = "player-name-avatar";
    img.alt = "";
    img.src = src;
    parent.appendChild(img);
  }

  function renderScoreboard() {
    // Rebuilding the board from state each time keeps move legality simple:
    // if a slot is scoreable in state, it becomes interactive in the DOM.
    elements.scoreboard.innerHTML = "";
    const targetRowCount = Math.max(
      getUpperCategories().length + 1,
      getLowerCategories().length
    );

    elements.scoreboard.appendChild(buildScoreGroup(getUpperCategories(), true, targetRowCount));
    elements.scoreboard.appendChild(buildScoreGroup(getLowerCategories(), false, targetRowCount));

    if (state.gameOver) {
      elements.scoreboard.appendChild(buildWinnerBanner());
    }
  }

  function buildScoreGroup(categories, includeBonusRow, targetRowCount) {
    const group = document.createElement("div");
    group.className = "score-group";
    let renderedRows = 0;

    categories.forEach((category) => {
      group.appendChild(buildCategoryCell(category));

      playerMetaList.forEach((playerMeta, playerIndex) => {
        group.appendChild(buildScoreCell(category, playerIndex, playerMeta.className));
      });

      renderedRows += 1;
    });

    if (includeBonusRow) {
      group.appendChild(buildBonusLabelCell());

      playerMetaList.forEach((playerMeta, playerIndex) => {
        group.appendChild(buildBonusProgressCell(playerIndex, playerMeta.className));
      });

      renderedRows += 1;
    }

    while (renderedRows < targetRowCount) {
      group.appendChild(buildSpacerCell());
      group.appendChild(buildSpacerCell("player-one"));
      group.appendChild(buildSpacerCell("player-two"));
      renderedRows += 1;
    }

    return group;
  }

  function buildCategoryCell(category) {
    const cell = document.createElement("div");
    cell.className = "score-cell category-cell";
    cell.setAttribute("title", categoryLabel(category.key));

    if (isCategoryScoreable(state.currentPlayerIndex, category.key) && !isRobotTurn()) {
      const scorePreview = previewScore(category.key);
      cell.classList.add("interactive", "valid");
      cell.setAttribute("role", "button");
      cell.setAttribute("tabindex", "0");
      cell.setAttribute("aria-label", t("aria.categoryScore", {
        category: categoryLabel(category.key),
        score: scorePreview
      }));
      cell.addEventListener("click", () => handleScoreSelection(category.key));
      cell.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleScoreSelection(category.key);
        }
      });
    }

    cell.appendChild(createCategoryIcon(category));
    return cell;
  }

  function buildScoreCell(category, playerIndex, className) {
    const cell = document.createElement("button");
    cell.type = "button";
    cell.className = `score-cell player-cell ${className}`;
    cell.dataset.categoryKey = category.key;
    cell.dataset.playerIndex = String(playerIndex);

    const isCurrentPlayer = playerIndex === state.currentPlayerIndex;
    const scoreValue = state.scores[playerIndex][category.key];
    const canScore = isCategoryScoreable(playerIndex, category.key);

    if (scoreValue !== null) {
      cell.classList.add("filled");
      cell.textContent = scoreValue;
      cell.disabled = true;
    } else if (canScore && !isRobotTurn()) {
      // The preview value is derived live from the dice so players can see
      // exactly what each category would score before committing the turn.
      const scorePreview = previewScore(category.key);
      cell.classList.add("interactive", "valid");
      cell.classList.add(scorePreview === 0 ? "preview-zero" : "preview-positive");
      cell.textContent = scorePreview;
      cell.addEventListener("click", () => handleScoreSelection(category.key));
      cell.setAttribute("aria-label", t("aria.playerCategoryScore", {
        player: state.players[playerIndex].name,
        category: categoryLabel(category.key),
        score: scorePreview
      }));
    } else {
      cell.classList.add("blocked");
      cell.textContent = "";
      cell.disabled = true;
    }

    if ((!isCurrentPlayer || !isLocalPlayersTurn()) && scoreValue === null) {
      cell.classList.add("blocked");
    }

    return cell;
  }

  function buildBonusLabelCell() {
    const cell = document.createElement("div");
    cell.className = "score-cell category-cell bonus-label";

    const wrapper = document.createElement("div");
    wrapper.className = "bonus-stack";
    wrapper.innerHTML = `
      <span class="bonus-title">${t("labels.bonus")}</span>
      <span class="bonus-value">+${bonusConfig.points}</span>
    `;

    cell.appendChild(wrapper);
    return cell;
  }

  function buildBonusProgressCell(playerIndex, className) {
    // Bonus display is derived each render from the recorded upper-section values.
    // That avoids mirrored aggregate state that could drift out of sync.
    const progress = calculateUpperSection(state.scores[playerIndex]);

    const cell = document.createElement("div");
    cell.className = `score-cell player-cell ${className}`;

    const bubble = document.createElement("div");
    bubble.className = "bonus-progress";
    bubble.textContent = `${progress}/${bonusConfig.threshold}`;

    cell.appendChild(bubble);
    return cell;
  }

  function buildSpacerCell(playerClassName = "") {
    const cell = document.createElement("div");
    cell.className = `score-cell ${playerClassName ? `player-cell spacer-cell ${playerClassName}` : "category-cell spacer-cell"}`;
    cell.setAttribute("aria-hidden", "true");
    return cell;
  }

  function buildWinnerBanner() {
    const overlay = document.createElement("div");
    overlay.className = "winner-banner";

    const card = document.createElement("div");
    card.className = "winner-card";

    const totals = playerMetaList.map((_, playerIndex) => calculateGrandTotal(state.scores[playerIndex]));
    const isTie = totals[0] === totals[1];

    // textContent rather than innerHTML: player names travel through the synced
    // game state, so a peer could otherwise inject markup into this card.
    const headline = document.createElement("h2");
    headline.textContent = isTie ? t("winner.tie") : t("winner.win", { name: state.winner });
    card.appendChild(headline);

    playerMetaList.forEach((_, playerIndex) => {
      const scoreLine = document.createElement("p");
      scoreLine.textContent = `${state.players[playerIndex].name}: ${totals[playerIndex]}`;
      card.appendChild(scoreLine);
    });

    const hint = document.createElement("p");
    hint.textContent = t("winner.useRestart");
    card.appendChild(hint);

    overlay.appendChild(card);
    return overlay;
  }

  function createCategoryIcon(category) {
    // The reference art uses symbolic category tiles rather than text labels,
    // so these helpers build visual icons while the game rules stay data-driven.
    if (category.face) {
      return createDieFace(category.face);
    }

    const tile = document.createElement("div");

    if (category.icon?.kind === "yatzy") {
      tile.className = "icon-tile yatzy-mark";

      const word = document.createElement("div");
      word.className = "yatzy-word";
      word.textContent = categoryIconText(category.key);
      tile.appendChild(word);
      return tile;
    }

    if (category.icon?.kind === "word") {
      tile.className = "icon-tile word-icon";
      tile.textContent = categoryIconText(category.key);
      return tile;
    }

    tile.className = "icon-tile";
    const mark = document.createElement("div");
    mark.className = "question-mark";
    mark.textContent = "?";
    tile.appendChild(mark);
    return tile;
  }

  // "watercolor" is the graphics experiment behind the "Jouer solo (test)"
  // button (see index.html/app.js) - same robot-mode rules, only the die
  // face swaps a hand-painted image (assets/dice-test/) in for the drawn
  // pip grid. Keep both renderers self-contained here so the default look
  // is untouched if the experiment is removed later.
  function createDieFace(value) {
    const die = document.createElement("div");
    die.className = "face-die";

    if (state.setup.diceTheme === "watercolor") {
      die.classList.add("face-die-watercolor");
      die.style.backgroundImage = `url("assets/dice-test/die-${value}.jpg")`;
      return die;
    }

    const pipMap = {
      1: [5],
      2: [3, 7],
      3: [3, 5, 7],
      4: [1, 3, 7, 9],
      5: [1, 3, 5, 7, 9],
      6: [1, 3, 4, 6, 7, 9]
    };

    for (let index = 1; index <= 9; index += 1) {
      const slot = document.createElement("div");
      slot.className = "pip-slot";
      if (pipMap[value].includes(index)) {
        const pip = document.createElement("span");
        pip.className = "pip";
        slot.appendChild(pip);
      }
      die.appendChild(slot);
    }

    return die;
  }

  function renderDice() {
    elements.diceRow.innerHTML = "";
    const reverseSelectionEnabled = state.setup.reverseDiceSelectionByPlayer[state.currentPlayerIndex];

    state.dice.forEach((die, index) => {
      const dieTile = document.createElement("button");
      dieTile.type = "button";
      dieTile.className = "game-die";

      const turnStarted = state.rollsRemaining < 3 || state.dice.some((item) => item.value !== null);
      const freshTurn = !turnStarted;
      const finalRollState = state.rollsRemaining === 0 && die.value !== null;
      const canToggle = !state.gameOver && !state.pendingScoreSelection && turnStarted && state.turnPhase === "rolling" && isLocalPlayersTurn() && !isRobotTurn();

      const shouldReroll = reverseSelectionEnabled ? die.locked : !die.locked;
      dieTile.style.setProperty("--die-delay", `${index * 70}ms`);
      if (state.animateDiceOnRender && shouldReroll) {
        dieTile.classList.add("rolling");
      }

      if (die.locked) {
        dieTile.classList.add("locked");
        if (reverseSelectionEnabled) {
          dieTile.classList.add("reverse-selected");
        }
      }

      if (freshTurn) {
        dieTile.classList.add("armed");
      }

      if (finalRollState) {
        dieTile.classList.add("final-selected");
      }

      if (finalRollState && die.lastRolled) {
        dieTile.classList.add("final-rolled");
      }

      if (!canToggle) {
        dieTile.classList.add("not-rollable");
        dieTile.disabled = true;
      }

      dieTile.setAttribute("aria-pressed", die.locked ? "true" : "false");
      dieTile.setAttribute("aria-label", getDieAriaLabel(die, index));
      dieTile.appendChild(createGameDieContent(die));
      dieTile.addEventListener("click", () => handleDieToggle(index));
      elements.diceRow.appendChild(dieTile);
    });
  }

  function createGameDieContent(die) {
    const wrapper = document.createElement("div");
    wrapper.className = "die-value";

    if (die.value === null) {
      const star = document.createElement("div");
      star.className = "star-shape";
      wrapper.appendChild(star);
      return wrapper;
    }

    wrapper.appendChild(createDieFace(die.value));
    return wrapper;
  }

  function renderRollControls() {
    const shortLabel = playerMetaList[state.currentPlayerIndex].shortLabel || `P${state.currentPlayerIndex + 1}`;
    elements.rollLabel.textContent = `${shortLabel} - ${t("controls.roll")}`;
    elements.rollIndicators.innerHTML = "";

    for (let rollNumber = 1; rollNumber <= 3; rollNumber += 1) {
      const chip = document.createElement("span");
      chip.className = "roll-chip";
      chip.textContent = rollNumber;

      if (rollNumber <= state.rollsRemaining) {
        chip.classList.add("active");
      }

      elements.rollIndicators.appendChild(chip);
    }

    const canRoll = !state.gameOver && state.turnPhase === "rolling" && state.rollsRemaining > 0 && isLocalPlayersTurn() && !isRobotTurn();
    const secretRollClicksOpen = canKeepSecretRollClicks();
    const showGoBack = Boolean(state.lastCommittedTurn) && !state.gameOver && !isOnlineGame();
    const controlsLocked = isInteractionLocked() || isScoringAnimationInFlight();
    // HTML disabled swallows clicks, so the easter-egg hunt must keep the
    // button enabled and only look spent via is-exhausted.
    elements.rollButton.disabled = !canRoll && !secretRollClicksOpen;
    elements.rollButton.classList.toggle("is-exhausted", !canRoll && secretRollClicksOpen);
    elements.goBackButton.textContent = t("controls.goBack");
    elements.goBackButton.disabled = controlsLocked;
    elements.goBackButton.classList.toggle("is-hidden", !showGoBack);
  }

  function renderCelebration() {
    if (state.yatzyCelebration) {
      elements.celebrationLayer.innerHTML = buildYatzyCelebrationMarkup(state.yatzyCelebration);
      return;
    }

    if (state.defeatModeAnnouncement) {
      renderDefeatModeAnnouncement(state.defeatModeAnnouncement);
      return;
    }

    if (state.emojiReaction) {
      renderEmojiCelebration(state.emojiReaction);
      return;
    }

    elements.celebrationLayer.innerHTML = "";
  }

  function renderDefeatModeAnnouncement(announcement) {
    elements.celebrationLayer.innerHTML = "";
    const banner = document.createElement("div");
    banner.className = "defeat-mode-toast";
    banner.dataset.id = "yatsy-defeat-mode-toast";
    banner.textContent = t("defeatMode.activated", { playerName: announcement.playerName });
    elements.celebrationLayer.appendChild(banner);
  }

  function buildYatzyCelebrationMarkup(celebration) {
    const particleMarkup = Array.from({ length: 18 }, (_, index) => (
      `<span style="--i:${index}"></span>`
    )).join("");

    return `
      <div class="yatzy-celebration">
        <div class="yatzy-burst"></div>
        <div class="yatzy-particles">${particleMarkup}</div>
        <div class="yatzy-banner">
          <strong>YATZY!</strong>
          <span>${t("celebration.rolledFiveKind", {
            playerName: celebration.playerName,
            faceLabel: celebration.faceLabel
          })}</span>
        </div>
      </div>
    `;
  }

  function renderEmojiCelebration(reaction) {
    // Guard: if the identical reaction is already in the DOM, leave it alone.
    // Re-creating the <img> node resets the GIF to frame 0 and restarts its
    // CSS pop animation ? producing visible flicker in multiplayer because
    // render() is called on every remote tick broadcast (i.e. each die roll
    // or score commit from the other player). Skipping the DOM update keeps
    // the GIF playing uninterrupted for its full TTL.
    const existing = elements.celebrationLayer.querySelector(".emoji-celebration");
    if (existing) {
      if (reaction.kind === "gif") {
        const img = existing.querySelector(".emoji-celebration-gif");
        if (img && img.getAttribute("src") === reaction.gifUrl) return;
      } else {
        const span = existing.querySelector(".emoji-celebration-emoji");
        if (span && span.textContent === reaction.emoji) return;
      }
    }

    // textContent rather than innerHTML: player names travel through the
    // synced game state (see buildWinnerBanner), so a peer could otherwise
    // inject markup into this overlay.
    elements.celebrationLayer.innerHTML = "";
    const wrapper = document.createElement("div");
    wrapper.className = "emoji-celebration";

    const media = reaction.kind === "gif"
      ? buildGifReactionMedia(reaction.gifUrl)
      : buildEmojiReactionMedia(reaction.emoji);
    if (media) wrapper.appendChild(media);

    const nameSpan = document.createElement("span");
    nameSpan.className = "emoji-celebration-name";
    nameSpan.textContent = reaction.playerName;
    wrapper.appendChild(nameSpan);

    elements.celebrationLayer.appendChild(wrapper);
  }

  function buildEmojiReactionMedia(emoji) {
    const emojiSpan = document.createElement("span");
    emojiSpan.className = "emoji-celebration-emoji";
    emojiSpan.dataset.id = "player-emoji-reaction";
    emojiSpan.textContent = emoji;
    return emojiSpan;
  }

  function buildGifReactionMedia(gifUrl) {
    if (!window.YATZY_EMOJI?.isGiphyMediaUrl(gifUrl)) return null;
    const img = document.createElement("img");
    img.className = "emoji-celebration-gif";
    img.dataset.id = "player-gif-reaction";
    img.src = gifUrl;
    img.alt = "";
    return img;
  }
    return { render };
  }
};