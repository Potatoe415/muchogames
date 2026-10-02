# 0070 — Per-game results on the hub profile

Date: 2026-10-02
Status: Accepted
Decision: Keep the combined local counter (0055) for display, and track a per-game split alongside it so the shared hub profile can show wins/losses per game (`coinche`, `bouilla`, `president`, `bataillecorse`).
Context: Hub roadmap phase 3 (root `docs/tasks/platform-admin-profile-roadmap.md`): `/profile` gets a per-game breakdown fed by `muchogames_game_stats` (root migration `0005_game_stats.sql`).
Rationale: The owner chose one combined counter for this app's own UI; that stays. Sync already works by deltas (`pendingSharedDelta`), so `planSharedSync` splits the pending delta into one batch per game plus one game-less batch for results recorded before the split existed. Game ids live in `lib/profileGames.ts` (no directive) because a Server Action cannot import values from a `"use client"` module. The server falls back to the totals-only RPC on PostgREST `PGRST202`, so deploy order versus the hub migration does not matter.
Consequences: Up to five Server Action calls per flush (one per game with pending results, plus the legacy batch), usually one. Old results never get a game attribution.
Alternatives_Rejected: Switch the displayed counter to per-game (contradicts 0055). Send one row per match (the existing sync is delta-based and the hub keeps one row per profile and game).
