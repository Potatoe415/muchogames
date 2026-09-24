# RUNBOOK

Status: Current.
Load this file only if the task contains or implies: run / command / script / setup / start / test / check / lint / build / deploy / migrate / seed / install.

---

## Setup
- `npm install`
- Yatzy online multiplayer needs a Supabase project: run `supabase/migrations/0001_yatzy.sql` against it, then fill in `public/games/yatsy/supabase-config.js` (`url` + `anonKey`, public values) and set `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` as Vercel project env vars (server-only, never committed). Set both on **every** environment you intend to use: `api/_lib/supabase.js` throws unless the two are present, so a variable set on Production only makes every database-backed route answer 500 on Preview deployments.
- Env vars stored as **Sensitive** on Vercel cannot be read back — not by the dashboard, not by `vercel env pull`. Keep your own copy, or be ready to regenerate the value.
- Admin stats page needs the same Supabase project: run `supabase/migrations/0002_events.sql` (creates `muchogames_events`), then set `ADMIN_PASSWORD` as a Vercel project env var. Nothing else to configure; it reuses `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY`.
- Shared player profile (`/profile` synced across hub/coinchapp/tranquil, see `docs/tasks/unified-profile-accounts.md`) needs: run `supabase/migrations/0003_profiles.sql` against the same Supabase project, **and** enable Google as an Auth provider in that project's dashboard (Authentication → Providers → Google, same `GOOGLE_CLIENT_ID` already used by `auth.js`'s Sign-In button) — `api/profile/*`'s token exchange 400s until that provider is enabled. Reuses `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY`, no new env var.
- Yatzy GIF reactions need `GIPHY_API_KEY` in `.env` / `.env.local` for `npm run dev` (Vite middleware at `/api/yatsy/gifs`) and as a Vercel env var (Production + Preview) for production. Server-only; never prefix with `VITE_`.

## Development
- `npm run dev` — starts the Vite dev server.
  - Hub: `http://localhost:5173/`
  - Wordplayer game (e.g. Pictionary): `http://localhost:5173/wordplayer.html?game=pictionary`
  - Admin stats: `http://localhost:5173/admin/index.html` (the trailing `index.html` is required in dev; on Vercel `/admin` also works)
- The serverless functions under `api/` do not run under `npm run dev` (Vite only serves static files), so the admin page shows a 404 error and no launch is recorded. Use `vercel dev` instead to run the full app (static + functions) locally, with `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY`/`ADMIN_PASSWORD` set via `vercel env pull` or a local `.env`.

## Test
- No automated test suite exists yet (see `docs/TECH.md` Open_Questions).
- Manual check: `npm run check` (lint + format-check + build).
- Exercising the API by hand from PowerShell: quote JSON as `-d '{\"key\":\"value\"}'` or use `--data-binary "@file.json"`. PowerShell strips double quotes when passing arguments to native executables, so `-d '{"key":"value"}'` reaches curl as `{key:value}` and the endpoint answers as if the body were empty.
- Admin stats round-trip: `POST /api/admin/login` with `{"password":"..."}` returns `{"token":"..."}`, then `POST /api/admin/stats` with `{"token":"...","range":"7d"}` (ranges: `7d`, `30d`, `6m`; an unknown value falls back to `30d`). The reply carries `range`, `totalLaunches`, `ranking` and a zero-filled `dailyTrend` of 7, 30 or 182 points.

## Build
- `npm run build` — production build via Vite, output in `dist/`.
- `npm run preview` — serve the production build locally.

## Lint / Format
- `npm run lint` — ESLint (`eslint.config.mjs`).
- `npm run format` — Prettier write.
- `npm run format:check` — Prettier check only.

## Deploy
- Hosting target: Vercel (static `dist/` build + `api/yatsy/games/*` serverless functions), connected via Vercel's Git integration.
- CI (`.github/workflows/ci.yml`) runs lint + format-check + build on push/PR to `main`/`master`. It does not deploy.
- Actual deploy is handled by Vercel (preview deployments per PR, production on merge to `main`/`master`); not scripted in this repo. `vercel --prod` also works from a machine with the Vercel CLI authenticated against this project, but prefer pushing: a CLI deploy carries no git metadata, so `vercel inspect` afterwards can no longer tell you which commit production is running. The next push-triggered deploy restores that.

## Troubleshooting
- **Any `/api/*` route answers 500 with "Unexpected server error":** the detail is redacted on purpose, never guess it. `sendError` and `withErrorHandling` in `api/_lib/http.js` log the real message and stack as one-line JSON to stderr, so read it with `vercel logs <deployment-url>` (or the Runtime Logs tab). This is the fastest route to the cause and has already saved a wrong diagnosis once.
- New game not showing on the hub: verify the entry exists in `public/hub-config.json` and that `assets/thumbnail.jpg` exists under `public/games/<id>/`.
- Wordplayer game not loading words: verify `public/data/<id>/<id>_words.json` exists and its path matches the `data` field in `public/hub-config.json`.
- Yatzy multiplayer not syncing: check `public/games/yatsy/supabase-config.js` has valid values, that `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` are set on the Vercel project, and that `yatzy_game_events` is added to the `supabase_realtime` publication (see `supabase/migrations/0001_yatzy.sql`).
- Admin page rejects the right password: confirm `ADMIN_PASSWORD` is set on the Vercel project for the environment being used (Production and Preview are separate), and redeploy - env var changes only apply to new deployments.
- Admin page shows zero launches: the counters only start from the moment `supabase/migrations/0002_events.sql` ran and a deployment containing the `hub.js` tracking hook went live. Verify with `curl -X POST https://<host>/api/track -d '{"gameId":"yatsy"}'`, which should return `{"recorded":true}`.
- Yatzy GIF picker empty/error: check `GIPHY_API_KEY` is set locally (`.env` / `.env.local`) and on the **muchogames** Vercel project (Production + Preview), then redeploy — the Coinchapp key does not apply here. Under `npm run dev` the search is served by a Vite middleware; under `vercel dev` / production it is `api/yatsy/gifs.js`. That file must import helpers as `../_lib/...` (it sits one level above `api/yatsy/games/index.js`, which uses `../../_lib/...`). A wrong `../../_lib` path crashes production with `FUNCTION_INVOCATION_FAILED` / `Cannot find module '/var/task/_lib/giphy.js'`.
