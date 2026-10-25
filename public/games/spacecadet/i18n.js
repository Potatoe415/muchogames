// Player-facing copy in FR/EN/ES.
export const LANGS = ["fr", "en", "es"];

const STRINGS = {
  fr: {
    title: "Space Cadet",
    back: "Retour",
    options: "Options",
    close: "Fermer",
    language: "Langue",
    rules: "Règles",
    newGame: "F2 Nouvelle partie",
    pause: "Pause (F3)",
    tilt: "Tilt",
    leftFlip: "◄ Flip",
    plunge: "Lancer (maintenir)",
    rightFlip: "Flip ►",
    downloading: "Téléchargement…",
    exception: "Erreur, voir la console"
  },
  en: {
    title: "Space Cadet",
    back: "Back",
    options: "Options",
    close: "Close",
    language: "Language",
    rules: "Rules",
    newGame: "F2 New game",
    pause: "Pause (F3)",
    tilt: "Tilt",
    leftFlip: "◄ Flip",
    plunge: "Launch (hold)",
    rightFlip: "Flip ►",
    downloading: "Downloading…",
    exception: "Error, see the console"
  },
  es: {
    title: "Space Cadet",
    back: "Volver",
    options: "Opciones",
    close: "Cerrar",
    language: "Idioma",
    rules: "Reglas",
    newGame: "F2 Nueva partida",
    pause: "Pausa (F3)",
    tilt: "Tilt",
    leftFlip: "◄ Flipper",
    plunge: "Lanzar (mantener)",
    rightFlip: "Flipper ►",
    downloading: "Descargando…",
    exception: "Error, mira la consola"
  }
};

const RULES = {
  fr: `<p>Le flipper 3D Pinball: Space Cadet, version Windows, dans le navigateur.</p>
<ul>
<li>Nouvelle partie (F2), puis maintenez Lancer pour doser le ressort et envoyer la bille.</li>
<li>Flip gauche et Flip droit (aussi les moitiés gauche et droite du plateau) pour renvoyer la bille.</li>
<li>Tilt si la bille se coince. Pause (F3) arrête le jeu. Une partie coûte 1 pièce.</li>
</ul>`,
  en: `<p>The Windows 3D Pinball: Space Cadet table, in the browser.</p>
<ul>
<li>New game (F2), then hold Launch to charge the plunger and send the ball.</li>
<li>Left and right flippers (also the left and right halves of the table) send the ball back up.</li>
<li>Tilt if the ball is stuck. Pause (F3) stops the table. A match costs 1 coin.</li>
</ul>`,
  es: `<p>La mesa de 3D Pinball: Space Cadet de Windows, en el navegador.</p>
<ul>
<li>Nueva partida (F2) y luego mantén Lanzar para cargar el muelle y enviar la bola.</li>
<li>Los flippers izquierdo y derecho (también las mitades de la mesa) devuelven la bola.</li>
<li>Tilt si la bola se atasca. Pausa (F3) para la mesa. Una partida cuesta 1 moneda.</li>
</ul>`
};

export function translate(lang, key) {
  return STRINGS[lang]?.[key] ?? STRINGS.fr[key] ?? key;
}

export const rulesHtml = (lang) => RULES[lang] || RULES.fr;
