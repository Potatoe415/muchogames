// Player-facing copy in FR/EN/ES, rules included.
export const LANGS = ["fr", "en", "es"];

const STRINGS = {
  fr: {
    title: "Piou",
    pitch: "Fais voler Piou entre les tuyaux. Un tuyau passé, un point.",
    back: "Retour",
    options: "Options",
    close: "Fermer",
    language: "Langue",
    sound: "Son",
    on: "Activé",
    off: "Désactivé",
    rules: "Règles",
    play: "Jouer",
    resume: "Reprendre",
    resumeInfo: "{score} points",
    resumeInfoOne: "1 point",
    score: "Score",
    best: "Record",
    startBest: "Record : {best} points",
    startBestOne: "Record : 1 point",
    tapToPlay: "Tape pour jouer",
    tapToFly: "Tape pour repartir",
    keysHint: "Clic, toucher ou Espace pour battre des ailes",
    menuButton: "Menu",
    playArea: "Zone de jeu : tape pour battre des ailes",
    paused: "Pause",
    pausedText: "Piou attend en l'air. Tape pour repartir.",
    continue: "Continuer",
    menu: "Quitter",
    endTitle: "Aïe !",
    endScore: "{score} points",
    endScoreOne: "1 point",
    bestLine: "Record : {best} points",
    bestLineOne: "Record : 1 point",
    newBest: "Nouveau record !",
    replay: "Rejouer"
  },
  en: {
    title: "Piou",
    pitch: "Fly Piou between the pipes. One pipe passed, one point.",
    back: "Back",
    options: "Options",
    close: "Close",
    language: "Language",
    sound: "Sound",
    on: "On",
    off: "Off",
    rules: "Rules",
    play: "Play",
    resume: "Resume",
    resumeInfo: "{score} points",
    resumeInfoOne: "1 point",
    score: "Score",
    best: "Best",
    startBest: "Best: {best} points",
    startBestOne: "Best: 1 point",
    tapToPlay: "Tap to play",
    tapToFly: "Tap to fly again",
    keysHint: "Click, tap or Space to flap",
    menuButton: "Menu",
    playArea: "Play area: tap to flap",
    paused: "Paused",
    pausedText: "Piou waits in the air. Tap to fly again.",
    continue: "Continue",
    menu: "Quit",
    endTitle: "Ouch!",
    endScore: "{score} points",
    endScoreOne: "1 point",
    bestLine: "Best: {best} points",
    bestLineOne: "Best: 1 point",
    newBest: "New best!",
    replay: "Play again"
  },
  es: {
    title: "Piou",
    pitch: "Haz volar a Piou entre las tuberías. Una tubería, un punto.",
    back: "Volver",
    options: "Opciones",
    close: "Cerrar",
    language: "Idioma",
    sound: "Sonido",
    on: "Activado",
    off: "Desactivado",
    rules: "Reglas",
    play: "Jugar",
    resume: "Reanudar",
    resumeInfo: "{score} puntos",
    resumeInfoOne: "1 punto",
    score: "Puntos",
    best: "Récord",
    startBest: "Récord: {best} puntos",
    startBestOne: "Récord: 1 punto",
    tapToPlay: "Toca para jugar",
    tapToFly: "Toca para volver a volar",
    keysHint: "Clic, toque o Espacio para aletear",
    menuButton: "Menú",
    playArea: "Zona de juego: toca para aletear",
    paused: "Pausa",
    pausedText: "Piou espera en el aire. Toca para volver a volar.",
    continue: "Continuar",
    menu: "Salir",
    endTitle: "¡Ay!",
    endScore: "{score} puntos",
    endScoreOne: "1 punto",
    bestLine: "Récord: {best} puntos",
    bestLineOne: "Récord: 1 punto",
    newBest: "¡Nuevo récord!",
    replay: "Jugar otra vez"
  }
};

const RULES = {
  fr: `<p>Piou tombe tout seul. Chaque appui le fait battre des ailes et remonter un peu.</p>
<p>Des tuyaux arrivent par la droite, avec une ouverture à une hauteur au hasard. Passe dans l'ouverture : chaque tuyau passé rapporte 1 point.</p>
<p>La partie s'arrête si Piou touche un tuyau, le sol ou le haut de l'écran. Le meilleur score est gardé sur cet appareil.</p>
<p>Commandes : touche ou clique la zone de jeu, ou appuie sur Espace (ou ↑) ; sur la télé, OK ou ↑ de la télécommande, Retour pour la pause.</p>`,
  en: `<p>Piou falls on its own. Each press makes it flap and rise a little.</p>
<p>Pipes come in from the right, with an opening at a random height. Fly through the opening: each pipe passed scores 1 point.</p>
<p>The game ends if Piou touches a pipe, the ground or the top of the screen. The best score is kept on this device.</p>
<p>Controls: tap or click the play area, or press Space (or ↑); on a TV, the remote's OK or ↑, Back to pause.</p>`,
  es: `<p>Piou cae solo. Cada pulsación lo hace aletear y subir un poco.</p>
<p>Llegan tuberías por la derecha, con una abertura a una altura al azar. Pasa por la abertura: cada tubería superada da 1 punto.</p>
<p>La partida termina si Piou toca una tubería, el suelo o la parte de arriba de la pantalla. El récord se guarda en este dispositivo.</p>
<p>Controles: toca o haz clic en la zona de juego, o pulsa Espacio (o ↑); en la tele, OK o ↑ del mando, Atrás para la pausa.</p>`
};

const fill = (text, vars = {}) =>
  text.replace(/\{(\w+)\}/g, (all, key) => String(vars[key] ?? all));

export function translate(lang, key, vars) {
  const text = STRINGS[lang]?.[key] ?? STRINGS.fr[key] ?? key;
  return fill(text, vars);
}

// Copy with a count: the "One" variant when it is exactly 1.
export function translateCount(lang, key, n, vars) {
  return translate(lang, n === 1 ? `${key}One` : key, vars);
}

export const rulesHtml = (lang) => RULES[lang] || RULES.fr;
