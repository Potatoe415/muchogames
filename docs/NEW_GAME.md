# NEW GAME PLAYBOOK

Read this in full before writing any code for a new game. It exists so a
new game is automatically consistent with the platform — technically and
visually — without the rules needing to be repeated each time. It is the
single source of truth for "add a game"; `docs/GAMES_MAP.md`'s equivalent
section just points here.

If anything below can't be satisfied for the game being built, stop and
ask instead of improvising a one-off exception (`AGENTS.md` Section 7).

**Read `docs/PLATFORM_RULES.md` too** — the common base every game shares
(back/options buttons, coins spent per match, matches started/won/lost,
URLs). `npm run check` fails until a new game follows it; a new game never
goes in the check's baseline.

---

## 0. Pick the kind

- `wordpack` — reuses the shared word-guessing engine, just a new data
  JSON. Zero new code.
- `custom` — its own standalone page/app under `public/games/<id>/`.
- `external` — a separate repo/deployment, linked by URL only.

See `docs/GAMES_MAP.md` for what each looks like today.

## 1. Technical baseline (mandatory)

- Location: `public/games/<id>/` (custom) or `public/data/<id>/`
  (wordpack). kebab-case `id`.
- **Zero changes to `hub.js` or `vite.config.js`** — config over code
  (`AGENTS.md` Section 6, `docs/TECH.md` Architecture_Principles).
- Register one entry in `public/hub-config.json`: `id`, `title`, `kind`,
  `category` (reuse an existing one — `mots`, `cartesdes`, `autres` —
  unless the game genuinely needs a new one; a new category is a
  `docs/PRODUCT.md`-level decision, ask first), `launch`, `thumbnail`,
  and `data` if `wordpack`. Optional: `players: [min, max]` (humans
  needed, bots don't count) and `duration` (typical minutes) — they drive
  the tile tags and the hub's "how many are we?" filter; omit them rather
  than guess. An `external` game also needs `source` (its colocated
  `apps/<name>` folder) or `"coinPolicy": "launch"` when its code is not in
  this repo (`docs/PLATFORM_RULES.md` section 3).
- If the game has an options panel wired with `GameHeader.initOptionsPanel`,
  it gets the "Report a problem" entry for free (`shared/CONTRACT.md`).
- Add one row to `docs/GAMES_MAP.md`.
- Reuse `shared/`: read `shared/CONTRACT.md` first, wire the header
  pattern (see Visual baseline below) and, for a word game, `engine.js`.
  Don't duplicate a shared function.
- Size limits (`AGENTS.md` Section 6): ≤ 300 lines/file, ≤ 30
  lines/function. Split by responsibility as you go — most existing
  games didn't and now carry that debt in `docs/BACKLOG.md`; don't repeat
  it.
- `data-id` on every meaningful interactive element (buttons, forms,
  inputs, modals, cards, nav items, error states), kebab-case, per
  `AGENTS.md`'s "Frontend — LLM-addressable UI" rule. Flag: most existing
  games predate this rule and don't have it (`yatsy` does) — a new game
  must not copy that gap.
- Player-facing copy in FR/EN/ES via JSON/data fields, never hardcoded to
  one language (`AGENTS.md` Language Rules, `docs/PRODUCT.md`
  Core_Features).
- No accounts or persisted identity beyond what `player-profile.js`
  already offers (name/avatar) — see `docs/PRODUCT.md` Out_Of_Scope.
- Verify before calling it done: `npm run lint && npm run format:check &&
  npm run build` all pass, **then** a live check in the browser
  (`npm run dev`) — this project's standing practice (see recent
  `docs/DECISIONS.md` entries), not just a CI checkbox.

## 2. Visual baseline (mandatory, for graphic coherence)

- Load `/shared/css/game-header.css` for the header: sticky nav bar, back
  button (top-left, arrow icon, `aria-label`), optional centered title,
  options gear (top-right) opening a single sliding panel. Every custom
  game uses this exact chrome — see every `index.html` under
  `public/games/*/` for the boilerplate markup to copy (nav structure,
  `#optionsPanel`, backdrop, close button).
- Wire the panel's open/close/Escape behavior with
  `/shared/js/game-header.js`'s `initOptionsPanel(triggerEl, panelEl)`
  (see `shared/CONTRACT.md`) — do not reimplement it.
- Load `/shared/css/base.css` too, unless the game deliberately needs a
  fully custom skin (a few existing games — `millionaire`, `cafards` — opt
  out on purpose; that's a valid choice, not the default). It provides
  `var(--font-sans)` and the base reset/background.
- A game may still have its own distinct color scheme/skin — that's
  expected and already true across the catalog — but the *structural*
  chrome (header, options panel, back button, rules modal) must stay the
  shared one, never reinvented per game.
- Thumbnail: the hub tile crops to a **4∶5 portrait** box with
  `object-fit: cover` (`.game-tile__media` in `hub.css`), so a portrait or
  near-square source image crops best; a landscape one will lose its
  sides. No fixed pixel size or file format is enforced (existing
  thumbnails mix `.jpg`/`.png`/`.svg`/`.webp`).

## 3. Confirm before diverging

Stop and ask instead of silently improvising if the game seems to need:
a new `hub-config.json` category or `kind` beyond `wordpack`/`custom`/
`external`, a new shared dependency, or an exception to a size/`data-id`/
i18n rule above.
