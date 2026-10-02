# Shared code contract

Read this before writing a new game. It documents every shared module's
public API so you rarely need to open its source. If what you need isn't
here, extend the module (see `AGENTS.md` DRY rule) instead of duplicating —
then update this file.

Two physical locations, one reason: Vite build vs. verbatim serving.

- `shared/js/` (repo root) — bundled by Vite. Only reachable from
  `wordplayer.js`/`hub.js` (the two entries in `vite.config.js`). **Do not
  duplicate a file that already exists under `public/shared/js/` here** —
  import that one instead (a relative disk path into `public/` bundles
  fine; see `docs/BACKLOG.md` 2026-09-17 for why this is safe with Vite).
- `public/shared/js/` and `public/shared/css/` — served verbatim, no build
  step. Every unbundled game under `public/games/<id>/` includes these via
  a plain `<script src="/shared/js/...">` tag.

---

## `public/shared/js/engine.js` (ES module, `import { ... } from ".../engine.js"`)

Word-guessing engine used by the wordpack shell (`wordplayer.js`) and by
opt-in custom games (Pictionary, Olé Mains).

- `loadGameData(jsonPath)` → `Promise<GameData>`. Fetches + validates a
  words/cards JSON file. Throws (and shows a French error screen) if the
  fetch fails or the schema is invalid — callers don't need their own
  try/catch for malformed data.
- `pullRandomWord(wordsArray)` → next word object, **removes it from the
  array** (no repeats within a session). `null` once empty.
- `renderWordToScreen(targetElementId, wordText)` — sets `textContent` on
  that element. Throws if the element doesn't exist (fail loud, not silent).
- `getWordText(wordObject, language)` — localized label with FR fallback.
- `getTabooWords(wordObject, language)` — `meta.taboo` list for that
  language, FR/EN fallback, always returns an array (never throws).
- `applyCategoryColorToElement(element, rawCategory)` — sets
  background/text color from a fixed 7-color palette; clears styles for an
  unknown category instead of throwing.
- `loadRulesIfExists(gameId, languageCode)` → `Promise<string|null>`.
  Fetches `/data/<gameId>/rules_<lang>.html`; `null` on 404 or any error
  (never throws — rules are optional).

## `shared/js/analytics.js` (ES module, root, hub-bundled only)

- `trackGameLaunch(gameId)` — fire-and-forget `sendBeacon` to
  `/api/track`, plus a client-only per-game counter in `localStorage`
  (`bergamots-launch-counts`) read by `/profile`. **Never throws.**
  Called from exactly one place (`hub.js`'s tile click handler) per
  `docs/TECH.md` Architecture_Principles — do not call this from inside a
  game.

## `public/shared/js/player-profile.js` (global script → `window.PlayerProfile`)

Canonical reader/writer for the player's name/avatar/launch stats. Include
via `<script src="/shared/js/player-profile.js">`.

- `getName(fallback)` / `setName(name)` — `bergamots-player-name`.
- `getAvatar()` / `setAvatar(dataUrl, thumbUrl)` / `getAvatarThumb()` —
  `bergamots-player-avatar` (+ thumb). Avatar is Muchogames-only: never
  propagated to other games (too large for a URL param).
- `getLaunchTotal()` / `getFavoriteLaunches(limit = 5)` — read-only
  aggregates over `bergamots-launch-counts` (written by `analytics.js`).
- `getWins()` / `getLosses()` / `recordGameResult(won)` — combined
  win/loss counter (`bergamots-game-results`), read on `/profile`. Only
  Yatzy calls `recordGameResult` today, and only when there is an
  unambiguous local player (online seat, or solo vs robot) — never for a
  same-device 2-player local match. Not propagated cross-origin; the
  `coinchapp`/`tranquil` apps keep their own separate local counters.

Cross-origin games (`kind: "external"`, e.g. Coinche/Bouilla/Tranquil)
cannot reach this `localStorage` at all — the hub instead forwards the name
as a `?name=` query param (see `hub.js` `appendLaunchParams()`). Only
pre-fill an existing input from that param; never require it.

## `public/shared/js/game-header.js` (global script → `window.GameHeader`)

- `initOptionsPanel(triggerEl, panelEl)` — wires a gear-button-opens-panel
  pattern: click-to-toggle, `Escape` to close, any `[data-options-close]`
  element inside the panel closes it. Returns `{ open, close, toggle }`.
  Sets `aria-expanded` on the trigger. Also appends a "Report a problem"
  entry (`data-id="options-feedback-button"`, FR/EN/ES from
  `bergamots-lang`) to the panel's `.options-panel-body` when it has one,
  and lazy-loads `feedback.js` on click — a game gets it for free.

## `public/shared/js/feedback.js` (global script → `window.MuchogamesFeedback`)

- `open({ gameId })` — shows the report dialog (bug / idea + message),
  posting to `POST /api/feedback`. `gameId` defaults to the `/games/<id>/`
  segment of the current URL. Injects `/shared/css/feedback.css` itself.
- `close()`.
  Loaded directly by the hub (`index.html`); games get it through
  `game-header.js`, so don't add a `<script>` tag for it in a game.

## `public/shared/css/`

- `base.css` — design tokens (`--font-sans`) + resets, hub and wordplayer.
- `game-header.css` — visuals for the header pattern `game-header.js` wires.
- `feedback.css` — the report dialog; loaded by `feedback.js`, not linked by pages.
- `wordplayer.css` — wordpack shell only.

No JS API to document — include the stylesheet, use its existing classes.
