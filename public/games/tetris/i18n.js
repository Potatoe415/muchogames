// Player-facing copy in FR/EN/ES, rules included.
export const LANGS = ["fr", "en", "es"];

const STRINGS = {
  fr: {
    title: "Tetris",
    pitch: "Empile, tourne, complète des lignes. Le score de la Game Boy.",
    back: "Retour",
    options: "Options",
    close: "Fermer",
    language: "Langue",
    sound: "Son",
    on: "Activé",
    off: "Désactivé",
    startLevel: "Niveau de départ",
    startLevelValue: "Niveau de départ : {level}",
    ghostOption: "Afficher la pièce fantôme",
    rules: "Règles",
    play: "Jouer",
    playInfo: "Niveau {level}",
    playInfoGhost: "Niveau {level} · avec fantôme",
    resume: "Reprendre",
    resumeInfo: "Niveau {level} · {score} points",
    score: "Score",
    lines: "Lignes",
    level: "Niveau",
    next: "Suivante",
    best: "Record",
    startBest: "Record : {best}",
    bestLine: "Record : {best}",
    newBest: "Nouveau record !",
    menuButton: "Pause",
    board:
      "Plateau : flèches pour bouger, haut pour tourner, espace pour lâcher",
    paused: "Pause",
    continue: "Continuer",
    menu: "Quitter",
    endWon: "40 lignes, bravo !",
    endLost: "Partie terminée",
    endScore: "{score} points",
    endStats: "{lines} lignes · niveau {level}",
    replay: "Rejouer",
    left: "Gauche",
    right: "Droite",
    rotate: "Tourner",
    dropButton: "Lâcher",
    clear1: "Simple",
    clear2: "Double",
    clear3: "Triple",
    clear4: "Tetris !",
    rocket: "Décollage !"
  },
  en: {
    title: "Tetris",
    pitch: "Stack, rotate, clear lines. Game Boy scoring.",
    back: "Back",
    options: "Options",
    close: "Close",
    language: "Language",
    sound: "Sound",
    on: "On",
    off: "Off",
    startLevel: "Starting level",
    startLevelValue: "Starting level: {level}",
    ghostOption: "Show the ghost piece",
    rules: "Rules",
    play: "Play",
    playInfo: "Level {level}",
    playInfoGhost: "Level {level} · with ghost",
    resume: "Resume",
    resumeInfo: "Level {level} · {score} points",
    score: "Score",
    lines: "Lines",
    level: "Level",
    next: "Next",
    best: "Best",
    startBest: "Best: {best}",
    bestLine: "Best: {best}",
    newBest: "New best!",
    menuButton: "Pause",
    board: "Board: arrows to move, up to rotate, space to drop",
    paused: "Paused",
    continue: "Continue",
    menu: "Quit",
    endWon: "40 lines, well done!",
    endLost: "Game over",
    endScore: "{score} points",
    endStats: "{lines} lines · level {level}",
    replay: "Play again",
    left: "Left",
    right: "Right",
    rotate: "Rotate",
    dropButton: "Hard drop",
    clear1: "Single",
    clear2: "Double",
    clear3: "Triple",
    clear4: "Tetris!",
    rocket: "Liftoff!"
  },
  es: {
    title: "Tetris",
    pitch: "Apila, gira, completa líneas. La puntuación de la Game Boy.",
    back: "Volver",
    options: "Opciones",
    close: "Cerrar",
    language: "Idioma",
    sound: "Sonido",
    on: "Activado",
    off: "Desactivado",
    startLevel: "Nivel inicial",
    startLevelValue: "Nivel inicial: {level}",
    ghostOption: "Mostrar la pieza fantasma",
    rules: "Reglas",
    play: "Jugar",
    playInfo: "Nivel {level}",
    playInfoGhost: "Nivel {level} · con fantasma",
    resume: "Reanudar",
    resumeInfo: "Nivel {level} · {score} puntos",
    score: "Puntos",
    lines: "Líneas",
    level: "Nivel",
    next: "Siguiente",
    best: "Récord",
    startBest: "Récord: {best}",
    bestLine: "Récord: {best}",
    newBest: "¡Nuevo récord!",
    menuButton: "Pausa",
    board: "Tablero: flechas para mover, arriba para girar, espacio para soltar",
    paused: "Pausa",
    continue: "Continuar",
    menu: "Salir",
    endWon: "¡40 líneas, bravo!",
    endLost: "Fin de la partida",
    endScore: "{score} puntos",
    endStats: "{lines} líneas · nivel {level}",
    replay: "Jugar otra vez",
    left: "Izquierda",
    right: "Derecha",
    rotate: "Girar",
    dropButton: "Soltar",
    clear1: "Simple",
    clear2: "Doble",
    clear3: "Triple",
    clear4: "¡Tetris!",
    rocket: "¡Despegue!"
  }
};

const RULES = {
  fr: `<p>Des pièces de 4 carrés tombent dans un puits de 10 colonnes. Déplace-les et fais-les tourner pour remplir des lignes entières : une ligne complète disparaît.</p>
<p>Les 7 pièces arrivent par sacs de 7, dans un ordre mélangé. La suivante est affichée. Coche « Afficher la pièce fantôme » sur l'accueil pour voir où la pièce atterrira.</p>
<p>Score de la Game Boy d'origine : simple 40, double 100, triple 300, Tetris (4 lignes) 1200, multiplié par (niveau + 1). Descente 1 point par case. À partir de 100 000 points, une fusée décolle en fin de partie (plus grande à 150 000, 200 000 et 250 000).</p>
<p>Choisis le niveau de départ, de 0 à 9, sur l'accueil. Un niveau de plus toutes les 10 lignes : la chute accélère. La partie s'arrête quand les pièces débordent en haut. 40 lignes comptent comme une partie gagnée.</p>
<p>Clavier : ← → bouger, ↓ descendre, Espace lâcher, ↑ ou X tourner à droite, Z ou Ctrl tourner à gauche, P ou Échap pause. Tactile : touche n'importe où à gauche du plateau ou sur ses 2 colonnes de gauche pour aller à gauche, pareil à droite pour aller à droite (garde le doigt pour continuer), sous le plateau pour descendre vite. Au milieu du plateau, glisse vers le haut pour tourner ; touche deux fois vite ou donne un coup sec vers le bas pour lâcher la pièce. Sous le plateau, les boutons : ◀ gauche, barre = lâcher, ▶ droite, ↻ tourner. Télé : flèches (haut = tourner), OK = lâcher, touche verte = tourner à gauche, Retour = pause.</p>`,
  en: `<p>Pieces of 4 squares fall into a 10-column well. Move and rotate them to fill whole rows: a full row disappears.</p>
<p>The 7 pieces come in bags of 7, shuffled. The next one is shown. Tick "Show the ghost piece" on the start screen to see where the piece will land.</p>
<p>Original Game Boy scoring: single 40, double 100, triple 300, Tetris (4 lines) 1200, times (level + 1). Dropping: 1 point per cell. From 100,000 points, a rocket lifts off at the end of the game (bigger at 150,000, 200,000 and 250,000).</p>
<p>Pick the starting level, 0 to 9, on the start screen. One more level every 10 lines: gravity speeds up. The game ends when pieces overflow the top. 40 lines count as a won game.</p>
<p>Keyboard: ← → move, ↓ soft drop, Space hard drop, ↑ or X rotate clockwise, Z or Ctrl rotate counter-clockwise, P or Esc pause. Touch: tap anywhere left of the board or on its 2 left columns to move left, the same on the right to move right (keep your finger down to keep going), below it to drop fast. In the middle of the board, swipe up to rotate; double tap or flick down to hard drop. Buttons under the board: ◀ left, bar = hard drop, ▶ right, ↻ rotate. TV: arrows (up = rotate), OK = hard drop, green key = rotate counter-clockwise, Back = pause.</p>`,
  es: `<p>Piezas de 4 cuadrados caen en un pozo de 10 columnas. Muévelas y gíralas para llenar filas enteras: una fila completa desaparece.</p>
<p>Las 7 piezas llegan en bolsas de 7, mezcladas. Se muestra la siguiente. Marca «Mostrar la pieza fantasma» en la pantalla de inicio para ver dónde aterrizará la pieza.</p>
<p>Puntuación de la Game Boy original: simple 40, doble 100, triple 300, Tetris (4 líneas) 1200, por (nivel + 1). Bajada: 1 punto por casilla. A partir de 100 000 puntos, un cohete despega al final de la partida (más grande a 150 000, 200 000 y 250 000).</p>
<p>Elige el nivel inicial, de 0 a 9, en la pantalla de inicio. Un nivel más cada 10 líneas: la caída se acelera. La partida acaba cuando las piezas desbordan por arriba. 40 líneas cuentan como partida ganada.</p>
<p>Teclado: ← → mover, ↓ bajar, Espacio soltar, ↑ o X girar a la derecha, Z o Ctrl girar a la izquierda, P o Esc pausa. Táctil: toca en cualquier sitio a la izquierda del tablero o en sus 2 columnas de la izquierda para ir a la izquierda, igual a la derecha para ir a la derecha (mantén el dedo para seguir), debajo para bajar rápido. En el centro del tablero, desliza hacia arriba para girar; toca dos veces rápido o da un golpe seco hacia abajo para soltar la pieza. Botones bajo el tablero: ◀ izquierda, barra = soltar, ▶ derecha, ↻ girar. Tele: flechas (arriba = girar), OK = soltar, tecla verde = girar a la izquierda, Atrás = pausa.</p>`
};

const fill = (text, vars = {}) =>
  text.replace(/\{(\w+)\}/g, (all, key) => String(vars[key] ?? all));

export function translate(lang, key, vars) {
  const text = STRINGS[lang]?.[key] ?? STRINGS.fr[key] ?? key;
  return fill(text, vars);
}

export const rulesHtml = (lang) => RULES[lang] || RULES.fr;
