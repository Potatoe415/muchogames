# GAMES MAP

Living document. Update whenever a game is added, removed, or its shared
deps / `NOTES.md` status changes.

Purpose: read this **before** opening any file under `public/games/` or
`public/data/`. It tells you which single folder a game lives in, so a
task scoped to one game never needs to read another game's code. See
`AGENTS.md` Section 1 ("Game-scoped work") for the isolation rule this
map exists to support.

---

## Wordpack games

Share one engine: `wordplayer.html` + `wordplayer.js` (root, Vite-bundled)
+ `public/shared/js/engine.js` (see `shared/CONTRACT.md`). To edit one
game's content, touch **only its data file** — never the engine, unless
the change must apply to every wordpack game at once.

| id | data file |
|---|---|
| `pictionary` | `public/data/pictionary/pictionary_words.json` |
| `taboo` | `public/data/taboo/taboo_words.json` |
| `esquisse` | `public/data/esquisse/esquisse_words.json` |
| `pigeonpigeon` | `public/data/pigeonpigeon/pigeonpigeon_words.json` |

Flag: `public/games/pictionary/index.html` + `main.js` are orphaned —
`hub-config.json` launches Pictionary via `wordplayer.html?game=pictionary`,
not this folder. Pre-existing dead code, left untouched per `AGENTS.md`.

## Custom games (own folder, own code, launched standalone)

| id | folder | main file(s) — lines | shared deps | `NOTES.md`? |
|---|---|---|---|---|
| `blackstories` | `public/games/blackstories/` | `blackstories.js` (482), `blackstories.css` (463) — **over limit**, `blackstories-i18n.js` (40), `blackstories-save.js` | engine, header, profile | yes |
| `olemains` | `public/games/olemains/` | 9 files incl. `save.js`, `i18n.js`, `play.css` (none >300) | engine, header, profile | yes |
| `cafards` | `public/games/cafards/` | `game.js` (300), `save.js`, `i18n.js`, `board.js`, `setup.js`, `deck.js`, `board.css` (none >300) | header, profile | yes |
| `millionaire` | `public/games/millionaire/` | `app.js` (**over 300-line limit**), `save.js`; TV mode in `tv.js`, `tv-nav.js`, `tv.css`, `tv-game.css` | engine, header, profile | yes |
| `pyramide` | `public/games/pyramide/` | `app.js` (1077), `i18n.js` (324) — **both over limit**, `save.js` | header, profile | yes |
| `pipedream` | `public/games/pipedream/` | 16 ES modules, ~1,810 total (none >300; `styles.css` 430, `index.html` 339 over); `main.js` entry | header, session | yes |
| `jezzball` | `public/games/jezzball/` | 17 ES modules, ~1,860 total (none >300; `styles.css` 583, `index.html` 499 over); `main.js` entry | header, session | yes |
| `skifree` | `public/games/skifree/` | 25 ES modules + 2 CSS, ~3,300 total (over 300: `main.js` 325, `styles.css` 394, `index.html` 392); `main.js` entry; original bitmaps in `assets/sprites.png` | header, session | yes |
| `chipschallenge` | `public/games/chipschallenge/` | 17 ES modules + 3 CSS, ~1,800 JS lines (over 300: `index.html` ~460, `styles.css` ~403, `panel.css` ~354, `main.js` ~339); `main.js` entry; rules engine vendored in `vendor/lexy/` (Lexy's Labyrinth, MIT, decision 0048); original CHIPS.EXE tiles in `assets/tiles.png`, original 149 levels in `assets/CHIPS.DAT` | header, session | yes |
| `minesweeper` | `public/games/minesweeper/` | 7 ES modules + 2 CSS, ~1,550 total (over 300: `index.html` 320, `styles.css` 308); `main.js` entry | header, session | yes |
| `spacecadet` | `public/games/spacecadet/` | 7 JS + 1 CSS, ~750 total (over 300: `styles.css` 439, `index.html` 357); `main.js` + classic `boot.js`; prebuilt Emscripten WASM vendored in `vendor/` (alula, decision 0049) | header, session | yes |
| `memory` | `public/games/memory/` | 26 JS + 5 CSS incl. `best.js`, `tv.css` (over 300: `index.html` ~470, `styles.css` 371, `play.css` 326, `main.js` 309); `main.js` entry; online mode in `online.js` + `wire.js`; 9 themes in `cards/<theme>/card_NN.webp` + 8 `backs/back_NN.webp`, sliced by `scripts/memory_slice.py`, which also writes the `decks.js` manifest | header, session, profile, online-room | yes |
| `checkers` | `public/games/checkers/` | 17 ES modules + 4 CSS incl. `screens.css`, ~1,860 JS lines (none >300 except `index.html`, ~500: header boilerplate + static start/stage/end markup); `main.js` entry; AI in a module worker (`ai-worker.js`) | header, session | yes |
| `chess` | `public/games/chess/` | 22 ES modules + 6 CSS incl. `screens.css`, ~2,540 JS lines (none >300 except `index.html`, ~630: header boilerplate + static start/stage/promotion/end markup); `main.js` entry; same shell as `checkers`; AI in a module worker (`ai-worker.js`) | header, session | yes |
| `fruitslash` | `public/games/fruitslash/` | 16 ES modules + 3 CSS, ~1,780 JS lines (over 300: `styles.css` ~306, `index.html` ~390: header boilerplate + static start/stage/overlay markup); `main.js` entry; emoji drawn as sprites, hand-made SVG tile | header, session | yes |
| `fruitmerge` | `public/games/fruitmerge/` | 17 ES modules + 3 CSS, ~1,700 JS lines (none >300 except `index.html`, ~400: header boilerplate + static start/stage/overlay markup); `main.js` entry; own circle physics (`physics.js`); fruits drawn procedurally (`fruit-art.js`), hand-made SVG tile | header, session, tv-remote | yes |
| `2048` | `public/games/2048/` | 9 ES modules + 5 CSS (incl. `overlays.css`), ~1,050 JS lines (none >300 except `index.html`, ~320: header boilerplate + static start/stage/overlay markup); `main.js` entry; pure rules in `board.js`, DOM tiles with CSS transitions (`view.js`), hand-made SVG tile | header, session, tv-remote | yes |
| `tetris` | `public/games/tetris/` | 24 ES modules + 3 CSS, ~2,100 JS lines (none >300 except `index.html`, ~180 fine); `main.js` entry; pure rules in `engine.js` / `flow.js` / `motion.js`, canvas `view.js`, hand-made SVG tile | header, session, tv-remote | yes |
| `simon` | `public/games/simon/` | 7 ES modules + 4 CSS, ~770 JS lines (none >300 except `index.html`, ~327: header boilerplate + static start/stage/overlay markup); `main.js` entry; pure rules in `rules.js`, DOM pads, Web Audio tones, hand-made SVG tile | header, session, tv-remote | yes |
| `easyfrog` | `public/games/easyfrog/` | 21 ES modules + 3 CSS (`style.css`, `stage.css`, `overlays.css`), ~2,200 JS lines (none >300 except `index.html`, ~478: header boilerplate + static dashboard/stage/overlay markup); `main.js` entry; the owner's game ported from its own repo (easyfrog.web.app) on 2026-11-05: canvas 720×880, rules in `rules.js` / `balance*.js`, original sprites in `images/` and sounds in `sounds/` | header, session, tv-remote | yes |
| `piou` | `public/games/piou/` | 9 ES modules + 2 CSS, ~990 JS lines (none >300); `main.js` entry; pure rules in `engine.js`, canvas `view.js` + shapes in `art.js`, Web Audio sounds, hand-made SVG tile | header, session, tv-remote | yes |
| `sudoku` | `public/games/sudoku/` | 11 ES modules + 2 CSS, ~1,300 JS lines (over 300: `styles.css` ~481, `board.css` ~407, `index.html` ~385: header boilerplate + static start/stage/end markup); `main.js` entry; grids generated in the browser (`generator.js`) | header, session | yes |
| `bridge` | `public/games/bridge/` | 43 ES modules + 7 CSS (incl. `layout.css`), ~5,600 JS lines (over 300: `index.html` ~570, `main.js` 309); `main.js` entry; SEF bidding engine in `bid-*.js`; robots' cards in a module worker (`robot-worker.js`) with a double-dummy endgame solver (`dds.js`) | header, session, `public/shared/card-backs/` | yes |
| `scrabble` | `public/games/scrabble/` + word lists `public/data/scrabble/{ods9,enable,es}.txt` (FR/EN/ES, built by `scripts/scrabble_dict.mjs`) + French definitions `public/data/scrabble/defs/fr/` (Wiktionary extract, CC BY-SA, built by `scripts/scrabble_defs.mjs`) | 28 ES modules + 6 CSS, ~3,000 JS lines (none >300 except `index.html`, ~520: header boilerplate + static start/stage/sheet markup); `main.js` entry; move generator `movegen.js` on the main thread; definitions (`define.js`): French from our files, live Wiktionary for missing words and EN/ES | header, session | yes |
| `trivialpursuit` | `public/games/trivialpursuit/` + questions `public/data/trivialpursuit/questions_{fr,en,es}.json` (2,321 questions per language, 6 categories; FR is OCR of the owner's card photos, hand-checked; EN/ES translated from FR, not native-checked) | 11 ES modules + 4 CSS, ~1,500 JS lines (none >300 except `index.html`, ~400: header boilerplate + static start/stage/overlay markup); `main.js` entry; board graph in `board.js`, SVG board + HTML pawns/targets in `board-view.js`, wheel mode in `wheel-view.js` | header, session, profile | yes |
| `yatsy` | `public/games/yatsy/` | 17 files; `app.js` (1651), `styles.css` (2571), `render.js` (866), `session.js` (620), `i18n.js` (449) — **5 files over limit**; `screens.css` (landscape/wide), `tv.css` (TV sizing); `resume.js` (local save, Reprendre, away notices) | engine, header, profile, online-room | yes |
| `ttmc` | `public/games/ttmc/` | `ttmc.js` (412), `ttmc.css` (492) — **over limit**, `i18n.js`, `store.js` (resume), `index.html` | header | yes |

"Shared deps" = which `shared/CONTRACT.md` modules the game imports. Read
that contract, not the shared source, unless it doesn't answer your
question.

## External games (launch is a plain URL, `kind: "external"` in `hub-config.json`)

"External" describes how a game **launches** (a URL, not an in-repo
page) — independent of where its *code* physically lives. Two different
situations exist today:

### Colocated (code lives in this repo, under `apps/`)

`coinchapp` and `tranquil` were imported via `git subtree` on 2026-09-17
(full history preserved) so their code, history, and docs sit in this
repo for easier LLM context — see `docs/DECISIONS.md`. **They are not
part of the hub-spoke/vanilla-JS architecture**: each is a separate,
self-governing project (own `package.json`, own `AGENTS.md`, own
lint/build) and is explicitly excluded from this repo's root
lint/format/build (`eslint.config.mjs`, `.prettierignore`). Read *that
app's own* `AGENTS.md`/`STATE.md` before working inside it, not this
repo's game-scoped rules.

| id (in `hub-config.json`) | code lives at | deploys at |
|---|---|---|
| `tranquil` | `apps/tranquil/` (npm workspaces: `shared` + `client` + `api`) | tranquil-woad.vercel.app — **still its own original Vercel project**, repoint not started |
| `coinche`, `belote`, `bouilla`, `president`, `bataillecorse`, `solitaire` | `apps/coinchapp/` (Next.js App Router) | coinchapp.vercel.app — Vercel project `coinchapp` (renamed back from `coinchapp-monorepo` post-cleanup), built from this repo's `apps/coinchapp/` (repointed + domain moved 2026-09-17, see `docs/DECISIONS.md`) |

Colocating the code did not automatically move the deployment — that
Vercel repoint is done per-app, separately: `coinchapp`'s is complete and
live; `tranquil`'s has not started (see `docs/BACKLOG.md`). Hub tile
thumbnails for these games stay where they always were, unaffected by
this: `public/games/coinchapp/assets/` and
`public/games/tranquil/assets/`.

**Local task orchestration** (build/lint caching, not deployment) uses
Turborepo (`turbo.json`, root `package.json`): `npm run build:all` /
`lint:all` run the hub's + `coinchapp`'s tasks with caching. `tranquil`
is excluded from this — it has its own nested npm workspaces
(`shared`+`client`), which cannot nest inside the root's; it keeps
building itself independently. See `docs/DECISIONS.md` 2026-09-17.

### Not colocated (code lives in a separate, untouched repo)

| id | deployed at | repo |
|---|---|---|
| `gameboy-web` | gameboy-web.vercel.app | `gameboy-web` |

---

## Adding a new game

Follow `docs/NEW_GAME.md` — the full checklist (technical + visual
conventions, hub-config.json schema, verification steps). It ends with:
add one row to this file, and add a `NOTES.md` in the game's folder once
its main file passes ~150–200 lines (a short summary of what an agent
needs before editing, so future edits can skip reading the full source;
below that size, the code itself is the doc).
