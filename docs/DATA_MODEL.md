# DATA MODEL

Status: Living document. Update whenever persisted data structure changes.

---

## Source of Truth

Technical_Source: Static JSON files in the repo (`public/hub-config.json`, `public/data/<gameId>/*.json`) + Supabase Postgres for Yatzy room state (`supabase/migrations/0001_yatzy.sql`, tables `yatzy_games`/`yatzy_game_events`), hub launch counts (`supabase/migrations/0002_events.sql`, table `muchogames_events`), and the shared signed-in profile (`supabase/migrations/0003_profiles.sql`, tables `muchogames_profiles` / `muchogames_launch_codes`).

Rule:
- If technical schema files exist, they are the executable source of truth.
- This document is the human/agent-readable map. It must not contradict them.
- Update this document whenever persisted data structure changes.

---

## Storage Overview

Database_Type: File-based static content (JSON) + a Supabase (Postgres) project for ephemeral multiplayer state (`yatzy_games`, `yatzy_game_events`) and hub launch counts (`muchogames_events`).
Persistence_Model: Game catalog and word/question content are read-only static files shipped with the build. Yatzy room state is mutable and ephemeral (TTL-purged: soft 3h expiry on unstarted/stale rooms checked by the API, hard 48h `pg_cron` delete). Hub launch events are append-only and kept indefinitely — the only long-lived network-persisted data in the project.

---

## Entities

### Entity: HubGameEntry

Purpose: Describes one game tile in the hub and how to launch it.
Storage: `public/hub-config.json` (JSON array, one object per game).

Fields:
| Field | Type | Required | Notes |
|---|---|---|---|
| id | string | Yes | kebab-case, matches `public/games/<id>/` folder |
| title | string | Yes | Display name on the hub tile |
| kind | string | Yes | `wordpack` \| `custom` \| `external` |
| category | string | Yes | `cartesdes` \| `mots` \| `autres` — which hub tab the tile appears under |
| engine | string | wordpack only | e.g. `wordplayer` |
| launch | string | Yes | Relative path or external URL to open |
| data | string | wordpack only | Path to the game's word JSON |
| thumbnail | string | Yes | Path to `assets/thumbnail.jpg` for the tile |
| players | [int, int] | No | `[min, max]` humans; tile tag + hub player-count filter (`hub-tags.js`). Missing = never filtered out |
| duration | int | No | Typical minutes; tile tag only |

Relationships:
- `data` points to a `WordPack` entity (wordpack games only).
- `id` maps 1:1 to a folder under `public/games/<id>/`.

Constraints:
- `id` must be unique across the array.
- `thumbnail` file must exist at build time for the tile to render correctly.
- `category` must be one of `cartesdes` / `mots` / `autres`; `hub.js` renders only the games matching the currently selected tab (no fallback bucket), so every entry needs a valid value.

Access_Rules:
- Public, read-only, fetched client-side by `hub.js` and `wordplayer.js`.

Sensitive_Data:
- None.

---

### Entity: WordPack

Purpose: Word/round dataset consumed by the shared wordplayer engine.
Storage: `public/data/<gameId>/<gameId>_words.json`.

Fields:
| Field | Type | Required | Notes |
|---|---|---|---|
| gameId | string | Yes | Matches `HubGameEntry.id` |
| title | string | Yes | Display title |
| controls | string[] | Yes | e.g. `["next"]` or `["pass","validate"]` |
| words | Word[] | Yes | See below |

Word object fields: `id`, `text`, optional `fr` / `en` / `es` translations.

Relationships:
- Referenced by exactly one `HubGameEntry.data`.

Constraints:
- Read-only at runtime (no writes from the client).

Access_Rules:
- Public, read-only, fetched client-side.

Sensitive_Data:
- None.

---

### Entity: YatzyGameRecord

Purpose: Ephemeral multiplayer room state for Yatzy, keyed by a 3-letter room code.
Storage: Supabase Postgres, table `yatzy_games` (see `supabase/migrations/0001_yatzy.sql` and `api/yatsy/games/`), plus `yatzy_game_events` (a tiny realtime "tick" table carrying only `game_code`/`version`, no game data).

Fields:
| Field | Type | Required | Notes |
|---|---|---|---|
| code | text (PK) | Yes | 3 uppercase letters, generated server-side, retried on collision |
| created_at | timestamptz | Yes | Used for TTL/expiry checks |
| status | text | Yes | `waiting` \| `playing` |
| game_state | jsonb \| null | Yes | Opaque Yatzy game state (dice, scores, turn) written by `PUT /api/yatsy/games/{code}/state` |
| creator_token | text \| null | Yes | Resume token for the creator seat |
| joiner_token | text \| null | Yes | Resume token for the joiner seat |
| version | bigint | Yes | Optimistic-concurrency / realtime-tick counter, bumped on every write |

Relationships:
- Standalone; not linked to any other entity or user account.
- `yatzy_game_events.game_code` references `yatzy_games.code` (cascade delete).

Constraints:
- Room code: 3 uppercase letters (`A-Z`), generated inside `api/yatsy/games/index.js`, retried on collision.
- Considered expired after `GAME_TTL_MS` (3h) since `created_at`; checked and lazily deleted by the API on read/join/resume.
- Hard-purged after 48h by an hourly `pg_cron` job (see the migration file), independent of the app-level check.

Access_Rules:
- No authentication. The browser never reads/writes `yatzy_games` directly — Row Level Security has zero policies on it, so only the service-role key (used exclusively inside `api/yatsy/games/*` serverless functions) can access it. Client-facing access control is by knowledge of the room code plus the per-seat resume token, enforced by those functions (capability-based, not identity-based).
- `yatzy_game_events` allows public `select` (any client) since it carries no game data, only enough to trigger a client refetch via the API.

Sensitive_Data:
- None (no personal data stored; tokens are random session capabilities, not identifiers).

---

### Entity: HubEvent

Purpose: Counts how many times each game is launched from the hub, for the admin stats page.
Storage: Supabase Postgres, table `muchogames_events` (see `supabase/migrations/0002_events.sql`, `api/track.js`, `api/admin/_stats.js`).

Fields:
| Field | Type | Required | Notes |
|---|---|---|---|
| id | bigint (PK) | Yes | Identity column |
| type | text | Yes | Defaults to `game_launch`; the only value written today |
| game_id | text | Yes | Matches `HubGameEntry.id`, max 64 chars (enforced in `api/track.js`, not in SQL) |
| created_at | timestamptz | Yes | Insert time; indexed descending |

Relationships:
- `game_id` mirrors `HubGameEntry.id` by convention only — there is no foreign key, since the hub catalog lives in JSON, not in Postgres. Ids of deleted games therefore survive in this table.

Constraints:
- Append-only: rows are never updated or deleted by the app. No TTL and no purge job (unlike `yatzy_games`), because the counts are the point.
- `api/admin/_stats.js` reads at most 10 000 rows per request (`MAX_ROWS`); beyond that the ranking and the trend silently undercount. Since 2026-08-30 that cap applies to the selected range window (7, 30 or 182 days) rather than to all history, so it is reached far less easily.
- Reads filter on `created_at >= start of the requested range`, served by `muchogames_events_created_at_idx`. Aggregation (ranking and per-day totals) happens in JavaScript inside the function, not in SQL — deliberate at this volume, since it avoids a view or an RPC and therefore a migration.

Access_Rules:
- Row Level Security enabled with zero policies, same as `yatzy_games`: the browser can neither read nor write this table. Writes go through `POST /api/track` (public, unauthenticated, throttled in memory to 60 events per minute per IP). Reads go through `POST /api/admin` (`action: "stats"`), which requires the Supabase access token returned by `action: "login"` for a Google account whose user id is in `ADMIN_USER_IDS`; every read re-resolves that token and re-checks the allowlist.
- `POST /api/track` being public means anyone who finds the URL can insert junk rows and inflate the counters. Accepted trade-off (see `docs/DECISIONS.md` 2026-08-30).

Sensitive_Data:
- None. No IP, user agent, session id, or any other visitor identifier is stored — only a game id and a timestamp.

---

## Relationships

- `HubGameEntry` 1—1 `WordPack` (wordpack games only, via `data` path).
- `HubGameEntry` 1—1 game folder under `public/games/<id>/`.
- `YatzyGameRecord` is standalone, keyed by room code, independent of the hub config.
- `HubEvent` 0—N per `HubGameEntry`, joined on `game_id` in application code only (no foreign key).

---

## Access Model

Roles: None (anonymous) for players. Yatzy uses ad-hoc `creator` / `joiner` seat roles scoped to a single room code. An `admin` role exists for Google-signed-in Supabase Auth users whose id is listed in the `ADMIN_USER_IDS` env var (since 2026-10-02, replacing the shared `ADMIN_PASSWORD`). No admin table: the allowlist is configuration. The admin session is the 1h Supabase access token from the Google exchange, verified with `auth.getUser` on every admin request.
Rules: All static JSON is public and read-only. Yatzy room reads/writes go exclusively through `api/yatsy/games/*` (Vercel serverless functions using the Supabase service-role key); those functions validate the room code + per-seat resume token before returning or mutating state. Direct client access to `yatzy_games` is blocked outright by Row Level Security (no policies), regardless of what the client knows. The same RLS pattern protects `muchogames_events`: writes via the public `api/track.js`, reads via `api/admin/index.js` behind an allowlisted Google sign-in.

---

### Entity: SharedProfile

Purpose: One name, avatar, and combined win/loss total for a Google-signed-in player, shared by the hub, Yatzy, coinchapp, and Tranquil.
Storage: `public.muchogames_profiles` (`supabase/migrations/0003_profiles.sql`). `id` is the Supabase Auth user id from the Google sign-in. Wins and losses increment through `increment_muchogames_profile_stats` (service-role only).
Sensitive_Data: The Google account is verified server-side. The row stores the chosen display name and avatar, not the email.

### Entity: GameStats

Purpose: Matches started and wins/losses per signed-in profile and game, for the per-game breakdown on `/profile`.
Storage: `public.muchogames_game_stats` (`supabase/migrations/0005_game_stats.sql`, `started` added by `0008_match_coins.sql`). Primary key (`profile_id`, `game_id`); `started`, `wins`, `losses`, optional `best_score` (highest seen, Yatzy sends its final total), `last_played_at`. Cascades on profile delete. `started` is incremented only by `start_muchogames_match` (see Coins), so rows from before 0008 can show fewer starts than results.
Writes: only through `record_muchogames_game_result(p_id, p_game_id, p_wins, p_losses, p_score)` (service-role only), which also increments `muchogames_profiles` totals in the same transaction. Callers: `api/profile` `record-result` (Yatzy, `gameId: "yatsy"`), coinchapp `lib/server/profileLink.ts` (its four game ids), Tranquil `api/_lib/profileLink.ts` (`tranquil`). All three fall back to `increment_muchogames_profile_stats` on PostgREST `PGRST202` (function missing).
Access_Rules: RLS on, zero policies. Read only by `api/profile` `game-stats` for the caller's own profile.
Sensitive_Data: None beyond the profile link.

### Entity: HubSettings

Purpose: Owner-edited overlay on `public/hub-config.json`: hidden, pinned (ordered) and "new" game ids, plus a FR/EN/ES announcement banner.
Storage: `public.muchogames_hub_settings` (`supabase/migrations/0006_hub_settings.sql`), a single row (`id = 1`) with one `settings` jsonb: `{ hidden: string[], pinned: string[], new: string[], announcement: { active, fr, en, es } }` (announcement texts ≤ 280 chars, ≤ 64 ids per list). Seeded with the previously hard-coded pinned order. Shape enforced by `api/_lib/hubSettings.js` on read and write.
Access_Rules: RLS on, zero policies. Public read through `GET /api/hub-settings` (CDN-cached 60 s); write only through `POST /api/admin` `hub-settings-update` behind the admin allowlist. The hub falls back to the static catalog when the read fails.
Sensitive_Data: None.

### Entity: Coins

Purpose: Daily play allowance (10 coins per Paris day, one per match started — `docs/PLATFORM_RULES.md`; one per hub launch only for `coinPolicy: "launch"` games).
Storage: `public.muchogames_coins` (`supabase/migrations/0007_coins.sql`): `profile_id` (PK, references `auth.users`, cascade), `day` (Paris date the count belongs to), `spent`, `updated_at`. One row per player, overwritten when the day changes; no purge needed. Spent only through `spend_muchogames_coin(p_id, p_daily)` (service-role only), which computes the Paris day itself and returns null when the allowance is used up.
Access_Rules: RLS on, zero policies. Read/spent only through `POST /api/match` (`coins` / `start`) for the caller's own row, and by the coinchapp/Tranquil servers via `start_muchogames_match`; admins are never charged. The 2026-10-02 browser counter `muchogames-coins` and the `api/profile` `coins` / `spend-coin` actions were removed on 2026-10-03.
Sensitive_Data: None beyond the profile link.

Per match (`docs/PLATFORM_RULES.md`, `supabase/migrations/0008_match_coins.sql`): `public.muchogames_device_coins` holds anonymous players' counters — `device_id` (PK, random UUID created in the browser under `muchogames-device-id`), `day`, `spent`, `updated_at`; rows older than 7 days are deleted on each spend. `start_muchogames_match(p_game_id, p_daily, p_profile_id, p_device_id, p_unlimited)` spends from the profile row (via `spend_muchogames_coin`) or the device row, returns coins left or null when out, and on success inserts a `match_start` row in `muchogames_events` and increments `muchogames_game_stats.started` for a signed-in profile. `muchogames_device_coins_left(p_device_id, p_daily)` reads a device's balance. Both service-role only, called by public `POST /api/match` (`start` 30/min, `coins` 60/min per IP). The device id is not linked to any person; knowing one lets you spend its coins. Browser key `muchogames-match-counts` (`{ [gameId]: n }`) counts matches started locally.

### Entity: Feedback

Purpose: A bug report or idea sent by any visitor, triaged by the admin.
Storage: `public.muchogames_feedback` (`supabase/migrations/0004_feedback.sql`). Fields: `id`, `kind` (`bug` | `idea`), `message` (1–2000 chars), optional `game_id` (≤ 64) and `page` (≤ 200, URL path), `status` (`new` | `in_progress` | `resolved`), `created_at`, `updated_at` (trigger).
Access_Rules: RLS on, zero policies. Written only by public `POST /api/feedback` (anonymous, 5 per 10 min per IP, best-effort in-memory throttle). Read and status-updated only by `POST /api/admin` (`feedback-list`, `feedback-update`) behind the admin allowlist. No delete path; no purge.
Sensitive_Data: Nothing identifying is stored by design (no profile id, IP, user agent, contact field). A sender may still type personal data into `message` themselves.

### Entity: ProfileLaunchCode

Purpose: One-time hand-off so coinchapp and Tranquil can attribute a result to that profile without putting a Google token in the launch URL.
Storage: `public.muchogames_launch_codes`. Minted by `POST /api/profile` (`action: "launch-code"`, 60s, single use). The receiving app marks `used_at` and keeps the resolved profile id in an httpOnly cookie for the browser session.
Sensitive_Data: The code itself is a secret capability until it is used. It is not a Google token.

---

## Migration Notes

## 2026-08-15 — Bootstrap migration

Change: Created this data model document by reverse-engineering `public/hub-config.json`, `public/data/*/`, and `public/games/yatsy/matchmaking.js`. Superseded the old ad-hoc `spectre_technique.md`/`spectre_fonctionnel.md` notes, which are now removed.
Reason: Future agents need a stable, accurate map of persisted data instead of scattered reverse-engineering notes.
Impact: No schema or storage engine changed. Documentation only.

## 2026-08-15 — Yatzy: Firebase Realtime Database to Supabase Postgres

Change: `YatzyGameRecord` moved from a Firebase Realtime Database tree (`games/{code}`) to Supabase Postgres tables `yatzy_games` + `yatzy_game_events` (`supabase/migrations/0001_yatzy.sql`), accessed exclusively through new `api/yatsy/games/*` Vercel serverless functions instead of direct client SDK reads/writes.
Reason: Reuse the `coinchapp` project's Vercel+Supabase pattern (service-role key confined to server code, RLS blocking all direct client access) for Yatzy's online multiplayer, as part of the wider Firebase Hosting to Vercel hosting migration.
Impact: Access control is now enforced by Row Level Security + server-side token checks instead of relying on Firebase rules (not tracked in this repo). Field names changed from Firebase's nested `seats.creator.token`/`seats.joiner.token` to flat `creator_token`/`joiner_token` columns.

## 2026-08-30 - Add hub launch counters (`muchogames_events`)

Change: Added the `HubEvent` entity, stored in a new Supabase table `muchogames_events` (`supabase/migrations/0002_events.sql`), written by `api/track.js` and read by `api/admin/stats.js`.
Reason: The user asked for an admin page showing which games are actually launched. No such data existed: the hub had zero instrumentation.
Impact: First long-lived (non-ephemeral) network-persisted data in the project - every earlier persisted record was TTL-purged. New required env var: `ADMIN_PASSWORD`. The `muchogames_` prefix starts the progressive rename from "bergamots" to "muchogames"; the repo, Vercel project, and existing `yatzy_*` tables are unchanged for now, so table prefixes are temporarily inconsistent.

## 2026-08-30 - Enforce seat tokens on every `yatzy_games` mutation

Change: No schema change. Access rules only: deleting a `YatzyGameRecord` now requires a `role` + `resumeToken` matching `creator_token`/`joiner_token`, and claiming a seat in a room already `playing` requires presenting that seat's existing token rather than being issued a new one. `game_state` writes are now rejected unless the payload is a JSON object serializing to under 64 KB. The client-triggered bulk delete endpoint (`api/yatsy/games/purge.js`) was removed; the hourly 48h `pg_cron` job is now the only bulk delete path.
Reason: The documented rule ("those functions validate the room code + per-seat resume token before returning or mutating state") was only partly implemented - delete and seat-claim accepted the room code alone, which is 3 letters and therefore enumerable. See `docs/DECISIONS.md` 2026-08-30.
Impact: The Access Model section above is now actually enforced for every mutation. One read path stays open: `GET /api/yatsy/games/[code]` still returns room state to anyone knowing the code. `game_state` rows are now bounded in size, which matters because the Supabase project is shared with coinchapp.

## 2026-08-30 - Token-gate `muchogames_events` reads, throttle its writes

Change: No schema change. Reading the launch ranking now requires a short-lived HMAC-signed token obtained from the new `POST /api/admin/login`, instead of replaying `ADMIN_PASSWORD` on every `POST /api/admin/stats` call. Writes through the still-public `api/track.js` are throttled in memory (60 events per minute per IP).
Reason: The password was stored in the browser's `sessionStorage` and re-sent on every read, and the write path was unbounded - a concern because `multigames-db` is shared with coinchapp. See `docs/DECISIONS.md` 2026-08-30.
Impact: `ADMIN_PASSWORD` doubles as the token signing key, so rotating it invalidates live admin sessions. Row growth in `muchogames_events` is now rate-bounded per IP, though the throttle is per serverless instance and therefore best-effort.

## 2026-08-30 - Read `muchogames_events` by range instead of all history

Change: No schema change. `POST /api/admin/stats` now takes a `range` of `7d`, `30d` or `6m`, filters on `created_at`, and returns a zero-filled per-day series alongside the ranking. `totalLaunches` counts the selected window rather than all history.
Reason: The admin page gained a period selector and a daily trend chart, modelled on the `nodali` project's analytics page. See `docs/DECISIONS.md` 2026-08-30.
Impact: `created_at` went from being written and never read to carrying the whole feature, which is what `muchogames_events_created_at_idx` was already there for. The `MAX_ROWS` cap of 10 000 now bounds a range window instead of all history, so it is safer than before. Days are bucketed in UTC, so for a UTC+1/+2 audience a launch after local midnight is attributed to the previous day. Nothing visitor-shaped was added: still no IP, user agent, session id, device or country, so `Sensitive_Data: None` still holds for this entity.

## 2026-09-24 - Shared profile wins and losses

Change: `muchogames_profiles.wins` / `losses` (and the one-time `muchogames_launch_codes` hand-off) are now written from Yatzy, coinchapp (all four games), and Tranquil, and read on `/profile` when a live Google sign-in exists.
Reason: Each app already counted results in its own `localStorage`. Those totals never reached the hub profile.
Impact: Anonymous play is unchanged. A signed-in player who launches Coinche, Bouilla, Président, la Bataille Corse, or Tranquil from the hub gets `?profileCode=` for that navigation; finishing a match increments the shared row. Existing local counters are folded in once per browser.

## 2026-10-02 - Admin access by Google account

Change: No schema change. The admin role moved from "knows `ADMIN_PASSWORD`" to "Google sign-in whose Supabase Auth user id is in `ADMIN_USER_IDS`". `api/admin/login.js` + `stats.js` became `api/admin/index.js` (`action: "login" | "stats"`).
Reason: Owner-only admin area, about to grow beyond read-only stats. See `docs/decisions/0040-admin-access-by-google-account.md`.
Impact: `ADMIN_PASSWORD` is no longer read and can be deleted from Vercel. `muchogames_events` access rules are otherwise unchanged.

## 2026-10-02 - Feedback inbox (`muchogames_feedback`)

Change: Added the `Feedback` entity (`supabase/migrations/0004_feedback.sql`), written by `api/feedback.js`, read and triaged through `api/admin/_feedback.js`.
Reason: Replace the external bug-tracker Google Doc with an in-app report button and an admin inbox. See `docs/decisions/0041-anonymous-feedback-inbox.md`.
Impact: Second long-lived, publicly writable table after `muchogames_events`; bounded by the per-IP throttle and the 2000-char message cap. Functions: 10 of 12.

## 2026-10-02 - Per-game results (`muchogames_game_stats`)

Change: Added the `GameStats` entity and `record_muchogames_game_result` (`supabase/migrations/0005_game_stats.sql`). Yatzy, coinchapp and Tranquil now attribute results to a game; `/profile` shows the breakdown; `/admin` shows signed-in players and recorded results.
Reason: Roadmap phase 3. See `docs/decisions/0042-per-game-results-one-row-per-profile-and-game.md`.
Impact: One row per (profile, game), not per match, so no match history. Results recorded before this change stay in the totals only.

## 2026-10-02 - Hub favorites, recents, player tags

Change: `HubGameEntry` gains optional `players` and `duration`. Two new browser-only `localStorage` keys: `muchogames-favorite-games` and `muchogames-recent-games` (ids, max 8), read by the hub's "My games" shelf (`hub-shelf.js`).
Reason: Roadmap phase 4.
Impact: No server data. Only Coinche, Bouilla, Président, la Bataille Corse and Yatzy carry `players` so far.

## 2026-10-02 - Hub settings (`muchogames_hub_settings`)

Change: Added the `HubSettings` entity, `GET /api/hub-settings` (11 of 12 functions) and admin actions `hub-settings-get` / `hub-settings-update`. New browser key `muchogames-dismissed-announcement` (last dismissed banner text).
Reason: Roadmap phase 5. See `docs/decisions/0043-hub-settings-overlay-served-by-a-cached-function.md`.
Impact: `hub.js`'s `PINNED_GAME_IDS` is now only the fallback when settings cannot be read.

## 2026-10-02 - Export, account deletion, admin moderation

Change: No schema change. `api/profile` gains `export` and `delete-account` (`confirm: true`); `api/admin` gains `players-list`, `player-reset` (`name` | `avatar` → null) and `player-delete` (non-admin only, `confirm: true`). Deletion calls `auth.admin.deleteUser`, cascading to `muchogames_profiles`, `muchogames_game_stats` and `muchogames_launch_codes`.
Reason: Roadmap phase 6. See `docs/decisions/0044-self-service-export-and-account-deletion.md`.
Impact: First code path that deletes user data on request. `/profile` deletion also clears this browser's hub keys (except the language).

## 2026-10-02 - Daily play coins (`muchogames_coins`)

Change: Added the `Coins` entity and `spend_muchogames_coin` (`supabase/migrations/0007_coins.sql`), `api/profile` actions `coins` / `spend-coin`, and the browser key `muchogames-coins`.
Reason: Owner request. See `docs/decisions/0046-daily-play-coins.md`.
Impact: Until 0007 runs, signed-in spends fail server-side and the hub lets the launch through (fail open); anonymous counting works immediately.

## 2026-10-03 - Coins per match (`muchogames_device_coins`, `started`)

Change: `supabase/migrations/0008_match_coins.sql` adds `muchogames_device_coins`, `muchogames_game_stats.started`, `start_muchogames_match`, `muchogames_device_coins_left`, and `match_start` events; public `POST /api/match`; browser keys `muchogames-device-id`, `muchogames-match-counts`.
Reason: Owner request: a coin per match started, not per game opened, one counter shared by every game and app. See `docs/tasks/platform-common-rules.md`.
Impact: Until 0008 runs, `/api/match` answers 500 and games let the match start (fail open). Admin launch stats are unaffected (they filter `type = 'game_launch'`). Functions: 8 of 12.
