// Player-facing copy in FR/EN/ES, rules included.
export const LANGS = ["fr", "en", "es"];

const STRINGS = {
  fr: {
    title: "Tetris",
    pitch: "Empile, tourne, complète des lignes. Les règles officielles.",
    back: "Retour",
    options: "Options",
    close: "Fermer",
    language: "Langue",
    sound: "Son",
    on: "Activé",
    off: "Désactivé",
    difficulty: "Difficulté",
    easy: "Facile",
    medium: "Moyen",
    hard: "Difficile",
    rules: "Règles",
    play: "Jouer",
    playInfo: "{difficulty} · niveau {level}",
    resume: "Reprendre",
    resumeInfo: "Niveau {level} · {score} points",
    score: "Score",
    lines: "Lignes",
    level: "Niveau",
    hold: "Réserve",
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
    holdButton: "Mettre en réserve",
    dropButton: "Lâcher",
    clear1: "Simple",
    clear2: "Double",
    clear3: "Triple",
    clear4: "Tetris !",
    spin: "T-spin",
    spinMini: "T-spin mini",
    b2b: "Enchaînement",
    combo: "Combo {n}"
  },
  en: {
    title: "Tetris",
    pitch: "Stack, rotate, clear lines. The official rules.",
    back: "Back",
    options: "Options",
    close: "Close",
    language: "Language",
    sound: "Sound",
    on: "On",
    off: "Off",
    difficulty: "Difficulty",
    easy: "Easy",
    medium: "Medium",
    hard: "Hard",
    rules: "Rules",
    play: "Play",
    playInfo: "{difficulty} · level {level}",
    resume: "Resume",
    resumeInfo: "Level {level} · {score} points",
    score: "Score",
    lines: "Lines",
    level: "Level",
    hold: "Hold",
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
    holdButton: "Hold piece",
    dropButton: "Hard drop",
    clear1: "Single",
    clear2: "Double",
    clear3: "Triple",
    clear4: "Tetris!",
    spin: "T-spin",
    spinMini: "Mini T-spin",
    b2b: "Back-to-back",
    combo: "Combo {n}"
  },
  es: {
    title: "Tetris",
    pitch: "Apila, gira, completa líneas. Las reglas oficiales.",
    back: "Volver",
    options: "Opciones",
    close: "Cerrar",
    language: "Idioma",
    sound: "Sonido",
    on: "Activado",
    off: "Desactivado",
    difficulty: "Dificultad",
    easy: "Fácil",
    medium: "Medio",
    hard: "Difícil",
    rules: "Reglas",
    play: "Jugar",
    playInfo: "{difficulty} · nivel {level}",
    resume: "Reanudar",
    resumeInfo: "Nivel {level} · {score} puntos",
    score: "Puntos",
    lines: "Líneas",
    level: "Nivel",
    hold: "Reserva",
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
    holdButton: "Guardar pieza",
    dropButton: "Soltar",
    clear1: "Simple",
    clear2: "Doble",
    clear3: "Triple",
    clear4: "¡Tetris!",
    spin: "T-spin",
    spinMini: "T-spin mini",
    b2b: "Encadenado",
    combo: "Combo {n}"
  }
};

const RULES = {
  fr: `<p>Des pièces de 4 carrés tombent dans un puits de 10 colonnes. Déplace-les et fais-les tourner pour remplir des lignes entières : une ligne complète disparaît.</p>
<p>Les 7 pièces arrivent par sacs de 7, dans un ordre mélangé. La suivante est affichée ; en Facile, la pièce fantôme montre où elle atterrira.</p>
<p>Réserve : mets une pièce de côté (une fois par pièce) et reprends-la plus tard.</p>
<p>Score : simple 100, double 300, triple 500, Tetris (4 lignes) 800, multiplié par le niveau. Descente douce 1 point par case, chute directe 2 points par case. T-spin (T tournée dans un creux) et enchaînement de Tetris ou de T-spins : bonus ×1,5. Combo : lignes à la suite.</p>
<p>Un niveau toutes les 10 lignes : la chute accélère. Choisis la difficulté sur l'accueil : Facile (niveau 1, avec la pièce fantôme), Moyen (niveau 4) ou Difficile (niveau 7), ces deux-là sans pièce fantôme. La partie s'arrête quand les pièces débordent en haut. 40 lignes comptent comme une partie gagnée.</p>
<p>Clavier : ← → bouger, ↓ descendre, Espace lâcher, ↑ ou X tourner à droite, Z ou Ctrl tourner à gauche, C ou Maj réserve, P ou Échap pause. Tactile : touche n'importe où à gauche du plateau pour aller à gauche, à droite pour aller à droite (garde le doigt pour continuer), sous le plateau pour descendre vite, sur le plateau pour tourner. Sur le plateau, un coup sec vers le bas lâche la pièce. Sous le plateau, les boutons : ◀ gauche, barre = lâcher, ▶ droite, ↻ tourner. Touche la réserve pour y mettre la pièce. Télé : flèches (haut = tourner), OK = lâcher, touche rouge = réserve, verte = tourner à gauche, Retour = pause.</p>`,
  en: `<p>Pieces of 4 squares fall into a 10-column well. Move and rotate them to fill whole rows: a full row disappears.</p>
<p>The 7 pieces come in bags of 7, shuffled. The next one is shown; on Easy, the ghost piece shows where it will land.</p>
<p>Hold: set a piece aside (once per piece) and take it back later.</p>
<p>Score: single 100, double 300, triple 500, Tetris (4 lines) 800, times the level. Soft drop 1 point per cell, hard drop 2 points per cell. T-spin (a T turned into a gap) and back-to-back Tetrises or T-spins: ×1.5 bonus. Combo: clears on consecutive pieces.</p>
<p>A level every 10 lines: gravity speeds up. Pick the difficulty on the start screen: Easy (level 1, with the ghost piece), Medium (level 4) or Hard (level 7), both without the ghost piece. The game ends when pieces overflow the top. 40 lines count as a won game.</p>
<p>Keyboard: ← → move, ↓ soft drop, Space hard drop, ↑ or X rotate clockwise, Z or Ctrl rotate counter-clockwise, C or Shift hold, P or Esc pause. Touch: tap anywhere left of the board to move left, right of it to move right (keep your finger down to keep going), below it to drop fast, on the board to rotate. A quick flick down on the board hard drops. Buttons under the board: ◀ left, bar = hard drop, ▶ right, ↻ rotate. Tap the hold box to hold the piece. TV: arrows (up = rotate), OK = hard drop, red key = hold, green key = rotate counter-clockwise, Back = pause.</p>`,
  es: `<p>Piezas de 4 cuadrados caen en un pozo de 10 columnas. Muévelas y gíralas para llenar filas enteras: una fila completa desaparece.</p>
<p>Las 7 piezas llegan en bolsas de 7, mezcladas. Se muestra la siguiente; en Fácil, la pieza fantasma indica dónde aterrizará.</p>
<p>Reserva: aparta una pieza (una vez por pieza) y recupérala más tarde.</p>
<p>Puntos: simple 100, doble 300, triple 500, Tetris (4 líneas) 800, por el nivel. Bajada suave 1 punto por casilla, caída directa 2 puntos por casilla. T-spin (una T girada en un hueco) y Tetris o T-spins seguidos: bonus ×1,5. Combo: líneas en piezas consecutivas.</p>
<p>Un nivel cada 10 líneas: la caída se acelera. Elige la dificultad en la pantalla de inicio: Fácil (nivel 1, con la pieza fantasma), Medio (nivel 4) o Difícil (nivel 7), estos dos sin pieza fantasma. La partida acaba cuando las piezas desbordan por arriba. 40 líneas cuentan como partida ganada.</p>
<p>Teclado: ← → mover, ↓ bajar, Espacio soltar, ↑ o X girar a la derecha, Z o Ctrl girar a la izquierda, C o Mayús reserva, P o Esc pausa. Táctil: toca en cualquier sitio a la izquierda del tablero para ir a la izquierda, a la derecha para ir a la derecha (mantén el dedo para seguir), debajo para bajar rápido, sobre el tablero para girar. Un golpe seco hacia abajo sobre el tablero suelta la pieza. Botones bajo el tablero: ◀ izquierda, barra = soltar, ▶ derecha, ↻ girar. Toca la reserva para guardar la pieza. Tele: flechas (arriba = girar), OK = soltar, tecla roja = reserva, verde = girar a la izquierda, Atrás = pausa.</p>`
};

const fill = (text, vars = {}) =>
  text.replace(/\{(\w+)\}/g, (all, key) => String(vars[key] ?? all));

export function translate(lang, key, vars) {
  const text = STRINGS[lang]?.[key] ?? STRINGS.fr[key] ?? key;
  return fill(text, vars);
}

export const rulesHtml = (lang) => RULES[lang] || RULES.fr;
