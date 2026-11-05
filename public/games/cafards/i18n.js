// Player-facing copy (FR / EN / ES) -> window.CafardsI18n. Keys match the
// page's data-i18n / data-i18n-aria attributes. The language is shared by
// every game (bergamots-lang).
(function () {
  const LANGS = ["fr", "en", "es"];
  const LANG_KEY = "bergamots-lang";
  const COPY = {
    fr: {
      title: "Salade de Cafards",
      back: "Retour",
      quit: "Quitter la partie",
      options: "Options",
      close: "Fermer",
      language: "Langue",
      rulesTitle: "Règles",
      intro: "Réglez la partie, puis touchez la pile active pour révéler chaque carte.",
      players: "Joueurs",
      deck: "Cartes totales",
      winners: "Gagnants",
      timer: "Minuteur",
      lightOn: "Lumière rouge : oui",
      lightOff: "Lumière rouge : non",
      timerSeconds: "Secondes avant alerte",
      less: "Moins",
      more: "Plus",
      start: "Nouvelle partie",
      resume: "Reprendre",
      board: "Table de jeu",
      pileA: "Révéler une carte sur la pile A",
      pileB: "Révéler une carte sur la pile B",
      tapHere: "Touchez ici !",
      waitingTimer: "Minuteur en attente",
      timerOff: "Minuteur désactivé",
      alertIn: "Alerte dans {value} s",
      timeUp: "Temps dépassé",
      gameOver: "Partie terminée",
      playerName: "Joueur {n}",
      playerWins: "{player} a gagné !",
      collectBtn: "Faire ramasser {player} ({count} cartes en main)",
      replay: "Rejouer",
      menu: "Menu du jeu",
      setupError: "Démarrage impossible : {message}"
    },
    en: {
      title: "Cockroach Salad",
      back: "Back",
      quit: "Quit match",
      options: "Options",
      close: "Close",
      language: "Language",
      rulesTitle: "Rules",
      intro: "Set up the match, then tap the active pile to reveal each card.",
      players: "Players",
      deck: "Total cards",
      winners: "Winners",
      timer: "Timer",
      lightOn: "Red light: on",
      lightOff: "Red light: off",
      timerSeconds: "Seconds before alert",
      less: "Less",
      more: "More",
      start: "New game",
      resume: "Resume",
      board: "Game table",
      pileA: "Reveal a card on pile A",
      pileB: "Reveal a card on pile B",
      tapHere: "Tap here!",
      waitingTimer: "Timer waiting",
      timerOff: "Timer disabled",
      alertIn: "Alert in {value} s",
      timeUp: "Time is up",
      gameOver: "Game over",
      playerName: "Player {n}",
      playerWins: "{player} wins!",
      collectBtn: "Give the cards to {player} ({count} cards in hand)",
      replay: "Play again",
      menu: "Game menu",
      setupError: "Unable to start: {message}"
    },
    es: {
      title: "Ensalada de Cucarachas",
      back: "Volver",
      quit: "Salir de la partida",
      options: "Opciones",
      close: "Cerrar",
      language: "Idioma",
      rulesTitle: "Reglas",
      intro: "Configura la partida y toca la pila activa para revelar cada carta.",
      players: "Jugadores",
      deck: "Cartas totales",
      winners: "Ganadores",
      timer: "Temporizador",
      lightOn: "Luz roja: sí",
      lightOff: "Luz roja: no",
      timerSeconds: "Segundos antes de la alerta",
      less: "Menos",
      more: "Más",
      start: "Nueva partida",
      resume: "Reanudar",
      board: "Mesa de juego",
      pileA: "Revelar una carta en la pila A",
      pileB: "Revelar una carta en la pila B",
      tapHere: "¡Toca aquí!",
      waitingTimer: "Temporizador en espera",
      timerOff: "Temporizador desactivado",
      alertIn: "Alerta en {value} s",
      timeUp: "Tiempo agotado",
      gameOver: "Partida terminada",
      playerName: "Jugador {n}",
      playerWins: "¡{player} gana!",
      collectBtn: "Hacer que recoja {player} ({count} cartas en mano)",
      replay: "Jugar otra vez",
      menu: "Menú del juego",
      setupError: "No se puede iniciar: {message}"
    }
  };

  function readLanguage() {
    try {
      const stored = localStorage.getItem(LANG_KEY);
      return LANGS.includes(stored) ? stored : "fr";
    } catch {
      return "fr";
    }
  }

  function storeLanguage(lang) {
    try {
      localStorage.setItem(LANG_KEY, lang);
    } catch {
      // Storage unavailable: the choice lasts for this visit.
    }
  }

  function translate(lang, key, values = {}) {
    const text = (COPY[lang] && COPY[lang][key]) || COPY.fr[key] || key;
    return Object.entries(values).reduce(
      (out, [name, value]) => out.replace(`{${name}}`, value),
      text
    );
  }

  // Static copy of the page: [data-i18n] text, [data-i18n-aria] labels.
  function applyCopy(lang) {
    document.documentElement.lang = lang;
    document.querySelectorAll("[data-i18n]").forEach((node) => {
      node.textContent = translate(lang, node.dataset.i18n);
    });
    document.querySelectorAll("[data-i18n-aria]").forEach((node) => {
      node.setAttribute("aria-label", translate(lang, node.dataset.i18nAria));
    });
    document.querySelectorAll(".lang-btn").forEach((button) => {
      button.classList.toggle("active", button.dataset.lang === lang);
    });
  }

  window.CafardsI18n = { LANGS, readLanguage, storeLanguage, translate, applyCopy };
})();
