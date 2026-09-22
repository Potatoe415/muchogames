# 0015 — Multi-game via game_type discriminator (Option A)

Date: 2026-06-12
Status: Accepted
Decision: Host several games in one Supabase project by adding a `game_type text not null default 'coinche'` column (indexed) to the shared `games` table, rather than separate Postgres schemas or per-game table sets. Added in `0003_games_game_type.sql` and folded into `0001_init.sql`; typed as `GameType` in `lib/supabase/types.ts`; `createGame` writes it explicitly.
Context: User wants to be able to add a new game later in the same Supabase project, with the games' data separated. DB is still sandbox (test rooms only, wipeable).
Rationale: The `games`/`game_players`/`game_events` tables are already game-agnostic (all coinche specifics live in the `settings`/`state` jsonb and in `lib/coinche`). A single discriminator column reuses the existing RLS, realtime publication and TTL cron for every game, keeps `room_code` globally unique, and is purely additive (KISS/YAGNI per AGENTS.md). A future game adds its own rules engine (e.g. `lib/belote`) while the data-access layer (`repo.ts`) stays shared.
Consequences: `games` gains `game_type`; existing/new rows default to `coinche`, so nothing breaks. App code can filter/route by `game_type`. `GameType` is a string union to extend per new game.
Alternatives_Rejected: Separate Postgres schemas per game (would duplicate RLS/realtime/cron per schema and add Supabase client schema plumbing — overkill now); per-game prefixed tables (data-access duplication, violates DRY).
