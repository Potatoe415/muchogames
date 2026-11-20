// Translates the build-time catalog footer (scripts/seo.mjs writes it in
// French so crawlers read the site's main language). Game titles stay as-is.
const COPY = {
  fr: {
    title: "Tous les jeux Muchogames",
    intro:
      "Jeux de société, de cartes, de soirée et d'arcade gratuits en ligne, sans inscription : échecs, belote, coinche, sudoku, quiz, Yams et plus encore."
  },
  en: {
    title: "All Muchogames games",
    intro:
      "Free online board, card, party and arcade games, no sign-up: chess, belote, coinche, sudoku, quizzes, Yahtzee-style dice and more."
  },
  es: {
    title: "Todos los juegos de Muchogames",
    intro:
      "Juegos de mesa, de cartas, de fiesta y arcade gratis en línea, sin registro: ajedrez, belote, coinche, sudoku, quiz, dados y mucho más."
  }
};

export function renderSeoFooter(lang) {
  const copy = COPY[lang] || COPY.fr;
  const title = document.querySelector('[data-id="hub-seo-title"]');
  const intro = document.querySelector('[data-id="hub-seo-intro"]');
  if (title) title.textContent = copy.title;
  if (intro) intro.textContent = copy.intro;
}
