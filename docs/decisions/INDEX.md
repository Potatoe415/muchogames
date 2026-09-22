# DECISIONS INDEX

One line per decision. Read this file, then open only the relevant decision.
Decision files are append-only. To change a decision, add a new one that supersedes it.
Template: `docs/_templates/DECISION.md`.

| # | Date | Title | Status |
|---|---|---|---|
| 0001 | 2026-08-15 | Adopt agent-agnostic context architecture, retire sync-flow tooling | Accepted |
| 0002 | 2026-08-15 | Migrate Yatzy multiplayer + hub hosting from Firebase to Vercel + Supabase | Accepted |
| 0003 | 2026-08-16 | Reuse coinchapp's Supabase project (renamed `multigames-db`) instead of a dedicated one | Accepted |
| 0004 | 2026-08-16 | Confirm Firebase project can be fully decommissioned | Accepted |
| 0005 | 2026-08-16 | Reintroduce Sync-Push/Pull tooling (reverses the 2026-08-15 retirement) | Accepted |
| 0006 | 2026-08-16 | Add `category` field to `HubGameEntry`, redesign the hub with tabs + language switcher | Accepted |
| 0007 | 2026-08-17 | Standardize on "splash screen: back top-left, settings top-right" across every game | Accepted |
| 0008 | 2026-08-30 | Add a password-protected admin stats page, backed by a new Supabase events table | Accepted |
| 0009 | 2026-08-30 | Require a seat token on every mutating Yatzy endpoint, remove client-triggered bulk purge | Accepted |
| 0010 | 2026-08-30 | Add security headers, throttle public endpoints, swap the stored admin password for a signed token | Accepted |
| 0011 | 2026-08-30 | Minimal serverless observability: redact 5xx detail, log it, guard every handler | Accepted |
| 0012 | 2026-08-30 | Make CI a real gate: fix the ESLint globs, format only the maintained surface | Accepted |
| 0013 | 2026-08-30 | Drop the stale dark-theme tokens in base.css instead of "fixing" the `::root` typo | Accepted |
| 0014 | 2026-08-30 | Model /admin on nodali's analytics page, hand-rolled in SVG and scoped to the data actually stored | Accepted |
| 0015 | 2026-09-01 | Host GameBoy Web in-repo as a custom hub game | Accepted |
| 0016 | 2026-09-01 | Ship porklike.gb only as a test cartridge | Accepted |
| 0017 | 2026-09-01 | Launch GameBoy Web from its Vercel app, drop the in-repo copy | Accepted |
| 0018 | 2026-09-04 | Yatzy GIF reactions via Giphy, same pattern as Coinchapp | Accepted |
| 0019 | 2026-09-05 | Google Sign-In status widget on the hub, client-only | Accepted |
| 0020 | 2026-09-05 | Show the signed-in email and add a placeholder profile page | Accepted |
| 0021 | 2026-09-05 | Editable "Nom" field on the profile page, not yet wired into games | Accepted |
| 0022 | 2026-09-05 | Pre-fill the profile "Nom" from the Google display name | Accepted |
| 0023 | 2026-09-06 | Avatar on the profile page, and the "Nom" wired into games at last | Accepted |
| 0024 | 2026-09-06 | Profile launch count and top-five favorites stay client-only | Accepted |
| 0025 | 2026-09-06 | Tiny avatar thumb in online games (reverses Bergamots-only avatar) | Accepted |
| 0026 | 2026-09-09 | Delete previously-flagged dead weight; start splitting `yatsy/app.js` via `storage.js` | Accepted |
| 0027 | 2026-09-09 | Split `yatsy/app.js` rendering and online-sync/session blocks into `render.js`/`session.js` | Accepted |
| 0028 | 2026-09-17 | Deduplicate `engine.js`; add `shared/CONTRACT.md` | Accepted |
| 0029 | 2026-09-17 | Add `docs/GAMES_MAP.md` and a game-scoped-context rule in `AGENTS.md` | Accepted |
| 0030 | 2026-09-17 | Add `docs/NEW_GAME.md`, wired into `AGENTS.md` Startup Protocol | Accepted |
| 0031 | 2026-09-17 | Colocate `coinchapp` and `tranquil` into this repo via `git subtree` (V2 of the earlier "refonte") | Accepted |
| 0032 | 2026-09-17 | Adopt Turborepo (npm workspaces, not pnpm) for local build/lint orchestration | Accepted |
| 0033 | 2026-09-17 | Complete the `coinchapp` Vercel repoint: domain moved to `coinchapp-monorepo`, live in production | Accepted |
| 0034 | 2026-09-17 | Post-migration cleanup: delete (not archive) the old `coinchapp` GitHub repo; delete the old Vercel project; rename `coinchapp-monorepo` → `coinchapp` | Accepted |
| 0035 | 2026-09-17 | Remove `diceduel` from the catalog | Accepted |
| 0036 | 2026-09-17 | Add a wins/losses counter to Yatzy, kept client-only and per-app (not synced to coinchapp/tranquil) | Accepted |
| 0037 | 2026-09-22 | Bootstrap v10.1 context architecture alignment | Accepted |

## When to log a decision
Any of:
- Locks in a technology, library, or vendor.
- Changes the data model, data ownership, or access model.
- Changes module boundaries or dependency directions.
- Cannot be reversed in under 30 minutes.
- Contradicts or supersedes an earlier decision.

If unsure, add an Open_Question to `STATE.md` instead.
