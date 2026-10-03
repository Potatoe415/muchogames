import { loadRulesIfExists } from "../../shared/js/engine.js";

const CONFIG = {
  totalRounds: 15,
  timer: {
    enabledByDefault: false,
    secondsPerQuestion: 30
  },
  // Base delay before revealing the answer (mid tiers).
  revealDelayMs: 2000,
  // Extra-long delay for high tiers (>= 5k) to roughly match
  // the selection sound length plus one extra second.
  highTierRevealDelayMs: 4000,
  advanceDelayMs: 1450,
  // When a guaranteed palier is reached, keep the
  // answered question on screen a bit longer.
  palierAdvanceDelayMs: 6000,
  audio: {
    enabled: true,
    musicBasePath: "./assets/music",
    soundBasePath: "./assets/sound",
    tracks: {
      home: "main_0.ogg",
      earlyQuestion: "question_1-5.ogg",
      midQuestion: "question_5-10.ogg",
      lateQuestion: "question_10-14.ogg",
      finalQuestion: "question_15.ogg",
      end: "end_game.ogg"
    },
    sounds: {
      lock: "accepted_5-N.ogg",
      correctEarly: "right_1-5.ogg",
      correctMid: "right_5-10.ogg",
      correctLate: "right_10-14.ogg",
      correctFinal: "accepted_end.ogg",
      wrongEarly: "wrong_1-5.ogg",
      wrongLate: "wrong_5-14.ogg",
      wrongFinal: "wrong_15.ogg",
      timeout: "timerOver.ogg",
      audience: "tip_audit.ogg",
      phone: "tip_friend.ogg",
      fiftyFifty: "tip_x2_activate.ogg",
      swap: "tip_switch.ogg",
      win: "winer.ogg",
      fireproof: "fireproof.ogg"
    }
  },
  languageFiles: {
    fr: "./assets/data/fr_millionaire.json",
    en: "./assets/data/usa_millionaire.json",
    es: "./assets/data/es_millionaire.json",
    "es-419": "./assets/data/es_latino_millionaire.json"
  },
  difficultyByRound: ["j0", "j0", "j0", "j0", "j0", "j1", "j1", "j2", "j2", "j2", "j3", "j3", "j4", "j4", "j5"],
  prizeLadder: [
    { amount: 100, label: "100 €", safe: false },
    { amount: 200, label: "200 €", safe: false },
    { amount: 300, label: "300 €", safe: false },
    { amount: 500, label: "500 €", safe: false },
    { amount: 1000, label: "1\u202f000 €", safe: true },
    { amount: 5000, label: "5\u202f000 €", safe: false },
    { amount: 7000, label: "7\u202f000 €", safe: false },
    { amount: 10000, label: "10\u202f000 €", safe: false },
    { amount: 15000, label: "15\u202f000 €", safe: false },
    { amount: 25000, label: "25\u202f000 €", safe: true },
    { amount: 50000, label: "50\u202f000 €", safe: false },
    { amount: 100000, label: "100\u202f000 €", safe: false },
    { amount: 250000, label: "250\u202f000 €", safe: false },
    { amount: 500000, label: "500\u202f000 €", safe: false },
    { amount: 1000000, label: "1\u202f000\u202f000 €", safe: false }
  ]
};

function getRevealDelayMs(roundIndex) {
  const prize = CONFIG.prizeLadder[roundIndex];
  if (!prize) {
    return CONFIG.revealDelayMs;
  }

  if (prize.amount <= 1000) {
    // Early questions: reveal instantly.
    return 0;
  }

  if (prize.amount >= 5000) {
    // High tiers: let the selection sound play out, then add ~1s.
    return CONFIG.highTierRevealDelayMs;
  }
  return CONFIG.revealDelayMs;
}

function formatPrizeLabelByAmount(prize) {
  if (!prize) {
    return "";
  }

  if (prize.amount >= 1000 && prize.amount < 1000000) {
    const thousands = Math.round(prize.amount / 1000);
    return `${thousands}K`;
  }

  return prize.label;
}

const ANSWER_LABELS = ["A", "B", "C", "D"];
const STORAGE_KEYS = {
  usedQuestionsPrefix: "millionaire_used_questions_v1"
};

function readHubLanguage() {
  try {
    const stored = localStorage.getItem("bergamots-lang");
    return ["fr", "en", "es"].includes(stored) ? stored : "fr";
  } catch {
    return "fr";
  }
}

const I18N = {
  fr: {
    htmlLang: "fr", brandEyebrow: "Defi quiz TV", brandTitle: "Qui veut gagner des millions ?", ladderEyebrow: "Progression", ladderTitle: "Echelle en 15 paliers",
    heroLabel: "Gain maximal", heroCopy: "15 questions. 4 jokers. 2 paliers garantis.", modeTag: "Mode classique", languageLabel: "Langue", rulesLabel: "Regles",
    questionsStatLabel: "Questions", safeStatLabel: "Paliers surs", timerStatLabel: "Minuteur", timerOptional: "Optionnel", startGameButton: "Commencer",
    timerOn: "Minuteur : active", timerOff: "Minuteur : coupe", dataChip: "Donnees",
    musicOn: "Music: On", musicOff: "Music: Off",
    datasetNote: "Charge depuis <code>assets/data/fr_millionaire.json</code>, <code>assets/data/usa_millionaire.json</code>, <code>assets/data/es_millionaire.json</code> ou <code>assets/data/es_latino_millionaire.json</code> selon la langue choisie.",
    questionLabel: "Question", guaranteedLabel: "Garanti", nextLabel: "Suivant", timerChipLabel: "Temps", lifeline5050Label: "50:50",
    lifelineAudienceLabel: "Avis du public", lifelinePhoneLabel: "Appel a un ami", lifelineSwapLabel: "Changer la question",
    audienceEyebrow: "Joker", audienceTitle: "Avis du public", audienceCopy: "Le studio a vote. Voici la repartition sur les reponses encore en jeu.",
    phoneEyebrow: "Joker", phoneTitle: "Appel a un ami", errorEyebrow: "Donnees", errorTitle: "Fichier de questions indisponible", retryLoadButton: "Reessayer",
    resultReachedLabel: "Atteint", resultGuaranteedLabel: "Garanti", resultWonLabel: "Gagne", playAgainButton: "Rejouer", backHomeButton: "Accueil",
    resultGameOverTag: "Partie terminee", resultTimeUpTag: "Temps ecoule", resultWinTag: "Champion", champion: "Champion",
    loadingBank: "Chargement de la banque de questions...", waitingForFile: "En attente du fichier de questions local.", bankReady: "Banque de questions prete. Lancez une partie quand vous voulez.",
    loadedCount: (count) => `${count} questions chargees depuis le fichier local.`, difficultyLoaded: (difficulty) => `Niveau ${difficulty.toUpperCase()} charge. Choisissez bien.`,
    correctAdvance: "Bonne reponse. Vous montez d'un palier...", wrongGameOver: "Mauvaise reponse. La partie s'arrete ici.", timeoutStatus: "Le temps est ecoule.",
    fullRunError: "Impossible de lancer une partie complete avec les donnees actuelles.", nextQuestionError: "Impossible de charger la question suivante.",
    missingDataStart: (file) => `La banque de questions n'est pas disponible. Ajoutez ${file}, puis reessayez.`, fetchError: (file) => `L'application attend un fichier local ${file}. Si le navigateur bloque fetch() en file://, lancez un petit serveur local dans ce dossier.`,
    reachedQuestion: (n) => `Question ${n}`, leaveWith: (prize) => `Vous repartez avec ${prize}`, wonMillion: (prize) => `Vous avez gagne ${prize}`,
    resultWrongCopy: "Une reponse a glisse, mais les paliers garantis sont conserves. Relancez les projecteurs et retentez votre chance.",
    resultTimeoutCopy: "Le chrono vous a battu avant la validation. Vous pouvez desactiver le minuteur depuis l'ecran d'accueil.",
    resultWinCopy: "Parcours parfait sur les 15 questions. Chaque validation, chaque joker et chaque choix ont tenu jusqu'au bout.",
    clearedAll: "Vous avez franchi les 15 questions.", expiredBeforeLock: "Le minuteur a expire avant la validation d'une reponse.",
    lifeline5050Used: "50:50 utilise. Deux mauvaises reponses disparaissent.", lifelineAudienceUsed: "Le public a donne son avis.", lifelinePhoneUsed: "Votre ami donne sa meilleure intuition.",
    lifelineSwapUsed: "Question echangee. Nouveau theme, meme palier.", lifelineSwapFailed: "Aucune autre question disponible pour ce palier.",
    phoneMessage: (label, text, confidence) => `Votre ami dit : "Je choisirais ${label} : ${text}. Je suis ${confidence}."`,
    phoneConfident: ["presque certain", "assez confiant", "vraiment penche pour cette reponse"], phoneUnsure: ["pas totalement sur mais je tenterais ca", "hesitant, mais je dirais ca", "plutot en train de deviner ici"],
    closeAudienceAria: "Fermer l'avis du public", closePhoneAria: "Fermer l'appel a un ami", homeAria: "Retour a l'accueil", restartAria: "Recommencer la partie",
    showLadderLabel: "Afficher les paliers", hideLadderLabel: "Masquer les paliers"
  },
  en: {
    htmlLang: "en", brandEyebrow: "TV Quiz Challenge", brandTitle: "Who Wants to Be a Millionaire?", ladderEyebrow: "Progress", ladderTitle: "15-Step Ladder",
    heroLabel: "Top prize", heroCopy: "15 questions. 4 lifelines. 2 guaranteed milestones.", modeTag: "Classic Mode", languageLabel: "Language", rulesLabel: "Rules",
    questionsStatLabel: "Questions", safeStatLabel: "Safe steps", timerStatLabel: "Timer", timerOptional: "Optional", startGameButton: "Start Game",
    timerOn: "Timer: On", timerOff: "Timer: Off", dataChip: "Data",
    musicOn: "Music: On", musicOff: "Music: Off",
    datasetNote: "Loaded from <code>assets/data/fr_millionaire.json</code>, <code>assets/data/usa_millionaire.json</code>, <code>assets/data/es_millionaire.json</code>, or <code>assets/data/es_latino_millionaire.json</code> based on the selected language.",
    questionLabel: "Question", guaranteedLabel: "Guaranteed", nextLabel: "Next", timerChipLabel: "Timer", lifeline5050Label: "50:50",
    lifelineAudienceLabel: "Ask the Audience", lifelinePhoneLabel: "Phone a Friend", lifelineSwapLabel: "Question Swap",
    audienceEyebrow: "Lifeline", audienceTitle: "Ask the Audience", audienceCopy: "The studio has voted. Here is the split for the remaining answers.",
    phoneEyebrow: "Lifeline", phoneTitle: "Phone a Friend", errorEyebrow: "Data", errorTitle: "Question file unavailable", retryLoadButton: "Retry Loading",
    resultReachedLabel: "Reached", resultGuaranteedLabel: "Guaranteed", resultWonLabel: "Won", playAgainButton: "Play Again", backHomeButton: "Home Screen",
    resultGameOverTag: "Game Over", resultTimeUpTag: "Time Up", resultWinTag: "Champion", champion: "Champion",
    loadingBank: "Loading question bank...", waitingForFile: "Waiting for a local question file.", bankReady: "Question bank ready. Start whenever you are.",
    loadedCount: (count) => `Loaded ${count} questions from the local dataset.`, difficultyLoaded: (difficulty) => `Difficulty ${difficulty.toUpperCase()} loaded. Choose carefully.`,
    correctAdvance: "Correct answer. Climbing to the next prize...", wrongGameOver: "Wrong answer. Game over.", timeoutStatus: "Time is up.",
    fullRunError: "Unable to start a full 15-question run with the current data.", nextQuestionError: "Unable to load the next question.",
    missingDataStart: (file) => `The question bank is not available yet. Add ${file}, then try again.`, fetchError: (file) => `The app expects a local ${file} file. If your browser blocks fetch() over file://, run a small local server in this folder instead.`,
    reachedQuestion: (n) => `Question ${n}`, leaveWith: (prize) => `You leave with ${prize}`, wonMillion: (prize) => `You won ${prize}`,
    resultWrongCopy: "One answer slipped, but your guaranteed milestones still hold. Reset the lights and take another run.",
    resultTimeoutCopy: "The clock beat you to the lock. You can disable the timer from the home screen if you want a calmer pace.",
    resultWinCopy: "A flawless 15-question run. Every lock-in, every lifeline, every decision held all the way through.",
    clearedAll: "You cleared all 15 questions.", expiredBeforeLock: "The timer expired before an answer was locked in.",
    lifeline5050Used: "50:50 used. Two wrong answers removed.", lifelineAudienceUsed: "The audience has voted.", lifelinePhoneUsed: "Your friend is giving their best guess.",
    lifelineSwapUsed: "Question swapped. New prompt, same prize tier.", lifelineSwapFailed: "No spare question is available for this tier.",
    phoneMessage: (label, text, confidence) => `Your friend says: "I'd go with ${label}: ${text}. I'm ${confidence}."`,
    phoneConfident: ["pretty sure", "quite confident", "strongly leaning that way"], phoneUnsure: ["not totally sure, but I'd try that", "torn, but I'd still say that", "mostly guessing here"],
    closeAudienceAria: "Close audience vote", closePhoneAria: "Close phone a friend", homeAria: "Return to home screen", restartAria: "Restart game",
    showLadderLabel: "Show prize ladder", hideLadderLabel: "Hide prize ladder"
  },
  es: {
    htmlLang: "es", brandEyebrow: "Desafio de concurso", brandTitle: "Quien quiere ser millonario?", ladderEyebrow: "Progreso", ladderTitle: "Escalera de 15 niveles",
    heroLabel: "Premio maximo", heroCopy: "15 preguntas. 4 comodines. 2 niveles asegurados.", modeTag: "Modo clasico", languageLabel: "Idioma", rulesLabel: "Reglas",
    questionsStatLabel: "Preguntas", safeStatLabel: "Niveles seguros", timerStatLabel: "Temporizador", timerOptional: "Opcional", startGameButton: "Empezar",
    timerOn: "Temporizador: activado", timerOff: "Temporizador: desactivado", dataChip: "Datos",
    musicOn: "Music: On", musicOff: "Music: Off",
    datasetNote: "Se carga desde <code>assets/data/fr_millionaire.json</code>, <code>assets/data/usa_millionaire.json</code>, <code>assets/data/es_millionaire.json</code> o <code>assets/data/es_latino_millionaire.json</code> segun el idioma seleccionado.",
    questionLabel: "Pregunta", guaranteedLabel: "Seguro", nextLabel: "Siguiente", timerChipLabel: "Tiempo", lifeline5050Label: "50:50",
    lifelineAudienceLabel: "Publico", lifelinePhoneLabel: "Llamar a un amigo", lifelineSwapLabel: "Cambiar pregunta",
    audienceEyebrow: "Comodin", audienceTitle: "Publico", audienceCopy: "El estudio ya ha votado. Esta es la distribucion entre las respuestas que siguen en juego.",
    phoneEyebrow: "Comodin", phoneTitle: "Llamar a un amigo", errorEyebrow: "Datos", errorTitle: "Archivo de preguntas no disponible", retryLoadButton: "Reintentar",
    resultReachedLabel: "Alcanzado", resultGuaranteedLabel: "Seguro", resultWonLabel: "Ganado", playAgainButton: "Jugar otra vez", backHomeButton: "Pantalla inicial",
    resultGameOverTag: "Fin de partida", resultTimeUpTag: "Tiempo agotado", resultWinTag: "Campeon", champion: "Campeon",
    loadingBank: "Cargando banco de preguntas...", waitingForFile: "Esperando un archivo local de preguntas.", bankReady: "Banco de preguntas listo. Empieza cuando quieras.",
    loadedCount: (count) => `${count} preguntas cargadas desde el archivo local.`, difficultyLoaded: (difficulty) => `Nivel ${difficulty.toUpperCase()} cargado. Elige con cuidado.`,
    correctAdvance: "Respuesta correcta. Subes al siguiente premio...", wrongGameOver: "Respuesta incorrecta. Fin de partida.", timeoutStatus: "Se acabo el tiempo.",
    fullRunError: "No se puede iniciar una partida completa de 15 preguntas con los datos actuales.", nextQuestionError: "No se pudo cargar la siguiente pregunta.",
    missingDataStart: (file) => `El banco de preguntas aun no esta disponible. Agrega ${file} y vuelve a intentarlo.`, fetchError: (file) => `La aplicacion espera un archivo local ${file}. Si el navegador bloquea fetch() con file://, levanta un pequeno servidor local en esta carpeta.`,
    reachedQuestion: (n) => `Pregunta ${n}`, leaveWith: (prize) => `Te llevas ${prize}`, wonMillion: (prize) => `Has ganado ${prize}`,
    resultWrongCopy: "Una respuesta fallo, pero tus niveles asegurados siguen intactos. Reinicia las luces y vuelve a intentarlo.",
    resultTimeoutCopy: "El reloj gano antes de que bloquearas una respuesta. Puedes desactivar el temporizador desde la pantalla inicial.",
    resultWinCopy: "Recorrido perfecto por las 15 preguntas. Cada bloqueo, cada comodin y cada decision funcionaron hasta el final.",
    clearedAll: "Superaste las 15 preguntas.", expiredBeforeLock: "El temporizador se agoto antes de bloquear una respuesta.",
    lifeline5050Used: "Has usado 50:50. Dos respuestas incorrectas desaparecen.", lifelineAudienceUsed: "El publico ya ha votado.", lifelinePhoneUsed: "Tu amigo te da su mejor intuicion.",
    lifelineSwapUsed: "Pregunta cambiada. Nuevo enunciado, mismo nivel.", lifelineSwapFailed: "No hay otra pregunta disponible para este nivel.",
    phoneMessage: (label, text, confidence) => `Tu amigo dice: "Yo iria con ${label}: ${text}. Estoy ${confidence}."`,
    phoneConfident: ["bastante seguro", "bastante convencido", "muy inclinado por esa opcion"], phoneUnsure: ["no del todo seguro, pero probaria esa", "dudando, aunque diria esa", "casi adivinando aqui"],
    closeAudienceAria: "Cerrar voto del publico", closePhoneAria: "Cerrar llamada a un amigo", homeAria: "Volver al inicio", restartAria: "Reiniciar partida",
    showLadderLabel: "Mostrar niveles de premio", hideLadderLabel: "Ocultar niveles de premio"
  },
  "es-419": {
    htmlLang: "es",
    brandEyebrow: "Desafio de concurso",
    brandTitle: "Quien quiere ser millonario?",
    ladderEyebrow: "Progreso",
    ladderTitle: "Escalera de 15 niveles",
    heroLabel: "Premio maximo",
    heroCopy: "15 preguntas. 4 comodines. 2 niveles asegurados.",
    modeTag: "Modo clasico",
    languageLabel: "Idioma",
    rulesLabel: "Reglas",
    questionsStatLabel: "Preguntas",
    safeStatLabel: "Niveles seguros",
    timerStatLabel: "Temporizador",
    timerOptional: "Opcional",
    startGameButton: "Empezar",
    timerOn: "Temporizador: activado",
    timerOff: "Temporizador: desactivado",
    dataChip: "Datos",
    musicOn: "Music: On",
    musicOff: "Music: Off",
    datasetNote: "Se carga desde <code>public/data/fr_millionaire.json</code>, <code>public/data/usa_millionaire.json</code>, <code>public/data/es_millionaire.json</code> o <code>public/data/es_latino_millionaire.json</code> segun el idioma seleccionado.",
    questionLabel: "Pregunta",
    guaranteedLabel: "Seguro",
    nextLabel: "Siguiente",
    timerChipLabel: "Tiempo",
    lifeline5050Label: "50:50",
    lifelineAudienceLabel: "Publico",
    lifelinePhoneLabel: "Llamar a un amigo",
    lifelineSwapLabel: "Cambiar pregunta",
    audienceEyebrow: "Comodin",
    audienceTitle: "Publico",
    audienceCopy: "El estudio ya voto. Esta es la distribucion entre las respuestas que siguen en juego.",
    phoneEyebrow: "Comodin",
    phoneTitle: "Llamar a un amigo",
    errorEyebrow: "Datos",
    errorTitle: "Archivo de preguntas no disponible",
    retryLoadButton: "Reintentar",
    resultReachedLabel: "Alcanzado",
    resultGuaranteedLabel: "Seguro",
    resultWonLabel: "Ganado",
    playAgainButton: "Jugar otra vez",
    backHomeButton: "Pantalla inicial",
    resultGameOverTag: "Fin de partida",
    resultTimeUpTag: "Tiempo agotado",
    resultWinTag: "Campeon",
    champion: "Campeon",
    loadingBank: "Cargando banco de preguntas...",
    waitingForFile: "Esperando un archivo local de preguntas.",
    bankReady: "Banco de preguntas listo. Empieza cuando quieras.",
    loadedCount: (count) => `${count} preguntas cargadas desde el archivo local.`,
    difficultyLoaded: (difficulty) => `Nivel ${difficulty.toUpperCase()} cargado. Elige con cuidado.`,
    correctAdvance: "Respuesta correcta. Subes al siguiente premio...",
    wrongGameOver: "Respuesta incorrecta. Fin de partida.",
    timeoutStatus: "Se acabo el tiempo.",
    fullRunError: "No se puede iniciar una partida completa de 15 preguntas con los datos actuales.",
    nextQuestionError: "No se pudo cargar la siguiente pregunta.",
    missingDataStart: (file) => `El banco de preguntas aun no esta disponible. Agrega ${file} y vuelve a intentarlo.`,
    fetchError: (file) => `La aplicacion espera un archivo local ${file}. Si el navegador bloquea fetch() con file://, levanta un pequeno servidor local en esta carpeta.`,
    reachedQuestion: (n) => `Pregunta ${n}`,
    leaveWith: (prize) => `Te llevas ${prize}`,
    wonMillion: (prize) => `Has ganado ${prize}`,
    resultWrongCopy: "Una respuesta fallo, pero tus niveles asegurados siguen intactos. Reinicia las luces y vuelve a intentarlo.",
    resultTimeoutCopy: "El reloj gano antes de que bloquearas una respuesta. Puedes desactivar el temporizador desde la pantalla inicial.",
    resultWinCopy: "Recorrido perfecto por las 15 preguntas. Cada bloqueo, cada comodin y cada decision funcionaron hasta el final.",
    clearedAll: "Superaste las 15 preguntas.",
    expiredBeforeLock: "El temporizador se agoto antes de bloquear una respuesta.",
    lifeline5050Used: "Has usado 50:50. Dos respuestas incorrectas desaparecen.",
    lifelineAudienceUsed: "El publico ya voto.",
    lifelinePhoneUsed: "Tu amigo te da su mejor intuicion.",
    lifelineSwapUsed: "Pregunta cambiada. Nuevo enunciado, mismo nivel.",
    lifelineSwapFailed: "No hay otra pregunta disponible para este nivel.",
    phoneMessage: (label, text, confidence) => `Tu amigo dice: "Yo iria con ${label}: ${text}. Estoy ${confidence}."`,
    phoneConfident: ["bastante seguro", "bastante convencido", "muy inclinado por esa opcion"],
    phoneUnsure: ["no del todo seguro, pero probaria esa", "dudando, aunque diria esa", "casi adivinando aqui"],
    closeAudienceAria: "Cerrar voto del publico",
    closePhoneAria: "Cerrar llamada a un amigo",
    homeAria: "Volver al inicio",
    restartAria: "Reiniciar partida",
    showLadderLabel: "Mostrar niveles de premio",
    hideLadderLabel: "Ocultar niveles de premio"
  }
};

const state = {
  dataset: null,
  questionsByDifficulty: new Map(),
  usedQuestionIds: new Set(),
  currentQuestion: null,
  currentRound: 0,
  isBusy: false,
  timerEnabled: CONFIG.timer.enabledByDefault,
  timeRemaining: CONFIG.timer.secondsPerQuestion,
  timerId: null,
  language: readHubLanguage(),
  lifelines: { fiftyFifty: true, audience: true, phone: true, swap: true },
  ladderVisible: false,
  audio: {
    enabled: true,
    unlocked: false,
    activeTrack: null,
    pool: new Map()
  }
};

const elements = {
  languageSelect: document.querySelector("#languageSelect"), rulesSection: document.querySelector("#rulesSection"), rulesLabel: document.querySelector("#rulesLabel"), rulesContent: document.querySelector("#rulesContent"), brandEyebrow: document.querySelector("#brandEyebrow"), brandTitle: document.querySelector("#brandTitle"), ladderEyebrow: document.querySelector("#ladderEyebrow"), ladderTitle: document.querySelector("#ladderTitle"), heroLabel: document.querySelector("#heroLabel"), heroCopy: document.querySelector("#heroCopy"), modeTag: document.querySelector("#modeTag"), languageLabel: document.querySelector("#languageLabel"), startGameButton: document.querySelector("#startGameButton"), toggleTimerButton: document.querySelector("#toggleTimerButton"), questionLabel: document.querySelector("#questionLabel"), guaranteedLabel: document.querySelector("#guaranteedLabel"), nextLabel: document.querySelector("#nextLabel"), timerChipLabel: document.querySelector("#timerChipLabel"), audienceEyebrow: document.querySelector("#audienceEyebrow"), audienceTitle: document.querySelector("#audienceTitle"), audienceCopy: document.querySelector("#audienceCopy"), phoneEyebrow: document.querySelector("#phoneEyebrow"), phoneTitle: document.querySelector("#phoneTitle"), errorEyebrow: document.querySelector("#errorEyebrow"), errorTitle: document.querySelector("#errorTitle"), retryLoadButton: document.querySelector("#retryLoadButton"), resultReachedLabel: document.querySelector("#resultReachedLabel"), resultGuaranteedLabel: document.querySelector("#resultGuaranteedLabel"), resultWonLabel: document.querySelector("#resultWonLabel"), playAgainButton: document.querySelector("#playAgainButton"), backHomeButton: document.querySelector("#backHomeButton"),
  screens: { start: document.querySelector("#startScreen"), game: document.querySelector("#gameScreen"), result: document.querySelector("#resultScreen") },
  ladderPanel: document.querySelector(".ladder-panel"), ladderList: document.querySelector("#ladderList"), questionCounter: document.querySelector("#questionCounter"), currentPrize: document.querySelector("#currentPrize"), nextPrize: document.querySelector("#nextPrize"), guaranteedPrize: document.querySelector("#guaranteedPrize"), questionText: document.querySelector("#questionText"), answersGrid: document.querySelector("#answersGrid"), timerChip: document.querySelector("#timerChip"), timerValue: document.querySelector("#timerValue"), homeShortcut: document.querySelector("#homeShortcut"), restartShortcut: document.querySelector("#restartShortcut"), optionsShortcut: document.querySelector("#optionsShortcut"), optionsPanel: document.querySelector("#optionsPanel"),
  lifelines: { fiftyFifty: document.querySelector("#lifeline5050"), audience: document.querySelector("#lifelineAudience"), phone: document.querySelector("#lifelinePhone"), swap: document.querySelector("#lifelineSwap") },
  result: { modeTag: document.querySelector("#resultModeTag"), title: document.querySelector("#resultTitle"), copy: document.querySelector("#resultCopy"), reached: document.querySelector("#resultReached"), guaranteed: document.querySelector("#resultGuaranteed"), prize: document.querySelector("#resultPrize") },
  modalBackdrop: document.querySelector("#modalBackdrop"), audienceModal: document.querySelector("#audienceModal"), phoneModal: document.querySelector("#phoneModal"), errorModal: document.querySelector("#errorModal"), audienceChart: document.querySelector("#audienceChart"), phoneFriendCopy: document.querySelector("#phoneFriendCopy"), errorCopy: document.querySelector("#errorCopy"), answerTemplate: document.querySelector("#answerButtonTemplate"),
  musicToggleButton: document.querySelector("#musicToggleButton"), ladderToggleButton: document.querySelector("#ladderToggleButton")
};

document.addEventListener("DOMContentLoaded", init);

function getRulesLanguageCode() {
  // "es-419" (Latam) reuses the plain "es" rules text - only the question
  // bank has a dedicated regional file (see CONFIG.languageFiles).
  return state.language === "es-419" ? "es" : state.language;
}

async function refreshRules() {
  if (!elements.rulesSection || !elements.rulesContent) return;

  const html = await loadRulesIfExists("millionaire", getRulesLanguageCode());
  if (!html) {
    elements.rulesSection.style.display = "none";
    return;
  }

  elements.rulesContent.innerHTML = html;
  elements.rulesSection.style.display = "";
}

function init() {
  bindEvents();
  applyTranslations();
  renderLadder();
  syncLadderVisibility();
  syncTimerToggle();
  syncMusicToggleUI();
  loadQuestions();
  void refreshRules();
}

function bindEvents() {
  elements.startGameButton.addEventListener("click", startGame);
  elements.toggleTimerButton.addEventListener("click", toggleTimerMode);
  elements.homeShortcut.addEventListener("click", handleHomeShortcutClick);
  elements.restartShortcut.addEventListener("click", startGame);
  if (window.GameHeader) {
    window.GameHeader.initOptionsPanel(elements.optionsShortcut, elements.optionsPanel);
  }
  elements.playAgainButton.addEventListener("click", startGame);
  elements.backHomeButton.addEventListener("click", returnHome);
  elements.retryLoadButton.addEventListener("click", loadQuestions);
  elements.languageSelect.addEventListener("change", handleLanguageChange);
  elements.lifelines.fiftyFifty.addEventListener("click", useFiftyFifty);
  elements.lifelines.audience.addEventListener("click", useAudience);
  elements.lifelines.phone.addEventListener("click", usePhoneFriend);
  elements.lifelines.swap.addEventListener("click", useQuestionSwap);
  document.querySelectorAll("[data-close-modal]").forEach((button) => button.addEventListener("click", closeModals));
  elements.modalBackdrop.addEventListener("click", (event) => {
    if (event.target === elements.modalBackdrop) {
      closeModals();
    }
  });
  elements.musicToggleButton.addEventListener("click", toggleMusic);
  if (elements.ladderToggleButton) {
    elements.ladderToggleButton.addEventListener("click", toggleLadderVisibility);
  }
  document.addEventListener("visibilitychange", handleVisibilityChange);
}

function handleHomeShortcutClick() {
  if (elements.screens.start.classList.contains("active")) {
    window.location.href = "/";
    return;
  }
  returnHome();
}

function getCopy() {
  return I18N[state.language];
}

function getQuestionFile() {
  return CONFIG.languageFiles[state.language];
}

function getUsedQuestionsStorageKey() {
  return `${STORAGE_KEYS.usedQuestionsPrefix}:${state.language}`;
}

function loadPersistedUsedQuestions() {
  try {
    const raw = window.localStorage.getItem(getUsedQuestionsStorageKey());
    const parsed = raw ? JSON.parse(raw) : [];
    state.usedQuestionIds = new Set(Array.isArray(parsed) ? parsed : []);
  } catch (error) {
    console.warn("Unable to read stored question history.", error);
    state.usedQuestionIds = new Set();
  }
}

function persistUsedQuestions() {
  try {
    window.localStorage.setItem(getUsedQuestionsStorageKey(), JSON.stringify([...state.usedQuestionIds]));
  } catch (error) {
    console.warn("Unable to persist question history.", error);
  }
}

function applyTranslations() {
  const copy = getCopy();
  document.documentElement.lang = copy.htmlLang;
  document.title = copy.brandTitle;
  elements.brandEyebrow.textContent = copy.brandEyebrow;
  elements.brandTitle.textContent = copy.brandTitle;
  elements.ladderEyebrow.textContent = copy.ladderEyebrow;
  elements.ladderTitle.textContent = copy.ladderTitle;
  elements.heroLabel.textContent = copy.heroLabel;
  elements.heroCopy.textContent = copy.heroCopy;
  elements.modeTag.textContent = copy.modeTag;
  elements.languageLabel.textContent = copy.languageLabel;
  elements.startGameButton.textContent = copy.startGameButton;
  elements.questionLabel.textContent = copy.questionLabel;
  elements.guaranteedLabel.textContent = copy.guaranteedLabel;
  elements.nextLabel.textContent = copy.nextLabel;
  elements.timerChipLabel.textContent = copy.timerChipLabel;
  elements.lifelines.fiftyFifty.setAttribute("aria-label", copy.lifeline5050Label);
  elements.lifelines.audience.setAttribute("aria-label", copy.lifelineAudienceLabel);
  elements.lifelines.phone.setAttribute("aria-label", copy.lifelinePhoneLabel);
  elements.lifelines.swap.setAttribute("aria-label", copy.lifelineSwapLabel);
  elements.audienceEyebrow.textContent = copy.audienceEyebrow;
  elements.audienceTitle.textContent = copy.audienceTitle;
  elements.audienceCopy.textContent = copy.audienceCopy;
  elements.phoneEyebrow.textContent = copy.phoneEyebrow;
  elements.phoneTitle.textContent = copy.phoneTitle;
  elements.errorEyebrow.textContent = copy.errorEyebrow;
  elements.errorTitle.textContent = copy.errorTitle;
  elements.retryLoadButton.textContent = copy.retryLoadButton;
  elements.resultReachedLabel.textContent = copy.resultReachedLabel;
  elements.resultGuaranteedLabel.textContent = copy.resultGuaranteedLabel;
  elements.resultWonLabel.textContent = copy.resultWonLabel;
  elements.playAgainButton.textContent = copy.playAgainButton;
  elements.backHomeButton.textContent = copy.backHomeButton;
  elements.languageSelect.value = state.language;
  if (elements.rulesLabel) elements.rulesLabel.textContent = copy.rulesLabel;
  elements.homeShortcut.setAttribute("aria-label", copy.homeAria);
  elements.restartShortcut.setAttribute("aria-label", copy.restartAria);
  document.querySelector("#audienceModal [data-close-modal]").setAttribute("aria-label", copy.closeAudienceAria);
  document.querySelector("#phoneModal [data-close-modal]").setAttribute("aria-label", copy.closePhoneAria);
  if (elements.ladderToggleButton) {
    elements.ladderToggleButton.setAttribute("aria-label", state.ladderVisible ? copy.hideLadderLabel : copy.showLadderLabel);
  }
  syncTimerToggle();
  syncMusicToggleUI();
  if (elements.screens.start.classList.contains("active")) {
    setStatus(state.dataset ? copy.bankReady : copy.loadingBank);
  }
}

async function handleLanguageChange(event) {
  state.language = event.target.value;
  state.dataset = null;
  state.questionsByDifficulty = new Map();
  loadPersistedUsedQuestions();
  clearTimer();
  closeModals();
  switchScreen("start");
  applyTranslations();
  void refreshRules();
  renderLadder();
  await loadQuestions();
}

async function loadQuestions() {
  const copy = getCopy();
  setStatus(copy.loadingBank);
  loadPersistedUsedQuestions();
  closeModals();
  try {
    const response = await fetch(getQuestionFile(), { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const payload = await response.json();
    if (!payload || !Array.isArray(payload.questions)) {
      throw new Error("Invalid JSON structure");
    }
    state.dataset = payload;
    state.questionsByDifficulty = groupQuestionsByDifficulty(payload.questions);
    validateQuestionSupply();
    setStatus(copy.loadedCount(payload.questions.length));
  } catch (error) {
    console.error(error);
    state.dataset = null;
    state.questionsByDifficulty = new Map();
    setStatus(copy.waitingForFile);
    showErrorModal(copy.fetchError(getQuestionFile().replace("./", "")));
  }
}

function groupQuestionsByDifficulty(questions) {
  return questions.reduce((map, question) => {
    if (!map.has(question.difficulty)) {
      map.set(question.difficulty, []);
    }
    map.get(question.difficulty).push(question);
    return map;
  }, new Map());
}

function validateQuestionSupply() {
  const requiredCounts = CONFIG.difficultyByRound.reduce((acc, difficulty) => {
    acc[difficulty] = (acc[difficulty] || 0) + 1;
    return acc;
  }, {});
  Object.entries(requiredCounts).forEach(([difficulty, needed]) => {
    const available = state.questionsByDifficulty.get(difficulty)?.length ?? 0;
    if (available < needed) {
      throw new Error(`Not enough ${difficulty} questions. Need ${needed}, found ${available}.`);
    }
  });
}

async function startGame() {
  unlockAudio();
  const copy = getCopy();
  if (!state.dataset) {
    showErrorModal(copy.missingDataStart(getQuestionFile().replace("./", "")));
    return;
  }
  if (state.isStarting) return;
  state.isStarting = true;
  const allowed = await window.MuchogamesMatch.start("millionaire");
  state.isStarting = false;
  if (!allowed) return;
  try {
    resetGameState();
    switchScreen("game");
    renderLadder();
    renderLifelines();
    loadRound();
  } catch (error) {
    console.error(error);
    setStatus(copy.fullRunError);
    showErrorModal(error.message);
    returnHome();
  }
}

function resetGameState() {
  clearTimer();
  state.currentQuestion = null;
  state.currentRound = 0;
  state.isBusy = false;
  state.timeRemaining = CONFIG.timer.secondsPerQuestion;
  state.lifelines = { fiftyFifty: true, audience: true, phone: true, swap: true };
  closeModals();
}

function loadRound() {
  try {
    if (state.currentRound >= CONFIG.totalRounds) {
      finishGame("win");
      return;
    }
    const sourceQuestion = selectQuestionForRound(state.currentRound);
    state.currentQuestion = prepareQuestion(sourceQuestion);
    state.isBusy = false;
    state.timeRemaining = CONFIG.timer.secondsPerQuestion;
    renderRound();
    startTimerIfNeeded();
    playSound("question");
  } catch (error) {
    console.error(error);
    setStatus(getCopy().nextQuestionError);
    showErrorModal(error.message);
    finishGame("wrong");
  }
}

function selectQuestionForRound(roundIndex, options = {}) {
  const { excludeIds = [] } = options;
  const difficulty = CONFIG.difficultyByRound[roundIndex];
  const bucket = state.questionsByDifficulty.get(difficulty) ?? [];
  const excluded = new Set(excludeIds);
  const available = bucket.filter((question) => !state.usedQuestionIds.has(question.id) && !excluded.has(question.id));
  if (!available.length) {
    throw new Error(`No unused questions remaining for ${difficulty}.`);
  }
  const selected = available[Math.floor(Math.random() * available.length)];
  state.usedQuestionIds.add(selected.id);
  persistUsedQuestions();
  return selected;
}

function prepareQuestion(question) {
  const answers = question.answers.map((text, index) => ({ text, isCorrect: index === 0, hidden: false }));
  shuffleInPlace(answers);
  return { id: question.id, difficulty: question.difficulty, prompt: question.question, answers, correctIndex: answers.findIndex((answer) => answer.isCorrect) };
}

function renderRound() {
  const copy = getCopy();
  const roundNumber = state.currentRound + 1;
  const prize = CONFIG.prizeLadder[state.currentRound];
  const nextPrize = CONFIG.prizeLadder[state.currentRound + 1];
  elements.questionCounter.textContent = `${roundNumber}/${CONFIG.totalRounds}`;
  // Keep current prize with its full amount formatting, thousands separator included.
  elements.currentPrize.textContent = prize.label;
  elements.guaranteedPrize.textContent = getGuaranteedPrizeLabel(state.currentRound - 1);
  elements.nextPrize.textContent = nextPrize ? formatPrizeLabelByAmount(nextPrize) : copy.champion;
  elements.questionText.textContent = state.currentQuestion.prompt;
  renderAnswerButtons();
  renderLadder();
  renderLifelines();
  updateTimerDisplay();
  setStatus(copy.difficultyLoaded(state.currentQuestion.difficulty));
}

function renderAnswerButtons() {
  elements.answersGrid.innerHTML = "";
  state.currentQuestion.answers.forEach((answer, index) => {
    const fragment = elements.answerTemplate.content.cloneNode(true);
    const button = fragment.querySelector(".answer-button");
    const prefix = fragment.querySelector(".answer-prefix");
    prefix.textContent = `${ANSWER_LABELS[index]}:`;
    fragment.querySelector(".answer-text").textContent = answer.text;
    button.dataset.index = String(index);
    button.disabled = answer.hidden;
    button.classList.toggle("removed", answer.hidden);
    button.setAttribute("aria-label", `${ANSWER_LABELS[index]}: ${answer.text}`);
    button.addEventListener("click", () => handleAnswerSelection(index));
    elements.answersGrid.appendChild(button);
  });
}

function renderLadder() {
  elements.ladderList.innerHTML = "";
  [...CONFIG.prizeLadder].reverse().forEach((entry, reverseIndex) => {
    const actualIndex = CONFIG.prizeLadder.length - 1 - reverseIndex;
    const item = document.createElement("li");
    item.className = "ladder-item";
    if (entry.safe) item.classList.add("safe");
    if (actualIndex === state.currentRound && isGameScreenActive()) item.classList.add("current");
    if (actualIndex < state.currentRound && isGameScreenActive()) item.classList.add("cleared");
    item.innerHTML = `<span class="ladder-rank">${actualIndex + 1}</span><span class="ladder-prize">${entry.label}</span>`;
    elements.ladderList.appendChild(item);
  });
}

function renderLifelines() {
  updateLifelineButton(elements.lifelines.fiftyFifty, state.lifelines.fiftyFifty);
  updateLifelineButton(elements.lifelines.audience, state.lifelines.audience);
  updateLifelineButton(elements.lifelines.phone, state.lifelines.phone);
  updateLifelineButton(elements.lifelines.swap, state.lifelines.swap);
}

function updateLifelineButton(button, isAvailable) {
  const disabled = !isAvailable || !state.currentQuestion || state.isBusy;
  button.disabled = disabled;
  button.classList.toggle("used", !isAvailable);
}

async function handleAnswerSelection(answerIndex) {
  if (state.isBusy || !state.currentQuestion) return;
  const selectedAnswer = state.currentQuestion.answers[answerIndex];
  if (!selectedAnswer || selectedAnswer.hidden) return;
  state.isBusy = true;
  clearTimer();
  closeModals();
  lockAnswerButtons();
  markSelectedAnswer(answerIndex);
  const currentPrize = CONFIG.prizeLadder[state.currentRound];
  if (currentPrize && currentPrize.amount >= 5000) {
    stopBackgroundAudio();
  }
  playSound("lock");
  const revealDelayMs = getRevealDelayMs(state.currentRound);
  if (revealDelayMs > 0) {
    await wait(revealDelayMs);
  }
  revealAnswerOutcome(answerIndex);
  if (selectedAnswer.isCorrect) {
    const justClearedPrize = CONFIG.prizeLadder[state.currentRound];
    const reachedPalier = Boolean(justClearedPrize && justClearedPrize.safe);
    if (reachedPalier) {
      playSound("fireproof");
    }
    playSound("correct");
    setStatus(getCopy().correctAdvance);
    state.currentRound += 1;
    renderLadder();
    const advanceDelay = reachedPalier ? CONFIG.palierAdvanceDelayMs : CONFIG.advanceDelayMs;
    await wait(advanceDelay);
    loadRound();
  } else {
    playSound("wrong");
    setStatus(getCopy().wrongGameOver);
    await wait(CONFIG.advanceDelayMs);
    finishGame("wrong");
  }
}

function lockAnswerButtons() {
  elements.answersGrid.querySelectorAll(".answer-button").forEach((button) => {
    button.disabled = true;
    button.classList.add("locked");
  });
  renderLifelines();
}

function markSelectedAnswer(answerIndex) {
  [...elements.answersGrid.querySelectorAll(".answer-button")][answerIndex]?.classList.add("selected");
}

function revealAnswerOutcome(selectedIndex) {
  [...elements.answersGrid.querySelectorAll(".answer-button")].forEach((button, index) => {
    const answer = state.currentQuestion.answers[index];
    if (answer.isCorrect) {
      button.classList.add("correct");
    } else if (index === selectedIndex) {
      button.classList.add("wrong");
    }
  });
}

function finishGame(reason) {
  const copy = getCopy();
  clearTimer();
  const reachedQuestion = Math.min(state.currentRound + (reason === "wrong" || reason === "timeout" ? 1 : 0), CONFIG.totalRounds);
  const guaranteedLabel = getGuaranteedPrizeLabel(state.currentRound - 1);
  const wonPrize = reason === "win" ? CONFIG.prizeLadder[CONFIG.totalRounds - 1] : null;
  const wonLabel = reason === "win" ? formatPrizeLabelByAmount(wonPrize) : guaranteedLabel;
  window.MuchogamesMatch.finish({ won: reason === "win", score: state.currentRound });
  switchScreen("result");
  renderLadder();
  if (reason === "win") {
    elements.result.modeTag.textContent = copy.resultWinTag;
    elements.result.title.textContent = copy.wonMillion(CONFIG.prizeLadder[CONFIG.totalRounds - 1].label);
    elements.result.copy.textContent = copy.resultWinCopy;
    playSound("win");
    setStatus(copy.clearedAll);
  } else if (reason === "timeout") {
    elements.result.modeTag.textContent = copy.resultTimeUpTag;
    elements.result.title.textContent = copy.leaveWith(wonLabel);
    elements.result.copy.textContent = copy.resultTimeoutCopy;
    setStatus(copy.expiredBeforeLock);
  } else {
    elements.result.modeTag.textContent = copy.resultGameOverTag;
    elements.result.title.textContent = copy.leaveWith(wonLabel);
    elements.result.copy.textContent = copy.resultWrongCopy;
  }
  elements.result.reached.textContent = copy.reachedQuestion(reachedQuestion);
  elements.result.guaranteed.textContent = guaranteedLabel;
  elements.result.prize.textContent = wonLabel;
}

function returnHome() {
  window.MuchogamesMatch.finish();
  clearTimer();
  closeModals();
  switchScreen("start");
  renderLadder();
   stopBackgroundAudio();
  setStatus(state.dataset ? getCopy().bankReady : getCopy().waitingForFile);
}

function switchScreen(screenName) {
  Object.entries(elements.screens).forEach(([name, screen]) => {
    screen.classList.toggle("active", name === screenName);
  });
  elements.restartShortcut.classList.toggle("is-hidden", screenName === "start");
}

function toggleTimerMode() {
  state.timerEnabled = !state.timerEnabled;
  syncTimerToggle();
}

function syncTimerToggle() {
  const copy = getCopy();
  elements.toggleTimerButton.textContent = state.timerEnabled ? copy.timerOn : copy.timerOff;
  elements.toggleTimerButton.setAttribute("aria-pressed", String(state.timerEnabled));
}

function syncMusicToggleUI() {
  const copy = getCopy();
  const label = state.audio.enabled ? copy.musicOn : copy.musicOff;
  elements.musicToggleButton.setAttribute("aria-pressed", String(state.audio.enabled));
  elements.musicToggleButton.setAttribute("aria-label", label);
  elements.musicToggleButton.dataset.muted = String(!state.audio.enabled);
}

function toggleLadderVisibility() {
  state.ladderVisible = !state.ladderVisible;
  syncLadderVisibility();
}

function syncLadderVisibility() {
  if (!elements.ladderPanel || !elements.ladderToggleButton) {
    return;
  }
  const copy = getCopy();
  const isVisible = state.ladderVisible;
  elements.ladderPanel.classList.toggle("is-collapsed", !isVisible);
  elements.ladderToggleButton.setAttribute(
    "aria-label",
    isVisible ? copy.hideLadderLabel : copy.showLadderLabel
  );
}

function startTimerIfNeeded() {
  clearTimer();
  if (!state.timerEnabled) {
    elements.timerChip.hidden = true;
    return;
  }
  elements.timerChip.hidden = false;
  state.timeRemaining = CONFIG.timer.secondsPerQuestion;
  updateTimerDisplay();
  state.timerId = window.setInterval(() => {
    state.timeRemaining -= 1;
    updateTimerDisplay();
    if (state.timeRemaining <= 0) {
      clearTimer();
      handleTimeout();
    }
  }, 1000);
}

function updateTimerDisplay() {
  elements.timerValue.textContent = String(state.timeRemaining);
  elements.timerChip.classList.toggle("danger", state.timeRemaining <= 5 && state.timerEnabled);
}

async function handleTimeout() {
  if (state.isBusy) return;
  state.isBusy = true;
  lockAnswerButtons();
  revealAnswerOutcome(-1);
  playSound("wrong");
  setStatus(getCopy().timeoutStatus);
  await wait(CONFIG.advanceDelayMs);
  finishGame("timeout");
}

function clearTimer() {
  if (state.timerId) {
    window.clearInterval(state.timerId);
    state.timerId = null;
  }
}

function toggleMusic() {
  state.audio.enabled = !state.audio.enabled;
  syncMusicToggleUI();
  if (!state.audio.enabled) {
    stopBackgroundAudio();
  } else {
    syncBackgroundAudio();
  }
}

function useFiftyFifty() {
  if (!canUseLifeline("fiftyFifty")) return;
  const removableIndexes = state.currentQuestion.answers
    .map((answer, index) => ({ answer, index }))
    .filter(({ answer }) => !answer.isCorrect && !answer.hidden)
    .map(({ index }) => index);
  shuffleInPlace(removableIndexes);
  removableIndexes.slice(0, 2).forEach((index) => {
    state.currentQuestion.answers[index].hidden = true;
  });
  state.lifelines.fiftyFifty = false;
  renderAnswerButtons();
  renderLifelines();
  playSound("lifeline");
  setStatus(getCopy().lifeline5050Used);
}

function useAudience() {
  if (!canUseLifeline("audience")) return;
  state.lifelines.audience = false;
  renderLifelines();
  playSound("lifeline");
  renderAudienceModal(buildAudienceDistribution());
  setStatus(getCopy().lifelineAudienceUsed);
}

function usePhoneFriend() {
  if (!canUseLifeline("phone")) return;
  state.lifelines.phone = false;
  renderLifelines();
  playSound("lifeline");
  elements.phoneFriendCopy.textContent = buildPhoneSuggestion();
  openModal(elements.phoneModal);
  setStatus(getCopy().lifelinePhoneUsed);
}

function useQuestionSwap() {
  if (!canUseLifeline("swap")) return;
  try {
    clearTimer();
    closeModals();
    const replacement = selectQuestionForRound(state.currentRound, { excludeIds: [state.currentQuestion.id] });
    state.currentQuestion = prepareQuestion(replacement);
    state.lifelines.swap = false;
    state.isBusy = false;
    state.timeRemaining = CONFIG.timer.secondsPerQuestion;
    renderRound();
    startTimerIfNeeded();
    playSound("lifeline");
    setStatus(getCopy().lifelineSwapUsed);
  } catch (error) {
    console.error(error);
    setStatus(getCopy().lifelineSwapFailed);
  }
}

function canUseLifeline(key) {
  return Boolean(state.currentQuestion) && !state.isBusy && state.lifelines[key];
}

function buildAudienceDistribution() {
  const visibleAnswers = state.currentQuestion.answers.map((answer, index) => ({ ...answer, index })).filter((answer) => !answer.hidden);
  const correctEntry = visibleAnswers.find((answer) => answer.isCorrect);
  const wrongEntries = visibleAnswers.filter((answer) => !answer.isCorrect);
  const correctBias = randomInt(44, 68);
  const distribution = { [correctEntry.index]: correctBias };
  let remaining = 100 - correctBias;
  wrongEntries.forEach((entry, wrongIndex) => {
    if (wrongIndex === wrongEntries.length - 1) {
      distribution[entry.index] = remaining;
      return;
    }
    const max = remaining - (wrongEntries.length - wrongIndex - 1);
    const slice = randomInt(8, Math.max(8, max));
    distribution[entry.index] = slice;
    remaining -= slice;
  });
  return state.currentQuestion.answers.map((answer, index) => ({ label: ANSWER_LABELS[index], percent: answer.hidden ? 0 : distribution[index] ?? 0 }));
}

function renderAudienceModal(distribution) {
  elements.audienceChart.innerHTML = "";
  distribution.filter((entry) => entry.percent > 0).forEach((entry) => {
    const row = document.createElement("div");
    row.className = "audience-row";
    row.innerHTML = `
      <span class="audience-label">${entry.label}</span>
      <div class="audience-track"><div class="audience-fill" style="width: ${entry.percent}%"></div></div>
      <span class="audience-value">${entry.percent}%</span>
    `;
    elements.audienceChart.appendChild(row);
  });
  openModal(elements.audienceModal);
}

function buildPhoneSuggestion() {
  const copy = getCopy();
  const visibleAnswers = state.currentQuestion.answers.map((answer, index) => ({ ...answer, index })).filter((answer) => !answer.hidden);
  const correctEntry = visibleAnswers.find((answer) => answer.isCorrect);
  const wrongEntries = visibleAnswers.filter((answer) => !answer.isCorrect);
  const suggested = Math.random() < 0.78 || !wrongEntries.length ? correctEntry : wrongEntries[Math.floor(Math.random() * wrongEntries.length)];
  const pool = suggested.isCorrect ? copy.phoneConfident : copy.phoneUnsure;
  const confidence = pool[randomInt(0, pool.length - 1)];
  return copy.phoneMessage(ANSWER_LABELS[suggested.index], suggested.text, confidence);
}

function openModal(modal) {
  elements.modalBackdrop.classList.remove("hidden");
  [elements.audienceModal, elements.phoneModal, elements.errorModal].forEach((entry) => {
    entry.classList.toggle("hidden", entry !== modal);
  });
  elements.modalBackdrop.setAttribute("aria-hidden", "false");
}

function closeModals() {
  elements.modalBackdrop.classList.add("hidden");
  [elements.audienceModal, elements.phoneModal, elements.errorModal].forEach((entry) => entry.classList.add("hidden"));
  elements.modalBackdrop.setAttribute("aria-hidden", "true");
}

function showErrorModal(message) {
  elements.errorCopy.textContent = message;
  openModal(elements.errorModal);
}

function setStatus() {}

function getGuaranteedPrizeLabel(roundIndex) {
  if (roundIndex < 0) return "0 €";
  const guaranteed = CONFIG.prizeLadder.slice(0, roundIndex + 1).filter((entry) => entry.safe).at(-1);
  return guaranteed ? formatPrizeLabelByAmount(guaranteed) : "0 €";
}

function isGameScreenActive() {
  return elements.screens.game.classList.contains("active");
}

function shuffleInPlace(items) {
  for (let index = items.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [items[index], items[randomIndex]] = [items[randomIndex], items[index]];
  }
  return items;
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function getMusicUrl(fileName) {
  return `${CONFIG.audio.musicBasePath}/${fileName}`;
}

function getSoundUrl(fileName) {
  return `${CONFIG.audio.soundBasePath}/${fileName}`;
}

function getOrCreateAudio(key, fileName, options = {}) {
  if (!fileName) {
    return null;
  }

  const existing = state.audio.pool.get(key);
  if (existing) {
    return existing;
  }

  const url = options.kind === "sound" ? getSoundUrl(fileName) : getMusicUrl(fileName);
  const audio = new Audio(url);
  audio.preload = "auto";
  audio.loop = Boolean(options.loop);
  audio.volume = options.volume ?? 1;
  audio.addEventListener("error", () => {
    console.warn(`Audio file unavailable: ${url}`);
    state.audio.pool.delete(key);
  }, { once: true });
  state.audio.pool.set(key, audio);
  return audio;
}

function unlockAudio() {
  if (!CONFIG.audio.enabled || state.audio.unlocked) {
    return;
  }

  state.audio.unlocked = true;
  syncBackgroundAudio();
}

function getQuestionTrackKey() {
  const roundNumber = state.currentRound + 1;

  if (roundNumber >= 15) {
    return "finalQuestion";
  }

  if (roundNumber >= 10) {
    return "lateQuestion";
  }

  if (roundNumber >= 5) {
    return "midQuestion";
  }

  return "earlyQuestion";
}

function syncBackgroundAudio() {
  if (!CONFIG.audio.enabled || !state.audio.unlocked || !state.audio.enabled) {
    return;
  }

  let nextTrack = "home";

  if (elements.screens.game.classList.contains("active")) {
    nextTrack = getQuestionTrackKey();
  } else if (elements.screens.result.classList.contains("active")) {
    nextTrack = "end";
  }

  if (state.audio.activeTrack === nextTrack) {
    return;
  }

  stopBackgroundAudio();

  const audio = getOrCreateAudio(nextTrack, CONFIG.audio.tracks[nextTrack], { kind: "music", loop: true, volume: 0.45 });
  state.audio.activeTrack = nextTrack;
  safePlay(audio);
}

function stopBackgroundAudio() {
  if (!state.audio.activeTrack) {
    return;
  }

  const activeAudio = state.audio.pool.get(state.audio.activeTrack);
  if (activeAudio) {
    activeAudio.pause();
    activeAudio.currentTime = 0;
  }

  state.audio.activeTrack = null;
}

function pauseAllAudio() {
  stopBackgroundAudio();
  state.audio.pool.forEach((audio) => {
    audio.pause();
  });
}

function handleVisibilityChange() {
  if (document.hidden) {
    pauseAllAudio();
  } else if (state.audio.enabled) {
    syncBackgroundAudio();
  }
}

function safePlay(audio) {
  if (!audio) {
    return;
  }

  const playPromise = audio.play();
  if (playPromise && typeof playPromise.catch === "function") {
    playPromise.catch(() => {});
  }
}

function getRoundAudioTier() {
  const roundNumber = state.currentRound + 1;

  if (roundNumber >= 15) {
    return "final";
  }

  if (roundNumber >= 10) {
    return "late";
  }

  return roundNumber >= 5 ? "mid" : "early";
}

function playSound(name) {
  if (!CONFIG.audio.enabled || !state.audio.unlocked || !state.audio.enabled) {
    return;
  }

  if (name === "question") {
    syncBackgroundAudio();
    return;
  }

  const tier = getRoundAudioTier();
  const soundMap = {
    lock: "lock",
    fireproof: "fireproof",
    correct: tier === "final" ? "correctFinal" : tier === "late" ? "correctLate" : tier === "mid" ? "correctMid" : "correctEarly",
    wrong: tier === "final" ? "wrongFinal" : tier === "early" ? "wrongEarly" : "wrongLate",
    timeout: "timeout",
    fiftyFifty: "fiftyFifty",
    audience: "audience",
    phone: "phone",
    swap: "swap",
    win: "win"
  };

  const soundKey = soundMap[name];
  if (!soundKey) {
    return;
  }

  const audio = getOrCreateAudio(`sound-${soundKey}`, CONFIG.audio.sounds[soundKey], {
    kind: "sound",
    loop: false,
    volume: soundKey === "win" ? 0.75 : 0.9
  });

  audio.currentTime = 0;
  safePlay(audio);
}




















