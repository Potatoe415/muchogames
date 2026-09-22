# ARCHITECTURE

Agents propose changes; the user confirms before any edit.
Every stack choice also gets a decision in `docs/decisions/`.
Merged from the retired `docs/TECH.md` on 2026-09-22 (bootstrap v10.1 upgrade, see `docs/decisions/INDEX.md`).

## Stack

| Layer | Choice |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS, single-page app (npm workspaces: `shared`, `client`) |
| Backend | Vercel Serverless Functions (`api/*.ts`, Node/TypeScript) — reuses the `@tranquillity/shared` pure game engine |
| Database | Supabase Postgres — same project as the sibling `coinchapp` app, reusing its `games`/`game_players`/`game_events` tables (`game_type='tranquillity'`); no dedicated migration in this repo |
| Runtime | Node.js (Vercel serverless), browser (Vite SPA) |
| Package manager | npm |
| Hosting | Vercel (single project — static client build + `/api` serverless functions) |
| Authentication | Supabase anonymous sign-in (`supabase-js`, session persisted in browser `localStorage`) |
| Validation library | None dedicated |
| Logger | None custom yet |
| Testing | Vitest (pure rules engine in `shared/`) |

Authorization: RLS denies direct client access to `games`/`game_players`; only the service-role client (`api/_lib/supabaseAdmin.ts`) reads/writes them. Every `/api/*` call resolves the caller's seat from their verified Supabase JWT (`api/_lib/auth.ts`).
Security model: Hidden hand data (`GameState`) is redacted per seat by `buildClientState` (shared engine) before any response leaves the API — the browser never receives the opponent's hand.

## Style: this is not a `src/modules/` monolith — it's `shared`/`api`/`client` workspaces

This app predates the `src/modules/<name>/` convention from the v10.1 template. The real structure is three npm workspaces (`shared`, `client`, plus the root-level `api/`), documented as-is below. Code is untouched by this alignment pass.

## Module map (current structure, as-is)

| Module | Purpose | Owns data | May depend on |
|---|---|---|---|
| `shared/src` | Pure, framework-agnostic game engine: types, `gameEngine` (init/move/redact), `gridFeasibility`, `botAI` — unit-tested | none (pure) | none |
| `api/_lib` | `supabaseAdmin` (service-role client), `auth` (JWT → user id), `repo` (load/persist/version-guard), `handleMove` (shared plumbing for the 3 move endpoints) | `games`/`game_players`/`game_events` (via Supabase) | `shared` |
| `api/*.ts` | `join`, `get-view`, `play-card`, `discard-two`, `contribute-start-discard` — one Vercel Serverless Function each | (delegates to `api/_lib`) | `api/_lib`, `shared` |
| `client/src/lib` | `supabase` (browser client + anonymous auth), `api` (fetch wrappers), `useOnlineGame` (realtime subscription + connection state, mirrors coinchapp's `useGameView`), `matchResultStats` (client-only win/loss counter) | `localStorage` (`tranquil-match-results`) | `shared`, browser Supabase client |
| `client/src/components` | UI: `Lobby`, `GameBoard`, `Hand`, `Grid`, `SettingsPanel`, `GameOver`, etc. | none | `client/src/lib`, `shared` |

Rules:
- The game engine (`shared/`) stays pure and framework-agnostic; local, vs-bot, and online modes all call the same `applyPlayCard`/`applyDiscardTwo`/`applyContributeStartDiscard`/`buildClientState` functions.
- Isolate vendor-specific code where practical — all Supabase access goes through `api/_lib/` (server) and `client/src/lib/supabase.ts` (browser).
- Realtime is a lightweight tick (`game_events` insert + broadcast) that triggers a redacted refetch (`GET /api/get-view`) — no secret data flows over Realtime itself.
- `shared` must be pre-compiled to plain JS before `api/*`/the client are built (`npm run build:shared`, wired into `vercel.json`'s `buildCommand` and root `dev`/`dev:api` scripts) — Vercel's Node runtime cannot execute a raw `.ts` file from a workspace symlink the way Vite/esbuild can for the client.

## Conventions

- Naming: camelCase (TS), kebab-case (API route filenames), snake_case (Postgres columns).
- Formatting: no formatter/linter config currently enforced (inferred — confirm; see `docs/BACKLOG.md`).
- Error handling: API endpoints return `{ error: string }` with a stable error code (e.g. `"room_full"`, `"not_in_game"`) and the matching HTTP status; the client surfaces `error.message`.
- Logging: none custom yet.
- Keep the system understandable. Avoid premature abstraction. Prefer explicit over implicit.

## Retired doc

`docs/TECH.md` is superseded by this file. Kept on disk for now (not deleted) pending user confirmation — see the migration report. Do not add new content there.
