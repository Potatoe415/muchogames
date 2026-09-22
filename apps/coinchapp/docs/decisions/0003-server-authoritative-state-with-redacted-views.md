# 0003 — Server-authoritative state with redacted views

Date: 2026-06-09
Status: Accepted
Decision: Store the full GameState (including hands) in `games.state`, accessible only to the service_role; clients receive a per-seat redacted view via the `getView` Server Action. Realtime uses a `game_events` tick table, not row broadcast of the state.
Context: Card games have hidden information; broadcasting rows or trusting the client would leak hands or enable cheating.
Rationale: A single authority validates every move; realtime carries no secrets (only a version tick), so RLS stays simple and leak-proof.
Consequences: Every mutation is a Server Action that loads, validates, advances bots, persists, and emits a tick. Clients are pure renderers.
Alternatives_Rejected: Postgres Changes on games (would ship hands to clients per RLS row payload); server WebSocket broadcast (heavier in serverless).
