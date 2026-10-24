// Player-facing copy in FR/EN/ES.
export const LANGS = ["fr", "en", "es"];

const STRINGS = {
  fr: {
    title: "Pipe Dream",
    pitch:
      "Posez les tuyaux et guidez le Flooz le plus loin possible avant qu'il ne déborde !",
    best: "Record : {best}",
    play: "Jouer",
    back: "Retour",
    options: "Options",
    close: "Fermer",
    language: "Langue",
    rules: "Règles",
    sound: "Son",
    soundOn: "Activé",
    soundOff: "Coupé",
    score: "Score",
    level: "Niveau",
    quota: "Quota",
    countdown: "Flooz",
    fast: "Accélérer",
    canvas: "Grille de tuyaux : touchez une case pour poser le tuyau actif",
    levelCleared: "Niveau {level} réussi !",
    levelStats:
      "{filled} tuyaux remplis (quota {quota}) · {removed} inutilisés (−{penalty})",
    crosses: "Bonus croisements : {crosses}",
    scoreLine: "Score : {score}",
    next: "Niveau suivant",
    gameOver: "Partie terminée",
    overStats: "Niveau {level} · {filled}/{quota} tuyaux remplis",
    newBest: "Nouveau record !",
    replay: "Rejouer",
    paused: "Pause",
    resume: "Reprendre"
  },
  en: {
    title: "Pipe Dream",
    pitch: "Lay pipes and lead the Flooz as far as you can before it spills!",
    best: "Best: {best}",
    play: "Play",
    back: "Back",
    options: "Options",
    close: "Close",
    language: "Language",
    rules: "Rules",
    sound: "Sound",
    soundOn: "On",
    soundOff: "Off",
    score: "Score",
    level: "Level",
    quota: "Quota",
    countdown: "Flooz",
    fast: "Fast",
    canvas: "Pipe grid: tap a cell to lay the active pipe",
    levelCleared: "Level {level} cleared!",
    levelStats:
      "{filled} pipes filled (quota {quota}) · {removed} unused (−{penalty})",
    crosses: "Cross bonuses: {crosses}",
    scoreLine: "Score: {score}",
    next: "Next level",
    gameOver: "Game over",
    overStats: "Level {level} · {filled}/{quota} pipes filled",
    newBest: "New record!",
    replay: "Play again",
    paused: "Paused",
    resume: "Resume"
  },
  es: {
    title: "Pipe Dream",
    pitch:
      "¡Coloca tuberías y lleva el Flooz lo más lejos posible antes de que se derrame!",
    best: "Récord: {best}",
    play: "Jugar",
    back: "Volver",
    options: "Opciones",
    close: "Cerrar",
    language: "Idioma",
    rules: "Reglas",
    sound: "Sonido",
    soundOn: "Activado",
    soundOff: "Silenciado",
    score: "Puntos",
    level: "Nivel",
    quota: "Cuota",
    countdown: "Flooz",
    fast: "Acelerar",
    canvas:
      "Cuadrícula de tuberías: toca una casilla para colocar la tubería activa",
    levelCleared: "¡Nivel {level} superado!",
    levelStats:
      "{filled} tuberías llenas (cuota {quota}) · {removed} sin usar (−{penalty})",
    crosses: "Bonus de cruces: {crosses}",
    scoreLine: "Puntos: {score}",
    next: "Siguiente nivel",
    gameOver: "Fin de la partida",
    overStats: "Nivel {level} · {filled}/{quota} tuberías llenas",
    newBest: "¡Nuevo récord!",
    replay: "Jugar de nuevo",
    paused: "Pausa",
    resume: "Continuar"
  }
};

const RULES = {
  fr: `<p>Le Flooz sort du réservoir à la fin du compte à rebours. Construisez-lui un chemin !</p>
<ul>
<li>Touchez une case pour y poser le tuyau actif (encadré en jaune dans la file).</li>
<li>Toucher un tuyau encore vide le remplace : −50 points et la case est bloquée un court instant. Un tuyau déjà rempli ne peut plus être changé.</li>
<li>Chaque tuyau traversé rapporte 50 points. Traverser un croisement dans les deux sens rapporte 500 points de bonus.</li>
<li>Quand le Flooz déborde, il faut avoir atteint le quota de tuyaux remplis, sinon la partie est terminée.</li>
<li>Niveau réussi : chaque tuyau posé mais inutilisé coûte 100 points.</li>
<li>Le bouton » (ou la barre d'espace) accélère le Flooz quand votre tracé est fini.</li>
<li>À chaque niveau, le Flooz part plus tôt et coule plus vite, et le quota augmente. Des rochers apparaissent à partir du niveau 3.</li>
</ul>`,
  en: `<p>The Flooz leaves the tank when the countdown ends. Build it a path!</p>
<ul>
<li>Tap a cell to lay the active pipe (outlined in yellow in the queue).</li>
<li>Tapping a pipe that is still empty replaces it: −50 points and the cell is locked for a moment. A filled pipe can no longer be changed.</li>
<li>Every pipe crossed scores 50 points. Crossing a cross pipe both ways scores a 500-point bonus.</li>
<li>When the Flooz spills, you must have reached the quota of filled pipes, otherwise the game is over.</li>
<li>Level cleared: every pipe laid but left unused costs 100 points.</li>
<li>The » button (or the space bar) speeds up the Flooz once your path is done.</li>
<li>Each level the Flooz starts sooner and flows faster, and the quota goes up. Rocks appear from level 3.</li>
</ul>`,
  es: `<p>El Flooz sale del depósito al terminar la cuenta atrás. ¡Constrúyele un camino!</p>
<ul>
<li>Toca una casilla para colocar la tubería activa (recuadrada en amarillo en la cola).</li>
<li>Tocar una tubería aún vacía la reemplaza: −50 puntos y la casilla queda bloqueada un instante. Una tubería llena ya no se puede cambiar.</li>
<li>Cada tubería recorrida da 50 puntos. Recorrer un cruce en ambos sentidos da 500 puntos de bonus.</li>
<li>Cuando el Flooz se derrama, debes haber alcanzado la cuota de tuberías llenas; si no, la partida termina.</li>
<li>Nivel superado: cada tubería colocada sin usar cuesta 100 puntos.</li>
<li>El botón » (o la barra espaciadora) acelera el Flooz cuando tu recorrido está listo.</li>
<li>En cada nivel el Flooz sale antes y corre más rápido, y la cuota sube. Aparecen rocas a partir del nivel 3.</li>
</ul>`
};

export function translate(lang, key, vars = {}) {
  const text = STRINGS[lang]?.[key] ?? STRINGS.fr[key] ?? key;
  return text.replace(/\{(\w+)\}/g, (_, name) => String(vars[name] ?? ""));
}

export const rulesHtml = (lang) => RULES[lang] || RULES.fr;
