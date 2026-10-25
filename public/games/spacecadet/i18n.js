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
    sound: "Son",
    soundOn: "Son : activé",
    soundOff: "Son : coupé",
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
    sound: "Sound",
    soundOn: "Sound: on",
    soundOff: "Sound: off",
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
    sound: "Sonido",
    soundOn: "Sonido: activado",
    soundOff: "Sonido: desactivado",
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
<li>Sur ordinateur : clic gauche et clic droit pour les flips. Maintiens Espace ou Lancer pour envoyer la bille.</li>
<li>Sur téléphone : le plateau est en plein écran, le score sur une ligne en haut. Touche à gauche, touche à droite. Maintiens le lanceur en bas à droite.</li>
<li>Nouvelle partie (F2), pause (F3) et tilt sont dans Options sur téléphone. Une partie coûte 1 pièce.</li>
</ul>`,
  en: `<p>The Windows 3D Pinball: Space Cadet table, in the browser.</p>
<ul>
<li>On a computer, left click and right click are the flippers. Hold Space or Launch to send the ball.</li>
<li>On a phone, the table is full screen with the score on one line at the top. Touch the left half and the right half. Hold the plunger at the bottom right.</li>
<li>New game (F2), pause (F3) and tilt are in Options on a phone. A match costs 1 coin.</li>
</ul>`,
  es: `<p>La mesa de 3D Pinball: Space Cadet de Windows, en el navegador.</p>
<ul>
<li>En el ordenador, clic izquierdo y clic derecho son los flippers. Mantén Espacio o Lanzar para enviar la bola.</li>
<li>En el teléfono, la mesa ocupa toda la pantalla y el marcador es una línea arriba. Toca la mitad izquierda y la derecha. Mantén el lanzador abajo a la derecha.</li>
<li>Nueva partida (F2), pausa (F3) y tilt están en Opciones en el teléfono. Una partida cuesta 1 moneda.</li>
</ul>`
};

export function translate(lang, key) {
  return STRINGS[lang]?.[key] ?? STRINGS.fr[key] ?? key;
}

export const rulesHtml = (lang) => RULES[lang] || RULES.fr;
