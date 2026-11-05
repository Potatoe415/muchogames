# PLATFORM RULES — the common base of every game

Every game on Muchogames obeys this contract: the in-repo games
(`public/games/*`, the wordpack shell), the colocated apps (`apps/coinchapp`,
`apps/tranquil`) and every future game. How to build one: `docs/NEW_GAME.md`.
Shared APIs: `shared/CONTRACT.md`.

- **Stop and ask**: if a rule cannot be met for a technical or design
  reason, stop and ask the owner. No silent exception.
- **Automated gate**: `npm run check` runs `scripts/check-games.mjs`, which
  enforces every rule marked **[verified: `<rule>`]** (`<rule>` is the name
  it prints on failure).
- **Baseline**: known gaps of existing games live in
  `scripts/check-games.baseline.json`. That list only shrinks. A new game is
  never added to it.
- **Existing games**: rules marked *(new games)* bind every game added after
  decision 0061 (2026-11-05; Piou, added that morning, is an existing game).
  Existing games are brought to them one by one
  (`docs/BACKLOG.md`) and keep their current `localStorage` keys: renaming
  a key wipes the players' saves and records.

---

## 1. Game types (`kind`)

Three kinds only. A fourth needs the owner's approval first.

| `kind` | Where the code lives | What a new game adds |
|---|---|---|
| `wordpack` | Shared engine (`wordplayer.js`) | One JSON file under `public/data/<id>/`, zero code |
| `custom` | `public/games/<id>/` | A self-contained page: HTML, CSS, native ES modules |
| `external` | Another deployment, or `apps/<name>` | A link only, or a colocated app |

- Neither `wordpack` nor `custom` changes `hub.js` or `vite.config.js`.
- A game's assets and data live only in `public/games/<id>/` or
  `public/data/<id>/`.

## 2. Catalog (`public/hub-config.json`)

One entry per game:

- `id`: kebab-case, equal to the folder name. The API accepts
  `^[a-z0-9-]{1,64}$`.
- `title`, `kind`, `launch`, `thumbnail`.
- `tags`: one or more of `cartes`, `soiree`, `mots`, `reflexion`, `arcade`,
  `quiz` (`hub-taxonomy.js`). A new tag is a product decision: ask first.
  **[verified: `catalog-tags`]**
- `added`: `YYYY-MM-DD`, the day the game joins the catalog. Drives the
  hub's "newest" order; the same day keeps catalog order.
- `players`: `[min, max]` human players (bots do not count), integers,
  `1 <= min <= max`. **[verified: `catalog-players`]**
- `duration`: typical minutes, integer > 0. ≤ 5 is Quick, ≤ 20 Medium,
  more is Long. **[verified: `catalog-duration`]**
- `wordpack` also has `data` (path to its JSON) and `engine`
  (e.g. `"wordplayer"`).
- `external` also has one of:
  - `"source"`: its colocated folder (`apps/coinchapp`, `apps/tranquil`);
  - `"coinPolicy": "launch"`: its code is not in this repo (section 4.2).
    **[verified: `external-needs-coin-policy-or-source`]**
  - `"coinPolicy": "launch"` is for `external` only.
    **[verified: `coin-policy-launch-is-external-only`]**
- Optional:
  - `"endless": true` only for a game with no end screen at all (Black
    Stories: riddles until you leave).
  - `"resumable": false` only for a game that truly cannot save a match.
    Ask first and explain why in its `NOTES.md` (section 5).
- `thumbnail`: any web format (`.jpg`, `.png`, `.svg`, `.webp`), inside the
  game's folder. The hub crops it to a square (`object-fit: cover`,
  `hub-home.css`): keep the subject centred.

## 3. Navigation chrome and the two views

### 3.1 Shared header

- In-repo games load `/shared/css/game-header.css`
  **[verified: `loads-game-header-css`]** and `/shared/js/game-header.js`
  **[verified: `loads-game-header-js`]**. They load `/shared/css/base.css`
  too, unless the game deliberately skins everything (`millionaire`,
  `cafards` opt out).
- **Back button**, top-left, `data-id="game-back-button"`
  **[verified: `has-game-back-button`]**. From the Game Dashboard it returns
  to the hub. During a match it first asks "Quitter la partie ?" (FR/EN/ES);
  `game-session.js` does that for any element with this `data-id`.
- **Options button**, top-right gear, always visible,
  `data-id="game-options-button"` **[verified: `has-game-options-button`]**,
  opening one panel `data-id="game-options-panel"`
  **[verified: `has-game-options-panel`]**, wired with
  `GameHeader.initOptionsPanel(button, panel)`
  **[verified: `wires-options-panel`]**.
- A game may recolor both buttons, never move or replace them.
- `<body>` carries `data-match-saved` **[verified: `marks-match-saved`]**,
  so the quit dialog says the match is saved. Skipped for
  `"resumable": false`.
- Colocated apps reproduce the same placement, `data-id`s and panel
  content in their own stack
  **[verified: `has-game-back-button`, `has-game-options-button`]**.

### 3.2 View 1 — Game Dashboard *(new games)*

Opening a game from the hub lands on its Game Dashboard, never straight in
a match. Top-left the back button, top-right the options button. Its body,
top to bottom:

1. Game title or visual header.
2. Personal best, `data-id="<id>-best-score"`, for a solo game with a
   score (section 4.3).
3. **Resume** button, `data-id="<id>-resume-button"` (or
   `<id>-continue-button` when the first one is already a pause overlay's),
   above every new-match control, shown whenever a saved match exists.
4. Mode or difficulty choices, if any, and the **New game** button,
   `data-id="<id>-start-button"`.

### 3.3 View 2 — In-game view

- Top-left, either:
  - the back button (asks, then returns to the hub); or
  - a ✖ carrying `data-match-quit` that returns to the Game Dashboard.
    `game-session.js` shows the same "Leave match?" dialog, then clicks the
    control again: the game's own click handler shows the dashboard. The
    game writes no dialog of its own.
- Leaving is not an end: the save stays, `finish()` is not called, and the
  dashboard now shows Resume (section 5).
- Top-right, the same options button.

### 3.4 Options panel order

`GameHeader.initOptionsPanel` is the only way to open it. Top to bottom:

1. Language FR / EN / ES, `data-id="game-options-language"`
   **[verified: `has-game-options-language`]**.
2. Game-specific options, if any: sound, controls, new game…
3. Rules: always the last section the game writes itself (decision 0050).
   A **closed** `<details class="options-panel-section"
   data-id="game-options-rules">` (no `open` attribute) whose
   `<summary class="options-panel-section-title">` is the "Règles" title
   (decision 0053) **[verified: `has-game-options-rules`, `rules-collapsed`]**.
   `game-header.css` styles the chevron.
4. "Report a problem": appended by `initOptionsPanel` to the panel's
   `.options-panel-body`. Never hardcode it.

## 4. Match lifecycle, coins, score, statistics

### 4.1 Match API (`/shared/js/game-session.js`)

A **match** is one playthrough with a start and an end: a Yatzy game, a
Millionaire run, a Taboo session started from its start button. Opening a
game, reading its rules or changing settings is not a match.

In-repo games load `/shared/js/game-session.js`
**[verified: `loads-game-session-js`]** and call:

- `await MuchogamesMatch.start(gameId)` when a match starts, including
  "play again" **[verified: `starts-match`]**. `false` means out of coins:
  the shared dialog is already shown, stay on the Game Dashboard.
- `MuchogamesMatch.resume(gameId)` when the dashboard resumes a saved match
  **[verified: `resumes-match`]**. No coin, not counted again. Not checked
  for `"resumable": false`.
- `MuchogamesMatch.finish({ won, score })` when the match reaches its real
  end screen **[verified: `finishes-match`]**. At most once per match.
  Never on leaving. Not called (nor checked) for `"endless": true`.
- Colocated apps call the SQL function `start_muchogames_match` from their
  server when a match starts **[verified: `starts-match`]**, and report
  results through their profile sync.

### 4.2 Coins

- 20 coins a day, back to 20 at midnight Europe/Paris. Admins are
  unlimited.
- **Opening a game is free. Starting a match costs 1 coin**, every match,
  including "play again". `start()` (or `start_muchogames_match`) spends
  it, never the hub tile.
- Online: each human player pays once, when the match really starts (all
  seats filled). Creating a room, waiting, reloading or resuming a seat is
  free. A rematch is a new match: every human pays again.
- Out of coins: the match does not start; the shared dialog says "Vous
  n'avez plus de pièces pour aujourd'hui. Revenez demain !".
- One counter per player, shared by every game: signed-in players by
  profile id, anonymous ones by the random device id the hub creates and
  forwards to colocated apps. Both live server-side.
- A server or network failure lets the match start.
- Exception: games whose code is not in this repo cannot report a match
  start. They declare `"coinPolicy": "launch"` and the hub charges the coin
  when the tile is opened. Today: `gameboy-web`.

### 4.3 Solo score and personal best *(new games)*

- A solo game whose performance can be measured — arcade, survival,
  high-score, point-based puzzle or dice games (Tetris, Simon, 2048, Fusion
  de fruits, SkiFree, Fruit Slash, Pipe Dream, JezzBall, solo
  Yatzy) — must:
  1. show the current score during play, `data-id="<id>-score"`;
  2. keep the all-time best in `localStorage` under its own key,
     `muchogames_<id>_best` (one key per level, `muchogames_<id>_best_<level>`,
     when levels are scored apart), never inside the match save;
  3. show it on the Game Dashboard (`data-id="<id>-best-score"`) and on the
     end screen (`data-id="<id>-final-best-score"`; `data-id`s are unique
     per page);
  4. pass the integer score (≥ 0) to `finish({ score })`, or
     `finish({ won, score })` when the game also has a win target.
- Today `finish` forwards the score to the shared profile only together
  with `won`; a score alone stays local (the personal best).
- No invented points for games whose rules are win/lose or contract-based:
  Millionaire, trick-taking and shedding card games (Belote, Coinche,
  Bridge, Président, Bataille corse), board duels (Échecs, Jeu de dames),
  party games.
- Exceptions (owner, 2026-11-05):
  - Timed games where lower is better (Démineur, Sudoku) keep a best
    *time* per level, shown on the Game Dashboard, and pass no `score`.
  - Level-based games scored per level (Chip's Challenge) keep their
    per-level scores; the dashboard shows the total, the end card the
    level's best.
  - Space Cadet shows no best and passes no `score`: its engine draws the
    score as pixels only (`vendor/` is not modified).

### 4.4 Won / lost statistics

- **Matches started**: counted by every successful `start()`.
- **Won / lost**: pass `won: true | false` only when there is **one
  unambiguous local player** (solo vs a bot, or one seat online) **and** a
  win/lose outcome.
- Omit `won`:
  - in pure high-score games where every run ends in game over (Tetris,
    Simon);
  - when several players share one device (Yatzy local 2-player, Pyramide
    teams);
  - in party games with no individual winner, which record "started" only:
    Taboo, Dessiner c'est gagné, Téléphone bizarre, Dictionnaire, Black
    Stories, Jeu de mains, Salade de Cafards, Pyramide.
- `/profile` shows started / won / lost per game; `/admin` ranks games by
  matches started.

## 5. Leaving never loses the match

Leaving a match by any route — back button, ✖, reload, closed tab, the
phone killing the browser — and opening the game again brings the match
back **exactly** where it was (decision 0054).

- **When to save**: at match start, after every move, on `pagehide` and
  `visibilitychange`; real-time games also about once a second.
- **What to save**: everything the player would notice, under one
  game-scoped key (`muchogames_<id>_save` for new games): board, deck
  order, hands, score, turn, phase, timers, lives, undo history, robot
  memory, a locked answer, the chosen mode or difficulty.
- **Reading it back**: validate every field; drop a save that does not
  pass. Unavailable or full storage never breaks the game.
- **Resume**: never reopen the match by itself. The Game Dashboard shows
  Resume (section 3.2), which calls `resume()`. A real-time game comes back
  paused.
- **Deleting the save**: only when the match really ends (end screen, then
  `finish()`), or when a new match replaces it.
- **Online**: leaving keeps the seat and the room (`online-room.js`). The
  opponent sees the player is away; Resume reclaims the seat.
- **`"resumable": false`**: today only Space Cadet (prebuilt pinball engine
  with no state export), explained in its `NOTES.md`.

## 6. Screens, mobile first, system bars

Every game plays fully on phone, tablet and desktop (decision 0053) and on
a TV (section 7).

### 6.1 Layout

- **Mobile first**: the base CSS is a 360px-wide phone. Tablet, desktop and
  TV are added with `min-width` media queries, never `max-width`. Short
  landscape phones may get a `max-height` query.
- Works from 320px wide up to a 4K TV (3840×2160), portrait and landscape
  on phones and tablets.
- **Never ask to rotate**: a landscape phone is ~360px tall; the board and
  controls still fit (e.g. controls move beside the board).
- **No page scroll during play, no horizontal scroll from 320px.** Fix the
  overflow (`max-width: 100%`, `flex-wrap`, `minmax(0, 1fr)`); never hide
  it with `overflow: hidden` on the page.
- Viewport meta
  `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`
  **[verified: `has-mobile-viewport`]**.
- Full-height layouts use `dvh`, never `vh` (decision 0060)
  **[verified: `uses-dynamic-viewport`]**.
- Drag or swipe gameplay sets `overscroll-behavior: none` and
  `touch-action: none` (or `manipulation`) on the play area, so a gesture
  never reloads, scrolls or navigates back.

### 6.2 Bottom and side margins *(new games)*

Android navigation bars (3 buttons or gesture pill) can cover the bottom
of the page even when `env(safe-area-inset-bottom)` reports 0. The game's
main container always keeps:

```css
padding-bottom: max(40px, calc(env(safe-area-inset-bottom, 0px) + 24px));
padding-left: max(24px, env(safe-area-inset-left, 0px));
padding-right: max(24px, env(safe-area-inset-right, 0px));
```

- No essential button, card in hand, control or swipe gesture in the
  bottom 40px of the screen, nor in the 24px along its left and right
  edges (the system's home and back gestures).
- The shared header and options panel already respect the safe areas.
- Verify on a real phone in both orientations: DevTools device mode does
  not show the system bars.

## 7. TV (1080p, 4K)

A TV browser (Google TV / Android TV, Fire TV, Tizen, webOS) played from
the couch with the remote (decision 0059). Required for every game added
from 2026-11-02; existing games are brought to it one by one by the owner.

- **Fill the screen** at every size TV browsers report: 960×540, 1280×720,
  1920×1080, 3840×2160 CSS px. No page scroll during a match, no small
  island in the middle of a 4K screen. Sizes grow with the screen
  (`clamp()` or `max()` with `vmin` / `dvh`, or a fixed 1920×1080 canvas
  zoomed to the viewport like Millionaire's `tv.js`). No fixed `max-width`
  that leaves most of a TV empty, and no `rem` cap on font sizes.
- **Readable from 3 m**: body text ≥ ~2.2% of the screen height (24px on a
  1080px-tall viewport), controls ≥ ~5% of it.
- **Overscan**: text and controls ≥ 3% from all four edges.
- **Sharp at 4K**: SVG, CSS, or images at least 2× their displayed size.
- **Remote only**: every action works with the arrows, OK (Enter) and Back
  (Escape) alone: no Tab, no hover, no typing required (a name field stays
  optional). Arrows move the focus to the nearest control, Back closes the
  open dialog or panel.
- The focus is always on a control, shown by a thick, high-contrast ring
  (`html.tv :focus`); a new screen puts it on its main button.
- Android TV browsers may navigate back instead of sending Back to the
  page: fine, the match is saved (section 5).
- **Shared script**: load `/shared/js/tv-remote.js` in `<head>`
  (`window.MuchogamesTv`), driven by `data-tv-screen`, `data-tv-overlay`,
  `data-tv-focus`, `data-tv-back` and `data-tv-keys` (`shared/CONTRACT.md`).
  Call `MuchogamesTv.play()` in the click that starts or resumes a match,
  before any `await`: it asks for fullscreen and a screen wake lock
  (refusals ignored). Millionaire uses it too and keeps only its zoomed
  layout in its own `tv.js`.
- TV behaviour turns on from `?tv=1` (`?tv=0` off, remembered per game) or
  a TV user agent. The layout never depends on it: it follows the screen
  size.
- Not statically checkable: verify in the browser at 960×540, 1920×1080
  and 3840×2160 with the keyboard arrows, Enter and Escape only, then on a
  real TV.

## 8. Input: touch, mouse, keyboard

Every action works with all three.

- Nothing relies on hover alone.
- No action needs right-click, double-click or a long press as its only
  way.
- Every drag also works with two taps: the piece, then the target.
- Keyboard: every control reachable with Tab and a visible focus ring,
  Enter / Space activates, Escape closes the open panel or dialog. Board
  and movement games also take the arrow keys.

## 9. Copy, privacy, URLs, wordpacks, online rooms

- **Copy**: every player-facing string in FR, EN and ES, from JSON or a
  data module, never hardcoded in one language. The chosen language is
  shared by every game (`bergamots-lang`). Code, identifiers, comments and
  docs stay in English (`AGENTS.md`).
- **Privacy**: no mandatory account, no identity beyond what
  `player-profile.js` offers (optional name, prefilled from `?name=`; the
  avatar stays inside Muchogames). Every game plays signed out. No global
  leaderboard, friend list or per-player match history.
- **URLs**: no `*.vercel.app` URL in code **[verified: `url`]**. In-repo
  links are relative; the hub's absolute URL is
  `https://www.muchogames.win/`. A game is launched only from its
  `public/hub-config.json` entry.
- **Wordpacks**: `public/data/<id>/<id>_words.json` with `gameId` (= `<id>`),
  `title`, `controls` (e.g. `["next"]` or `["pass", "validate"]`) and
  `words[]` (schema: `docs/DATA_MODEL.md`). Read-only on the client.
  Optional rules at `/data/<id>/rules_<lang>.html`, loaded with
  `loadRulesIfExists`.
- **Online rooms** (`online-room.js`): two seats, a 3-letter code, one
  opaque JSON state ≤ 64 KB that the game validates on receipt. The game's
  id goes in `ROOM_GAMES` (`api/_lib/rooms.js`). Each human pays once at
  the real start (`chargeOnce`). Leaving keeps the seat. The anonymous
  device id is forwarded only to colocated apps (`source`), never to
  external deployments.

## 10. Before calling a game done

1. `npm run check` passes (lint, format, the **[verified]** rules above,
   build).
2. In the browser (`npm run dev`):
   - phone portrait (360×640) and landscape (640×360): nothing in the
     bottom 40px, no scroll;
   - desktop: mouse, then keyboard only (Tab, Enter, Space, Escape,
     arrows);
   - TV (`?tv=1`): arrows, Enter and Escape only, at 960×540, 1920×1080
     and 3840×2160.
3. On a real phone, both orientations.

Also required (`AGENTS.md`): `data-id` on every meaningful element,
≤ 300 lines per file and ≤ 30 per function, one `docs/GAMES_MAP.md` row, a
`NOTES.md` once the main file passes ~150–200 lines.
