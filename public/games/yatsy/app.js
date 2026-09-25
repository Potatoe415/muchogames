const CONFIG = window.YATZY_CONFIG;
const I18N = window.YATZY_I18N || {
  t(_language, key, params = {}) {
    return String(key).replace(/\{(\w+)\}/g, (_, name) => (
      Object.prototype.hasOwnProperty.call(params, name) ? params[name] : `{${name}}`
    ));
  }
};
const MATCHMAKING = window.YATZY_MATCHMAKING;
const SCORING = window.YATZY_SCORING || {
  calculateCategoryScore() { return 0; },
  calculateUpperSection() { return 0; },
  calculateGrandTotal() { return 0; },
  calculateMinMaxDelta() { return 0; },
  isScoreboardFull() { return false; },
  isYatzyHand() { return false; }
};
const RANDOM = window.YATZY_RANDOM || {
  randomDieValue() {
    return Math.floor(Math.random() * 6) + 1;
  },
  getSecureRandomInt(minInclusive, maxInclusive) {
    const min = Math.ceil(minInclusive);
    const max = Math.floor(maxInclusive);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
};
const ROBOT_API = window.YATZY_ROBOT || null;
const STORAGE = window.YATZY_STORAGE || {
  readJSON() { return null; },
  writeJSON() {},
  readBoolean() { return false; },
  writeBoolean() {},
  remove() {},
  readHubLanguage() { return "fr"; }
};
const PLAYER_META = CONFIG.players;
const BONUS_CONFIG = CONFIG.bonus;
const ROBOT_CONFIG = CONFIG.robot;
const STORAGE_KEY = "yatzy-online-session";
const LOCAL_GAME_STORAGE_KEY = "yatzy-local-game-session";
const RULE_SETTINGS_STORAGE_KEY = "yatzy-rule-settings";
const REVERSE_SELECTION_STORAGE_KEY = "yatzy-reverse-selection";
const EXTRA_ROLL_EASTER_EGG_STORAGE_KEY = "yatzy-extra-roll-easter-egg";
const DEFEAT_MODE_ENABLED_STORAGE_KEY = "yatzy-defeat-mode-enabled";
const LOWER_RULE_OPTIONS = [
  { key: "fullHouse", scoreRule: "fullHouse", defaultEnabled: true, defaultPoints: 30, iconText: "FULL" },
  { key: "fourKind", scoreRule: "fourKind", defaultEnabled: true, defaultPoints: 40, iconText: "FOUR" },
  { key: "largeStraight", scoreRule: "straight", defaultEnabled: true, defaultPoints: 40, iconText: "LARGE" },
  { key: "smallStraight", scoreRule: "smallStraight", defaultEnabled: false, defaultPoints: 30, iconText: "SMALL" },
  { key: "threeKind", scoreRule: "threeKind", defaultEnabled: false, defaultPoints: 20, iconText: "3KIND" },
  { key: "min", scoreRule: "sumWeighted", defaultEnabled: true, defaultPoints: 1, iconText: "MIN" },
  { key: "max", scoreRule: "sumWeighted", defaultEnabled: true, defaultPoints: 1, iconText: "MAX" },
  { key: "luck", scoreRule: "sumWeighted", defaultEnabled: false, defaultPoints: 1, iconText: "LUCK" }
];
const BASE_LOWER_CATEGORY_BY_KEY = Object.fromEntries(
  CONFIG.categories.filter((category) => category.type === "lower").map((category) => [category.key, category])
);
let CATEGORIES = [];
let CATEGORY_MAP = {};
let UPPER_CATEGORIES = [];
let LOWER_CATEGORIES = [];
let robotEngine = null;
const persistedRuleSettings = readPersistedRuleSettings();
const persistedReverseDiceSelection = readPersistedReverseDiceSelection();
const initialSetupLanguage = STORAGE.readHubLanguage();
initializeRuntimeDefinitions(buildDefaultRuleSettings());
if (persistedRuleSettings) {
  initializeRuntimeDefinitions(persistedRuleSettings);
}

// This one object is the entire gameplay source of truth.
// The renderer reads from it, event handlers update it, and nothing in the UI
// is treated as stored game state. That keeps the architecture deterministic.
const state = createInitialState();

const elements = {
  homeButton: document.getElementById("home-button"),
  splashScreen: document.getElementById("splash-screen"),
  splashTitle: document.getElementById("splash-title"),
  playerNameLabel: document.getElementById("player-name-label"),
  playerNameInput: document.getElementById("player-name-input"),
  playerNameRow: document.getElementById("player-name-row"),
  playerNameAvatar: document.getElementById("player-name-avatar"),
  soloGameButton: document.getElementById("solo-game-button"),
  robotGameButton: document.getElementById("robot-game-button"),
  robotTestGameButton: document.getElementById("robot-test-game-button"),
  playOnlineButton: document.getElementById("play-online-button"),
  createGameButton: document.getElementById("create-game-button"),
  shareGameButton: document.getElementById("share-game-button"),
  cancelCreateButton: document.getElementById("cancel-create-button"),
  splashJoin: document.getElementById("splash-join"),
  joinLabel: document.getElementById("join-label"),
  joinCodeInput: document.getElementById("join-code-input"),
  joinGameButton: document.getElementById("join-game-button"),
  splashStatus: document.getElementById("splash-status"),
  splashError: document.getElementById("splash-error"),
  splashBackButton: document.getElementById("splash-back-button"),
  settingsButton: document.getElementById("settings-button"),
  settingsPanel: document.getElementById("settings-panel"),
  settingsList: document.getElementById("settings-list"),
  settingsRulesSection: document.getElementById("settings-rules-section"),
  settingsRulesTitle: document.getElementById("settings-rules-title"),
  settingsRulesContent: document.getElementById("settings-rules-content"),
  scoreSummary: document.getElementById("score-summary"),
  scoreboard: document.getElementById("scoreboard"),
  diceRow: document.getElementById("dice-row"),
  rollButton: document.getElementById("roll-button"),
  goBackButton: document.getElementById("go-back-button"),
  rollLabel: document.getElementById("roll-label"),
  rollIndicators: document.getElementById("roll-indicators"),
  celebrationLayer: document.getElementById("celebration-layer"),
  emojiButton: document.getElementById("emoji-button"),
  emojiPicker: document.getElementById("emoji-picker"),
  emojiBackdrop: document.getElementById("emoji-picker-backdrop"),
  gameCard: document.getElementById("game-card"),
  gameTitle: document.getElementById("game-title"),
  restartButton: document.getElementById("restart-button"),
  gameSettingsButton: document.getElementById("game-settings-button"),
  gameSettingsPanel: document.getElementById("game-settings-panel"),
  gameSettingsTitle: document.getElementById("game-settings-title"),
  gameSettingsClose: document.getElementById("game-settings-close"),
  gameSettingsLanguageTitle: document.getElementById("game-settings-language-title"),
  gameLangSelector: document.getElementById("game-lang-selector"),
  reverseSelectionToggle: document.getElementById("game-reverse-selection-toggle"),
  reverseSelectionLabel: document.getElementById("game-reverse-selection-label"),
  reverseSelectionPill: document.getElementById("game-reverse-selection-pill")
};

let yatzyCelebrationTimeoutId = null;
let emojiReactionTimeoutId = null;
let robotTurnTimeoutId = null;
let undoScoreTimeoutId = null;
let robotStepDelayMs = getRobotDelayMs(ROBOT_CONFIG.rollDelayMs);
let robotQueuedScoreCategory = null;
let scoringAnimationInFlight = false;
// Guards PlayerProfile.recordGameResult() to fire exactly once per game,
// regardless of whether gameOver arrives locally (finishGame()) or via
// remote sync (session.js's hydrateFromRemoteGameState) - reset in resetGame().
let localResultRecorded = false;
let extraRollTapCount = 0;
let bonusRollUsedThisTurn = false;
const UNDO_SCORE_WINDOW_MS = 5000;
let defeatModeTapCount = 0;
let defeatModeTapTimeoutId = null;
let defeatModeTurnTimeoutId = null;
let defeatModeToastTimeoutId = null;
const DEFEAT_MODE_TAP_WINDOW_MS = 1200;
const DEFEAT_MODE_TURNS_THRESHOLD = 3;
const DEFEAT_MODE_STEP_DELAY_MS = 150;
const DEFEAT_MODE_TOAST_TTL_MS = 2200;

elements.soloGameButton.addEventListener("click", () => handleLocalStart("solo"));
elements.robotGameButton.addEventListener("click", () => handleLocalStart("robot"));
// Graphics experiment: identical robot-mode rules, only the die faces swap
// to the hand-painted watercolor images (see render.js's createDieFace).
elements.robotTestGameButton.addEventListener("click", () => handleLocalStart("robot", "watercolor"));
// These handlers live in session.js and are only wired up once the session
// controller is created below, so each listener defers the lookup to click
// time (arrow wrapper) instead of capturing an undefined reference now.
if (elements.playOnlineButton) {
  elements.playOnlineButton.addEventListener("click", () => handlePlayOnline());
}
elements.createGameButton.addEventListener("click", () => handleCreateGame());
elements.shareGameButton.addEventListener("click", () => handleShareGame());
elements.cancelCreateButton.addEventListener("click", () => handleWaitingCancel());
elements.joinGameButton.addEventListener("click", () => handleJoinGame());
elements.joinCodeInput.addEventListener("input", (event) => handleJoinCodeInput(event));
elements.joinCodeInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    handleJoinGame();
  }
});
if (elements.splashBackButton) {
  elements.splashBackButton.addEventListener("click", (event) => handleSplashBack(event));
}
if (elements.settingsButton && elements.settingsPanel && window.GameHeader) {
  window.GameHeader.initOptionsPanel(elements.settingsButton, elements.settingsPanel);
}
if (elements.settingsList) {
  elements.settingsList.addEventListener("change", handleSettingsInputChange);
}
if (elements.gameSettingsButton && elements.gameSettingsPanel && window.GameHeader) {
  window.GameHeader.initOptionsPanel(elements.gameSettingsButton, elements.gameSettingsPanel);
}
if (elements.gameLangSelector) {
  elements.gameLangSelector.addEventListener("click", handleGameLangSelectorClick);
}
if (elements.reverseSelectionToggle) {
  elements.reverseSelectionToggle.addEventListener("change", handleGameReverseSelectionToggle);
}
elements.homeButton.addEventListener("click", handleHomeNavigation);
const emojiController = window.YATZY_EMOJI
  ? window.YATZY_EMOJI.createEmojiController({
      buttonElement: elements.emojiButton,
      pickerElement: elements.emojiPicker,
      backdropElement: elements.emojiBackdrop,
      getText: (key) => t(key),
      getLang: () => state.setup.language,
      onPick: handleSendReaction
    })
  : null;
elements.rollButton.addEventListener("click", handleRoll);
elements.goBackButton.addEventListener("click", handleSelectionCancel);
elements.restartButton.addEventListener("click", handleRestart);
if (elements.scoreSummary) {
  elements.scoreSummary.addEventListener("click", handleScoreSummaryClick);
}

if (elements.playerNameInput && window.PlayerProfile) {
  elements.playerNameInput.value = window.PlayerProfile.getName();
  elements.playerNameInput.addEventListener("change", persistPlayerNameFromInput);
  elements.playerNameInput.addEventListener("blur", persistPlayerNameFromInput);
}

// render.js owns the DOM projection of `state`; everything it needs that can
// change identity at runtime (the category lists get rebuilt whenever rule
// settings change, the scoring animation flag flips mid-turn) is passed as a
// getter rather than a snapshot value.
const renderer = window.YATZY_RENDER.createRenderer({
  state,
  elements,
  t,
  playerMeta: PLAYER_META,
  bonusConfig: BONUS_CONFIG,
  lowerRuleOptions: LOWER_RULE_OPTIONS,
  emojiController,
  getUpperCategories: () => UPPER_CATEGORIES,
  getLowerCategories: () => LOWER_CATEGORIES,
  isScoringAnimationInFlight: () => scoringAnimationInFlight,
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
});
// Wrapped (not just renderer.render) so every state mutation that leads to a
// render also keeps the local-game persistence snapshot in sync, the same
// way session.js keeps yatzy-online-session in sync on every state change it
// causes. See persistLocalGameState().
const render = () => {
  renderer.render();
  persistLocalGameState();
};

// session.js owns matchmaking wiring, remote-state sync and session
// persistence. It shares mutable game state through `state` directly and
// through the scoring-animation flag getter/setter below, since that flag is
// also flipped by the local scoring flow further down in this file.
const session = window.YATZY_SESSION.createSessionController({
  state,
  t,
  render,
  storage: STORAGE,
  storageKey: STORAGE_KEY,
  playerMeta: PLAYER_META,
  getCategories: () => CATEGORIES,
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
  isScoringAnimationInFlight: () => scoringAnimationInFlight,
  setScoringAnimationInFlight: (value) => {
    scoringAnimationInFlight = value;
  }
});
const handlePlayOnline = session.handlePlayOnline;
const handleCreateGame = session.handleCreateGame;
const handleShareGame = session.handleShareGame;
const handleWaitingCancel = session.handleWaitingCancel;
const handleJoinGame = session.handleJoinGame;
const handleJoinCodeInput = session.handleJoinCodeInput;
const handleSplashBack = session.handleSplashBack;
const handleDeepLinkJoin = session.handleDeepLinkJoin;
const restoreOnlineSession = session.restoreOnlineSession;
const leaveCurrentGame = session.leaveCurrentGame;
const syncOnlineGameState = session.syncOnlineGameState;
const clearPersistedOnlineSession = session.clearPersistedOnlineSession;

restoreLocalGameState();
render();
restoreOnlineSession();
handleDeepLinkJoin();
registerOfflineSupport();
window.MuchogamesProfileResults?.migrateLocalResultsOnce();
void refreshSettingsRules();

// Dynamic import (not a static one): every other file here is a classic
// script sharing one global scope (see eslint.config.mjs) - a static import
// would force this file alone into module scope. Re-run by
// handleLanguageSelection() whenever the splash or in-game language switcher
// changes state.setup.language, so the splash rules panel stays in sync.
async function refreshSettingsRules() {
  if (!elements.settingsRulesSection || !elements.settingsRulesContent) return;

  const { loadRulesIfExists } = await import("/shared/js/engine.js");
  const html = await loadRulesIfExists("yatsy", state.setup.language);
  if (!html) {
    elements.settingsRulesSection.style.display = "none";
    return;
  }

  if (elements.settingsRulesTitle) {
    elements.settingsRulesTitle.textContent = t("splash.rules");
  }
  elements.settingsRulesContent.innerHTML = html;
  elements.settingsRulesSection.style.display = "";
}

function getRobotDelayMs(delayMs, enforceMinimum = true) {
  if (!enforceMinimum) {
    return Math.max(0, delayMs || 0);
  }

  return Math.max(ROBOT_CONFIG.minStepDelayMs || 0, delayMs || 0);
}

function clearUndoWindow() {
  clearTimeout(undoScoreTimeoutId);
  undoScoreTimeoutId = null;
}

function startUndoWindow() {
  clearUndoWindow();
  undoScoreTimeoutId = setTimeout(() => {
    state.lastCommittedTurn = null;
    undoScoreTimeoutId = null;
    render();
  }, UNDO_SCORE_WINDOW_MS);
}

function buildDefaultRuleSettings() {
  return LOWER_RULE_OPTIONS.reduce((settings, option) => {
    settings[option.key] = {
      enabled: option.defaultEnabled,
      points: option.defaultPoints
    };
    return settings;
  }, {});
}

function cloneRuleSettings(settings) {
  return LOWER_RULE_OPTIONS.reduce((copy, option) => {
    const current = settings?.[option.key];
    copy[option.key] = {
      enabled: typeof current?.enabled === "boolean" ? current.enabled : option.defaultEnabled,
      points: normalizePoints(current?.points ?? option.defaultPoints)
    };
    return copy;
  }, {});
}

function initializeRuntimeDefinitions(ruleSettings) {
  const upperCategories = CONFIG.categories.filter((category) => category.type === "upper");
  const lowerCategories = buildConfiguredLowerCategories(ruleSettings);
  CATEGORIES = [...upperCategories, ...lowerCategories];
  CATEGORY_MAP = Object.fromEntries(CATEGORIES.map((category) => [category.key, category]));
  UPPER_CATEGORIES = CATEGORIES.filter((category) => category.type === "upper");
  LOWER_CATEGORIES = CATEGORIES.filter((category) => category.type === "lower");
  robotEngine = createRobotEngine();
}

function createRobotEngine() {
  if (ROBOT_API?.createEngine) {
    return ROBOT_API.createEngine({
      categories: CATEGORIES,
      bonus: BONUS_CONFIG,
      robot: ROBOT_CONFIG,
      evaluateCategoryScore: calculateCategoryScore,
      calculateUpperSection,
      calculateGrandTotal
    });
  }

  return {
    getDecision() {
      const availableCategory = CATEGORIES.find((category) => category.type === "lower")?.key || CATEGORIES[0]?.key || "ones";
      return {
        type: "score",
        categoryKey: availableCategory
      };
    }
  };
}

function buildConfiguredLowerCategories(ruleSettings) {
  const categories = [];

  LOWER_RULE_OPTIONS.forEach((option) => {
    const current = ruleSettings[option.key];
    if (!current?.enabled) {
      return;
    }

    const configuredPoints = normalizePoints(current.points);
    const source = BASE_LOWER_CATEGORY_BY_KEY[option.key];
    if (source) {
      categories.push({
        ...source,
        scoreRule: option.scoreRule,
        fixedScore: option.scoreRule === "sumWeighted" ? source.fixedScore : configuredPoints,
        multiplier: option.scoreRule === "sumWeighted" ? configuredPoints : source.multiplier
      });
      return;
    }

    categories.push({
      key: option.key,
      label: option.key,
      type: "lower",
      scoreRule: option.scoreRule,
      fixedScore: option.scoreRule === "sumWeighted" ? 0 : configuredPoints,
      multiplier: option.scoreRule === "sumWeighted" ? configuredPoints : 0,
      icon: { kind: "word", text: option.iconText }
    });
  });

  const hasYatzy = categories.some((category) => category.key === "yatzy");
  if (!hasYatzy && BASE_LOWER_CATEGORY_BY_KEY.yatzy) {
    categories.push(BASE_LOWER_CATEGORY_BY_KEY.yatzy);
  }

  return categories;
}

function normalizePoints(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : 0;
}

function createInitialState() {
  // Null score slots matter because 0 is a valid Yatzy result.
  // Using null lets the app distinguish "not played yet" from "played for zero".
  const initialState = {
    screen: "splash",
    splashView: "modes",
    setup: {
      mode: "solo",
      // "default" or "watercolor" - see the "Jouer solo (test)" button and
      // render.js's createDieFace(). Purely visual, orthogonal to `mode`.
      diceTheme: "default",
      language: initialSetupLanguage,
      // Indexed by player (0/1), not a single shared value: the in-game
      // settings panel only ever edits the currently active seat's own entry
      // (see handleGameReverseSelectionToggle), so each player can keep an
      // independent preference without affecting the other one.
      reverseDiceSelectionByPlayer: [persistedReverseDiceSelection, persistedReverseDiceSelection],
      extraRollEasterEgg: readPersistedExtraRollEasterEgg(),
      defeatModeEnabled: readPersistedDefeatModeEnabled(),
      rules: cloneRuleSettings(persistedRuleSettings || buildDefaultRuleSettings())
    },
    session: {
      mode: "online",
      gameCode: "",
      joinCode: "",
      role: null,
      resumeToken: "",
      localPlayerIndex: null,
      splashStatus: "",
      splashError: "",
      connectionState: "idle"
    },
    players: PLAYER_META.map((player) => ({
      name: player.name,
      isRobot: Boolean(player.isRobotDefault)
    })),
    currentPlayerIndex: 0,
    dice: Array.from({ length: 5 }, () => ({ value: null, locked: false, lastRolled: false })),
    rollsRemaining: 3,
    turnPhase: "rolling",
    scores: PLAYER_META.map(() => buildEmptyScorecard()),
    pendingScoreSelection: null,
    lastCommittedTurn: null,
    animateDiceOnRender: false,
    yatzyCelebration: null,
    emojiReaction: null,
    defeatMode: [false, false],
    defeatModeAnnouncement: null,
    gameOver: false,
    winner: null,
    statusMessage: ""
  };

  applySetupSettings(initialState);
  return initialState;
}

function t(key, params = {}, language = state.setup.language) {
  return I18N.t(language, key, params);
}

// The local player's own name comes from the profile (shown on the online
// splash step, prefilled from bergamots-player-name — see player-profile.js).
// Local games keep the translated Player 1 / Player 2 labels. Only the local
// seat gets the custom name online; the other seat keeps the default until
// the remote player's real name arrives via hydrateFromRemoteGameState.
function applySetupSettings(targetState) {
  const nameInput = document.getElementById("player-name-input");
  const localIndex = Number.isInteger(targetState.session.localPlayerIndex)
    ? targetState.session.localPlayerIndex
    : 0;
  const typedName = nameInput ? nameInput.value.trim() : "";
  const localName = targetState.setup.mode === "online" ? typedName : "";

  targetState.players = PLAYER_META.map((player, index) => ({
    name: index === localIndex && localName
      ? localName
      : t(`players.player${index + 1}`, {}, targetState.setup.language),
    isRobot: index === 1 && targetState.setup.mode === "robot"
  }));
}

function categoryIconText(categoryKey) {
  const translated = t(`categoryIcons.${categoryKey}`);
  if (translated.startsWith("categoryIcons.")) {
    return categoryLabel(categoryKey).toUpperCase().slice(0, 6);
  }
  return translated;
}

function buildEmptyScorecard() {
  return CATEGORIES.reduce((card, category) => {
    card[category.key] = null;
    return card;
  }, {});
}

function isOnlineGame() {
  return Boolean(state.session.gameCode);
}

function isLocalPlayersTurn() {
  if (!isOnlineGame()) {
    return true;
  }

  return state.currentPlayerIndex === state.session.localPlayerIndex;
}

function isInteractionLocked() {
  return state.gameOver || !isLocalPlayersTurn();
}

function isRobotTurn() {
  return state.screen === "game" && !isOnlineGame() && !state.gameOver && state.players[state.currentPlayerIndex].isRobot;
}

function isSplashBusy() {
  const connectionState = state.session.connectionState;
  return connectionState === "creating"
    || connectionState === "joining"
    || connectionState === "restoring"
    || connectionState === "waiting";
}

function persistPlayerNameFromInput() {
  if (!elements.playerNameInput || !window.PlayerProfile) {
    return;
  }
  window.PlayerProfile.setName(elements.playerNameInput.value.trim());
}

function handleLanguageSelection(language) {
  state.setup.language = language;
  applySetupSettings(state);
  void refreshSettingsRules();
  render();
}

function handleGameLangSelectorClick(event) {
  const language = event.target.closest("[data-lang]")?.dataset.lang;
  if (!language) {
    return;
  }
  handleLanguageSelection(language);
}

// Only ever flips the currently active seat's own preference (see
// reverseDiceSelectionByPlayer on state.setup): opening this panel during
// Player 1's turn edits Player 1's entry, during Player 2's/the robot's turn
// it edits that other entry, never both at once.
function handleGameReverseSelectionToggle(event) {
  state.setup.reverseDiceSelectionByPlayer[state.currentPlayerIndex] = Boolean(event.target.checked);
  render();
}

function handleSettingsInputChange(event) {
  const target = event.target;
  const settingKey = target.dataset.settingKey;
  if (settingKey === "reverseDiceSelection") {
    const enabled = Boolean(target.checked);
    state.setup.reverseDiceSelectionByPlayer = [enabled, enabled];
    persistReverseDiceSelection(enabled);
    render();
    return;
  }

  if (settingKey === "extraRollEasterEgg") {
    state.setup.extraRollEasterEgg = Boolean(target.checked);
    persistExtraRollEasterEgg(state.setup.extraRollEasterEgg);
    if (!state.setup.extraRollEasterEgg) {
      resetBonusRollHunt();
    }
    render();
    return;
  }

  if (settingKey === "defeatModeEnabled") {
    state.setup.defeatModeEnabled = Boolean(target.checked);
    persistDefeatModeEnabled(state.setup.defeatModeEnabled);
    if (!state.setup.defeatModeEnabled) {
      clearTimeout(defeatModeTurnTimeoutId);
      defeatModeTurnTimeoutId = null;
      state.defeatMode = [false, false];
      resetDefeatModeTapCount();
    }
    render();
    return;
  }

  const ruleKey = target.dataset.ruleKey;
  const field = target.dataset.ruleField;

  if (!ruleKey || !field || !state.setup.rules[ruleKey]) {
    return;
  }

  if (field === "enabled") {
    state.setup.rules[ruleKey].enabled = Boolean(target.checked);
  } else if (field === "points") {
    state.setup.rules[ruleKey].points = normalizePoints(target.value);
    target.value = state.setup.rules[ruleKey].points;
  }

  initializeRuntimeDefinitions(state.setup.rules);
  persistRuleSettings(state.setup.rules);
  state.scores = PLAYER_META.map(() => buildEmptyScorecard());
  state.pendingScoreSelection = null;
  state.lastCommittedTurn = null;
  clearUndoWindow();
  clearUndoWindow();
  state.currentPlayerIndex = 0;
  state.dice = Array.from({ length: 5 }, () => ({ value: null, locked: false, lastRolled: false }));
  state.rollsRemaining = 3;
  state.turnPhase = "rolling";
  state.gameOver = false;
  state.winner = null;
  render();
}

function syncRuntimeRulesFromSetup() {
  state.setup.rules = cloneRuleSettings(state.setup.rules);
  initializeRuntimeDefinitions(state.setup.rules);
  persistRuleSettings(state.setup.rules);
}

function persistRuleSettings(ruleSettings) {
  STORAGE.writeJSON(RULE_SETTINGS_STORAGE_KEY, cloneRuleSettings(ruleSettings));
}

function readPersistedRuleSettings() {
  const parsed = STORAGE.readJSON(RULE_SETTINGS_STORAGE_KEY);
  return parsed ? cloneRuleSettings(parsed) : null;
}

function persistReverseDiceSelection(enabled) {
  STORAGE.writeBoolean(REVERSE_SELECTION_STORAGE_KEY, enabled);
}

function readPersistedReverseDiceSelection() {
  return STORAGE.readBoolean(REVERSE_SELECTION_STORAGE_KEY);
}

function persistExtraRollEasterEgg(enabled) {
  STORAGE.writeBoolean(EXTRA_ROLL_EASTER_EGG_STORAGE_KEY, enabled);
}

function readPersistedExtraRollEasterEgg() {
  return STORAGE.readBoolean(EXTRA_ROLL_EASTER_EGG_STORAGE_KEY);
}

function persistDefeatModeEnabled(enabled) {
  STORAGE.writeBoolean(DEFEAT_MODE_ENABLED_STORAGE_KEY, enabled);
}

// Defaults to enabled: unlike the other toggles, nothing-stored-yet must read
// as ON so the checkbox starts checked for players who never touched it.
function readPersistedDefeatModeEnabled() {
  const stored = STORAGE.readJSON(DEFEAT_MODE_ENABLED_STORAGE_KEY);
  return stored === null ? true : Boolean(stored);
}

// Local games (solo vs robot, or two players passing the same device) had no
// resume mechanism at all: unlike an online match (yatzy-online-session,
// restored via restoreOnlineSession()), refreshing mid-game always dropped
// back to the splash screen. This mirrors that same persist/restore/clear
// pattern for local games. Only the fields needed to rebuild the board are
// stored; transient UI state (pending selection, in-flight animations...)
// intentionally comes back from createInitialState()'s own defaults instead.
function persistLocalGameState() {
  if (state.screen !== "game" || isOnlineGame()) {
    clearPersistedLocalGameState();
    return;
  }

  STORAGE.writeJSON(LOCAL_GAME_STORAGE_KEY, {
    mode: state.setup.mode,
    diceTheme: state.setup.diceTheme,
    players: state.players,
    dice: state.dice,
    rollsRemaining: state.rollsRemaining,
    turnPhase: state.turnPhase,
    scores: state.scores,
    currentPlayerIndex: state.currentPlayerIndex,
    defeatMode: state.defeatMode,
    gameOver: state.gameOver,
    winner: state.winner
  });
}

function clearPersistedLocalGameState() {
  STORAGE.remove(LOCAL_GAME_STORAGE_KEY);
}

function readPersistedLocalGameState() {
  const parsed = STORAGE.readJSON(LOCAL_GAME_STORAGE_KEY);
  return parsed && (parsed.mode === "solo" || parsed.mode === "robot") ? parsed : null;
}

function restoreLocalGameState() {
  const persisted = readPersistedLocalGameState();
  if (!persisted) {
    return;
  }

  const freshState = createInitialState();
  freshState.screen = "game";
  freshState.setup.mode = persisted.mode;
  freshState.setup.diceTheme = persisted.diceTheme || "default";
  freshState.players = persisted.players;
  freshState.dice = persisted.dice;
  freshState.rollsRemaining = persisted.rollsRemaining;
  freshState.turnPhase = persisted.turnPhase;
  freshState.scores = persisted.scores;
  freshState.currentPlayerIndex = persisted.currentPlayerIndex;
  freshState.defeatMode = persisted.defeatMode;
  freshState.gameOver = persisted.gameOver;
  freshState.winner = persisted.winner;
  Object.assign(state, freshState);
}

async function handleRestart() {
  if (!isOnlineGame()) {
    resetGame({
      screen: "game",
      language: state.setup.language,
      mode: state.setup.mode
    });
    return;
  }

  await leaveCurrentGame();
  resetGame({
    screen: "splash",
    language: state.setup.language,
    mode: state.setup.mode,
    splashView: "online"
  });
}

async function handleHomeNavigation() {
  if (isOnlineGame()) {
    await leaveCurrentGame();
  }

  resetGame({
    screen: "splash",
    language: state.setup.language,
    mode: state.setup.mode
  });
}

function navigateToHub() {
  window.location.href = "/";
}



function handleLocalStart(mode, diceTheme = "default") {
  syncRuntimeRulesFromSetup();
  resetGame({
    screen: "game",
    language: state.setup.language,
    mode,
    diceTheme
  });
}









// The seat sending a reaction: the local seat when online (either player can
// react any time, not just on their turn), or whichever seat is currently
// playing in a local/robot game shared on one device.
function actingPlayerIndex() {
  return isOnlineGame() ? (state.session.localPlayerIndex ?? state.currentPlayerIndex) : state.currentPlayerIndex;
}

function handleSendReaction(pick) {
  if (state.screen !== "game") {
    return;
  }

  const parsed = window.YATZY_EMOJI?.parseReactionPayload(pick);
  if (!parsed) {
    return;
  }

  const playerIndex = actingPlayerIndex();
  showReaction(state.players[playerIndex].name, parsed);

  if (isOnlineGame()) {
    MATCHMAKING?.sendReaction({ seat: playerIndex, ...parsed });
  }
}

function handleEmojiReceived(payload) {
  const parsed = window.YATZY_EMOJI?.parseReactionPayload(payload);
  if (!parsed) {
    return;
  }

  const playerIndex = payload.seat === 1 ? 1 : 0;
  showReaction(state.players[playerIndex].name, parsed);
}

function showReaction(playerName, pick) {
  clearTimeout(emojiReactionTimeoutId);
  state.emojiReaction = { playerName, ...pick };
  render();

  const ttl = pick.kind === "gif"
    ? (window.YATZY_EMOJI?.GIF_REACTION_TTL_MS || 5000)
    : (window.YATZY_EMOJI?.REACTION_TTL_MS || 2600);
  emojiReactionTimeoutId = setTimeout(() => {
    state.emojiReaction = null;
    render();
  }, ttl);
}

// "Mode defaite": a triple-click on the score summary lets a player whose
// remaining categories are down to the wire hand their own remaining turns
// off to the same decision engine the robot uses, played back very quickly.
// It only affects the activating player's own future turns.
function remainingCategoriesForPlayer(playerIndex) {
  return CATEGORIES.filter((category) => state.scores[playerIndex][category.key] === null).length;
}

function isDefeatModeEnabled() {
  return Boolean(state.setup.defeatModeEnabled);
}

function canActivateDefeatMode() {
  return state.screen === "game"
    && !state.gameOver
    && !isRobotTurn()
    && isLocalPlayersTurn()
    && isDefeatModeEnabled()
    && !state.defeatMode[state.currentPlayerIndex]
    && remainingCategoriesForPlayer(state.currentPlayerIndex) <= DEFEAT_MODE_TURNS_THRESHOLD;
}

function resetDefeatModeTapCount() {
  clearTimeout(defeatModeTapTimeoutId);
  defeatModeTapTimeoutId = null;
  defeatModeTapCount = 0;
}

function handleScoreSummaryClick() {
  if (!canActivateDefeatMode()) {
    resetDefeatModeTapCount();
    return;
  }

  clearTimeout(defeatModeTapTimeoutId);
  defeatModeTapCount += 1;

  if (defeatModeTapCount < 3) {
    defeatModeTapTimeoutId = setTimeout(resetDefeatModeTapCount, DEFEAT_MODE_TAP_WINDOW_MS);
    return;
  }

  resetDefeatModeTapCount();
  activateDefeatMode();
}

function activateDefeatMode() {
  const playerIndex = state.currentPlayerIndex;
  const playerName = state.players[playerIndex].name;
  state.defeatMode[playerIndex] = true;

  if (isOnlineGame()) {
    MATCHMAKING?.sendNotice({ type: "defeatMode", playerName });
  }

  showDefeatModeAnnouncement(playerName);
}

function showDefeatModeAnnouncement(playerName) {
  clearTimeout(defeatModeToastTimeoutId);
  state.defeatModeAnnouncement = { playerName };
  render();

  defeatModeToastTimeoutId = setTimeout(() => {
    state.defeatModeAnnouncement = null;
    render();
  }, DEFEAT_MODE_TOAST_TTL_MS);
}

function handleDefeatModeNoticeReceived(payload) {
  if (payload?.type !== "defeatMode" || typeof payload.playerName !== "string") {
    return;
  }

  showDefeatModeAnnouncement(payload.playerName);
}






function maybeTriggerOnlineYatzyCelebration(previousDiceValues, previousPlayerIndex) {
  const nextDiceValues = state.dice.map((die) => die.value);
  const hadYatzyBefore = isYatzyHand(previousDiceValues);
  const hasYatzyNow = isYatzyHand(nextDiceValues);
  const sameTurnOwner = previousPlayerIndex === state.currentPlayerIndex;

  if (hadYatzyBefore || !hasYatzyNow || !sameTurnOwner) {
    return;
  }

  clearTimeout(yatzyCelebrationTimeoutId);
  state.yatzyCelebration = {
    playerName: state.players[state.currentPlayerIndex].name,
    faceLabel: numberToWord(nextDiceValues[0])
  };

  yatzyCelebrationTimeoutId = setTimeout(() => {
    state.yatzyCelebration = null;
    render();
  }, 1700);
}




function resetGame({
  screen = state.screen,
  language = state.setup.language,
  mode = state.setup.mode,
  diceTheme = state.setup.diceTheme,
  splashView = "modes"
} = {}) {
  clearTimeout(yatzyCelebrationTimeoutId);
  clearTimeout(emojiReactionTimeoutId);
  clearTimeout(robotTurnTimeoutId);
  clearTimeout(defeatModeTurnTimeoutId);
  clearTimeout(defeatModeToastTimeoutId);
  clearUndoWindow();
  yatzyCelebrationTimeoutId = null;
  emojiReactionTimeoutId = null;
  robotTurnTimeoutId = null;
  defeatModeTurnTimeoutId = null;
  defeatModeToastTimeoutId = null;
  emojiController?.close();
  robotQueuedScoreCategory = null;
  robotStepDelayMs = getRobotDelayMs(ROBOT_CONFIG.rollDelayMs);
  resetBonusRollHunt();
  resetDefeatModeTapCount();
  localResultRecorded = false;

  const freshState = createInitialState();
  freshState.screen = screen;
  freshState.setup.mode = mode;
  freshState.setup.diceTheme = diceTheme;
  freshState.setup.language = language;
  freshState.setup.reverseDiceSelectionByPlayer = [...state.setup.reverseDiceSelectionByPlayer];
  freshState.setup.extraRollEasterEgg = state.setup.extraRollEasterEgg;
  freshState.setup.defeatModeEnabled = state.setup.defeatModeEnabled;
  freshState.setup.rules = cloneRuleSettings(state.setup.rules);
  initializeRuntimeDefinitions(freshState.setup.rules);
  applySetupSettings(freshState);
  Object.assign(state, freshState);
  state.splashView = splashView;
  if (mode !== "online") {
    clearPersistedOnlineSession();
  }
  render();
}








function scheduleRobotTurnIfNeeded() {
  if (!isRobotTurn() || robotTurnTimeoutId) {
    return;
  }

  const delay = robotStepDelayMs;
  robotStepDelayMs = getRobotDelayMs(ROBOT_CONFIG.rollDelayMs);

  robotTurnTimeoutId = setTimeout(() => {
    robotTurnTimeoutId = null;
    runRobotTurnStep();
  }, delay);
}

function runRobotTurnStep() {
  if (!isRobotTurn()) {
    return;
  }

  if (robotQueuedScoreCategory) {
    const queuedCategoryKey = robotQueuedScoreCategory;
    robotQueuedScoreCategory = null;
    handleScoreSelection(queuedCategoryKey);
    return;
  }

  const diceValues = state.dice.map((die) => die.value);
  const turnStarted = diceValues.some((value) => value !== null);

  if (!turnStarted && state.rollsRemaining === 3) {
    robotStepDelayMs = getRobotDelayMs(ROBOT_CONFIG.rollDelayMs);
    handleRoll();
    return;
  }

  const decision = getRobotDecision();

  if (decision.type === "score") {
    robotQueuedScoreCategory = decision.categoryKey;
    robotTurnTimeoutId = setTimeout(() => {
      robotTurnTimeoutId = null;
      runRobotTurnStep();
    }, getRobotDelayMs(ROBOT_CONFIG.scoreChoiceDelayMs));
    return;
  }

  if (decision.type === "hold") {
    const lockPatternChanged = applyRobotHoldPattern(decision.lockMask);
    if (lockPatternChanged) {
      robotStepDelayMs = getRobotDelayMs(ROBOT_CONFIG.holdDelayMs, false);
      render();
      return;
    }
  }

  robotStepDelayMs = getRobotDelayMs(ROBOT_CONFIG.rollDelayMs);
  handleRoll();
}

function getRobotDecision() {
  return robotEngine.getDecision(
    state.scores[state.currentPlayerIndex],
    state.dice.map((die) => die.value),
    state.rollsRemaining
  );
}

function applyRobotHoldPattern(lockMask) {
  let changed = false;
  const reverseSelectionEnabled = state.setup.reverseDiceSelectionByPlayer[state.currentPlayerIndex];

  state.dice = state.dice.map((die, index) => {
    const shouldLock = Boolean(lockMask & (1 << index));
    const nextLocked = reverseSelectionEnabled ? !shouldLock : shouldLock;
    if (die.locked !== nextLocked) {
      changed = true;
    }

    return {
      ...die,
      locked: nextLocked
    };
  });

  return changed;
}

// Drives the activating player's own remaining turns through the robot's
// decision engine, reusing getRobotDecision()/applyRobotHoldPattern() so the
// choices stay consistent with the robot, but paced much faster and allowed
// during online games (unlike isRobotTurn(), which excludes online play).
function isDefeatModeTurn() {
  return state.screen === "game"
    && !state.gameOver
    && !isRobotTurn()
    && isLocalPlayersTurn()
    && isDefeatModeEnabled()
    && Boolean(state.defeatMode[state.currentPlayerIndex]);
}

function scheduleDefeatModeTurnIfNeeded() {
  if (!isDefeatModeTurn() || defeatModeTurnTimeoutId) {
    return;
  }

  defeatModeTurnTimeoutId = setTimeout(() => {
    defeatModeTurnTimeoutId = null;
    runDefeatModeTurnStep();
  }, DEFEAT_MODE_STEP_DELAY_MS);
}

function runDefeatModeTurnStep() {
  if (!isDefeatModeTurn()) {
    return;
  }

  const diceValues = state.dice.map((die) => die.value);
  const turnStarted = diceValues.some((value) => value !== null);

  if (!turnStarted && state.rollsRemaining === 3) {
    handleRoll();
    return;
  }

  const decision = getRobotDecision();

  if (decision.type === "score") {
    handleScoreSelection(decision.categoryKey);
    return;
  }

  if (decision.type === "hold") {
    const lockPatternChanged = applyRobotHoldPattern(decision.lockMask);
    if (lockPatternChanged) {
      render();
      syncOnlineGameState();
      return;
    }
  }

  handleRoll();
}






function resetBonusRollHunt() {
  extraRollTapCount = 0;
  bonusRollUsedThisTurn = false;
}

function isExtraRollEasterEggEnabled() {
  return Boolean(state.setup.extraRollEasterEgg) || readPersistedExtraRollEasterEgg();
}

function canKeepSecretRollClicks() {
  return isExtraRollEasterEggEnabled()
    && !state.gameOver
    && !isRobotTurn()
    && isLocalPlayersTurn();
}

function canHuntBonusRoll() {
  return canKeepSecretRollClicks()
    && !bonusRollUsedThisTurn
    && !state.pendingScoreSelection
    && state.rollsRemaining === 0
    && state.dice.every((die) => die.value !== null);
}

function consumeSecretExtraRollTaps() {
  if (!canHuntBonusRoll()) {
    return false;
  }

  extraRollTapCount += 1;
  if (extraRollTapCount < 3) {
    return true;
  }

  bonusRollUsedThisTurn = true;
  extraRollTapCount = 0;
  state.rollsRemaining = 1;
  state.turnPhase = "rolling";
  state.lastCommittedTurn = null;
  return false;
}

function shouldForcePlayerOneYatzy() {
  if (!isExtraRollEasterEggEnabled() || state.currentPlayerIndex !== 0) {
    return false;
  }

  return RANDOM.getSecureRandomInt(1, 2) === 1;
}

function forceYatzyHand(dice) {
  const face = randomDieValue();
  return dice.map((die) => ({ ...die, value: face, lastRolled: true }));
}

function handleRoll() {
  if (consumeSecretExtraRollTaps()) {
    return;
  }

  if (state.gameOver || state.turnPhase !== "rolling" || state.rollsRemaining <= 0 || !isLocalPlayersTurn()) {
    return;
  }

  state.lastCommittedTurn = null;
  clearUndoWindow();

  const firstRollOfTurn = state.rollsRemaining === 3 && state.dice.every((die) => die.value === null);
  const reverseSelectionEnabled = state.setup.reverseDiceSelectionByPlayer[state.currentPlayerIndex];
  const dieWouldReroll = (die) => firstRollOfTurn || (reverseSelectionEnabled ? die.locked : !die.locked);
  const rerollHeldDice = bonusRollUsedThisTurn && !state.dice.some(dieWouldReroll);
  state.dice = state.dice.map((die) => {
    const shouldReroll = rerollHeldDice || dieWouldReroll(die);
    if (!shouldReroll) {
      return { ...die, lastRolled: false };
    }

    return { ...die, value: randomDieValue(), lastRolled: true };
  });
  if (shouldForcePlayerOneYatzy()) {
    state.dice = forceYatzyHand(state.dice);
  }
  state.animateDiceOnRender = true;

  state.rollsRemaining -= 1;

  const allRollsSpent = state.rollsRemaining === 0;
  const playerName = state.players[state.currentPlayerIndex].name;
  state.turnPhase = allRollsSpent ? "scoring" : "rolling";
  state.statusMessage = allRollsSpent
    ? `${playerName}, choose a category for this turn.`
    : `${playerName}, roll again or score whenever you are ready.`;

  maybeTriggerYatzyCelebration();

  render();
  syncOnlineGameState();
  state.animateDiceOnRender = false;
}

function handleDieToggle(index) {
  const turnStarted = state.rollsRemaining < 3 || state.dice.some((die) => die.value !== null);

  if (!turnStarted || state.turnPhase !== "rolling" || state.gameOver || state.pendingScoreSelection || !isLocalPlayersTurn()) {
    return;
  }

  state.dice = state.dice.map((die, dieIndex) => (
    dieIndex === index
      ? { ...die, locked: !die.locked }
      : die
  ));
  state.lastCommittedTurn = null;
  clearUndoWindow();

  render();
  syncOnlineGameState();
}

function maybeTriggerYatzyCelebration() {
  const values = state.dice.map((die) => die.value);

  if (!isYatzyHand(values)) {
    return;
  }

  clearTimeout(yatzyCelebrationTimeoutId);
  state.yatzyCelebration = {
    playerName: state.players[state.currentPlayerIndex].name,
    faceLabel: numberToWord(values[0])
  };

  yatzyCelebrationTimeoutId = setTimeout(() => {
    state.yatzyCelebration = null;
    render();
  }, 1700);
}

async function handleScoreSelection(categoryKey) {
  if (!isCategoryScoreable(state.currentPlayerIndex, categoryKey) || !isLocalPlayersTurn()) {
    return;
  }

  if (scoringAnimationInFlight) {
    return;
  }

  state.lastCommittedTurn = null;

  if (isRobotTurn()) {
    const score = previewScore(categoryKey);
    commitScoreSelection(state.currentPlayerIndex, categoryKey, score, null);
    return;
  }

  const playerIndex = state.currentPlayerIndex;
  const score = previewScore(categoryKey);
  const turnSnapshot = {
    currentPlayerIndex: state.currentPlayerIndex,
    dice: state.dice.map((die) => ({ ...die })),
    rollsRemaining: state.rollsRemaining,
    turnPhase: state.turnPhase
  };
  scoringAnimationInFlight = true;
  render();
  try {
    await animateDiceIntoScoreCell(playerIndex, categoryKey);
  } finally {
    scoringAnimationInFlight = false;
  }
  commitScoreSelection(playerIndex, categoryKey, score, turnSnapshot);
}

function handleSelectionCancel() {
  if (!state.lastCommittedTurn || isOnlineGame() || scoringAnimationInFlight) {
    return;
  }

  const { playerIndex, categoryKey, score, turnSnapshot } = state.lastCommittedTurn;
  clearUndoWindow();
  state.scores[playerIndex][categoryKey] = null;
  state.currentPlayerIndex = turnSnapshot.currentPlayerIndex;
  state.dice = turnSnapshot.dice.map((die) => ({ ...die }));
  state.rollsRemaining = turnSnapshot.rollsRemaining;
  state.turnPhase = turnSnapshot.turnPhase;
  state.pendingScoreSelection = null;
  state.lastCommittedTurn = null;
  state.statusMessage = `${state.players[playerIndex].name} score ${score} reverted. Choose another category.`;
  render();
}

function getSelectedScoreCell(playerIndex, categoryKey) {
  return elements.scoreboard.querySelector(
    `.player-cell[data-player-index="${playerIndex}"][data-category-key="${categoryKey}"]`
  );
}

function createFlightClone(dieElement) {
  const clone = dieElement.cloneNode(true);
  const dieRect = dieElement.getBoundingClientRect();
  clone.style.position = "fixed";
  clone.style.top = `${dieRect.top}px`;
  clone.style.left = `${dieRect.left}px`;
  clone.style.width = `${dieRect.width}px`;
  clone.style.height = `${dieRect.height}px`;
  clone.style.margin = "0";
  clone.style.pointerEvents = "none";
  clone.style.zIndex = "50";
  return clone;
}

function animateCloneIntoCell(clone, dieRect, cellRect, index, totalCount) {
  const cellCenterX = cellRect.left + (cellRect.width / 2);
  const cellCenterY = cellRect.top + (cellRect.height / 2);
  const spread = (index - ((totalCount - 1) / 2)) * Math.max(10, cellRect.width * 0.08);
  const targetX = (cellCenterX + spread) - (dieRect.left + (dieRect.width / 2));
  const targetY = cellCenterY - (dieRect.top + (dieRect.height / 2));
  const animation = clone.animate([
    { transform: "translate3d(0, 0, 0) scale(1) rotate(0deg)", opacity: 1, offset: 0 },
    { transform: `translate3d(${targetX * 0.55}px, ${(targetY * 0.2) - 36}px, 0) scale(0.95) rotate(${(index - 2) * 8}deg)`, opacity: 0.96, offset: 0.62 },
    { transform: `translate3d(${targetX}px, ${targetY}px, 0) scale(0.34) rotate(${(index - 2) * 18}deg)`, opacity: 0.02, offset: 1 }
  ], {
    duration: 500 + (index * 36),
    easing: "cubic-bezier(0.22, 1, 0.36, 1)",
    fill: "forwards"
  });
  return animation.finished.catch(() => undefined);
}

async function animateDiceIntoScoreCell(playerIndex, categoryKey) {
  const targetCell = getSelectedScoreCell(playerIndex, categoryKey);
  const diceElements = Array.from(elements.diceRow.querySelectorAll(".game-die"));
  if (!targetCell || diceElements.length === 0) {
    return;
  }

  const targetRect = targetCell.getBoundingClientRect();
  const clones = diceElements.map((dieElement) => {
    const dieRect = dieElement.getBoundingClientRect();
    const clone = createFlightClone(dieElement);
    document.body.appendChild(clone);
    return { clone, dieRect };
  });

  elements.diceRow.classList.add("is-score-animating");
  targetCell.classList.add("score-cell-catch");
  await Promise.all(clones.map((entry, index) => (
    animateCloneIntoCell(entry.clone, entry.dieRect, targetRect, index, clones.length)
  )));
  clones.forEach((entry) => entry.clone.remove());
  elements.diceRow.classList.remove("is-score-animating");
  targetCell.classList.remove("score-cell-catch");
}

function commitScoreSelection(playerIndex, categoryKey, score, turnSnapshot) {
  state.scores[playerIndex][categoryKey] = score;
  state.pendingScoreSelection = null;
  state.lastCommittedTurn = null;
  clearUndoWindow();

  if (isScoreboardFull()) {
    finishGame();
    render();
    syncOnlineGameState();
    return;
  }

  // A turn ends by resetting all turn-scoped state in one place,
  // which guarantees the next player starts from the same baseline every time.
  const finishedPlayerName = state.players[state.currentPlayerIndex].name;
  resetBonusRollHunt();
  resetDefeatModeTapCount();
  state.currentPlayerIndex = state.currentPlayerIndex === 0 ? 1 : 0;
  state.dice = Array.from({ length: 5 }, () => ({ value: null, locked: false, lastRolled: false }));
  state.rollsRemaining = 3;
  state.turnPhase = "rolling";
  if (!isOnlineGame() && turnSnapshot) {
    state.lastCommittedTurn = {
      playerIndex,
      categoryKey,
      score,
      turnSnapshot
    };
    startUndoWindow();
  }
  state.statusMessage = `${finishedPlayerName} scored ${score}. ${state.players[state.currentPlayerIndex].name}, press LANCER to start your turn.`;

  render();
  syncOnlineGameState();
}

function isCategoryScoreable(playerIndex, categoryKey) {
  // Legal moves are derived purely from state:
  // active player, open score slot, and a complete rolled hand.
  const isCurrentPlayer = playerIndex === state.currentPlayerIndex;
  const slotEmpty = state.scores[playerIndex][categoryKey] === null;
  const hasRolledThisTurn = state.dice.every((die) => die.value !== null);
  return isCurrentPlayer && slotEmpty && hasRolledThisTurn && isLocalPlayersTurn();
}

function previewScore(categoryKey) {
  return calculateCategoryScore(categoryKey, state.dice.map((die) => die.value));
}

function calculateCategoryScore(categoryKey, values) {
  return SCORING.calculateCategoryScore(CATEGORY_MAP, categoryKey, values);
}

function isYatzyHand(values) {
  return SCORING.isYatzyHand(values);
}

function calculateUpperSection(scorecard) {
  return SCORING.calculateUpperSection(CATEGORIES, scorecard);
}

function calculateGrandTotal(scorecard) {
  return SCORING.calculateGrandTotal(CATEGORIES, BONUS_CONFIG, scorecard);
}

function calculateMinMaxDelta(scorecard) {
  return SCORING.calculateMinMaxDelta(scorecard);
}

function isScoreboardFull(scoreMatrix = state.scores) {
  return SCORING.isScoreboardFull(CATEGORIES, scoreMatrix);
}

function finishGame() {
  state.gameOver = true;
  applyWinnerFromScores(state);
  recordGameResultIfNeeded(state);
}

// Only "robot" (human vs bot) and "online" (real seat) have an unambiguous
// "me" to attribute a result to. "solo" mode is 2 human players sharing this
// device (misleadingly named - see index.html's splash buttons), so no
// single local player's win/loss can be recorded there.
function resolveLocalResultPlayerIndex(targetState) {
  if (targetState.setup.mode === "online") {
    return Number.isInteger(targetState.session.localPlayerIndex)
      ? targetState.session.localPlayerIndex
      : null;
  }
  if (targetState.setup.mode === "robot") {
    return 0;
  }
  return null;
}

function recordGameResultIfNeeded(targetState) {
  if (!targetState.gameOver || localResultRecorded) return;
  localResultRecorded = true;

  const localIndex = resolveLocalResultPlayerIndex(targetState);
  if (localIndex === null || !window.PlayerProfile) return;

  const totals = [calculateGrandTotal(targetState.scores[0]), calculateGrandTotal(targetState.scores[1])];
  if (totals[0] === totals[1]) return;
  const won = totals[localIndex] > totals[localIndex === 0 ? 1 : 0];
  window.PlayerProfile.recordGameResult(won);
  window.MuchogamesProfileResults?.recordSharedResult(won);
}

function applyWinnerFromScores(targetState) {
  const playerOneTotal = calculateGrandTotal(targetState.scores[0]);
  const playerTwoTotal = calculateGrandTotal(targetState.scores[1]);

  if (playerOneTotal === playerTwoTotal) {
    targetState.winner = t("winner.tie");
    targetState.statusMessage = t("winner.tie");
    return;
  }

  targetState.winner = playerOneTotal > playerTwoTotal ? targetState.players[0].name : targetState.players[1].name;
  targetState.statusMessage = t("winner.win", { name: targetState.winner });
}

function getDieAriaLabel(die, index) {
  const order = index + 1;

  if (die.value === null) {
    return t("aria.dieWaiting", { order });
  }

  return t("aria.dieShowing", {
    order,
    value: die.value,
    state: die.locked ? t("diceState.kept") : t("diceState.free")
  });
}

function randomDieValue() {
  return RANDOM.randomDieValue();
}

function categoryLabel(categoryKey) {
  return t(`categories.${categoryKey}`);
}

function getRuleDisplayName(ruleKey) {
  return t(`categories.${ruleKey}`);
}

function numberToWord(value) {
  return t(`faces.${value}`);
}

function registerOfflineSupport() {
  // A tiny service worker keeps the app runnable offline after the first load
  // when it is served from http(s). Local file:// usage already has the assets.
  if (!("serviceWorker" in navigator) || window.location.protocol === "file:") {
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {
      // Offline caching is a progressive enhancement, so we silently continue.
    });
  });
}