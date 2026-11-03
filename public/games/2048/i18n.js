// Player-facing copy in FR/EN/ES, rules included.
export const LANGS = ["fr", "en", "es"];

const STRINGS = {
  fr: {
    title: "2048",
    pitch: "Glisse, assemble, respire. Pas de chrono, rien ne presse.",
    back: "Retour",
    options: "Options",
    close: "Fermer",
    language: "Langue",
    sound: "Son",
    on: "Activé",
    off: "Désactivé",
    rules: "Règles",
    play: "Nouvelle partie",
    resume: "Reprendre",
    resumeInfo: "{score} points",
    score: "Score",
    best: "Record",
    bestLine: "Record : {best}",
    undo: "Annuler le coup",
    undoLabel: "Annuler le dernier coup (restants : {n})",
    menuButton: "Menu",
    board: "Plateau : glisse ou touche près d'un bord, ou utilise les flèches",
    paused: "Pause",
    continue: "Continuer",
    menu: "Quitter",
    winTitle: "2048 !",
    winText:
      "Bravo, tu as atteint 2048. Tu peux continuer aussi loin que tu veux.",
    keepGoing: "Continuer",
    stop: "Terminer la partie",
    endWon: "Belle partie",
    endLost: "Plus de coups possibles",
    endScore: "{score} points",
    endTop: "Plus grande tuile : {top}",
    newBest: "Nouveau record !",
    replay: "Rejouer"
  },
  en: {
    title: "2048",
    pitch: "Slide, merge, breathe. No timer, no rush.",
    back: "Back",
    options: "Options",
    close: "Close",
    language: "Language",
    sound: "Sound",
    on: "On",
    off: "Off",
    rules: "Rules",
    play: "New game",
    resume: "Resume",
    resumeInfo: "{score} points",
    score: "Score",
    best: "Best",
    bestLine: "Best: {best}",
    undo: "Undo move",
    undoLabel: "Undo the last move ({n} left)",
    menuButton: "Menu",
    board: "Board: swipe or tap near an edge, or use the arrow keys",
    paused: "Paused",
    continue: "Continue",
    menu: "Quit",
    winTitle: "2048!",
    winText: "Well done, you reached 2048. Keep going as far as you like.",
    keepGoing: "Keep going",
    stop: "End the game",
    endWon: "Lovely game",
    endLost: "No moves left",
    endScore: "{score} points",
    endTop: "Biggest tile: {top}",
    newBest: "New best!",
    replay: "Play again"
  },
  es: {
    title: "2048",
    pitch: "Desliza, combina, respira. Sin reloj, sin prisa.",
    back: "Volver",
    options: "Opciones",
    close: "Cerrar",
    language: "Idioma",
    sound: "Sonido",
    on: "Activado",
    off: "Desactivado",
    rules: "Reglas",
    play: "Nueva partida",
    resume: "Reanudar",
    resumeInfo: "{score} puntos",
    score: "Puntos",
    best: "Récord",
    bestLine: "Récord: {best}",
    undo: "Deshacer jugada",
    undoLabel: "Deshacer la última jugada (restantes: {n})",
    menuButton: "Menú",
    board: "Tablero: desliza o toca cerca de un borde, o usa las flechas",
    paused: "Pausa",
    continue: "Continuar",
    menu: "Salir",
    winTitle: "¡2048!",
    winText: "Bravo, has llegado a 2048. Puedes seguir tan lejos como quieras.",
    keepGoing: "Seguir",
    stop: "Terminar la partida",
    endWon: "Bonita partida",
    endLost: "No quedan jugadas",
    endScore: "{score} puntos",
    endTop: "Ficha más grande: {top}",
    newBest: "¡Nuevo récord!",
    replay: "Jugar otra vez"
  }
};

const RULES = {
  fr: `<p>Fais glisser toutes les tuiles d'un coup vers le haut, le bas, la gauche ou la droite.</p>
<p>Deux tuiles de même valeur qui se touchent fusionnent : 2 + 2 = 4, 4 + 4 = 8… Chaque fusion ajoute sa valeur au score.</p>
<p>Après chaque coup, une nouvelle tuile (un 2, parfois un 4) apparaît.</p>
<p>Atteins la tuile 2048 pour gagner, puis continue si tu veux. La partie s'arrête quand plus aucun coup n'est possible.</p>
<p>↶ annule le dernier coup, 3 fois par partie.</p>
<p>Commandes : glisse le doigt sur le plateau ou touche près d'un bord ; au clavier, les flèches, ZQSD ou WASD ; sur la télé, les flèches de la télécommande, Retour pour le menu.</p>
<p>Pas de chrono : prends ton temps.</p>`,
  en: `<p>Slide every tile at once up, down, left or right.</p>
<p>Two tiles with the same value that touch merge: 2 + 2 = 4, 4 + 4 = 8… Each merge adds its value to the score.</p>
<p>After each move a new tile (a 2, sometimes a 4) appears.</p>
<p>Reach the 2048 tile to win, then keep going if you like. The game ends when no move is left.</p>
<p>↶ undoes the last move, 3 times per game.</p>
<p>Controls: swipe on the board or tap near an edge; on a keyboard, the arrows, WASD or ZQSD; on a TV, the remote's arrows, Back for the menu.</p>
<p>No timer: take your time.</p>`,
  es: `<p>Desliza todas las fichas a la vez hacia arriba, abajo, izquierda o derecha.</p>
<p>Dos fichas del mismo valor que se tocan se combinan: 2 + 2 = 4, 4 + 4 = 8… Cada combinación suma su valor a los puntos.</p>
<p>Tras cada jugada aparece una ficha nueva (un 2, a veces un 4).</p>
<p>Llega a la ficha 2048 para ganar y sigue si quieres. La partida termina cuando no queda ninguna jugada.</p>
<p>↶ deshace la última jugada, 3 veces por partida.</p>
<p>Controles: desliza sobre el tablero o toca cerca de un borde; con teclado, las flechas, WASD o ZQSD; en la tele, las flechas del mando y Atrás para el menú.</p>
<p>Sin reloj: tómate tu tiempo.</p>`
};

const fill = (text, vars = {}) =>
  text.replace(/\{(\w+)\}/g, (all, key) => String(vars[key] ?? all));

export function translate(lang, key, vars) {
  const text = STRINGS[lang]?.[key] ?? STRINGS.fr[key] ?? key;
  return fill(text, vars);
}

export const rulesHtml = (lang) => RULES[lang] || RULES.fr;
