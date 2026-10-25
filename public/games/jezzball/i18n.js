// Player-facing copy in FR/EN/ES.
export const LANGS = ["fr", "en", "es"];

const STRINGS = {
  fr: {
    title: "JezzBall",
    pitch:
      "Coupez le terrain avec vos murs et enfermez les atomes : conquérez 75 % de la surface !",
    best: "Record : {best}",
    play: "Jouer",
    back: "Retour",
    options: "Options",
    close: "Fermer",
    language: "Langue",
    rules: "Règles",
    sound: "Son",
    on: "Activé",
    off: "Désactivé",
    swipe: "Swipe",
    swipeHint:
      "Glissez depuis une case : ← → mur horizontal · ↑ ↓ mur vertical. Un simple tap marche toujours (axe actif).",
    level: "Niveau",
    lives: "Vies",
    area: "Surface",
    time: "Temps",
    score: "Score",
    bestShort: "Record",
    horizontal: "Horizontal",
    vertical: "Vertical",
    axisHint: "Changer d'axe",
    canvas:
      "Terrain de JezzBall : touchez une case pour lancer un mur selon l'axe actif",
    levelCleared: "Niveau {level} réussi !",
    areaLine: "Surface conquise : {percent} %",
    percentBonus: "Bonus surface : +{percentBonus}",
    timeBonus: "Bonus temps : +{timeBonus}",
    scoreLine: "Score : {score}",
    next: "Niveau suivant",
    gameOver: "Partie terminée",
    overHit: "Plus de vies : un atome a brisé votre mur.",
    overTime: "Plus de vies : le temps est écoulé.",
    overStats: "Niveau {level} · {percent} % / {target} %",
    newBest: "Nouveau record !",
    replay: "Rejouer",
    paused: "Pause",
    resume: "Reprendre"
  },
  en: {
    title: "JezzBall",
    pitch:
      "Split the field with your walls and trap the atoms: claim 75% of the area!",
    best: "Best: {best}",
    play: "Play",
    back: "Back",
    options: "Options",
    close: "Close",
    language: "Language",
    rules: "Rules",
    sound: "Sound",
    on: "On",
    off: "Off",
    swipe: "Swipe",
    swipeHint:
      "Swipe from a cell: ← → horizontal wall · ↑ ↓ vertical wall. A plain tap still works (active axis).",
    level: "Level",
    lives: "Lives",
    area: "Area",
    time: "Time",
    score: "Score",
    bestShort: "Best",
    horizontal: "Horizontal",
    vertical: "Vertical",
    axisHint: "Switch axis",
    canvas: "JezzBall field: tap a cell to launch a wall along the active axis",
    levelCleared: "Level {level} cleared!",
    areaLine: "Area claimed: {percent}%",
    percentBonus: "Area bonus: +{percentBonus}",
    timeBonus: "Time bonus: +{timeBonus}",
    scoreLine: "Score: {score}",
    next: "Next level",
    gameOver: "Game over",
    overHit: "Out of lives: an atom broke your wall.",
    overTime: "Out of lives: time ran out.",
    overStats: "Level {level} · {percent}% / {target}%",
    newBest: "New record!",
    replay: "Play again",
    paused: "Paused",
    resume: "Resume"
  },
  es: {
    title: "JezzBall",
    pitch:
      "Divide el terreno con tus muros y encierra los átomos: ¡conquista el 75 % de la superficie!",
    best: "Récord: {best}",
    play: "Jugar",
    back: "Volver",
    options: "Opciones",
    close: "Cerrar",
    language: "Idioma",
    rules: "Reglas",
    sound: "Sonido",
    on: "Activado",
    off: "Desactivado",
    swipe: "Deslizar",
    swipeHint:
      "Desliza desde una casilla: ← → muro horizontal · ↑ ↓ muro vertical. Un toque simple sigue funcionando (eje activo).",
    level: "Nivel",
    lives: "Vidas",
    area: "Superficie",
    time: "Tiempo",
    score: "Puntos",
    bestShort: "Récord",
    horizontal: "Horizontal",
    vertical: "Vertical",
    axisHint: "Cambiar de eje",
    canvas:
      "Terreno de JezzBall: toca una casilla para lanzar un muro según el eje activo",
    levelCleared: "¡Nivel {level} superado!",
    areaLine: "Superficie conquistada: {percent} %",
    percentBonus: "Bonus de superficie: +{percentBonus}",
    timeBonus: "Bonus de tiempo: +{timeBonus}",
    scoreLine: "Puntos: {score}",
    next: "Siguiente nivel",
    gameOver: "Fin de la partida",
    overHit: "Sin vidas: un átomo rompió tu muro.",
    overTime: "Sin vidas: se acabó el tiempo.",
    overStats: "Nivel {level} · {percent} % / {target} %",
    newBest: "¡Nuevo récord!",
    replay: "Jugar de nuevo",
    paused: "Pausa",
    resume: "Continuar"
  }
};

const RULES = {
  fr: `<p>Des atomes rebondissent dans le terrain. Construisez des murs pour les enfermer dans des zones de plus en plus petites.</p>
<ul>
<li>Touchez (ou cliquez) une case libre : un mur part dans les deux sens selon l'axe actif, une moitié rouge et une moitié bleue. Pendant qu'il grandit, vous pouvez lancer un 2e mur, mais il n'a qu'une seule moitié (dans le sens du swipe, sinon vers le mur le plus proche).</li>
<li>Changez d'axe (↔ / ↕) avec le gros bouton, un toucher à deux doigts, le clic droit, la molette ou la barre d'espace.</li>
<li>Option « Swipe » (activée par défaut, écran tactile) : glissez depuis une case libre, ← → pour un mur horizontal, ↑ ↓ pour un mur vertical. Un simple tap lance toujours le mur selon l'axe actif, quand le doigt se lève.</li>
<li>Chaque moitié se fige dès qu'elle touche un mur. Toute zone sans atome est alors conquise et noircie.</li>
<li>Si un atome touche une moitié encore en construction, elle se brise et vous perdez une vie. Si le temps s'écoule, vous perdez aussi une vie et le chrono repart.</li>
<li>Conquérez 75 % de la surface pour passer au niveau suivant. Bonus : chaque point au-delà de 75 % et chaque seconde restante.</li>
<li>Chaque niveau ajoute un atome et une vie (niveau 1 : 2 atomes, 2 vies). La partie s'arrête quand il ne reste plus de vies.</li>
</ul>`,
  en: `<p>Atoms bounce around the field. Build walls to trap them in smaller and smaller areas.</p>
<ul>
<li>Tap (or click) a free cell: a wall grows both ways along the active axis, one red half and one blue half. While it grows you can launch a 2nd wall, but it only has one half (in the swipe direction, otherwise toward the nearest wall).</li>
<li>Switch axis (↔ / ↕) with the big button, a two-finger tap, right click, the mouse wheel or the space bar.</li>
<li>"Swipe" option (on by default, touch screens): swipe from a free cell, ← → for a horizontal wall, ↑ ↓ for a vertical one. A plain tap still launches the wall along the active axis, when the finger lifts.</li>
<li>Each half sets as soon as it reaches a wall. Every area with no atom inside is then claimed and turns black.</li>
<li>If an atom touches a half still growing, it breaks and you lose a life. Running out of time also costs a life, and the clock restarts.</li>
<li>Claim 75% of the area to reach the next level. Bonus: every point above 75% and every second left.</li>
<li>Each level adds one atom and one life (level 1: 2 atoms, 2 lives). The game ends when no lives are left.</li>
</ul>`,
  es: `<p>Los átomos rebotan por el terreno. Construye muros para encerrarlos en zonas cada vez más pequeñas.</p>
<ul>
<li>Toca (o haz clic en) una casilla libre: un muro crece en ambos sentidos según el eje activo, una mitad roja y otra azul. Mientras crece puedes lanzar un 2.º muro, pero solo tiene una mitad (en el sentido del deslizamiento, si no hacia el muro más cercano).</li>
<li>Cambia de eje (↔ / ↕) con el botón grande, un toque con dos dedos, el clic derecho, la rueda del ratón o la barra espaciadora.</li>
<li>Opción «Deslizar» (activada por defecto, pantalla táctil): desliza desde una casilla libre, ← → para un muro horizontal, ↑ ↓ para uno vertical. Un toque simple sigue lanzando el muro según el eje activo, al levantar el dedo.</li>
<li>Cada mitad se fija en cuanto toca un muro. Toda zona sin átomos queda conquistada y se vuelve negra.</li>
<li>Si un átomo toca una mitad aún en construcción, se rompe y pierdes una vida. Si se acaba el tiempo, también pierdes una vida y el reloj vuelve a empezar.</li>
<li>Conquista el 75 % de la superficie para pasar al siguiente nivel. Bonus: cada punto por encima del 75 % y cada segundo restante.</li>
<li>Cada nivel añade un átomo y una vida (nivel 1: 2 átomos, 2 vidas). La partida termina cuando no quedan vidas.</li>
</ul>`
};

export function translate(lang, key, vars = {}) {
  const text = STRINGS[lang]?.[key] ?? STRINGS.fr[key] ?? key;
  return text.replace(/\{(\w+)\}/g, (_, name) => String(vars[name] ?? ""));
}

export const rulesHtml = (lang) => RULES[lang] || RULES.fr;
