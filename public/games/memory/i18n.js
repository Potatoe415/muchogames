export const LANGS = ["fr", "en", "es"];

const STRINGS = {
  fr: {
    title: "Memory",
    pitch: "Retourne deux cartes. Les paires trouvées disparaissent.",
    back: "Retour",
    options: "Options",
    close: "Fermer",
    language: "Langue",
    rules: "Règles",
    who: "Qui joue",
    solo: "Solo",
    pass: "2 joueurs",
    bot: "Robot",
    easy: "Facile",
    medium: "Moyen",
    hard: "Difficile",
    size: "Taille",
    level: "Niveau",
    theme: "Univers",
    cardBack: "Verso",
    backN: "Verso {n}",
    card: "Carte {n}",
    "theme-miraculous": "Miraculous",
    "theme-objets": "Objets",
    "theme-ghibli": "Ghibli",
    "theme-pat-patrouille": "Pat' Patrouille",
    "theme-dinosaures": "Dinosaures",
    "theme-cuba": "Cuba",
    loading: "Chargement…",
    start: "Jouer",
    newGame: "Nouvelle",
    newGameAria: "Nouvelle partie",
    replay: "Rejouer",
    changeSetup: "Changer",
    you: "Vous",
    robot: "Robot",
    player1: "Joueur 1",
    player2: "Joueur 2",
    left: "{n} restantes",
    pairs: "{n} paires",
    mute: "Couper le son",
    unmute: "Activer le son",
    rotate: "Tourner le camp du haut",
    hiddenCard: "Carte face cachée",
    soloWin: "Toutes les paires !",
    win: "Gagné !",
    lose: "Perdu",
    tie: "Égalité",
    p1wins: "Joueur 1 gagne",
    p2wins: "Joueur 2 gagne"
  },
  en: {
    title: "Memory",
    pitch: "Flip two cards. Found pairs disappear.",
    back: "Back",
    options: "Options",
    close: "Close",
    language: "Language",
    rules: "Rules",
    who: "Who plays",
    solo: "Solo",
    pass: "2 players",
    bot: "Robot",
    easy: "Easy",
    medium: "Medium",
    hard: "Hard",
    size: "Size",
    level: "Level",
    theme: "Theme",
    cardBack: "Card back",
    backN: "Card back {n}",
    card: "Card {n}",
    "theme-miraculous": "Miraculous",
    "theme-objets": "Objects",
    "theme-ghibli": "Ghibli",
    "theme-pat-patrouille": "PAW Patrol",
    "theme-dinosaures": "Dinosaurs",
    "theme-cuba": "Cuba",
    loading: "Loading…",
    start: "Play",
    newGame: "New",
    newGameAria: "New game",
    replay: "Play again",
    changeSetup: "Change",
    you: "You",
    robot: "Robot",
    player1: "Player 1",
    player2: "Player 2",
    left: "{n} left",
    pairs: "{n} pairs",
    mute: "Mute",
    unmute: "Unmute",
    rotate: "Rotate the top side",
    hiddenCard: "Face-down card",
    soloWin: "Every pair found!",
    win: "You win!",
    lose: "You lose",
    tie: "Tie",
    p1wins: "Player 1 wins",
    p2wins: "Player 2 wins"
  },
  es: {
    title: "Memory",
    pitch: "Voltea dos cartas. Las parejas encontradas desaparecen.",
    back: "Volver",
    options: "Opciones",
    close: "Cerrar",
    language: "Idioma",
    rules: "Reglas",
    who: "Quién juega",
    solo: "Solo",
    pass: "2 jugadores",
    bot: "Robot",
    easy: "Fácil",
    medium: "Medio",
    hard: "Difícil",
    size: "Tamaño",
    level: "Nivel",
    theme: "Universo",
    cardBack: "Reverso",
    backN: "Reverso {n}",
    card: "Carta {n}",
    "theme-miraculous": "Miraculous",
    "theme-objets": "Objetos",
    "theme-ghibli": "Ghibli",
    "theme-pat-patrouille": "Patrulla Canina",
    "theme-dinosaures": "Dinosaurios",
    "theme-cuba": "Cuba",
    loading: "Cargando…",
    start: "Jugar",
    newGame: "Nueva",
    newGameAria: "Nueva partida",
    replay: "Jugar de nuevo",
    changeSetup: "Cambiar",
    you: "Tú",
    robot: "Robot",
    player1: "Jugador 1",
    player2: "Jugador 2",
    left: "{n} restantes",
    pairs: "{n} parejas",
    mute: "Silenciar",
    unmute: "Activar sonido",
    rotate: "Girar el lado de arriba",
    hiddenCard: "Carta boca abajo",
    soloWin: "¡Todas las parejas!",
    win: "¡Ganaste!",
    lose: "Perdiste",
    tie: "Empate",
    p1wins: "Gana el jugador 1",
    p2wins: "Gana el jugador 2"
  }
};

const RULES = {
  fr: `<p>Retourne deux cartes par tour. Une paire fait 1 point et tu rejoues. Sinon, pause, les cartes se referment, au tour suivant.</p>
<ul>
<li>Solo : trouve toutes les paires.</li>
<li>2 joueurs : le même appareil, à tour de rôle. Le plus de paires gagne.</li>
<li>Robot : Facile se trompe souvent, Moyen une fois sur deux, Difficile se souvient de chaque carte vue.</li>
<li>Le bouton du haut tourne son texte pour jouer face à face sur la table.</li>
<li>Chaque partie pioche ses cartes au hasard dans l'univers choisi.</li>
</ul>`,
  en: `<p>Flip two cards each turn. A pair scores 1 and you go again. Otherwise the cards close after a short pause and the turn passes.</p>
<ul>
<li>Solo: find every pair.</li>
<li>2 players: same device, taking turns. Most pairs wins.</li>
<li>Robot: Easy misses often, Medium half the time, Hard remembers every card it has seen.</li>
<li>The top button rotates that side so two players can sit across a table.</li>
<li>Each game draws its cards at random from the chosen theme.</li>
</ul>`,
  es: `<p>Voltea dos cartas por turno. Una pareja suma 1 punto y repites. Si no, pausa, las cartas se cierran y pasa el turno.</p>
<ul>
<li>Solo: encuentra todas las parejas.</li>
<li>2 jugadores: el mismo aparato, por turnos. Gana quien más parejas tenga.</li>
<li>Robot: Fácil falla a menudo, Medio la mitad de las veces, Difícil recuerda cada carta vista.</li>
<li>El botón de arriba gira su texto para jugar cara a cara en la mesa.</li>
<li>Cada partida saca sus cartas al azar del universo elegido.</li>
</ul>`
};

export function translate(lang, key, vars = {}) {
  const text = STRINGS[lang]?.[key] ?? STRINGS.fr[key] ?? key;
  return text.replace(/\{(\w+)\}/g, (_, name) => String(vars[name] ?? ""));
}

export const rulesHtml = (lang) => RULES[lang] || RULES.fr;
