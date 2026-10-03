const DATA_URL = "./data/sample-pyramides.json";
const BET_SOUND_URL = "./data/sound/bet.mp3";
const STARTING_BRICKS = 13;
const REQUIRED_KEYWORDS = 5;
const MAX_BET = 8;
const SUPPORTED_LOCALES = ["fr", "en", "es"];
const { detectInitialLocale, translate } = window.PYRAMIDE_I18N;

function readHubLocale() {
  try {
    const stored = localStorage.getItem("bergamots-lang");
    return SUPPORTED_LOCALES.includes(stored) ? stored : "fr";
  } catch {
    return "fr";
  }
}

const PHASES = {
  SETUP: "SETUP",
  WORD_LOOP: "WORD_LOOP",
  FINAL_RIDDLE: "FINAL_RIDDLE",
  ROUND_SUMMARY: "ROUND_SUMMARY",
  GAME_OVER: "GAME_OVER",
};

const SCREENS = {
  LOADING: "LOADING",
  SPLASH: "SPLASH",
  GAME: "GAME",
  ERROR: "ERROR",
};

const els = {
  gameLayout: document.getElementById("gameLayout"),
  publicStage: document.getElementById("publicStage"),
  publicTitle: document.getElementById("publicTitle"),
  publicContent: document.getElementById("publicContent"),
  secretStage: document.getElementById("secretStage"),
  secretTitle: document.getElementById("secretTitle"),
  secretContent: document.getElementById("secretContent"),
  statusStrip: document.getElementById("statusStrip"),
  langSelector: document.getElementById("lang-selector"),
  holdRevealTemplate: document.getElementById("holdRevealTemplate"),
};

const state = {
  screen: SCREENS.LOADING,
  loading: true,
  error: null,
  rawData: null,
  session: null,
  round: null,
  datasetMeta: null,
  uiLocale: readHubLocale(),
};

const transientCleanups = [];
let betSound = null;

init();
setupInfoButton();
setupNavButtons();

async function init() {
  try {
    const response = await fetch(DATA_URL);
    if (!response.ok) {
      throw new Error(t("loadDataError", { url: DATA_URL }, state.uiLocale));
    }

    state.rawData = await response.json();
    state.loading = false;
    state.screen = SCREENS.SPLASH;
  } catch (error) {
    state.loading = false;
    state.error = error instanceof Error ? error.message : String(error);
    state.screen = SCREENS.ERROR;
  }

  render();
}

function getLocale() {
  return state.session?.locale ?? state.uiLocale ?? "fr";
}

function t(key, params = {}, locale = getLocale()) {
  return translate(locale, key, params);
}

function formatPoints(points, locale = getLocale()) {
  return t("pointsShort", { count: points }, locale);
}

function setupInfoButton() {
  const optionsButton = document.getElementById("options-button");
  const optionsPanel = document.getElementById("options-panel");
  const titleEl = document.getElementById("pyramide-rules-title");
  const contentEl = document.getElementById("pyramide-rules-content");
  if (!optionsButton || !optionsPanel || !titleEl || !contentEl) return;

  const refreshRulesContent = () => {
    titleEl.textContent = t("rulesTitle");
    contentEl.innerHTML = t("rulesBodyHtml");
  };

  refreshRulesContent();

  if (window.GameHeader) {
    window.GameHeader.initOptionsPanel(optionsButton, optionsPanel);
  }
  optionsButton.addEventListener("click", () => {
    if (!optionsPanel.hidden) refreshRulesContent();
  });
}

function setupNavButtons() {
  const resetButton = document.getElementById("pyramide-reset-button");
  const backLink = document.querySelector(".back-button");

  if (resetButton) {
    resetButton.addEventListener("click", handleResetClick);
  }

  if (backLink) {
    backLink.addEventListener("click", (event) => {
      if (state.screen !== SCREENS.SPLASH) {
        event.preventDefault();
        window.MuchogamesMatch.finish();
        state.session = null;
        state.round = null;
        state.error = null;
        state.screen = SCREENS.SPLASH;
        render();
      }
    });
  }
}

function handleResetClick() {
  if (!state.rawData) return;
  startMatch(getLocale());
}

// Every new match (splash start, ↻ reset) spends a coin first.
async function startMatch(locale) {
  if (state.isStarting) return;
  state.isStarting = true;
  const allowed = await window.MuchogamesMatch.start("pyramide");
  state.isStarting = false;
  if (allowed) beginSession(locale);
}

function applyLocaleToSession(locale) {
  if (!state.session || !state.rawData || !SUPPORTED_LOCALES.includes(locale)) return false;

  const normalized = normalizeDeck(state.rawData, locale);
  if (normalized.validDeck.length === 0) {
    state.error = t("noValidDeck", { locale: locale.toUpperCase() }, locale);
    state.screen = SCREENS.ERROR;
    return false;
  }

  const byId = Object.fromEntries(normalized.validDeck.map((e) => [e.id, e]));
  state.session.deck = state.session.deck.map((old) => byId[old.id] ?? old);
  state.session.locale = locale;
  state.datasetMeta = {
    validCount: normalized.validDeck.length,
    skippedCount: normalized.skipped.length,
    skipped: normalized.skipped,
    batchId: state.rawData.batch_id ?? null,
  };

  if (state.round?.enigma?.id && byId[state.round.enigma.id]) {
    state.round.enigma = byId[state.round.enigma.id];
  }

  state.error = null;
  state.screen = SCREENS.GAME;
  return true;
}

function beginSession(locale) {
  if (!SUPPORTED_LOCALES.includes(locale) || !state.rawData) return;

  state.uiLocale = locale;

  const normalized = normalizeDeck(state.rawData, locale);
  if (normalized.validDeck.length === 0) {
    state.error = t("noValidDeck", { locale: locale.toUpperCase() }, locale);
    state.screen = SCREENS.ERROR;
    render();
    return;
  }

  state.datasetMeta = {
    validCount: normalized.validDeck.length,
    skippedCount: normalized.skipped.length,
    skipped: normalized.skipped,
    batchId: state.rawData.batch_id ?? null,
  };
  state.session = createSession(normalized.validDeck, locale);
  state.round = createRound(drawNextEnigma());
  state.error = null;
  state.screen = SCREENS.GAME;
  render();
}

function createSession(deck, locale) {
  return {
    locale,
    deck: shuffle(deck.slice()),
    deckIndex: 0,
    activeTeamIndex: 0,
    teams: [
      { id: "A", name: t("teamA", {}, locale), points: 0 },
      { id: "B", name: t("teamB", {}, locale), points: 0 },
    ],
  };
}

function createRound(enigma) {
  if (!enigma) {
    return {
      phase: PHASES.GAME_OVER,
      enigma: null,
      bricksRemaining: 0,
      currentWordIndex: 0,
      currentBet: "",
      wordResults: [],
      finalSolved: null,
      bonusApplied: 0,
    };
  }

  return {
    phase: PHASES.SETUP,
    enigma,
    bricksRemaining: STARTING_BRICKS,
    currentWordIndex: 0,
    currentBet: "",
    wordResults: [],
    finalSolved: null,
    bonusApplied: 0,
  };
}

function drawNextEnigma() {
  if (!state.session) return null;

  const enigma = state.session.deck[state.session.deckIndex] ?? null;
  if (enigma) {
    state.session.deckIndex += 1;
  }

  return enigma;
}

function hasMoreRounds() {
  return Boolean(state.session && state.session.deckIndex < state.session.deck.length);
}

function getActiveTeam() {
  return state.session.teams[state.session.activeTeamIndex];
}

function toggleActiveTeam() {
  state.session.activeTeamIndex = state.session.activeTeamIndex === 0 ? 1 : 0;
}

function normalizeDeck(raw, locale) {
  const validDeck = [];
  const skipped = [];
  const cards = Array.isArray(raw?.cards) ? raw.cards : [];

  cards.forEach((card, cardIndex) => {
    const enigmas = Array.isArray(card?.enigmas) ? card.enigmas : [];

    enigmas.forEach((item, enigmaIndex) => {
      const clue = repairMojibake(readLocalizedValue(item?.clue, locale)).trim();
      const text = repairMojibake(readLocalizedValue(item?.text, locale)).trim();
      const answer = repairMojibake(readLocalizedValue(item?.answer, locale)).trim();
      const keywords = Array.isArray(item?.keywords?.[locale])
        ? item.keywords[locale].map((value) => repairMojibake(String(value ?? "")).trim()).filter(Boolean)
        : [];

      const validationError = validateEnigma({ clue, text, answer, keywords });
      const uniqueId = `${card?.position ?? `card-${cardIndex}`}-${item?.id ?? enigmaIndex}`;

      if (validationError) {
        skipped.push({ id: uniqueId, reason: validationError });
        return;
      }

      validDeck.push({
        id: uniqueId,
        sourceId: item?.id ?? enigmaIndex,
        clue,
        text,
        answer,
        keywords,
      });
    });
  });

  return { validDeck, skipped };
}

function readLocalizedValue(entry, locale) {
  if (!entry || typeof entry !== "object") return "";
  return entry[locale] ?? "";
}

function validateEnigma(enigma) {
  if (!enigma.clue) return "clue missing";
  if (!enigma.text) return "text missing";
  if (!enigma.answer) return "answer missing";
  if (!Array.isArray(enigma.keywords)) return "keywords invalid";
  if (enigma.keywords.length !== REQUIRED_KEYWORDS) {
    return `keywords expected: ${REQUIRED_KEYWORDS}, got: ${enigma.keywords.length}`;
  }
  if (enigma.keywords.some((keyword) => !keyword)) return "empty keyword";
  return null;
}

function repairMojibake(value) {
  const text = String(value ?? "");
  if (!/[���]/.test(text)) return text;

  try {
    const bytes = Uint8Array.from(text, (char) => char.charCodeAt(0) & 0xff);
    const repaired = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
    return repaired.includes("\uFFFD") ? text : repaired;
  } catch {
    return text;
  }
}

function shuffle(items) {
  for (let index = items.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [items[index], items[swapIndex]] = [items[swapIndex], items[index]];
  }

  return items;
}

function render() {
  cleanupTransientEffects();
  document.documentElement.lang = getLocale();
  updateLayoutMode();
  renderStatus();

  if (state.loading || state.screen === SCREENS.LOADING) {
    renderLoadingScreen();
    return;
  }

  if (state.screen === SCREENS.ERROR) {
    renderErrorScreen();
    return;
  }

  if (state.screen === SCREENS.SPLASH) {
    renderSplashScreen();
    return;
  }

  if (!state.session || !state.round) {
    renderEmptyScreen(t("noState"));
    return;
  }

  switch (state.round.phase) {
    case PHASES.SETUP:
      renderSetupScreen();
      return;
    case PHASES.WORD_LOOP:
      renderWordLoopScreen();
      return;
    case PHASES.FINAL_RIDDLE:
      renderFinalRiddleScreen();
      return;
    case PHASES.ROUND_SUMMARY:
      renderRoundSummaryScreen();
      return;
    case PHASES.GAME_OVER:
      renderGameOverScreen();
      return;
    default:
      renderEmptyScreen(t("unknownState"));
  }
}

function updateLayoutMode() {
  const isSplash = state.screen === SCREENS.LOADING || state.screen === SCREENS.ERROR || state.screen === SCREENS.SPLASH;

  els.gameLayout.classList.toggle("layout-splash", isSplash);
  els.gameLayout.classList.toggle("layout-compact", !isSplash);
  els.publicStage.classList.toggle("is-splash", isSplash);
  els.secretStage.classList.add("is-hidden");
  els.statusStrip.classList.add("is-hidden");

  const resetButton = document.getElementById("pyramide-reset-button");
  const scoreDisplay = document.getElementById("score-display");
  const rulesSection = document.getElementById("rules-section");

  if (resetButton) {
    resetButton.style.display = isSplash ? "none" : "";
  }
  if (scoreDisplay) {
    scoreDisplay.style.display = isSplash ? "none" : scoreDisplay.style.display;
  }
  if (rulesSection) {
    rulesSection.style.display = "block";
  }
}

function renderStatus() {
  const parts = [];
  if (state.session) {
    parts.push(pill(t("languageLabel", { locale: state.session.locale.toUpperCase() })));
    parts.push(pill(t("validEnigmas", { count: state.datasetMeta?.validCount ?? 0 })));

    if ((state.datasetMeta?.skippedCount ?? 0) > 0) {
      parts.push(pill(t("skippedCards", { count: state.datasetMeta.skippedCount })));
    }
  }

  els.statusStrip.replaceChildren(...parts);
}

function renderLoadingScreen() {
  setStageTitles(t("loadingTitle"), t("loadingSecretTitle"));
  renderPublic(emptyState(t("loadingDeck")));
  renderSecret(emptyState(t("loadingCommands")));
}

function renderErrorScreen() {
  setStageTitles(t("errorTitle"), t("noCommand"));
  renderPublic(warningBox(state.error));
  renderSecret(emptyState(t("reloadHint")));
}

function renderSplashScreen() {
  setStageTitles(t("splashTitle"), "");

  const shell = createElement("section", { className: "splash-shell" });
  const splashImage = createElement("img", {
    className: "splash-image",
    src: "./data/images/splashscreen.jpg",
    alt: t("splashAlt"),
  });

  shell.append(
    splashImage,
    button(t("splashStart"), "primary-button", () => startMatch(getLocale())),
  );

  if (els.langSelector) {
    const makeLangButton = (locale, label) => {
      const element = document.createElement("button");
      element.type = "button";
      element.className = `lang-btn${getLocale() === locale ? " active" : ""}`;
      element.textContent = label;
      element.addEventListener("click", () => {
        state.uiLocale = locale;
        if (state.session) {
          applyLocaleToSession(locale);
        }
        render();
      });
      return element;
    };

    els.langSelector.replaceChildren(
      makeLangButton("fr", "FR"),
      makeLangButton("en", "EN"),
      makeLangButton("es", "ES"),
    );
  }

  renderPublic(shell);
  renderSecret();
}

function renderSetupScreen() {
  const activeTeam = getActiveTeam();

  setStageTitles(t("teamEntering", { team: activeTeam.name }), t("roundStart"));
  renderPublic(
    teamStrip(),
    clueCard(state.round.enigma.clue),
    button(t("startEnigma"), "primary-button", startRound),
  );
  renderSecret();
}

function renderWordLoopScreen() {
  const keyword = state.round.enigma.keywords[state.round.currentWordIndex];
  const betNumber = parseBet(state.round.currentBet);
  const betError = validateBet(betNumber, state.round.bricksRemaining);
  const actions = createElement("div", { className: "action-row" });

  actions.append(
    button(t("found"), "success-button", () => resolveCurrentWord(true), Boolean(betError)),
    button(t("missed"), "danger-button", () => resolveCurrentWord(false), Boolean(betError)),
  );

  setStageTitles(
    t("wordProgress", { current: state.round.currentWordIndex + 1, total: REQUIRED_KEYWORDS }),
    t("roundInProgress"),
  );
  renderPublic(
    teamStrip(),
    clueCard(state.round.enigma.clue),
    wordTurnLayout(keyword, betError),
    actions,
  );
  renderSecret();
}

function renderFinalRiddleScreen() {
  const failedKeywords = state.round.wordResults.filter((entry) => !entry.success).map((entry) => entry.keyword);
  const finalPanel = createElement("section", { className: "final-panel" });
  const finalText = createElement("p", {
    className: "final-text",
    html: censorFinalText(state.round.enigma.text, failedKeywords, state.session.locale),
  });
  const actions = createElement("div", { className: "final-actions" });

  finalPanel.append(finalText);
  actions.append(
    createHoldReveal({
      label: t("holdToRevealAnswer"),
      value: state.round.enigma.answer,
    }),
    button(t("solvedEnigma"), "success-button", () => resolveFinal(true)),
    button(t("failure"), "danger-button", () => resolveFinal(false)),
  );

  setStageTitles(t("finalRiddleTitle"), t("dicoArbitration"));
  renderPublic(teamStrip(), clueCard(state.round.enigma.clue), finalPanel, actions);
  renderSecret();
}

function renderRoundSummaryScreen() {
  const foundCount = state.round.wordResults.filter((entry) => entry.success).length;
  const summaryGrid = createElement("div", { className: "summary-grid" });

  summaryGrid.append(
    summaryCard(t("wordsFound"), `${foundCount}/${REQUIRED_KEYWORDS}`),
    summaryCard(t("finalRiddle"), state.round.finalSolved ? t("solved") : t("failed")),
    summaryCard(t("bonusBricks"), String(state.round.bonusApplied)),
  );

  setStageTitles(t("roundSummary"), t("physicalRotation"));
  renderPublic(
    teamStrip(),
    clueCard(state.round.enigma.clue),
    summaryGrid,
    recapPanel(),
    button(hasMoreRounds() ? t("passToOtherTeam") : t("showFinalResult"), "primary-button", nextRound),
  );
  renderSecret();
}

function renderGameOverScreen() {
  const teams = [...state.session.teams].sort((left, right) => right.points - left.points);
  const winner = teams[0];
  const isDraw = teams[0]?.points === teams[1]?.points;
  const message = isDraw
    ? t("drawMessage", { points: winner?.points ?? 0 })
    : t("winnerMessage", { team: winner?.name ?? t("winningTeamFallback") });

  setStageTitles(t("gameOverTitle"), t("sessionEnded"));
  renderPublic(teamStrip(), clueCard(message));
  renderSecret();
}

function renderEmptyScreen(message) {
  setStageTitles(t("noContent"), t("noCommand"));
  renderPublic(emptyState(message));
  renderSecret(emptyState(t("impossibleDisplay")));
}

function setStageTitles(publicTitle, secretTitle) {
  els.publicTitle.textContent = publicTitle;
  els.secretTitle.textContent = secretTitle;
}

function renderPublic(...nodes) {
  els.publicContent.replaceChildren(...nodes.filter(Boolean));
}

function renderSecret(...nodes) {
  els.secretContent.replaceChildren(...nodes.filter(Boolean));
}

function startRound() {
  if (!state.round || state.round.phase !== PHASES.SETUP) return;
  state.round.phase = PHASES.WORD_LOOP;
  render();
}

function resolveCurrentWord(success) {
  if (!state.round || state.round.phase !== PHASES.WORD_LOOP) return;

  const betNumber = parseBet(state.round.currentBet);
  const betError = validateBet(betNumber, state.round.bricksRemaining);
  if (betError) {
    render();
    return;
  }

  state.round.bricksRemaining = Math.max(0, state.round.bricksRemaining - betNumber);
  state.round.wordResults.push({
    keyword: state.round.enigma.keywords[state.round.currentWordIndex],
    bet: betNumber,
    success,
  });

  if (success) {
    awardPoints(1);
  }

  state.round.currentBet = "";
  state.round.currentWordIndex += 1;

  if (state.round.currentWordIndex >= REQUIRED_KEYWORDS) {
    state.round.phase = PHASES.FINAL_RIDDLE;
    render();
    return;
  }

  if (state.round.bricksRemaining === 0) {
    autoFailRemainingWords();
    return;
  }

  render();
}

function resolveFinal(success) {
  if (!state.round || state.round.phase !== PHASES.FINAL_RIDDLE) return;

  state.round.finalSolved = success;
  if (success) {
    awardPoints(1);
  }

  const allWordsFound = state.round.wordResults.length === REQUIRED_KEYWORDS
    && state.round.wordResults.every((entry) => entry.success);

  state.round.bonusApplied = allWordsFound ? state.round.bricksRemaining : 0;
  if (state.round.bonusApplied > 0) {
    awardPoints(state.round.bonusApplied);
  }

  state.round.phase = PHASES.ROUND_SUMMARY;
  render();
}

function nextRound() {
  if (!state.session || !state.round) return;

  if (!hasMoreRounds()) {
    window.MuchogamesMatch.finish();
    state.round = createRound(null);
    render();
    return;
  }

  toggleActiveTeam();
  state.round = createRound(drawNextEnigma());
  render();
}

function autoFailRemainingWords() {
  while (state.round.currentWordIndex < REQUIRED_KEYWORDS) {
    state.round.wordResults.push({
      keyword: state.round.enigma.keywords[state.round.currentWordIndex],
      bet: 0,
      success: false,
    });
    state.round.currentWordIndex += 1;
  }

  state.round.currentBet = "";
  state.round.phase = PHASES.FINAL_RIDDLE;
  render();
}

function awardPoints(points) {
  getActiveTeam().points += points;
}

function parseBet(value) {
  if (value === "" || value === null || value === undefined) return null;

  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function validateBet(value, max) {
  const allowedMax = Math.min(MAX_BET, max);

  if (value === null) return t("enterBet");
  if (!Number.isInteger(value)) return t("betInteger");
  if (value < 1) return t("betMin");
  if (value > allowedMax) return t("betMax", { max: allowedMax });
  return null;
}

function getObeliskState() {
  const spent = Math.max(0, STARTING_BRICKS - state.round.bricksRemaining);
  const currentBet = parseBet(state.round.currentBet);
  const reserved = state.round.phase === PHASES.WORD_LOOP && currentBet !== null && currentBet > 0
    ? Math.min(currentBet, state.round.bricksRemaining)
    : 0;
  const remaining = Math.max(0, state.round.bricksRemaining - reserved);

  return { spent, reserved, remaining };
}

function playBetSound() {
  try {
    if (!betSound) {
      betSound = new Audio(BET_SOUND_URL);
      betSound.preload = "auto";
    }

    betSound.currentTime = 0;
    void betSound.play().catch(() => {});
  } catch {
    // Keep the game responsive even if audio playback fails.
  }
}

function cleanupTransientEffects() {
  while (transientCleanups.length > 0) {
    const cleanup = transientCleanups.pop();
    try {
      cleanup();
    } catch {
      // No-op cleanup guard.
    }
  }
}

function teamStrip() {
  const strip = createElement("section", { className: "team-strip" });

  state.session.teams.forEach((team, index) => {
    const item = createElement("article", {
      className: `team-chip ${index === state.session.activeTeamIndex ? "active" : "inactive"}`,
    });

    item.append(
      createElement("strong", { className: "team-name", text: team.name }),
      createElement("span", { className: "team-points", text: `(${formatPoints(team.points)})` }),
    );
    strip.append(item);
  });

  return strip;
}

function clueCard(clue) {
  return createCard("section", "clue-card", [
    createElement("span", { className: "info-label", text: t("clue") }),
    createElement("p", { className: "clue-text", text: clue }),
  ]);
}

function wordTurnLayout(keyword, betError) {
  const layout = createElement("section", { className: "play-grid" });
  const wordCard = createCard("article", "word-card", [
    createElement("span", { className: "info-label", text: t("wordToGuess") }),
    createElement("p", { className: "word-display", text: keyword }),
    createElement("p", {
      className: "helper-text",
      text: betError ?? t("tapBrickToChoose", { max: Math.min(MAX_BET, state.round.bricksRemaining) }),
    }),
  ]);

  layout.append(wordCard, obeliskCard(getObeliskState(), true));
  return layout;
}

function obeliskCard(obeliskState, interactive = false) {
  const card = createCard("article", "obelisk-card");
  const meter = createElement("div", {
    className: `obelisk-counter${interactive ? " is-interactive" : ""}`,
    id: "obelisk",
  });
  const availableTotal = obeliskState.remaining + obeliskState.reserved;
  const allowedMax = Math.min(MAX_BET, availableTotal);

  appendSelectableObeliskBricks(meter, obeliskState, allowedMax, interactive);
  appendObeliskBricks(meter, obeliskState.spent, "spent");
  card.append(meter);

  return card;
}

function appendSelectableObeliskBricks(container, obeliskState, allowedMax, interactive) {
  const availableTotal = obeliskState.remaining + obeliskState.reserved;

  for (let position = 1; position <= availableTotal; position += 1) {
    const tone = position <= obeliskState.remaining ? "remaining" : "reserved";
    const targetBet = availableTotal - position + 1;
    const isPickable = interactive && targetBet <= allowedMax;
    const brick = createElement(isPickable ? "button" : "div", {
      className: `brick ${tone}${isPickable ? " is-pickable" : ""}`,
      title: isPickable ? t("chooseBricks", { count: targetBet }) : undefined,
      type: isPickable ? "button" : undefined,
    });

    if (isPickable) {
      brick.addEventListener("click", () => {
        playBetSound();
        state.round.currentBet = String(targetBet);
        render();
      });
    }

    container.append(brick);
  }
}

function appendObeliskBricks(container, count, tone) {
  for (let index = 0; index < count; index += 1) {
    container.append(createElement("div", { className: `brick ${tone}` }));
  }
}

function summaryCard(label, value) {
  return createCard("article", "summary-card", [
    createElement("span", { className: "summary-label", text: label }),
    createElement("strong", { className: "summary-score", text: value }),
  ]);
}

function recapPanel() {
  const panel = createCard("section", "recap-panel");
  const logList = createElement("div", { className: "log-list" });

  state.round.wordResults.forEach((entry, index) => {
    const row = createElement("div", {
      className: `log-item ${entry.success ? "success" : "failed"}`,
    });

    row.append(
      createElement("span", {
        text: t("wordHistoryRow", {
          index: index + 1,
          status: entry.success ? t("found") : t("missed"),
        }),
      }),
      createElement("strong", {
        text: t("wordBetSummary", { keyword: entry.keyword, bet: entry.bet }),
      }),
    );
    logList.append(row);
  });

  panel.append(
    createElement("span", { className: "info-label", text: t("roundRecap") }),
    createElement("p", {
      className: "text-block",
      text: `${nextRoundMessage()} ${t("bonusApplied", { bonus: state.round.bonusApplied })}`,
    }),
    createElement("span", { className: "info-label", text: t("wordHistory") }),
    logList,
  );

  return panel;
}

function nextRoundMessage() {
  return hasMoreRounds() ? t("nextRoundMessage") : t("deckFinished");
}

function createHoldReveal({ label, value }) {
  const fragment = els.holdRevealTemplate.content.cloneNode(true);
  const container = fragment.querySelector(".hold-reveal");
  const buttonEl = fragment.querySelector(".hold-button");
  const valueEl = fragment.querySelector(".hold-value");
  let pointerId = null;
  let isPressed = false;

  const show = () => {
    isPressed = true;
    buttonEl.classList.add("is-active");
    buttonEl.textContent = t("releaseToHide");
    valueEl.textContent = value;
  };

  const hide = () => {
    isPressed = false;
    pointerId = null;
    buttonEl.classList.remove("is-active");
    buttonEl.textContent = label;
    valueEl.textContent = "������";
  };

  buttonEl.textContent = label;
  buttonEl.addEventListener("contextmenu", (event) => event.preventDefault());
  buttonEl.addEventListener("pointerdown", (event) => {
    if (pointerId !== null) return;
    pointerId = event.pointerId;
    buttonEl.setPointerCapture(event.pointerId);
    show();
  });

  ["pointerup", "pointercancel", "pointerleave", "lostpointercapture"].forEach((eventName) => {
    buttonEl.addEventListener(eventName, hide);
  });

  const handleVisibilityChange = () => {
    if (document.hidden && isPressed) hide();
  };

  window.addEventListener("blur", hide);
  document.addEventListener("visibilitychange", handleVisibilityChange);
  transientCleanups.push(() => {
    window.removeEventListener("blur", hide);
    document.removeEventListener("visibilitychange", handleVisibilityChange);
  });

  container.dataset.holdReveal = "true";
  return container;
}

function resolveTokenMatch(value, locale) {
  return value
    .toLocaleLowerCase(locale)
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function censorFinalText(text, failedKeywords, locale) {
  const failedSet = new Set(failedKeywords.map((keyword) => resolveTokenMatch(keyword, locale)));

  if (typeof Intl !== "undefined" && typeof Intl.Segmenter === "function") {
    const segmenter = new Intl.Segmenter(locale, { granularity: "word" });
    return Array.from(segmenter.segment(text))
      .map((segment) => {
        if (!segment.isWordLike) return escapeHtml(segment.segment);
        return failedSet.has(resolveTokenMatch(segment.segment, locale))
          ? '<span class="censored">[______]</span>'
          : escapeHtml(segment.segment);
      })
      .join("");
  }

  return escapeHtml(text).replace(/\b\w+\b/gu, (token) => (
    failedSet.has(resolveTokenMatch(token, locale))
      ? '<span class="censored">[______]</span>'
      : escapeHtml(token)
  ));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function warningBox(text) {
  return createElement("div", { className: "warning-box", text });
}

function emptyState(text) {
  return createElement("div", { className: "empty-state", text });
}

function button(label, className, onClick, disabled = false) {
  const element = createElement("button", {
    type: "button",
    className,
    text: label,
  });

  element.disabled = disabled;
  if (disabled) {
    element.style.opacity = "0.45";
    element.style.cursor = "not-allowed";
  }

  element.addEventListener("click", onClick);
  return element;
}

function pill(text) {
  return createElement("div", { className: "pill", text });
}

function createCard(tagName, className, children = []) {
  const card = createElement(tagName, { className });
  card.append(...children);
  return card;
}

function createElement(tagName, options = {}) {
  const element = document.createElement(tagName);

  if (options.className) element.className = options.className;
  if (options.id) element.id = options.id;
  if (options.type) element.type = options.type;
  if (options.src) element.src = options.src;
  if (options.alt !== undefined) element.alt = options.alt;
  if (options.title !== undefined) element.title = options.title;
  if (options.text !== undefined) element.textContent = options.text;
  if (options.html !== undefined) element.innerHTML = options.html;

  return element;
}
