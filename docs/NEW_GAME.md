# NEW GAME PLAYBOOK

Read this in full, with `docs/PLATFORM_RULES.md` and `shared/CONTRACT.md`,
before writing any code for a new game. Every new `custom` game starts from
the boilerplate below, so the Game Dashboard → in-game view flow, the
shared header, coins, score and best, resume, the bottom margin and the TV
remote work from the first commit. `npm run check` fails until a new game
follows the platform rules; a new game never goes in the check's baseline.

---

## 1. Checklist

1. **Pick the kind** (`docs/PLATFORM_RULES.md` section 1):
   - `wordpack`: add `public/data/<id>/<id>_words.json` (and optional
     `rules_<lang>.html`). Zero JS or CSS.
   - `custom`: create `public/games/<id>/`, HTML + CSS + native ES modules.
   - Never touch `hub.js`, `vite.config.js` or
     `scripts/check-games.baseline.json`.
2. **Pick the result model** (a design choice, not a `hub-config.json`
   field; `docs/PLATFORM_RULES.md` sections 4.3–4.4):
   - **High score** (Tetris, Simon, 2048, solo Yatzy): live score
     `<id>-score`, best `<id>-best-score`, `finish({ score })`.
   - **Win / loss** (one local player vs a bot or one online seat: Échecs,
     Jeu de dames, Belote): `finish({ won })`. No invented points.
   - **No individual result** (pass-and-play, party games): `finish({})`.
3. **Register it**:
   - one entry in `public/hub-config.json` (fields:
     `docs/PLATFORM_RULES.md` section 2), thumbnail inside the game's
     folder, subject centred (the hub crops it to a square);
   - one row in `docs/GAMES_MAP.md`;
   - a `NOTES.md` in the game's folder once the main file passes
     ~150–200 lines.
4. **Build from the boilerplate** (section 2). Keep files ≤ 300 lines and
   functions ≤ 30 lines: game logic goes in its own modules (`game.js`,
   `board.js`, pure rules in `rules.js` so they run in Node).
   `public/games/simon/` is a complete example of the same header, i18n,
   validated save, pause overlay and TV wiring (it predates the key names
   below).
5. **Verify** (`docs/PLATFORM_RULES.md` section 10): `npm run check`, then
   the browser at 360×640 (board 99% wide, section 6.3), 640×360, desktop, and `?tv=1` at 960×540,
   1920×1080 and 3840×2160 with arrows, Enter and Escape only; then a real
   phone.

Stop and ask instead of improvising if the game seems to need a new tag or
`kind`, a new shared dependency, an exception to a platform rule, or to a
size / `data-id` / FR-EN-ES rule.

---

## 2. `custom` boilerplate

Five files. Replace `<id>` with the game's id everywhere. Keep the shared
class names (`game-nav`, `back-button`, `options-button`, `options-panel*`,
`lang-btn`): `game-header.css` styles them and `npm run check` looks for the
`data-id`s.

### 2.1 `public/games/<id>/index.html`

```html
<!doctype html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1, viewport-fit=cover"
    />
    <title>Game Title</title>
    <link rel="stylesheet" href="/shared/css/base.css" />
    <link rel="stylesheet" href="/shared/css/game-header.css" />
    <link rel="stylesheet" href="style.css" />
    <script src="/shared/js/tv-remote.js"></script>
  </head>
  <body data-match-saved>
    <header class="game-nav">
      <div class="nav-side nav-left">
        <!-- Game Dashboard: back to the hub. Hidden during a match. -->
        <a
          class="back-button"
          href="/"
          data-id="game-back-button"
          data-tv-back
          aria-label="Retour"
          data-i18n-aria="back"
          ><svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M19 12H5M12 5l-7 7 7 7" /></svg
        ></a>
        <!-- In a match: back to the Game Dashboard, after game-session.js asks. -->
        <button
          type="button"
          class="back-button"
          data-id="<id>-quit-button"
          data-match-quit
          data-tv-back
          aria-label="Quitter la partie"
          data-i18n-aria="quit"
          hidden
        >
          <span aria-hidden="true">✕</span>
        </button>
      </div>
      <div class="nav-center"></div>
      <div class="nav-side nav-right">
        <button
          type="button"
          class="options-button"
          data-id="game-options-button"
          aria-label="Options"
          data-i18n-aria="options"
          aria-expanded="false"
          aria-controls="optionsPanel"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="3" />
            <path
              d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
            />
          </svg>
        </button>
      </div>
    </header>

    <div
      id="optionsPanel"
      class="options-panel"
      data-id="game-options-panel"
      hidden
    >
      <div class="options-panel-backdrop" data-options-close></div>
      <div class="options-panel-sheet" role="dialog" aria-modal="true">
        <div class="options-panel-header">
          <span class="options-panel-title" data-i18n="options">Options</span>
          <button
            type="button"
            class="options-panel-close"
            data-options-close
            data-id="<id>-options-close"
            aria-label="Fermer"
            data-i18n-aria="close"
          >
            ×
          </button>
        </div>
        <div class="options-panel-body">
          <div class="options-panel-section" data-id="game-options-language">
            <p class="options-panel-section-title" data-i18n="language">
              Langue
            </p>
            <div class="lang-selector">
              <button type="button" class="lang-btn" data-lang="fr" data-id="<id>-lang-fr">FR</button>
              <button type="button" class="lang-btn" data-lang="en" data-id="<id>-lang-en">EN</button>
              <button type="button" class="lang-btn" data-lang="es" data-id="<id>-lang-es">ES</button>
            </div>
          </div>
          <!-- Game-specific sections (sound, controls…) go here. -->
          <details class="options-panel-section" data-id="game-options-rules">
            <summary class="options-panel-section-title" data-i18n="rules">
              Règles
            </summary>
            <div
              class="rules-modal-content"
              data-id="<id>-rules-content"
              data-i18n="rulesBody"
            ></div>
          </details>
          <!-- "Report a problem" is appended here by initOptionsPanel. -->
        </div>
      </div>
    </div>

    <main class="game-shell" data-id="<id>-shell">
      <section
        class="game-screen"
        data-id="<id>-dashboard-screen"
        data-tv-screen
      >
        <div class="game-card">
          <h1 class="game-title" data-i18n="title">Game Title</h1>
          <!-- Only for a game with a score. -->
          <p class="game-best" data-id="<id>-best-score-row">
            <span data-i18n="best">Record</span> :
            <strong data-id="<id>-best-score">0</strong>
          </p>
          <button
            type="button"
            class="game-button"
            data-id="<id>-resume-button"
            data-tv-focus
            data-i18n="resume"
            hidden
          >
            Reprendre
          </button>
          <!-- Mode / difficulty choices, if any, go here. -->
          <button
            type="button"
            class="game-button"
            data-id="<id>-start-button"
            data-tv-focus
            data-i18n="newGame"
          >
            Nouvelle partie
          </button>
        </div>
      </section>

      <section
        class="game-screen"
        data-id="<id>-play-screen"
        data-tv-screen
        hidden
      >
        <div class="game-hud" data-id="<id>-hud">
          <span data-i18n="score">Score</span> :
          <strong data-id="<id>-score">0</strong>
        </div>
        <!-- The board's main control carries data-tv-focus. A board that
             moves its own cursor lists the arrows it keeps:
             data-tv-keys="left right up down". -->
        <div
          class="game-board"
          data-id="<id>-board"
          role="group"
          aria-label="Plateau"
          data-i18n-aria="board"
        ></div>
      </section>

      <section
        class="game-screen"
        data-id="<id>-gameover-screen"
        data-tv-screen
        hidden
      >
        <div class="game-card">
          <h2 class="game-title" data-i18n="gameOver">Partie terminée</h2>
          <p>
            <span data-i18n="score">Score</span> :
            <strong data-id="<id>-final-score">0</strong>
          </p>
          <p>
            <span data-i18n="best">Record</span> :
            <strong data-id="<id>-final-best-score">0</strong>
          </p>
          <button
            type="button"
            class="game-button"
            data-id="<id>-replay-button"
            data-tv-focus
            data-i18n="replay"
          >
            Rejouer
          </button>
          <button
            type="button"
            class="game-button"
            data-id="<id>-menu-button"
            data-tv-back
            data-i18n="menu"
          >
            Menu du jeu
          </button>
        </div>
      </section>
    </main>

    <script src="/shared/js/game-header.js"></script>
    <script src="/shared/js/game-session.js"></script>
    <script type="module" src="main.js"></script>
  </body>
</html>
```

### 2.2 `public/games/<id>/style.css`

```css
/* Mobile first: the base is a 360px-wide phone. Wider screens are added
   with min-width queries, short landscape phones with max-height. */
[hidden] {
  display: none !important;
}

body {
  display: flex;
  flex-direction: column;
  height: 100dvh;
  margin: 0;
  overscroll-behavior: none;
}

.game-nav {
  flex: 0 0 auto;
}

/* Android bars can cover the bottom even when the safe-area inset is 0. */
.game-shell {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  padding: 12px max(24px, env(safe-area-inset-right, 0px))
    max(40px, calc(env(safe-area-inset-bottom, 0px) + 24px))
    max(24px, env(safe-area-inset-left, 0px));
  font-size: max(1rem, 2.4dvh);
}

.game-screen {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1em;
}

.game-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.8em;
  width: min(100%, 24em);
  text-align: center;
}

.game-title {
  margin: 0;
  font-size: 1.8em;
}

.game-best {
  margin: 0;
}

.game-button {
  min-width: 10em;
  min-height: max(44px, 5.5dvh);
  padding: 0.4em 1.2em;
  border: none;
  border-radius: 0.6em;
  font: inherit;
  cursor: pointer;
}

/* Portrait: the board is 99% of the screen wide, past the 24px side
   strips (PLATFORM_RULES 6.3). Draw it to the board's full width. */
.game-board {
  flex: 1 1 auto;
  align-self: stretch;
  min-height: 0;
  margin-inline: calc(50% - 49.5vw);
  touch-action: none;
}

:focus-visible,
html.tv :focus {
  outline: max(3px, 0.4dvh) solid #ffcc00;
  outline-offset: max(2px, 0.3dvh);
}

/* Landscape: the board stays inside the margins. */
@media (orientation: landscape) {
  .game-board {
    margin-inline: 0;
  }
}

/* Landscape phones are ~360px tall. */
@media (orientation: landscape) and (max-height: 500px) {
  .game-shell {
    padding-top: 4px;
  }

  .game-screen,
  .game-card {
    gap: 0.4em;
  }
}

/* Desktop and TV, 960x540 up to 3840x2160: sizes follow the screen and
   everything stays 3% away from the edges (TV overscan). */
@media (min-width: 960px) and (min-height: 500px) {
  .game-nav {
    height: auto;
    padding: 3dvh max(3vw, env(safe-area-inset-right, 0px)) 1dvh
      max(3vw, env(safe-area-inset-left, 0px));
  }

  .back-button,
  .options-button {
    width: max(36px, 6dvh);
    height: max(36px, 6dvh);
    font-size: max(1rem, 3dvh);
  }

  .back-button svg,
  .options-button svg {
    width: 50%;
    height: 50%;
  }

  .game-shell {
    padding: 2dvh max(3vw, env(safe-area-inset-right, 0px)) max(40px, 4dvh)
      max(3vw, env(safe-area-inset-left, 0px));
  }

  .game-card {
    width: min(100%, 30em);
  }
}
```

### 2.3 `public/games/<id>/i18n.js`

```javascript
// Player-facing copy. Keys match the page's data-i18n / data-i18n-aria.
export const LANGS = ["fr", "en", "es"];

export const COPY = {
  fr: {
    title: "Titre du jeu",
    back: "Retour",
    quit: "Quitter la partie",
    options: "Options",
    close: "Fermer",
    language: "Langue",
    rules: "Règles",
    rulesBody: "Comment jouer…",
    best: "Record",
    score: "Score",
    board: "Plateau",
    resume: "Reprendre",
    newGame: "Nouvelle partie",
    gameOver: "Partie terminée",
    replay: "Rejouer",
    menu: "Menu du jeu"
  },
  en: {
    title: "Game title",
    back: "Back",
    quit: "Quit match",
    options: "Options",
    close: "Close",
    language: "Language",
    rules: "Rules",
    rulesBody: "How to play…",
    best: "Best",
    score: "Score",
    board: "Board",
    resume: "Resume",
    newGame: "New game",
    gameOver: "Game over",
    replay: "Play again",
    menu: "Game menu"
  },
  es: {
    title: "Título del juego",
    back: "Volver",
    quit: "Salir de la partida",
    options: "Opciones",
    close: "Cerrar",
    language: "Idioma",
    rules: "Reglas",
    rulesBody: "Cómo jugar…",
    best: "Récord",
    score: "Puntos",
    board: "Tablero",
    resume: "Reanudar",
    newGame: "Nueva partida",
    gameOver: "Partida terminada",
    replay: "Jugar otra vez",
    menu: "Menú del juego"
  }
};
```

### 2.4 `public/games/<id>/save.js`

```javascript
// The match in progress under one key, so leaving by any route and coming
// back resumes it. Everything read back is validated: a bad save is dropped.
const SAVE_KEY = "muchogames_<id>_save";
const BEST_KEY = "muchogames_<id>_best";
const VERSION = 1;

// Check every field the game stores, not only that it exists.
function isValidMatch(match) {
  return Number.isInteger(match?.score) && match.score >= 0;
}

export function loadMatch() {
  try {
    const data = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (data?.v === VERSION && isValidMatch(data.match)) return data.match;
    localStorage.removeItem(SAVE_KEY);
  } catch {
    // Unreadable save or storage unavailable: no match to resume.
  }
  return null;
}

export function storeMatch(match) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ v: VERSION, match }));
  } catch {
    // Storage full or unavailable: the match only lasts for this visit.
  }
}

export function clearMatch() {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    // Storage unavailable: nothing was saved.
  }
}

export function loadBest() {
  try {
    const best = Number(localStorage.getItem(BEST_KEY));
    return Number.isInteger(best) && best > 0 ? best : 0;
  } catch {
    return 0;
  }
}

export function storeBest(score) {
  if (score <= loadBest()) return;
  try {
    localStorage.setItem(BEST_KEY, String(score));
  } catch {
    // Storage unavailable: the record is not kept.
  }
}
```

### 2.5 `public/games/<id>/main.js`

```javascript
// Page shell: language, options panel, Game Dashboard / match / end
// screens, save and resume, score and best. Game logic lives in its own
// modules and calls render() and endMatch().
import { COPY, LANGS } from "./i18n.js";
import {
  clearMatch,
  loadBest,
  loadMatch,
  storeBest,
  storeMatch
} from "./save.js";

const GAME_ID = "<id>";
const LANG_KEY = "bergamots-lang";
const $ = (id) => document.querySelector(`[data-id="${id}"]`);

const page = { lang: readLang(), match: null, starting: false };

function readLang() {
  try {
    const saved = localStorage.getItem(LANG_KEY);
    return LANGS.includes(saved) ? saved : "fr";
  } catch {
    return "fr";
  }
}

function setLanguage(lang) {
  page.lang = lang;
  try {
    localStorage.setItem(LANG_KEY, lang);
  } catch {
    // Storage unavailable: the choice lasts for this visit.
  }
  applyLanguage();
}

function applyLanguage() {
  const copy = COPY[page.lang];
  document.documentElement.lang = page.lang;
  document.querySelectorAll("[data-i18n]").forEach((node) => {
    node.textContent = copy[node.dataset.i18n];
  });
  document.querySelectorAll("[data-i18n-aria]").forEach((node) => {
    node.setAttribute("aria-label", copy[node.dataset.i18nAria]);
  });
  document.querySelectorAll("[data-lang]").forEach((button) => {
    button.classList.toggle("active", button.dataset.lang === page.lang);
  });
}

function showScreen(name) {
  const playing = name === "play";
  $(`${GAME_ID}-dashboard-screen`).hidden = name !== "dashboard";
  $(`${GAME_ID}-play-screen`).hidden = !playing;
  $(`${GAME_ID}-gameover-screen`).hidden = name !== "gameover";
  $("game-back-button").hidden = playing;
  $(`${GAME_ID}-quit-button`).hidden = !playing;
  $(`${GAME_ID}-resume-button`).hidden = !loadMatch();
  $(`${GAME_ID}-best-score`).textContent = String(loadBest());
}

// Draws everything from page.match. After every move the game calls
// storeMatch(page.match), then render().
function render() {
  $(`${GAME_ID}-score`).textContent = String(page.match.score);
}

async function startMatch() {
  if (page.starting) return;
  window.MuchogamesTv?.play();
  page.starting = true;
  const allowed = await window.MuchogamesMatch.start(GAME_ID);
  page.starting = false;
  if (!allowed) return;
  // The whole match: board, deck order, turn, timers, chosen mode…
  page.match = { score: 0 };
  storeMatch(page.match);
  render();
  showScreen("play");
}

function resumeMatch() {
  page.match = loadMatch();
  if (!page.match) return showScreen("dashboard");
  window.MuchogamesTv?.play();
  window.MuchogamesMatch.resume(GAME_ID);
  render();
  // A real-time game comes back paused.
  showScreen("play");
}

function saveOnLeave() {
  if (page.match) storeMatch(page.match);
}

// Runs once game-session.js's "Leave match?" dialog is confirmed.
function quitMatch() {
  saveOnLeave();
  page.match = null;
  showScreen("dashboard");
}

// The match reached its end screen. `won`: true / false for one local
// player with a win or a loss; leave it out otherwise.
function endMatch(won) {
  if (!page.match) return;
  const { score } = page.match;
  page.match = null;
  clearMatch();
  storeBest(score);
  window.MuchogamesMatch.finish({ won, score });
  $(`${GAME_ID}-final-score`).textContent = String(score);
  $(`${GAME_ID}-final-best-score`).textContent = String(loadBest());
  showScreen("gameover");
}

function bindControls() {
  document.querySelectorAll("[data-lang]").forEach((button) => {
    button.addEventListener("click", () => setLanguage(button.dataset.lang));
  });
  $(`${GAME_ID}-start-button`).addEventListener("click", startMatch);
  $(`${GAME_ID}-replay-button`).addEventListener("click", startMatch);
  $(`${GAME_ID}-resume-button`).addEventListener("click", resumeMatch);
  $(`${GAME_ID}-quit-button`).addEventListener("click", quitMatch);
  $(`${GAME_ID}-menu-button`).addEventListener("click", () =>
    showScreen("dashboard")
  );
}

function bindPage() {
  window.GameHeader?.initOptionsPanel(
    $("game-options-button"),
    $("game-options-panel")
  );
  window.addEventListener("pagehide", saveOnLeave);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") saveOnLeave();
  });
}

bindControls();
bindPage();
applyLanguage();
showScreen("dashboard");
```
