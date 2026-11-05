// Player-facing copy. Keys match the page's data-i18n / data-i18n-aria.
export const LANGS = ["fr", "en", "es"];

export const COPY = {
  fr: {
    title: "4 en ligne",
    back: "Retour",
    quit: "Quitter la partie",
    options: "Options",
    close: "Fermer",
    language: "Langue",
    rules: "Règles",
    rulesBody: [
      "Deux joueurs sur le même appareil : Rouge commence, puis chacun joue à son tour.",
      "Touchez une colonne pour y lâcher un pion : il tombe dans la case libre la plus basse. Une colonne pleine ne prend plus de pion.",
      "Le premier qui aligne 4 pions de sa couleur, à l'horizontale, à la verticale ou en diagonale, gagne.",
      "Si la grille est pleine sans alignement, c'est un match nul.",
      "Clavier : flèches gauche / droite pour choisir la colonne, Entrée pour jouer, ou les touches 1 à 7."
    ],
    pitch: "Alignez 4 pions avant votre adversaire.",
    twoPlayers: "2 joueurs sur le même appareil",
    board: "Grille",
    resume: "Reprendre",
    resumeInfo: "{count} pions joués",
    newGame: "Nouvelle partie",
    replay: "Rejouer",
    menu: "Menu du jeu",
    red: "Rouge",
    yellow: "Jaune",
    turn: "Au tour de {player}",
    win: "{player} gagne !",
    draw: "Match nul : la grille est pleine.",
    full: "Colonne pleine : choisissez-en une autre.",
    column: "Colonne {n}, {free} cases libres",
    columnFull: "Colonne {n}, pleine"
  },
  en: {
    title: "Four in a Row",
    back: "Back",
    quit: "Quit match",
    options: "Options",
    close: "Close",
    language: "Language",
    rules: "Rules",
    rulesBody: [
      "Two players on the same device: Red starts, then you take turns.",
      "Tap a column to drop a disc into it: it falls to the lowest empty hole. A full column takes no more discs.",
      "The first to line up 4 discs of their colour, horizontally, vertically or diagonally, wins.",
      "If the grid fills up with no line, the game is a draw.",
      "Keyboard: left / right arrows pick the column, Enter plays, or keys 1 to 7."
    ],
    pitch: "Line up 4 discs before your opponent does.",
    twoPlayers: "2 players on the same device",
    board: "Grid",
    resume: "Resume",
    resumeInfo: "{count} discs played",
    newGame: "New game",
    replay: "Play again",
    menu: "Game menu",
    red: "Red",
    yellow: "Yellow",
    turn: "{player} to play",
    win: "{player} wins!",
    draw: "Draw: the grid is full.",
    full: "This column is full: pick another one.",
    column: "Column {n}, {free} empty holes",
    columnFull: "Column {n}, full"
  },
  es: {
    title: "4 en línea",
    back: "Volver",
    quit: "Salir de la partida",
    options: "Opciones",
    close: "Cerrar",
    language: "Idioma",
    rules: "Reglas",
    rulesBody: [
      "Dos jugadores en el mismo dispositivo: empieza Rojo y luego se juega por turnos.",
      "Toca una columna para soltar una ficha: cae a la casilla libre más baja. Una columna llena ya no admite fichas.",
      "Gana el primero que alinee 4 fichas de su color, en horizontal, vertical o diagonal.",
      "Si la cuadrícula se llena sin ninguna línea, es empate.",
      "Teclado: flechas izquierda / derecha para elegir la columna, Intro para jugar, o las teclas 1 a 7."
    ],
    pitch: "Alinea 4 fichas antes que tu rival.",
    twoPlayers: "2 jugadores en el mismo dispositivo",
    board: "Cuadrícula",
    resume: "Reanudar",
    resumeInfo: "{count} fichas jugadas",
    newGame: "Nueva partida",
    replay: "Jugar otra vez",
    menu: "Menú del juego",
    red: "Rojo",
    yellow: "Amarillo",
    turn: "Turno de {player}",
    win: "¡{player} gana!",
    draw: "Empate: la cuadrícula está llena.",
    full: "Columna llena: elige otra.",
    column: "Columna {n}, {free} casillas libres",
    columnFull: "Columna {n}, llena"
  }
};

export function translate(lang, key, vars = {}) {
  const text = (COPY[lang] ?? COPY.fr)[key] ?? COPY.fr[key] ?? key;
  if (typeof text !== "string") return text;
  return text.replace(/\{(\w+)\}/g, (_, name) => String(vars[name] ?? ""));
}
