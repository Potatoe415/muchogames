// Player-facing copy (FR / EN / ES). Keys match the page's data-i18n and
// data-i18n-aria attributes; {name} placeholders are filled by translate().
export const LANGS = ["fr", "en", "es"];

const COPY = {
  fr: {
    title: "Easy Frog",
    pitch:
      "Fais traverser la route puis l'étang à la grenouille, jusqu'aux cases d'arrivée.",
    back: "Retour",
    quit: "Quitter la partie",
    options: "Options",
    close: "Fermer",
    language: "Langue",
    rules: "Règles",
    sound: "Son",
    frogAnimation: "Animation de la grenouille",
    objectsMovement: "Mouvement des objets",
    dpadPosition: "Position des flèches",
    center: "Centre",
    on: "Activé",
    off: "Désactivé",
    best: "Record",
    easy: "Facile",
    normal: "Normal",
    resume: "Reprendre",
    resumeInfo: "{difficulty} · niveau {level} · {score} pts",
    score: "Score",
    level: "Niveau",
    time: "Temps",
    lives: "Vies",
    godMode: "MODE DIEU",
    board: "Plateau de jeu",
    pause: "Pause",
    paused: "Pause",
    continue: "Continuer",
    restart: "Nouvelle partie",
    menu: "Menu du jeu",
    gameOver: "Partie terminée",
    victory: "Victoire !",
    newBest: "Nouveau record !",
    replay: "Rejouer",
    up: "Haut",
    down: "Bas",
    left: "Gauche",
    right: "Droite",
    keysHint: "Flèches ou balayage pour sauter"
  },
  en: {
    title: "Easy Frog",
    pitch: "Get the frog across the road, then the pond, to the home slots.",
    back: "Back",
    quit: "Quit match",
    options: "Options",
    close: "Close",
    language: "Language",
    rules: "Rules",
    sound: "Sound",
    frogAnimation: "Frog animation",
    objectsMovement: "Objects movement",
    dpadPosition: "Arrow position",
    center: "Centre",
    on: "On",
    off: "Off",
    best: "Best",
    easy: "Easy",
    normal: "Normal",
    resume: "Resume",
    resumeInfo: "{difficulty} · level {level} · {score} pts",
    score: "Score",
    level: "Level",
    time: "Time",
    lives: "Lives",
    godMode: "GOD MODE",
    board: "Game board",
    pause: "Pause",
    paused: "Paused",
    continue: "Continue",
    restart: "New game",
    menu: "Game menu",
    gameOver: "Game over",
    victory: "You win!",
    newBest: "New record!",
    replay: "Play again",
    up: "Up",
    down: "Down",
    left: "Left",
    right: "Right",
    keysHint: "Arrows or swipe to jump"
  },
  es: {
    title: "Easy Frog",
    pitch:
      "Haz que la rana cruce la carretera y luego el estanque, hasta las casillas de llegada.",
    back: "Volver",
    quit: "Salir de la partida",
    options: "Opciones",
    close: "Cerrar",
    language: "Idioma",
    rules: "Reglas",
    sound: "Sonido",
    frogAnimation: "Animación de la rana",
    objectsMovement: "Movimiento de objetos",
    dpadPosition: "Posición de las flechas",
    center: "Centro",
    on: "Activado",
    off: "Desactivado",
    best: "Récord",
    easy: "Fácil",
    normal: "Normal",
    resume: "Reanudar",
    resumeInfo: "{difficulty} · nivel {level} · {score} pts",
    score: "Puntos",
    level: "Nivel",
    time: "Tiempo",
    lives: "Vidas",
    godMode: "MODO DIOS",
    board: "Tablero",
    pause: "Pausa",
    paused: "Pausa",
    continue: "Continuar",
    restart: "Nueva partida",
    menu: "Menú del juego",
    gameOver: "Partida terminada",
    victory: "¡Victoria!",
    newBest: "¡Nuevo récord!",
    replay: "Jugar otra vez",
    up: "Arriba",
    down: "Abajo",
    left: "Izquierda",
    right: "Derecha",
    keysHint: "Flechas o deslizar para saltar"
  }
};

const RULES = {
  fr: `<p>Amène la grenouille de la rive du bas jusqu'aux 4 cases d'arrivée en haut, en traversant la route puis l'étang.</p>
<ul>
<li>Route : évite les voitures et, à partir du niveau 5, le train.</li>
<li>Étang : saute sur les rondins, nénuphars, tortues et crocodiles, jamais dans l'eau ni sur la tête du crocodile. Certaines tortues plongent : elles clignotent juste avant.</li>
<li>Chaque case d'arrivée rapporte 200 points ; le niveau est gagné quand assez de cases sont remplies. Termine le dernier niveau pour gagner la partie.</li>
<li>La mouche rapporte 500 points et une vie (5 vies au plus). La mouche aux couleurs inversées retourne l'écran pendant 4 secondes.</li>
<li>Une vie perdue coûte des points : 10 000 en Normal, 5 000 en Facile. En Normal, chaque niveau a un temps limite ; chaque case atteinte ajoute 5 secondes et chaque vie perdue (voiture, train ou eau) en ajoute 10.</li>
<li>Facile : 5 niveaux plus lents, sans chrono. Normal : 7 niveaux.</li>
</ul>
<p>Commandes : flèches ou ZQSD/WASD, balayage sur le plateau, ou les flèches à l'écran. Échap ou P : pause.</p>`,
  en: `<p>Take the frog from the bottom bank to the 4 home slots at the top, across the road and then the pond.</p>
<ul>
<li>Road: dodge the cars and, from level 5, the train.</li>
<li>Pond: hop on logs, lily pads, turtles and crocodiles, never into the water nor onto the crocodile's head. Some turtles dive: they blink just before.</li>
<li>Each home slot is worth 200 points; a level is won once enough slots are filled. Clear the last level to win the match.</li>
<li>The fly is worth 500 points and one life (5 lives at most). The fly with inverted colours turns the screen upside down for 4 seconds.</li>
<li>Losing a life costs points: 10,000 in Normal, 5,000 in Easy. In Normal each level has a time limit; each slot reached adds 5 seconds and each life lost (car, train or water) adds 10.</li>
<li>Easy: 5 slower levels, no timer. Normal: 7 levels.</li>
</ul>
<p>Controls: arrow keys or WASD, swipe on the board, or the on-screen arrows. Escape or P: pause.</p>`,
  es: `<p>Lleva la rana desde la orilla de abajo hasta las 4 casillas de llegada de arriba, cruzando la carretera y luego el estanque.</p>
<ul>
<li>Carretera: esquiva los coches y, desde el nivel 5, el tren.</li>
<li>Estanque: salta sobre troncos, nenúfares, tortugas y cocodrilos, nunca al agua ni sobre la cabeza del cocodrilo. Algunas tortugas se sumergen: parpadean justo antes.</li>
<li>Cada casilla de llegada vale 200 puntos; el nivel se gana cuando hay suficientes casillas llenas. Supera el último nivel para ganar la partida.</li>
<li>La mosca vale 500 puntos y una vida (5 vidas como máximo). La mosca de colores invertidos da la vuelta a la pantalla durante 4 segundos.</li>
<li>Perder una vida cuesta puntos: 10 000 en Normal, 5 000 en Fácil. En Normal cada nivel tiene un tiempo límite; cada casilla alcanzada añade 5 segundos y cada vida perdida (coche, tren o agua) añade 10.</li>
<li>Fácil: 5 niveles más lentos, sin cronómetro. Normal: 7 niveles.</li>
</ul>
<p>Controles: flechas o WASD, deslizar sobre el tablero, o las flechas en pantalla. Escape o P: pausa.</p>`
};

export function translate(lang, key, vars = {}) {
  const text = COPY[lang]?.[key] ?? COPY.fr[key] ?? key;
  return text.replace(/\{(\w+)\}/g, (_, name) => String(vars[name] ?? ""));
}

export const rulesHtml = (lang) => RULES[lang] ?? RULES.fr;
