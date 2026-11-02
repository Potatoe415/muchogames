// Player-facing interface copy in FR/EN/ES. Tips, rules and fruit names
// live in copy.js.
import { FRUIT_NAMES, RULES, TIPS } from "./copy.js";

export const LANGS = ["fr", "en", "es"];

const STRINGS = {
  fr: {
    title: "Fusion de fruits",
    pitch: "Fais tomber les fruits, assemble les jumeaux et vise la pastèque !",
    back: "Retour",
    options: "Options",
    close: "Fermer",
    language: "Langue",
    sound: "Son",
    on: "Activé",
    off: "Désactivé",
    rules: "Règles",
    play: "Jouer",
    resume: "Reprendre",
    resumeInfo: "{score} points",
    howto: "Comment jouer",
    prev: "Page précédente",
    next: "Page suivante",
    ok: "OK",
    page: "Page {n} sur {total}",
    score: "Score",
    bestLine: "Record : {best}",
    nextFruits: "Prochains fruits",
    evolution: "Ordre des fruits",
    sweepLabel: "Balayer les petits fruits (restants : {n})",
    undoLabel: "Annuler le dernier fruit (restants : {n})",
    pause: "Pause",
    paused: "Pause",
    continue: "Continuer",
    menu: "Menu",
    canvas: "Plateau : glisse pour viser, lâche pour faire tomber le fruit",
    danger: "Attention, ça déborde !",
    endTitle: "Partie terminée",
    endScore: "{score} points",
    endTop: "Plus gros fruit : {fruit}",
    newBest: "Nouveau record ! 🎉",
    best: "Record : {best}",
    replay: "Rejouer"
  },
  en: {
    title: "Fruit Merge",
    pitch: "Drop the fruits, join the twins and aim for the watermelon!",
    back: "Back",
    options: "Options",
    close: "Close",
    language: "Language",
    sound: "Sound",
    on: "On",
    off: "Off",
    rules: "Rules",
    play: "Play",
    resume: "Resume",
    resumeInfo: "{score} points",
    howto: "How to play",
    prev: "Previous page",
    next: "Next page",
    ok: "OK",
    page: "Page {n} of {total}",
    score: "Score",
    bestLine: "Best: {best}",
    nextFruits: "Next fruits",
    evolution: "Fruit order",
    sweepLabel: "Sweep the small fruits ({n} left)",
    undoLabel: "Undo the last fruit ({n} left)",
    pause: "Pause",
    paused: "Paused",
    continue: "Continue",
    menu: "Menu",
    canvas: "Board: slide to aim, release to drop the fruit",
    danger: "Careful, it's overflowing!",
    endTitle: "Game over",
    endScore: "{score} points",
    endTop: "Biggest fruit: {fruit}",
    newBest: "New best! 🎉",
    best: "Best: {best}",
    replay: "Play again"
  },
  es: {
    title: "Fusión de frutas",
    pitch: "¡Deja caer las frutas, junta las gemelas y llega a la sandía!",
    back: "Volver",
    options: "Opciones",
    close: "Cerrar",
    language: "Idioma",
    sound: "Sonido",
    on: "Activado",
    off: "Desactivado",
    rules: "Reglas",
    play: "Jugar",
    resume: "Reanudar",
    resumeInfo: "{score} puntos",
    howto: "Cómo jugar",
    prev: "Página anterior",
    next: "Página siguiente",
    ok: "OK",
    page: "Página {n} de {total}",
    score: "Puntos",
    bestLine: "Récord: {best}",
    nextFruits: "Próximas frutas",
    evolution: "Orden de las frutas",
    sweepLabel: "Barrer las frutas pequeñas (restantes: {n})",
    undoLabel: "Deshacer la última fruta (restantes: {n})",
    pause: "Pausa",
    paused: "Pausa",
    continue: "Continuar",
    menu: "Menú",
    canvas: "Tablero: desliza para apuntar, suelta para dejar caer la fruta",
    danger: "¡Cuidado, se desborda!",
    endTitle: "Fin de la partida",
    endScore: "{score} puntos",
    endTop: "Fruta más grande: {fruit}",
    newBest: "¡Nuevo récord! 🎉",
    best: "Récord: {best}",
    replay: "Jugar otra vez"
  }
};

const fill = (text, vars = {}) =>
  text.replace(/\{(\w+)\}/g, (all, key) => String(vars[key] ?? all));

export function translate(lang, key, vars) {
  const text = STRINGS[lang]?.[key] ?? STRINGS.fr[key] ?? key;
  return fill(text, vars);
}

export const fruitName = (lang, level) =>
  (FRUIT_NAMES[lang] || FRUIT_NAMES.fr)[level];

export const tips = (lang) => TIPS[lang] || TIPS.fr;

export const rulesHtml = (lang) => RULES[lang] || RULES.fr;
