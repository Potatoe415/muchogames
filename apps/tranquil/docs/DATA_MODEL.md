# DATA MODEL

Status: Living document. Update whenever persisted data structure changes.

---

## Source of Truth

Technical_Source: `coinchapp/supabase/migrations/0001_init.sql` (owned by the `coinchapp` repo — tranquillity does not add or modify any migration).

Rule:
- If technical schema files exist, they are the executable source of truth.
- This document is the human/agent-readable map. It must not contradict them.
- Update this document whenever persisted data structure changes.

---

## Storage Overview

Database_Type: Supabase Postgres — the same project used by the `coinchapp` app (a sibling repo). No SQL migration was added for tranquillity: the existing `games` / `game_players` / `game_events` tables already support hosting multiple games via the `game_type` column.
Persistence_Model: One `games` row per online room (`game_type = 'tranquillity'`), one `game_players` row per seat (0 or 1), `state` as opaque `jsonb` holding the engine's `GameState` (see `shared/src/types.ts`). No local persistence for local/vs-bot modes (those stay fully client-side, unchanged).

---

## Entities

### Entity: games (game_type = 'tranquillity')

Purpose: One row per online room/match.
Storage: Supabase Postgres, table `games` (shared with coinchapp's rows, `game_type` discriminates).

Fields:
| Field | Type | Required | Notes |
|---|---|---|---|
| id | uuid | Yes | Primary identifier (`gameId` in the API/client) |
| room_code | text | Yes | 3-char room code players share to join |
| game_type | text | Yes | Always `'tranquillity'` for this app's rows |
| status | text | Yes | `'lobby'` \| `'playing'` \| `'finished'` — coarse status; fine-grained phase lives inside `state` |
| settings | jsonb | Yes | `{ monsterCount: 0 \| 3 \| 4 \| 5 }` |
| state | jsonb | No | The engine's `GameState` (grid, both players' hand/deck, phase, etc.) — null until the 2nd seat joins |
| version | integer | Yes | Optimistic-concurrency guard, bumped on every mutation |
| host_user_id | uuid | No | Unused by tranquillity (no bot/host concept server-side) |
| turn_started_at | timestamptz | Yes | Unused by tranquillity today (no idle-turn timer yet) |
| created_at | timestamptz | Yes | Anchors the shared 48h TTL cron cleanup |

Relationships:
- Has many `game_players` (`game_id`).
- Has many `game_events` (`game_id`) — realtime tick log.

Constraints:
- Row deleted automatically ~48h after `created_at` by coinchapp's shared cron job (`cleanup-expired-games`) — matches tranquillity's own prior room TTL.
- RLS enabled, no policies for normal roles — only the `service_role` (used by `api/_lib/supabaseAdmin.ts`) can read/write.

Access_Rules:
- Never queried directly by the browser. All reads/writes go through `/api/*` serverless functions using the service-role client.

Sensitive_Data:
- `state` contains both players' hands — never sent to the client as-is; `buildClientState` (shared engine) redacts it per seat before any response leaves `/api/get-view` or a move endpoint.

---

### Entity: game_players (rows where games.game_type = 'tranquillity')

Purpose: One row per seat (0 or 1) in a tranquillity room.
Storage: Supabase Postgres, table `game_players` (shared with coinchapp).

Fields:
| Field | Type | Required | Notes |
|---|---|---|---|
| id | uuid | Yes | Primary identifier |
| game_id | uuid | Yes | FK → `games.id` |
| seat | smallint | Yes | 0 or 1 (table's CHECK allows 0–3, tranquillity only ever uses 0/1) |
| user_id | uuid | No | Supabase anonymous-auth user id — this player's durable identity |
| display_name | text | Yes | Player-chosen name, sanitized/truncated by `api/join.ts` |
| is_bot | boolean | Yes | Always `false` — the "vs bot" mode stays 100% client-side, no server bot seat |
| team | text | Yes | Unused by tranquillity (no teams) — set to `'A'` (seat 0) / `'B'` (seat 1) only to satisfy the shared table's NOT NULL constraint |
| last_seen_at | timestamptz | Yes | Presence heartbeat, refreshed on every `get-view` call — drives seat-takeover eligibility |
| missed_turns_in_row | integer | Yes | Unused by tranquillity today |
| created_at | timestamptz | Yes | |

Relationships:
- Belongs to one `games` row (`game_id`).

Constraints:
- Unique (`game_id`, `seat`).

Access_Rules:
- Same as `games` — service-role only, via `/api/*`.

Sensitive_Data:
- None beyond `display_name` (player-chosen, not verified identity).

---

## Relationships

`games` (1) ── (0..2) `game_players` ── (0..*) `game_events`, all scoped by `game_id` and filtered to `game_type = 'tranquillity'` in every tranquillity query (`api/_lib/repo.ts`).

---

## Access Model

Roles: `service_role` (full read/write, used only server-side in `/api/*`) · `authenticated` (Supabase anonymous sign-in; can only read `game_events` ticks via Realtime, never `games`/`game_players` directly).
Rules: All game-state reads/writes are mediated by `/api/*` serverless functions, which resolve the caller's seat from their verified Supabase JWT (`api/_lib/auth.ts`) — a client can never read or mutate another seat's data.

---

## Migration Notes

## 2026-06-03 — Bootstrap

Change: Created empty data model document.
Reason: Future agents need a stable map of persisted data.
Impact: No database selected. No schema defined.

## 2026-08-03 — Adopt coinchapp's shared Supabase tables

Change: Documented `games`/`game_players`/`game_events` reuse (via `game_type='tranquillity'`) in place of the "no database" state. No migration file added to this repo — the schema lives in `coinchapp/supabase/migrations/0001_init.sql`.
Reason: Migrated off Railway/Socket.IO to Supabase (see `docs/DECISIONS.md`), reusing the same Supabase project as coinchapp.
Impact: Online rooms now persist in Postgres instead of an in-memory `Map`. Local and vs-bot modes are unaffected (still fully client-side, no persistence).

## 2026-09-24 — Shared hub profile wins and losses

Change: No change to `games` / `game_players` / `game_events`. `POST /api/profile-link` consumes `muchogames_launch_codes` (same Supabase project) and increments `muchogames_profiles` when a hub `?profileCode=` was resolved this session. The local `tranquil-match-results` counter is unchanged.
Reason: The hub `/profile` page cannot read this app's `localStorage`.
Impact: A visit with no launch code does not write the shared row.
