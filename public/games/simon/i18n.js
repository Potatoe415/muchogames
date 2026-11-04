// Player-facing copy in FR/EN/ES, rules included.
export const LANGS = ["fr", "en", "es"];

const STRINGS = {
  fr: {
    title: "Simon",
    pitch: "Regarde, écoute, répète. Une couleur de plus à chaque tour.",
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
    resumeInfo: "{score} tours réussis",
    resumeInfoOne: "1 tour réussi",
    score: "Tours",
    best: "Record",
    startBest: "Record : {best} tours",
    startBestOne: "Record : 1 tour",
    watch: "Regarde…",
    yourTurn: "À toi !",
    oops: "Raté !",
    menuButton: "Menu",
    board: "Les quatre couleurs",
    green: "Vert",
    red: "Rouge",
    yellow: "Jaune",
    blue: "Bleu",
    paused: "Pause",
    pausedText: "En reprenant, la séquence est rejouée depuis le début.",
    continue: "Continuer",
    menu: "Quitter",
    endTitle: "Partie terminée",
    endScore: "{score} tours réussis",
    endScoreOne: "1 tour réussi",
    bestLine: "Record : {best} tours",
    bestLineOne: "Record : 1 tour",
    newBest: "Nouveau record !",
    replay: "Rejouer"
  },
  en: {
    title: "Simon",
    pitch: "Watch, listen, repeat. One more colour every round.",
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
    resumeInfo: "{score} rounds completed",
    resumeInfoOne: "1 round completed",
    score: "Rounds",
    best: "Best",
    startBest: "Best: {best} rounds",
    startBestOne: "Best: 1 round",
    watch: "Watch…",
    yourTurn: "Your turn!",
    oops: "Missed!",
    menuButton: "Menu",
    board: "The four colours",
    green: "Green",
    red: "Red",
    yellow: "Yellow",
    blue: "Blue",
    paused: "Paused",
    pausedText: "When you continue, the sequence plays again from the start.",
    continue: "Continue",
    menu: "Quit",
    endTitle: "Game over",
    endScore: "{score} rounds completed",
    endScoreOne: "1 round completed",
    bestLine: "Best: {best} rounds",
    bestLineOne: "Best: 1 round",
    newBest: "New best!",
    replay: "Play again"
  },
  es: {
    title: "Simon",
    pitch: "Mira, escucha, repite. Un color más en cada ronda.",
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
    resumeInfo: "{score} rondas superadas",
    resumeInfoOne: "1 ronda superada",
    score: "Rondas",
    best: "Récord",
    startBest: "Récord: {best} rondas",
    startBestOne: "Récord: 1 ronda",
    watch: "Mira…",
    yourTurn: "¡Te toca!",
    oops: "¡Fallo!",
    menuButton: "Menú",
    board: "Los cuatro colores",
    green: "Verde",
    red: "Rojo",
    yellow: "Amarillo",
    blue: "Azul",
    paused: "Pausa",
    pausedText: "Al continuar, la secuencia se repite desde el principio.",
    continue: "Continuar",
    menu: "Salir",
    endTitle: "Fin de la partida",
    endScore: "{score} rondas superadas",
    endScoreOne: "1 ronda superada",
    bestLine: "Récord: {best} rondas",
    bestLineOne: "Récord: 1 ronda",
    newBest: "¡Nuevo récord!",
    replay: "Jugar otra vez"
  }
};

const RULES = {
  fr: `<p>Le jeu allume une couleur et joue son son. Répète-la en touchant la même couleur.</p>
<p>À chaque tour, la séquence reprend depuis le début avec une couleur de plus. Répète-la en entier, dans l'ordre.</p>
<p>Une seule erreur termine la partie. Ton score est le nombre de tours réussis ; le meilleur est gardé sur cet appareil.</p>
<p>Plus la séquence est longue, plus elle est jouée vite.</p>
<p>Commandes : touche ou clique les couleurs ; au clavier, 1 vert, 2 rouge, 3 jaune, 4 bleu, ou les flèches puis Entrée ; sur la télé, les flèches de la télécommande puis OK, Retour pour le menu.</p>`,
  en: `<p>The game lights a colour and plays its sound. Repeat it by pressing the same colour.</p>
<p>Every round the sequence starts again from the beginning with one more colour. Repeat all of it, in order.</p>
<p>A single mistake ends the game. Your score is the number of rounds completed; the best one is kept on this device.</p>
<p>The longer the sequence, the faster it plays.</p>
<p>Controls: tap or click the colours; on a keyboard, 1 green, 2 red, 3 yellow, 4 blue, or the arrows then Enter; on a TV, the remote's arrows then OK, Back for the menu.</p>`,
  es: `<p>El juego enciende un color y toca su sonido. Repítelo pulsando el mismo color.</p>
<p>En cada ronda la secuencia vuelve a empezar con un color más. Repítela entera, en orden.</p>
<p>Un solo error termina la partida. Tus puntos son las rondas superadas; el récord se guarda en este dispositivo.</p>
<p>Cuanto más larga es la secuencia, más rápido suena.</p>
<p>Controles: toca o haz clic en los colores; con teclado, 1 verde, 2 rojo, 3 amarillo, 4 azul, o las flechas y Enter; en la tele, las flechas del mando y OK, Atrás para el menú.</p>`
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
