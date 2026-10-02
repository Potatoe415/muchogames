# STATE

Replace on every update. Max 40 lines. History lives in git and `docs/decisions/`.

Status: A finished match increments the hub profile (when this session resolved a hub `?profileCode=`) and, once the hub's `0005_game_stats.sql` runs, also its `tranquil` per-game row. Falls back to the totals-only RPC until then.
Focus: Live-check one win and one loss on the hub `/profile` (totals and the "Tranquil" row) after a signed-in hub launch.
Level: L2

Context:
- Working_On: n/a
- Relevant_Files: `api/_lib/profileLink.ts`, `api/profile-link.ts`, `client/src/lib/profileSync.ts`
- Do_Not_Touch: `shared/src` rules engine
- Relevant_Decisions: local win/loss counter (2026-09-17); root `docs/decisions/0042` (per-game hub stats)

Next:
- Owner runs the root `supabase/migrations/0005_game_stats.sql`, then finishes one match launched from the hub.
- Confirm `docs/ARCHITECTURE.md` / `docs/SECURITY.md` wording before editing them.

Open_Questions:
- Bot is greedy+feasibility-aware (no multi-turn search). Add look-ahead later if needed.
- Rare engine `start_discard` deadlock (Start drawn with near-empty decks) — fix in engine?
- Competitive variant (`docs/RULES.md` Section 7.5): in scope?
- Jagged Rocks / Storm & Compass expansions: in scope?
- No idle-turn timer/bot-takeover for online mode yet (coinchapp has one) — add only if disconnections prove to be a real problem.

Blockers: none.

Recent_Changes:
- 2026-10-02 `SettingsPanel`: "Report a problem" link (`settings-feedback-link`) to the hub's `?feedback=tranquil`. Tests, `tsc`, client build clean.
- 2026-10-02 `profileLink.ts` records results under hub game id `tranquil` (`record_muchogames_game_result`), with a fallback to `increment_muchogames_profile_stats`. `npm test` 51/51, `tsc` clean, client build clean.
- 2026-09-24 Finished matches also increment `muchogames_profiles` after a hub launch code. Local `tranquil-match-results` is unchanged.
- 2026-09-22 Bootstrap v10.1 alignment (context architecture only).
