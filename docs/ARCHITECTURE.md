# ARCHITECTURE

Agents propose changes; the user confirms before any edit.
Every stack choice also gets a decision in `docs/decisions/`.
Merged from the retired `docs/TECH.md` on 2026-09-22 (bootstrap v10.1 upgrade, see `docs/decisions/INDEX.md`).

## Stack

| Layer | Choice |
|---|---|
| Frontend | Vanilla JavaScript (ES6+), HTML5, CSS3. No UI framework. Vite as dev server/bundler. Applies to the hub-spoke surface only (`index.html`, `wordplayer.html`, `public/games/`) |
| Backend | Vercel Serverless Functions (Node.js): `api/yatsy/games/*` (Yatzy matchmaking/state), `api/track.js` + `api/admin/stats.js` (hub launch counts) |
| Database | No general-purpose DB. Game content is static JSON (`public/data/`, `public/hub-config.json`). Supabase Postgres holds only ephemeral Yatzy room state and append-only hub launch events (shared `multigames-db` project, also used by `coinchapp`, tables namespaced `yatzy_*`/`muchogames_*`) |
| Runtime | Node.js (tooling + `api/` functions), browser (app itself) |
| Package manager | npm |
| Hosting | Vercel (`muchogames` project), serving the Vite build (`dist/`) + `api/`. Custom domain `muchogames.win` (Cloudflare DNS) alongside `muchogames.vercel.app`. Must stay on the free Hobby plan |
| Authentication | No accounts for players. Hub-only Google Sign-In (Google Identity Services, client-side only) shows a signed-in email via `localStorage` (`bergamots-auth`) — no backend session, no cookie. `GOOGLE_CLIENT_ID` is public, restricted by Authorized JavaScript origins |
| Validation library | None (no schema library in use) |
| Logger | None dedicated. Serverless 5xx failures log one-line JSON to stderr via `api/_lib/http.js`'s `withErrorHandling` |
| Testing | None automated (see Open Question in `docs/BACKLOG.md`) |

Monorepo orchestration: Turborepo (`turbo.json` + root `package.json` `workspaces: ["apps/coinchapp"]`) orchestrates `build`/`lint` across the root and `apps/coinchapp` with local task caching. `apps/tranquil` is **not** a workspace member (it declares its own nested npm workspaces `shared`+`client`, and npm does not support nested workspaces) — it keeps building itself independently. Root `npm run build`/`lint`/`format`/`check` (unprefixed) only cover the hub; the turbo-orchestrated multi-package versions are `npm run build:all` / `npm run lint:all`. See `docs/decisions/INDEX.md` (2026-09-17 entries).

## Style: hub-spoke, not a modular monolith

This repo predates the `src/modules/<name>/` convention from the v10.1 template and is **not** being restructured to match it (`AGENTS.md` §2 — code is untouched during a doc-architecture alignment). The real structure is documented as-is below; do not create a `src/modules/` tree.

## Module map (current structure, as-is)

| Area | Purpose | Owns data | May depend on |
|---|---|---|---|
| `index.html` + `hub.js` | Central hub: reads `public/hub-config.json`, renders game tiles, launches games | `public/hub-config.json` (static) | `shared/js/analytics.js`, `public/shared/js/*` |
| `wordplayer.html` + `wordplayer.js` | Shared word-guessing engine for wordpack games | none | `public/shared/js/engine.js` |
| `public/games/<id>/` | One folder per custom game (own code, own rules). See `docs/GAMES_MAP.md` for the full index — read that before opening any game folder | game-specific (mostly static JSON; `yatsy` also owns Supabase state) | `public/shared/js/*`, `public/shared/css/*` |
| `public/shared/js/`, `public/shared/css/` | Shared code for unbundled games, served verbatim via `<script src>`. Public API documented in `shared/CONTRACT.md` — read that, not the source, before writing a new game | n/a | none (leaf) |
| `shared/js/analytics.js` | Bundled-by-Vite shared code, reachable only from `wordplayer.js`/`hub.js` | none | none |
| `api/yatsy/games/*` | Yatzy matchmaking/state authority (serverless) | `yatzy_games`, `yatzy_game_events` (Supabase) | `api/_lib/*` |
| `api/track.js`, `api/admin/*` | Hub launch counters + admin stats page backend | `muchogames_events` (Supabase) | `api/_lib/*` |
| `public/admin/` | Password-protected stats page, plain unbundled HTML/CSS/JS (own `vite.config.js`-free pattern, like `public/profile/`) | none (reads via `api/admin/*`) | `public/shared/css/base.css` |
| `apps/coinchapp/` | Self-governing Next.js sub-app (Coinche, la Bouilla, Président, la Bataille Corse). Own `AGENTS.md`/`STATE.md`/`docs/` — not part of this stack, not built/linted by root tooling | own Supabase tables (`games`, `game_players`, `game_events`) | none from this repo's perspective |
| `apps/tranquil/` | Self-governing Vite/React sub-app (Tranquility). Own `AGENTS.md`/`STATE.md`/`docs/` | reuses `coinchapp`'s Supabase tables via `game_type='tranquillity'` | none from this repo's perspective |

Rules:
- Config over code: adding a wordpack game requires zero changes to `hub.js` or `vite.config.js` (`docs/NEW_GAME.md`).
- Each custom game is isolated in its own `public/games/<id>/` folder; no forced code sharing beyond `shared/`.
- `apps/<name>/` sub-apps are excluded from this repo's root lint/format/build (`eslint.config.mjs`, `.prettierignore`) and follow their own `AGENTS.md`, not this file.
- A new game needs one row in `docs/GAMES_MAP.md` (full checklist: `docs/NEW_GAME.md`).

## Conventions

- Naming: kebab-case for game ids/folders (`public/games/<id>/`); camelCase for JS identifiers.
- Formatting/linting: Prettier (`.prettierrc`) and ESLint (`eslint.config.mjs`) are the enforced source of truth (`npm run format` / `npm run lint`).
- Tests: none exist yet; see `docs/BACKLOG.md`.
- Configuration: server-only secrets are Vercel env vars (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_PASSWORD`, `GIPHY_API_KEY`); public config (`GOOGLE_CLIENT_ID`, Supabase anon key) is a plain constant/committed file, not a secret.
- Full browser navigation between games (`window.location.href`), no SPA router.
- Analytics instrumented once (hub tile click listener in `hub.js`), never inside individual games.

## Player identity contract

`public/shared/js/player-profile.js` is the canonical reader/writer for the player's name (`bergamots-player-name`) and avatar (`bergamots-player-avatar`), exposed as `window.PlayerProfile`. In-repo same-origin games (Yatzy) read `localStorage` directly via that module. Cross-origin games (`coinche`, `bouilla`, `president`, `bataillecorse`, `tranquil`) receive the name/avatar as `?name=`/`?avatar=` launch URL params (`hub.js`'s `appendLaunchParams()`), pre-filling but never requiring or overwriting a value the player types. See `docs/decisions/INDEX.md` (2026-09-05/06 entries) and `docs/TECH.md` (retained, see note below) for the full mechanism.

## Retired doc

`docs/TECH.md` is superseded by this file. It is kept on disk for now (not deleted) pending user confirmation — see the migration report. Do not add new content there.
