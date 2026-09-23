# STATE

Replace on every update. Max 40 lines. History lives in git and `docs/decisions/`.

Status: Président now enforces "finishing on a 2 loses" (solo/online/ad-hoc, same engine) - decision 0064. 262 tests green, `tsc`/build clean. Deployed on Vercel (project `coinchapp`, team `remiinsf-3156s-projects`).
Focus: Get explicit user confirmation to (a) delete the superseded `docs/TECH.md`, `docs/DECISIONS.md`, `CLAUDE.md`, `.cursor/rules/000-router.mdc`, and (b) update `docs/PRODUCT.md` Out_Of_Scope wording now that a wins/losses stat exists.
Level: L2 (data model - new `GameState.losingFinishSeats` field)

Context:
- Working_On: `lib/president/play.ts`, `lib/president/scoring.ts`, `lib/president/types.ts`, `lib/president/deal.ts`, `lib/president/test-utils.ts`
- Relevant_Files: `lib/president/play.test.ts`, `lib/president/scoring.test.ts`
- Do_Not_Touch: `run.bat` (local Windows launcher, left untracked)
- Relevant_Decisions: `docs/decisions/INDEX.md` 0064 (finishing on a 2 forces Trou du Cul at round end), 0047 (2 burns the pile)

Next:
- Ask the user to confirm deletion of the 4 superseded router/flat-doc files (see Focus).
- Ask the user to confirm the `docs/PRODUCT.md` Out_Of_Scope wording edit (see Focus).
- Resume verification backlog — see `docs/BACKLOG.md` Now.

Open_Questions:
- La Bataille Corse's slap resolution trusts each client's self-reported `reactionMs` — accepted trade-off, no fix planned.
- Trusted-runner: host can see opponent-bot hands in mixed games — accepted trade-off, no fix planned.
- Should a permanently-bot-converted seat ever be reclaimable by its original human?
- A player who taps the screen every few seconds without ever playing can indefinitely dodge auto-play and bot conversion — accepted trade-off.
- Is a full endgame minimax solver for Bouilla worth building later?
- Duel mode never records match stats (no single "you" to attribute a win/loss to) — accepted trade-off.

Blockers:
- None.

Recent_Changes:
- 2026-09-23 Président: finishing your hand on a losing 2 (single/pair/triple) forces Trou du Cul at round-end scoring, no early round-end (decision 0064).
- 2026-09-23 la Bataille Corse: P1 pile-win glow is green, opponent stays yellow (`v0.12`).
- 2026-09-23 la Bataille Corse: in-game back goes to the splash (`v0.11`); caption glued under the ring (`v0.10`).
