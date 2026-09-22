# STATE

Replace on every update. Max 40 lines. History lives in git and `docs/decisions/`.

Status: Bootstrap v10.1 alignment applied 2026-09-22 (part of a repo-wide pass covering root `muchogames` + `apps/coinchapp` + this app, all in one session on `main`). `docs/DECISIONS.md` split into `docs/decisions/*.md` + `INDEX.md` (10 decisions, verbatim). New `docs/ARCHITECTURE.md` (merged from `docs/TECH.md`), `docs/SECURITY.md`, `docs/DEBUGGING.md`, `.gemini/settings.json`. `docs/TECH.md`/`docs/DECISIONS.md`/`CLAUDE.md`/`GEMINI.md`/`.cursor/rules/000-router.mdc` kept on disk, superseded, pending user confirmation to delete. Product-wise: online backend on Vercel + Supabase; share-game-link button live on `tranquil-woad.vercel.app`.
Focus: No `docs/PRODUCT.md` confirmation blocker here (it is still all "TBD"). Get explicit user confirmation to delete the superseded router/flat-doc files (see Retired files in `AGENTS.md`).
Level: L2

Context:
- Working_On: `AGENTS.md`, `STATE.md`, `docs/ARCHITECTURE.md`, `docs/SECURITY.md`, `docs/DEBUGGING.md`, `docs/decisions/`, `docs/BACKLOG.md`, `.gemini/settings.json`
- Relevant_Files: `docs/decisions/INDEX.md`
- Do_Not_Touch: no source code was touched by this alignment pass (docs/context-architecture only)
- Relevant_Decisions: `docs/decisions/INDEX.md` 0001 (original bootstrap), 0011 (this v10.1 alignment)

Next:
- Ask the user to confirm deletion of the 5 superseded router/flat-doc files (`docs/TECH.md`, `docs/DECISIONS.md`, `CLAUDE.md`, `GEMINI.md`, `.cursor/rules/000-router.mdc`).
- Resume the pre-existing verification backlog — see `docs/BACKLOG.md` Now (win/loss counter sanity check, online/bot/local play-tests, mobile hand real-device re-test) — none of it was touched by this alignment pass.
- Fill `docs/PRODUCT.md` with confirmed scope whenever the user is ready (currently all "TBD" — not a blocker, just open).

Open_Questions:
- Bot is greedy+feasibility-aware (no multi-turn search). Add look-ahead later if needed.
- Rare engine `start_discard` deadlock (Start drawn with near-empty decks) — fix in engine?
- Competitive variant (`docs/RULES.md` Section 7.5): in scope?
- Jagged Rocks / Storm & Compass expansions: in scope?
- No idle-turn timer/bot-takeover for online mode yet (coinchapp has one) — add only if disconnections prove to be a real problem.

Blockers:
- None.

Recent_Changes:
- 2026-09-22 Bootstrap v10.1 alignment (context architecture only, no code touched): split `docs/DECISIONS.md` into `docs/decisions/*.md`+`INDEX.md`; added `docs/ARCHITECTURE.md`/`docs/SECURITY.md`/`docs/DEBUGGING.md`/`docs/_templates/`/`.claude/settings.json`/`.gemini/settings.json`; rewrote `AGENTS.md`/`STATE.md`; condensed `docs/BACKLOG.md`. Same pass applied to root `muchogames` and `apps/coinchapp`.
- 2026-09-17 Added a win/loss counter (`client/src/lib/matchResultStats.ts`, `tranquil-match-results` key), recorded from `GameOver`'s mount effect, shown in `SettingsPanel`.
- 2026-09-09 Lobby/GameBoard headers follow the back-top-left/options-top-right convention shared with the Bergamots-hub apps.
- 2026-09-08 Finish-card win flourish: light burst + card flies to top-right corner with a glow pulse + shimmer sound.
- 2026-09-06 Invite links no longer carry hub `?name=`/`?avatar=`; online `GameBoard` shows the hub avatar thumb next to own name.
