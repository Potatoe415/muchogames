# 0042 — Per-game results: one row per profile and game

Date: 2026-10-02
Status: Accepted
Decision: Store per-game wins/losses (plus best score and last played) in `muchogames_game_stats`, one row per (profile, game), written by `record_muchogames_game_result` together with the profile totals.
Context: Roadmap phase 3 asked for per-game stats and a history on `/profile`. coinchapp and Tranquil sync results as batched deltas, not per match.
Rationale: A row per match would need per-match payloads from apps that only know deltas, and grows without bound in a database shared with coinchapp. Aggregates answer the per-game questions; "last played" covers most of what a history would show. Every caller falls back to the 0003 totals-only function on PostgREST `PGRST202`, so code can ship before the migration runs.
Consequences: No per-match history (date and outcome of each game). Results recorded before 2026-10-02 count in totals only. Yatzy's `best_score` is client-reported, like its win flag.
Alternatives_Rejected: `muchogames_results` with one row per match (unbounded, needs coinchapp/Tranquil rework). Computing per-game stats in each app's own tables (the hub cannot read coinchapp's `localStorage`, and Tranquil/coinchapp tables do not carry hub profile ids).
