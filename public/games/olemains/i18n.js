/**
 * Player-facing copy (FR / EN / ES). Keys match the page's data-i18n and
 * data-i18n-aria attributes. The language is shared by every game
 * (bergamots-lang).
 */

export const LANGS = ['fr', 'en', 'es'];
const LANG_KEY = 'bergamots-lang';

export const COPY = {
  fr: {
    title: 'Jeu de mains',
    back: 'Retour',
    quit: 'Quitter la partie',
    options: 'Options',
    close: 'Fermer',
    language: 'Langue',
    rules: 'Règles',
    timerLabel: 'Temps de jeu (secondes)',
    timerLess: 'Moins de temps',
    timerMore: 'Plus de temps',
    deckLabel: 'Choisis ton thème',
    newGame: 'Nouvelle partie',
    resume: 'Reprendre',
    resumeInfo: '{deck} · {seconds} s · {score} pts',
    timeLeft: 'Temps restant',
    score: 'Score',
    ready: 'Prêt ?',
    pass: 'Passer',
    found: 'Trouvé',
    paused: 'En pause',
    continue: 'Continuer',
    deckEmpty: 'Fin du paquet !',
    timeUp: 'Temps écoulé !',
    finalScore: '{score} pts',
    replay: 'Rejouer',
    menu: 'Menu du jeu',
    error: 'Erreur : {message}'
  },
  en: {
    title: 'Hands game',
    back: 'Back',
    quit: 'Quit match',
    options: 'Options',
    close: 'Close',
    language: 'Language',
    rules: 'Rules',
    timerLabel: 'Play time (seconds)',
    timerLess: 'Less time',
    timerMore: 'More time',
    deckLabel: 'Pick a theme',
    newGame: 'New game',
    resume: 'Resume',
    resumeInfo: '{deck} · {seconds}s left · {score} pts',
    timeLeft: 'Time left',
    score: 'Score',
    ready: 'Ready?',
    pass: 'Skip',
    found: 'Got it',
    paused: 'Paused',
    continue: 'Continue',
    deckEmpty: 'Deck finished!',
    timeUp: "Time's up!",
    finalScore: '{score} pts',
    replay: 'Play again',
    menu: 'Game menu',
    error: 'Error: {message}'
  },
  es: {
    title: 'Juego de manos',
    back: 'Volver',
    quit: 'Salir de la partida',
    options: 'Opciones',
    close: 'Cerrar',
    language: 'Idioma',
    rules: 'Reglas',
    timerLabel: 'Tiempo de juego (segundos)',
    timerLess: 'Menos tiempo',
    timerMore: 'Más tiempo',
    deckLabel: 'Elige un tema',
    newGame: 'Nueva partida',
    resume: 'Reanudar',
    resumeInfo: '{deck} · {seconds} s · {score} pts',
    timeLeft: 'Tiempo restante',
    score: 'Puntos',
    ready: '¿Listo?',
    pass: 'Pasar',
    found: 'Acertado',
    paused: 'En pausa',
    continue: 'Continuar',
    deckEmpty: '¡Se acabó el mazo!',
    timeUp: '¡Se acabó el tiempo!',
    finalScore: '{score} pts',
    replay: 'Jugar otra vez',
    menu: 'Menú del juego',
    error: 'Error: {message}'
  }
};

export function readLanguage() {
  try {
    const stored = localStorage.getItem(LANG_KEY);
    return LANGS.includes(stored) ? stored : 'fr';
  } catch {
    return 'fr';
  }
}

export function storeLanguage(language) {
  try {
    localStorage.setItem(LANG_KEY, language);
  } catch {
    // Storage unavailable: the choice lasts for this visit.
  }
}

export function translate(language, key, values = {}) {
  const text = (COPY[language] || COPY.fr)[key] ?? COPY.fr[key] ?? key;
  return Object.entries(values).reduce(
    (out, [name, value]) => out.replace(`{${name}}`, value),
    text
  );
}

// Static copy of the page: [data-i18n] text, [data-i18n-aria] labels.
export function applyCopy(language) {
  document.documentElement.lang = language;
  document.querySelectorAll('[data-i18n]').forEach((node) => {
    node.textContent = translate(language, node.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-aria]').forEach((node) => {
    node.setAttribute('aria-label', translate(language, node.dataset.i18nAria));
  });
  document.querySelectorAll('.lang-btn').forEach((button) => {
    button.classList.toggle('active', button.dataset.lang === language);
  });
}
