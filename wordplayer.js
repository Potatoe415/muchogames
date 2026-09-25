import {
  loadGameData,
  pullRandomWord,
  renderWordToScreen,
  getWordText,
  getTabooWords,
  applyCategoryColorToElement,
  loadRulesIfExists
} from "./public/shared/js/engine.js";

const HUB_CONFIG_URL = "/hub-config.json";
const BUZZER_SOUND_URL = "/audio/buzzer.mp3";

const DOM = {
  wordDisplay: "word-display",
  controlsContainer: "controls-container",
  banner: "game-banner",
  score: "score-display",
  langSelector: "lang-selector",
  timerDisplay: "timer-display",
  customTimerInput: "custom-timer-input"
};

const TIMER_PRESETS = [0, 45, 60];
const CUSTOM_TIMER_MIN = 1;
const CUSTOM_TIMER_MAX = 300;
const CUSTOM_TIMER_DEFAULT = 90;

const LANG_LABELS = {
  fr: {
    ready: "Prêt ?",
    finished: "Partie Terminée !",
    next: "Mot Suivant",
    pass: "Passer",
    validate: "Valider",
    start: "Démarrer",
    noTimer: "Sans minuteur",
    loading: "Chargement...",
    errorNoGame: "Erreur : Aucun jeu sélectionné dans l'URL.",
    errorGameNotFound: "Jeu non trouvé ou non pris en charge : {GAME_ID}",
    errorLoadFailed: "Impossible de charger : {GAME_ID}",
    statsPoints: "Points :",
    statsSkipped: "Passés :",
    statsSuccessRate: "Taux de réussite :",
    statsAvgTime: "Temps moyen par carte :",
    restartKeep: "Relancer",
    restartAll: "Tout re-mélanger"
  },
  en: {
    ready: "Ready?",
    finished: "Game Over!",
    next: "Next Word",
    pass: "Skip",
    validate: "Validate",
    start: "Start",
    noTimer: "No timer",
    loading: "Loading...",
    errorNoGame: "Error: No game selected in the URL.",
    errorGameNotFound: "Game not found or unsupported: {GAME_ID}",
    errorLoadFailed: "Unable to load: {GAME_ID}",
    statsPoints: "Points:",
    statsSkipped: "Skipped:",
    statsSuccessRate: "Success rate:",
    statsAvgTime: "Avg time per card:",
    restartKeep: "Restart",
    restartAll: "Reshuffle all cards"
  },
  es: {
    ready: "¿Listo?",
    finished: "¡Juego Terminado!",
    next: "Siguiente",
    pass: "Saltar",
    validate: "Validar",
    start: "Empezar",
    noTimer: "Sin tiempo",
    loading: "Cargando...",
    errorNoGame: "Error: Ningún juego seleccionado en la URL.",
    errorGameNotFound: "Juego no encontrado o no compatible: {GAME_ID}",
    errorLoadFailed: "No se puede cargar: {GAME_ID}",
    statsPoints: "Puntos:",
    statsSkipped: "Saltados:",
    statsSuccessRate: "Tasa de acierto:",
    statsAvgTime: "Tiempo medio por carta:",
    restartKeep: "Reiniciar",
    restartAll: "Barajar todas las cartas"
  }
};

const LANGUAGE_FLAGS = [
  { code: "fr", flag: "🇫🇷" },
  { code: "en", flag: "🇬🇧" },
  { code: "es", flag: "🇪🇸" }
];

function readHubLanguage() {
  try {
    const stored = localStorage.getItem("bergamots-lang");
    return LANGUAGE_FLAGS.some((entry) => entry.code === stored)
      ? stored
      : "fr";
  } catch {
    return "fr";
  }
}

const gameState = {
  allWords: [],
  availableWords: [],
  score: 0,
  controls: [],
  currentLanguage: readHubLanguage(),
  currentWord: null,
  phase: "setup",
  timerEnabled: false,
  timerDuration: 60,
  timerRemaining: 0,
  timerInterval: null,
  statsSuccess: 0,
  statsSkipped: 0,
  statsTotalTimeMs: 0,
  currentCardStartedAtMs: 0,
  percentChanceDefi: 0,
  currentCardIsDefi: false,
  isCurrentWordHidden: false,
  currentGameId: null,
  rulesByLanguage: {}
};

let buzzerAudio = null;

function getCurrentLabels() {
  return LANG_LABELS[gameState.currentLanguage] || LANG_LABELS.fr;
}

function resetStats() {
  gameState.statsSuccess = 0;
  gameState.statsSkipped = 0;
  gameState.statsTotalTimeMs = 0;
  gameState.currentCardStartedAtMs = 0;
}

function recordCardResult(points) {
  const now = Date.now();
  if (gameState.currentCardStartedAtMs > 0) {
    gameState.statsTotalTimeMs += now - gameState.currentCardStartedAtMs;
  }
  if (points > 0) {
    gameState.statsSuccess += 1;
  } else {
    gameState.statsSkipped += 1;
  }
  gameState.currentCardStartedAtMs = 0;
}

function computeStatsSnapshot() {
  const totalCards = gameState.statsSuccess + gameState.statsSkipped;
  const successRate =
    totalCards === 0
      ? 0
      : Math.round((gameState.statsSuccess / totalCards) * 100);
  const avgSeconds =
    totalCards === 0 ? 0 : gameState.statsTotalTimeMs / totalCards / 1000;

  return {
    points: gameState.score,
    skipped: gameState.statsSkipped,
    successRate,
    avgSeconds
  };
}

function getDefiChance() {
  const raw = Number(gameState.percentChanceDefi);
  if (Number.isNaN(raw)) return 0;
  if (raw <= 0) return 0;
  if (raw >= 100) return 100;
  return raw;
}

function updateDefiClass(isActive) {
  const el = document.getElementById(DOM.wordDisplay);
  if (!el) return;
  el.classList.toggle("defi-active", isActive);
}

function rollDefiForCurrentCard() {
  const chance = getDefiChance();
  if (!chance) {
    gameState.currentCardIsDefi = false;
    updateDefiClass(false);
    return;
  }

  const isDefi = Math.random() * 100 < chance;
  gameState.currentCardIsDefi = isDefi;
  updateDefiClass(isDefi);
}

function normalizeControls(rawControls) {
  if (!Array.isArray(rawControls) || rawControls.length === 0) {
    return ["next"];
  }

  const normalized = new Set();

  rawControls.forEach((raw) => {
    const value = String(raw).toLowerCase();
    if (value === "next") normalized.add("next");
    if (value === "skip" || value === "pass") normalized.add("pass");
    if (value === "success" || value === "validate") normalized.add("success");
    if (value === "failed" || value === "fail") normalized.add("failed");
  });

  if (normalized.size === 0) {
    return ["next"];
  }

  return Array.from(normalized);
}

function playBuzzer() {
  try {
    if (!buzzerAudio) {
      buzzerAudio = new Audio(BUZZER_SOUND_URL);
    }
    buzzerAudio.currentTime = 0;
    void buzzerAudio.play();
  } catch {
    // ignore audio errors
  }
}

const MASK_TEXT = "************";

function maskCurrentWord() {
  if (!gameState.currentWord || gameState.isCurrentWordHidden) {
    return;
  }

  const container = document.getElementById(DOM.wordDisplay);
  if (!container) {
    return;
  }

  container.textContent = MASK_TEXT;
  gameState.isCurrentWordHidden = true;
}

function onWordCardDoubleActivate() {
  if (gameState.phase !== "playing" || !gameState.currentWord) {
    return;
  }

  if (gameState.isCurrentWordHidden) {
    gameState.isCurrentWordHidden = false;
    renderCurrentCard();
  } else {
    maskCurrentWord();
  }
}

function attachWordCardHideHandlers() {
  const cardElement = document.getElementById(DOM.wordDisplay);
  if (!cardElement) {
    return;
  }

  cardElement.addEventListener("dblclick", onWordCardDoubleActivate);
}

function renderEndScreen() {
  const container = document.getElementById(DOM.wordDisplay);
  if (!container) return;

  const labels = getCurrentLabels();
  const stats = computeStatsSnapshot();
  const avgTimeText = stats.avgSeconds.toFixed(1);

  container.innerHTML = `
    <div class="end-screen">
      <div class="end-title">${labels.finished}</div>
      <ul class="end-stats">
        <li>${labels.statsPoints} ${stats.points}</li>
        <li>${labels.statsSkipped} ${stats.skipped}</li>
        <li>${labels.statsSuccessRate} ${stats.successRate}%</li>
        <li>${labels.statsAvgTime} ${avgTimeText}s</li>
      </ul>
    </div>
  `;
}

function renderEndControls() {
  const container = document.getElementById(DOM.controlsContainer);
  if (!container) return;

  const labels = getCurrentLabels();
  container.innerHTML = "";

  const restartKeepBtn = createActionButton(
    labels.restartKeep,
    "btn-restart-keep",
    restartSessionKeepRemaining
  );
  const restartAllBtn = createActionButton(
    labels.restartAll,
    "btn-restart-all",
    restartSessionReshuffleAll
  );

  container.appendChild(restartKeepBtn);
  container.appendChild(restartAllBtn);
}

document.addEventListener("DOMContentLoaded", initializeWordPlayer);

async function fetchHubConfig() {
  const response = await fetch(HUB_CONFIG_URL);
  if (!response.ok) {
    throw new Error(`Hub config failed: ${response.status}`);
  }
  return response.json();
}

function findWordpackGame(gamesList, gameId) {
  if (!Array.isArray(gamesList)) return null;
  const game = gamesList.find((g) => g.id === gameId);
  if (!game || game.kind !== "wordpack" || !game.data) return null;
  return game;
}

async function initializeWordPlayer() {
  const urlParams = new URLSearchParams(window.location.search);
  const gameId = urlParams.get("game");

  document.documentElement.lang = gameState.currentLanguage;

  attachWordCardHideHandlers();

  const labels = getCurrentLabels();
  renderWordToScreen(DOM.wordDisplay, labels.loading);

  if (!gameId) {
    handleFatalError(labels.errorNoGame);
    return;
  }

  try {
    const gamesList = await fetchHubConfig();
    const gameEntry = findWordpackGame(gamesList, gameId);

    if (!gameEntry) {
      const message = labels.errorGameNotFound.replace("{GAME_ID}", gameId);
      handleFatalError(message);
      return;
    }

    const gameConfiguration = await loadGameData(gameEntry.data);

    gameState.allWords = [...gameConfiguration.words];
    gameState.availableWords = [...gameState.allWords];
    gameState.controls = normalizeControls(gameConfiguration.controls);
    gameState.percentChanceDefi =
      Number(gameConfiguration.percentChanceDefi) || 0;
    gameState.timerEnabled =
      typeof gameConfiguration.timer === "string" &&
      gameConfiguration.timer.toUpperCase() === "ON";

    gameState.currentGameId = gameEntry.id;
    await ensureRulesForCurrentLanguage();

    hydrateUserInterface(gameEntry);
    initLanguageSelector();
    initOptionsPanel();
    renderSetupScreen();
  } catch (error) {
    console.error(error);
    const message = labels.errorLoadFailed.replace("{GAME_ID}", gameId);
    handleFatalError(message);
  }
}

function hydrateUserInterface(gameEntry) {
  document.title = `${gameEntry.title} - Muchogames`;

  const bannerSource = gameEntry.banner || gameEntry.thumbnail;
  const bannerElement = document.getElementById(DOM.banner);
  if (!bannerElement || !bannerSource) {
    return;
  }

  bannerElement.src = bannerSource;

  bannerElement.onerror = () => {
    const currentSource =
      typeof bannerElement.src === "string" ? bannerElement.src : "";
    const hasTriedPngFallback =
      bannerElement.dataset.triedPngFallback === "true";

    if (!hasTriedPngFallback && currentSource.endsWith(".jpg")) {
      bannerElement.dataset.triedPngFallback = "true";
      bannerElement.src = currentSource.replace(/\.jpg$/, ".png");
    }
  };
}

async function ensureRulesForCurrentLanguage() {
  const gameId = gameState.currentGameId;
  const language = gameState.currentLanguage;

  if (!gameId) {
    return;
  }

  if (!gameState.rulesByLanguage[language]) {
    const rulesHtml = await loadRulesIfExists(gameId, language);
    if (rulesHtml) {
      gameState.rulesByLanguage[language] = rulesHtml;
    } else {
      gameState.rulesByLanguage[language] = null;
    }
  }

  renderRulesSection();
}

function renderRulesSection() {
  const section = document.getElementById("rules-section");
  const content = document.getElementById("rules-content");
  const language = gameState.currentLanguage;

  if (!section || !content) {
    return;
  }

  const rulesHtml = gameState.rulesByLanguage[language];
  section.style.display = rulesHtml ? "block" : "none";
  content.innerHTML = rulesHtml || "";
}

function initLanguageSelector() {
  const selectorElement = document.getElementById(DOM.langSelector);
  if (!selectorElement) return;

  LANGUAGE_FLAGS.forEach(({ code, flag }) => {
    const button = document.createElement("button");
    button.textContent = flag;
    button.className = `lang-btn${code === gameState.currentLanguage ? " active" : ""}`;
    button.dataset.lang = code;
    button.addEventListener("click", () => handleLanguageChange(code));
    selectorElement.appendChild(button);
  });
}

function handleLanguageChange(language) {
  gameState.currentLanguage = language;

  document.documentElement.lang = language;

  document.querySelectorAll(".lang-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.lang === language);
  });

  if (gameState.phase === "setup") {
    ensureRulesForCurrentLanguage().then(() => {
      renderSetupScreen();
    });
    return;
  }

  if (gameState.currentWord) {
    renderCurrentCard();
  }

  renderControls(gameState.controls);
}

function initOptionsPanel() {
  const trigger = document.getElementById("options-button");
  const panel = document.getElementById("options-panel");
  if (window.GameHeader) {
    window.GameHeader.initOptionsPanel(trigger, panel);
  }
}

function renderCurrentCard() {
  const container = document.getElementById(DOM.wordDisplay);
  const word = gameState.currentWord;

  if (!container || !word) {
    return;
  }

  if (gameState.isCurrentWordHidden) {
    renderWordToScreen(DOM.wordDisplay, MASK_TEXT);
    applyCategoryColorToElement(container, null);
    return;
  }

  const mainText = getWordText(word, gameState.currentLanguage);
  const tabooWords = getTabooWords(word, gameState.currentLanguage);

  if (tabooWords.length === 0) {
    renderWordToScreen(DOM.wordDisplay, mainText);
  } else {
    const tabooItems = tabooWords
      .map((taboo) => `<li class="taboo-item">${taboo}</li>`)
      .join("");

    container.innerHTML = `
      <div class="word-main-term-wrapper">
        <div class="word-main-term">${mainText}</div>
      </div>
      <div class="word-taboo-container">
        <div class="word-taboo-separator"></div>
        <ul class="word-taboo-list">${tabooItems}</ul>
      </div>
    `;
  }

  const category = word.meta && word.meta.category ? word.meta.category : null;
  applyCategoryColorToElement(container, category);
}

function renderSetupScreen() {
  gameState.phase = "setup";
  const labels = getCurrentLabels();

  renderWordToScreen(DOM.wordDisplay, labels.ready);

  const container = document.getElementById(DOM.controlsContainer);
  if (!container) return;
  container.innerHTML = "";

  if (gameState.timerEnabled) {
    const timerGroup = document.createElement("div");
    timerGroup.className = "timer-selector";

    TIMER_PRESETS.forEach((seconds) => {
      const btn = document.createElement("button");
      const isActive =
        seconds === gameState.timerDuration &&
        !isCustomValue(gameState.timerDuration);
      btn.className = `timer-option${isActive ? " active" : ""}`;
      btn.dataset.seconds = String(seconds);
      btn.textContent = seconds === 0 ? labels.noTimer : `${seconds}s`;
      btn.addEventListener("click", () => selectTimerPreset(seconds));
      timerGroup.appendChild(btn);
    });

    const customWrap = document.createElement("span");
    customWrap.className = "custom-timer-wrap";

    const customInput = document.createElement("input");
    customInput.type = "number";
    customInput.id = DOM.customTimerInput;
    customInput.min = CUSTOM_TIMER_MIN;
    customInput.max = CUSTOM_TIMER_MAX;
    customInput.value = customInputValue();
    customInput.addEventListener("input", () => onCustomTimerInput());
    customInput.addEventListener("focus", () => onCustomTimerInput());

    const customLabel = document.createElement("span");
    customLabel.className = "custom-timer-suffix";
    customLabel.textContent = "s";
    customWrap.appendChild(customInput);
    customWrap.appendChild(customLabel);
    timerGroup.appendChild(customWrap);

    container.appendChild(timerGroup);
  }
  container.appendChild(
    createActionButton(labels.start, "btn-start", startGame)
  );
}

function isCustomValue(seconds) {
  return TIMER_PRESETS.indexOf(seconds) === -1 && seconds > 0;
}

function customInputValue() {
  if (isCustomValue(gameState.timerDuration)) return gameState.timerDuration;
  if (gameState.timerDuration === 0) return CUSTOM_TIMER_DEFAULT;
  return gameState.timerDuration;
}

function onCustomTimerInput() {
  const input = document.getElementById(DOM.customTimerInput);
  if (!input) return;
  const value = clampCustomSeconds(Number(input.value) || 0);
  gameState.timerDuration = value;
  input.value = value;
  updatePresetActiveState();
}

function clampCustomSeconds(value) {
  if (Number.isNaN(value) || value < CUSTOM_TIMER_MIN) return CUSTOM_TIMER_MIN;
  if (value > CUSTOM_TIMER_MAX) return CUSTOM_TIMER_MAX;
  return Math.floor(value);
}

function selectTimerPreset(seconds) {
  gameState.timerDuration = seconds;
  const input = document.getElementById(DOM.customTimerInput);
  if (input) input.value = seconds === 0 ? CUSTOM_TIMER_DEFAULT : seconds;
  updatePresetActiveState();
}

function updatePresetActiveState() {
  document.querySelectorAll(".timer-option").forEach((btn) => {
    const presetSeconds = parseInt(btn.dataset.seconds, 10);
    btn.classList.toggle("active", presetSeconds === gameState.timerDuration);
  });
}

function startGame() {
  const input = document.getElementById(DOM.customTimerInput);
  const raw = input ? Number(input.value) : gameState.timerDuration;
  if (raw > 0) gameState.timerDuration = clampCustomSeconds(raw);

  startNewSessionWithCurrentWords();
}

function startNewSessionWithCurrentWords() {
  gameState.phase = "playing";
  gameState.score = 0;
  resetStats();
  updateScoreDisplay();
  renderControls(gameState.controls);
  displayNextWord();
  startTimer();
}

function renderControls(controlsArray) {
  const containerElement = document.getElementById(DOM.controlsContainer);
  if (!containerElement) return;

  containerElement.innerHTML = "";
  const labels = getCurrentLabels();

  const hasNext = controlsArray.includes("next");
  const hasPass = controlsArray.includes("pass");
  const hasSuccess = controlsArray.includes("success");
  const hasFailed = controlsArray.includes("failed");

  if (hasNext) {
    containerElement.appendChild(
      createActionButton(labels.next, "btn-next", handleNextCard)
    );
  }

  const shouldShowScore = hasPass || hasSuccess || hasFailed;
  if (shouldShowScore) {
    const scoreElement = document.getElementById(DOM.score);
    if (scoreElement) {
      scoreElement.style.display = "block";
    }
  }

  if (hasPass) {
    containerElement.appendChild(
      createActionButton(labels.pass, "btn-pass", handleFailedCard)
    );
  }

  if (hasFailed) {
    containerElement.appendChild(
      createActionButton(labels.pass, "btn-failed", handleFailedCard)
    );
  }

  if (hasSuccess) {
    containerElement.appendChild(
      createActionButton(labels.validate, "btn-success", handleSuccessCard)
    );
  }
}

function createActionButton(buttonText, buttonId, clickHandler) {
  const button = document.createElement("button");
  button.textContent = buttonText;
  button.id = buttonId;
  button.className = "action-button";
  button.addEventListener("click", clickHandler);
  return button;
}

function processTurn(pointsToAdd) {
  recordCardResult(pointsToAdd);
  gameState.score += pointsToAdd;
  updateScoreDisplay();
  displayNextWord();
}

function getCurrentCardPoints() {
  if (!gameState.currentWord || !gameState.currentWord.meta) {
    return 1;
  }

  const raw = Number(gameState.currentWord.meta.points);
  if (Number.isNaN(raw) || raw <= 0) {
    return 1;
  }

  return raw;
}

function handleSuccessCard() {
  const points = getCurrentCardPoints();
  processTurn(points);
}

function handleFailedCard() {
  processTurn(0);
}

function handleNextCard() {
  processTurn(0);
}

function updateScoreDisplay() {
  const scoreElement = document.getElementById(DOM.score);
  if (scoreElement) {
    scoreElement.textContent = gameState.score;
  }
}

function displayNextWord() {
  const nextWord = pullRandomWord(gameState.availableWords);

  if (!nextWord) {
    executeEndGameSequence();
    return;
  }

  gameState.currentWord = nextWord;
  gameState.isCurrentWordHidden = false;
  gameState.currentCardStartedAtMs = Date.now();
  renderCurrentCard();
  rollDefiForCurrentCard();
}

function executeEndGameSequence() {
  stopTimer();
  hideTimerDisplay();
  gameState.currentWord = null;
  renderEndScreen();
  renderEndControls();
}

function startTimer() {
  if (!gameState.timerEnabled || gameState.timerDuration === 0) {
    hideTimerDisplay();
    return;
  }

  stopTimer();
  gameState.timerRemaining = gameState.timerDuration;
  showTimerDisplay();
  updateTimerDisplay();

  gameState.timerInterval = setInterval(() => {
    gameState.timerRemaining -= 1;
    updateTimerDisplay();

    if (gameState.timerRemaining <= 0) {
      stopTimer();
      onTimerExpired();
    }
  }, 1000);
}

function stopTimer() {
  if (gameState.timerInterval) {
    clearInterval(gameState.timerInterval);
    gameState.timerInterval = null;
  }
}

function showTimerDisplay() {
  const el = document.getElementById(DOM.timerDisplay);
  if (!el) return;
  el.innerHTML =
    '<div class="timer-track"><div class="timer-bar"></div></div><span class="timer-count"></span>';
  el.classList.add("visible");
}

function hideTimerDisplay() {
  const el = document.getElementById(DOM.timerDisplay);
  if (el) el.classList.remove("visible");
}

function updateTimerDisplay() {
  const el = document.getElementById(DOM.timerDisplay);
  if (!el) return;

  const bar = el.querySelector(".timer-bar");
  const count = el.querySelector(".timer-count");
  const percentage = (gameState.timerRemaining / gameState.timerDuration) * 100;

  if (bar) {
    bar.style.width = `${percentage}%`;
    const urgency =
      percentage <= 25 ? " danger" : percentage <= 50 ? " warning" : "";
    bar.className = `timer-bar${urgency}`;
  }

  if (count) count.textContent = gameState.timerRemaining;
}

function onTimerExpired() {
  playBuzzer();

  if (gameState.currentWord) {
    recordCardResult(0);
  }

  executeEndGameSequence();
}

function restartSessionKeepRemaining() {
  if (gameState.availableWords.length === 0) {
    gameState.availableWords = [...gameState.allWords];
  }
  startNewSessionWithCurrentWords();
}

function restartSessionReshuffleAll() {
  gameState.availableWords = [...gameState.allWords];
  startNewSessionWithCurrentWords();
}

function handleFatalError(errorMessage) {
  const display = document.getElementById(DOM.wordDisplay);
  if (display) {
    display.innerHTML = `<span style="color: red; font-size: 1.5rem;">${errorMessage}</span>`;
  }
}
