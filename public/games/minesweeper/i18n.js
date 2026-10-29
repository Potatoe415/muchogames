// Player-facing copy in FR/EN/ES.
export const LANGS = ["fr", "en", "es"];

const STRINGS = {
  fr: {
    title: "Démineur",
    pitch: "Trouvez toutes les cases sûres sans faire sauter une seule mine !",
    chooseLevel: "Choisissez un niveau",
    beginner: "Débutant",
    intermediate: "Intermédiaire",
    expert: "Expert",
    levelInfo: "{cols}×{rows} · {mines} mines",
    best: "Record : {best} s",
    noBest: "Pas encore de record",
    resume: "Reprendre la partie",
    resumeInfo: "{level} · {seconds} s",
    back: "Retour",
    options: "Options",
    close: "Fermer",
    language: "Langue",
    rules: "Règles",
    mines: "Mines",
    time: "Temps",
    newGame: "Nouvelle partie",
    modeDig: "Creuser",
    modeFlag: "Drapeau",
    modeHint: "Changer d'action au toucher",
    cellHidden: "Case cachée",
    cellFlag: "Drapeau",
    cellMine: "Mine",
    cellEmpty: "Vide",
    won: "Gagné !",
    lost: "Boum !",
    wonLine: "{level} terminé en {seconds} s.",
    lostLine: "Vous avez touché une mine.",
    newBest: "Nouveau record !",
    replay: "Rejouer",
    changeLevel: "Changer de niveau",
    seeBoard: "Voir la grille"
  },
  en: {
    title: "Minesweeper",
    pitch: "Find every safe cell without setting off a single mine!",
    chooseLevel: "Pick a level",
    beginner: "Beginner",
    intermediate: "Intermediate",
    expert: "Expert",
    levelInfo: "{cols}×{rows} · {mines} mines",
    best: "Best: {best} s",
    noBest: "No record yet",
    resume: "Resume the game",
    resumeInfo: "{level} · {seconds} s",
    back: "Back",
    options: "Options",
    close: "Close",
    language: "Language",
    rules: "Rules",
    mines: "Mines",
    time: "Time",
    newGame: "New game",
    modeDig: "Dig",
    modeFlag: "Flag",
    modeHint: "Switch tap action",
    cellHidden: "Hidden cell",
    cellFlag: "Flag",
    cellMine: "Mine",
    cellEmpty: "Empty",
    won: "You win!",
    lost: "Boom!",
    wonLine: "{level} cleared in {seconds} s.",
    lostLine: "You hit a mine.",
    newBest: "New record!",
    replay: "Play again",
    changeLevel: "Change level",
    seeBoard: "See the grid"
  },
  es: {
    title: "Buscaminas",
    pitch:
      "¡Encuentra todas las casillas seguras sin hacer estallar ni una mina!",
    chooseLevel: "Elige un nivel",
    beginner: "Principiante",
    intermediate: "Intermedio",
    expert: "Experto",
    levelInfo: "{cols}×{rows} · {mines} minas",
    best: "Récord: {best} s",
    noBest: "Aún sin récord",
    resume: "Reanudar la partida",
    resumeInfo: "{level} · {seconds} s",
    back: "Volver",
    options: "Opciones",
    close: "Cerrar",
    language: "Idioma",
    rules: "Reglas",
    mines: "Minas",
    time: "Tiempo",
    newGame: "Nueva partida",
    modeDig: "Excavar",
    modeFlag: "Bandera",
    modeHint: "Cambiar la acción al tocar",
    cellHidden: "Casilla oculta",
    cellFlag: "Bandera",
    cellMine: "Mina",
    cellEmpty: "Vacía",
    won: "¡Has ganado!",
    lost: "¡Bum!",
    wonLine: "{level} completado en {seconds} s.",
    lostLine: "Has pisado una mina.",
    newBest: "¡Nuevo récord!",
    replay: "Jugar de nuevo",
    changeLevel: "Cambiar de nivel",
    seeBoard: "Ver la cuadrícula"
  }
};

const RULES = {
  fr: `<p>Des mines sont cachées dans la grille. Ouvrez toutes les cases qui n'en contiennent pas.</p>
<ul>
<li>Touchez (ou cliquez) une case pour l'ouvrir. La première case ouverte n'est jamais une mine.</li>
<li>Un chiffre indique combien de mines touchent cette case, diagonales comprises. Une case vide ouvre automatiquement ses voisines.</li>
<li>Appui long, clic droit ou touche F : posez ou retirez un drapeau sur une case que vous pensez minée. Le bouton Creuser / Drapeau change l'action du simple toucher.</li>
<li>Touchez un chiffre déjà entouré du bon nombre de drapeaux pour ouvrir d'un coup toutes ses autres voisines. Attention aux drapeaux mal placés !</li>
<li>Ouvrez une mine et c'est perdu. Ouvrez toutes les cases sûres pour gagner : battez votre record de temps dans chaque niveau.</li>
</ul>`,
  en: `<p>Mines are hidden in the grid. Open every cell that does not hold one.</p>
<ul>
<li>Tap (or click) a cell to open it. The first cell you open is never a mine.</li>
<li>A number tells how many mines touch that cell, diagonals included. An empty cell opens its neighbours by itself.</li>
<li>Long press, right click or the F key: put or remove a flag on a cell you think is mined. The Dig / Flag button changes what a simple tap does.</li>
<li>Tap a number already surrounded by the right number of flags to open all its other neighbours at once. Beware of misplaced flags!</li>
<li>Open a mine and you lose. Open every safe cell to win, and beat your best time on each level.</li>
</ul>`,
  es: `<p>Hay minas escondidas en la cuadrícula. Abre todas las casillas que no tengan ninguna.</p>
<ul>
<li>Toca (o haz clic en) una casilla para abrirla. La primera casilla que abres nunca es una mina.</li>
<li>Un número indica cuántas minas tocan esa casilla, diagonales incluidas. Una casilla vacía abre sola a sus vecinas.</li>
<li>Pulsación larga, clic derecho o la tecla F: pon o quita una bandera en una casilla que creas minada. El botón Excavar / Bandera cambia lo que hace un toque simple.</li>
<li>Toca un número ya rodeado del número correcto de banderas para abrir de golpe todas sus demás vecinas. ¡Cuidado con las banderas mal puestas!</li>
<li>Si abres una mina, pierdes. Abre todas las casillas seguras para ganar y bate tu mejor tiempo en cada nivel.</li>
</ul>`
};

export function translate(lang, key, vars = {}) {
  const text = STRINGS[lang]?.[key] ?? STRINGS.fr[key] ?? key;
  return text.replace(/\{(\w+)\}/g, (_, name) => String(vars[name] ?? ""));
}

export const rulesHtml = (lang) => RULES[lang] || RULES.fr;
