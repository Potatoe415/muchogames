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
    startLevel: "Niveau de départ",
    rules: "Règles",
    play: "Jouer",
    playInfo: "Niveau de départ {level}",
    resume: "Reprendre",
    resumeInfo: "Niveau {level} · {score} points",
    score: "Score",
    lines: "Lignes",
    level: "Niveau",
    hold: "Réserve",
    next: "Suivantes",
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
    down: "Descendre",
    rotateCw: "Tourner à droite",
    rotateCcw: "Tourner à gauche",
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
    startLevel: "Starting level",
    rules: "Rules",
    play: "Play",
    playInfo: "Starting level {level}",
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
    down: "Soft drop",
    rotateCw: "Rotate clockwise",
    rotateCcw: "Rotate counter-clockwise",
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
    startLevel: "Nivel inicial",
    rules: "Reglas",
    play: "Jugar",
    playInfo: "Nivel inicial {level}",
    resume: "Reanudar",
    resumeInfo: "Nivel {level} · {score} puntos",
    score: "Puntos",
    lines: "Líneas",
    level: "Nivel",
    hold: "Reserva",
    next: "Siguientes",
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
    down: "Bajar",
    rotateCw: "Girar a la derecha",
    rotateCcw: "Girar a la izquierda",
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
<p>Les 7 pièces arrivent par sacs de 7, dans un ordre mélangé. Les 5 suivantes sont affichées ; la pièce fantôme montre où elle atterrira.</p>
<p>Réserve : mets une pièce de côté (une fois par pièce) et reprends-la plus tard.</p>
<p>Score : simple 100, double 300, triple 500, Tetris (4 lignes) 800, multiplié par le niveau. Descente douce 1 point par case, chute directe 2 points par case. T-spin (T tournée dans un creux) et enchaînement de Tetris ou de T-spins : bonus ×1,5. Combo : lignes à la suite.</p>
<p>Un niveau toutes les 10 lignes : la chute accélère. Tu peux choisir le niveau de départ de 1 à 10 dans les options. La partie s'arrête quand les pièces débordent en haut. 40 lignes comptent comme une partie gagnée.</p>
<p>Clavier : ← → bouger, ↓ descendre, Espace lâcher, ↑ ou X tourner à droite, Z ou Ctrl tourner à gauche, C ou Maj réserve, P ou Échap pause. Tactile : boutons à l'écran, ou glisse sur le plateau (sur le côté pour bouger, vers le bas pour descendre, d'un coup sec pour lâcher) et touche pour tourner. Télé : flèches (haut = tourner), OK = lâcher, touche rouge = réserve, verte = tourner à gauche, Retour = pause.</p>`,
  en: `<p>Pieces of 4 squares fall into a 10-column well. Move and rotate them to fill whole rows: a full row disappears.</p>
<p>The 7 pieces come in bags of 7, shuffled. The next 5 are shown; the ghost piece shows where it will land.</p>
<p>Hold: set a piece aside (once per piece) and take it back later.</p>
<p>Score: single 100, double 300, triple 500, Tetris (4 lines) 800, times the level. Soft drop 1 point per cell, hard drop 2 points per cell. T-spin (a T turned into a gap) and back-to-back Tetrises or T-spins: ×1.5 bonus. Combo: clears on consecutive pieces.</p>
<p>A level every 10 lines: gravity speeds up. Pick the starting level from 1 to 10 in the options. The game ends when pieces overflow the top. 40 lines count as a won game.</p>
<p>Keyboard: ← → move, ↓ soft drop, Space hard drop, ↑ or X rotate clockwise, Z or Ctrl rotate counter-clockwise, C or Shift hold, P or Esc pause. Touch: on-screen buttons, or drag on the board (sideways to move, down to soft drop, a quick flick to hard drop) and tap to rotate. TV: arrows (up = rotate), OK = hard drop, red key = hold, green key = rotate counter-clockwise, Back = pause.</p>`,
  es: `<p>Piezas de 4 cuadrados caen en un pozo de 10 columnas. Muévelas y gíralas para llenar filas enteras: una fila completa desaparece.</p>
<p>Las 7 piezas llegan en bolsas de 7, mezcladas. Se muestran las 5 siguientes; la pieza fantasma indica dónde aterrizará.</p>
<p>Reserva: aparta una pieza (una vez por pieza) y recupérala más tarde.</p>
<p>Puntos: simple 100, doble 300, triple 500, Tetris (4 líneas) 800, por el nivel. Bajada suave 1 punto por casilla, caída directa 2 puntos por casilla. T-spin (una T girada en un hueco) y Tetris o T-spins seguidos: bonus ×1,5. Combo: líneas en piezas consecutivas.</p>
<p>Un nivel cada 10 líneas: la caída se acelera. Elige el nivel inicial de 1 a 10 en las opciones. La partida acaba cuando las piezas desbordan por arriba. 40 líneas cuentan como partida ganada.</p>
<p>Teclado: ← → mover, ↓ bajar, Espacio soltar, ↑ o X girar a la derecha, Z o Ctrl girar a la izquierda, C o Mayús reserva, P o Esc pausa. Táctil: botones en pantalla, o desliza sobre el tablero (de lado para mover, hacia abajo para bajar, un golpe seco para soltar) y toca para girar. Tele: flechas (arriba = girar), OK = soltar, tecla roja = reserva, verde = girar a la izquierda, Atrás = pausa.</p>`
};

const fill = (text, vars = {}) =>
  text.replace(/\{(\w+)\}/g, (all, key) => String(vars[key] ?? all));

export function translate(lang, key, vars) {
  const text = STRINGS[lang]?.[key] ?? STRINGS.fr[key] ?? key;
  return fill(text, vars);
}

export const rulesHtml = (lang) => RULES[lang] || RULES.fr;
