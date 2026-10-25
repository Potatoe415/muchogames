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
| `blackstories` | `public/games/blackstories/` | `blackstories.js` (266) | engine, header, profile | no |
| `olemains` | `public/games/olemains/` | 6 files, ~510 total (already split, none >300) | engine, header, profile | no |
| `cafards` | `public/games/cafards/` | `game.js` (238) | header, profile | no |
| `millionaire` | `public/games/millionaire/` | `app.js` (1089, **over 300-line limit**) | engine, header, profile | no — see `docs/BACKLOG.md` |
| `pyramide` | `public/games/pyramide/` | `app.js` (847), `i18n.js` (317) — **both over limit** | header, profile | no — see `docs/BACKLOG.md` |
| `pipedream` | `public/games/pipedream/` | 16 ES modules, ~1,780 total (none >300); `main.js` entry | header, session | yes |
| `jezzball` | `public/games/jezzball/` | 17 ES modules, ~1,760 total (none >300); `main.js` entry | header, session | yes |
| `skifree` | `public/games/skifree/` | 25 ES modules + 2 CSS, ~3,050 total (none >300 except `index.html` header boilerplate, 307); `main.js` entry; original bitmaps in `assets/sprites.png` | header, session | yes |
| `chipschallenge` | `public/games/chipschallenge/` | 24 ES modules + 3 CSS, ~2,300 JS lines (none >300 except `index.html`, ~400: header boilerplate + static dialogs/D-pad, and `panel.css`, ~315); `main.js` entry; original CHIPS.EXE tiles in `assets/tiles.png`, original 149 levels in `assets/CHIPS.DAT` | header, session | yes |
| `minesweeper` | `public/games/minesweeper/` | 7 ES modules + 2 CSS, ~1,550 total (none >300); `main.js` entry | header, session | yes |
| `yatsy` | `public/games/yatsy/` | 14 files; `app.js` (1239), `i18n.js` (395), `render.js` (633), `session.js` (575) — **4 files over limit** | engine, header, profile, Supabase | no — see `docs/BACKLOG.md` Later |

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
| `coinche`, `bouilla`, `president`, `bataillecorse`, `solitaire` | `apps/coinchapp/` (Next.js App Router) | coinchapp.vercel.app — Vercel project `coinchapp` (renamed back from `coinchapp-monorepo` post-cleanup), built from this repo's `apps/coinchapp/` (repointed + domain moved 2026-09-17, see `docs/DECISIONS.md`) |

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
| `easyfrog` | easyfrog.web.app | separate, not tracked here |
| `gameboy-web` | gameboy-web.vercel.app | `gameboy-web` |

---

## Adding a new game

Follow `docs/NEW_GAME.md` — the full checklist (technical + visual
conventions, hub-config.json schema, verification steps). It ends with:
add one row to this file, and add a `NOTES.md` in the game's folder once
its main file passes ~150–200 lines (a short summary of what an agent
needs before editing, so future edits can skip reading the full source;
below that size, the code itself is the doc).
