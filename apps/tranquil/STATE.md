# STATE

Replace on every update. Max 40 lines. History lives in git and `docs/decisions/`.

Status: A finished match increments the hub profile when this session resolved a hub `?profileCode=`.
Focus: Live-check one win and one loss on `/profile` after a signed-in hub launch. Needs `0003_profiles.sql` applied.
Level: L2

Context:
- Working_On: `api/profile-link.ts`, `client/src/lib/profileSync.ts`, `client/src/lib/matchResultStats.ts`
- Relevant_Files: `docs/tasks/unified-profile-accounts.md`
- Do_Not_Touch: `shared/src` rules engine
- Relevant_Decisions: local win/loss counter (2026-09-17)

Next:
- User applies the root profiles migration and enables Google Auth, if not done.
- Finish one match launched from the hub and confirm the hub `/profile` counter moves.
- Confirm `docs/ARCHITECTURE.md` / `docs/SECURITY.md` wording before editing them.

Open_Questions:
- Bot is greedy+feasibility-aware (no multi-turn search). Add look-ahead later if needed.
- Rare engine `start_discard` deadlock (Start drawn with near-empty decks) — fix in engine?
- Competitive variant (`docs/RULES.md` Section 7.5): in scope?
- Jagged Rocks / Storm & Compass expansions: in scope?
- No idle-turn timer/bot-takeover for online mode yet (coinchapp has one) — add only if disconnections prove to be a real problem.

Blockers:
- Shared profile writes fail until `0003_profiles.sql` is applied.

Recent_Changes:
- 2026-09-24 Finished matches also increment `muchogames_profiles` after a hub launch code. Local `tranquil-match-results` is unchanged.
- 2026-09-22 Bootstrap v10.1 alignment (context architecture only).
- 2026-09-17 Added a win/loss counter (`matchResultStats.ts`), shown in `SettingsPanel`.
