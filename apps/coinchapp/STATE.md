# STATE

Replace on every update. Max 40 lines. History lives in git and `docs/decisions/`.

Status: Président waits out every play animation (enter, collect, skip, crown, quad hold) before the next card, in every mode. Splash stamp `v0.3`. In-game back still returns to `/president`.
Focus: Get explicit user confirmation to (a) delete the superseded `docs/TECH.md`, `docs/DECISIONS.md`, `CLAUDE.md`, `.cursor/rules/000-router.mdc`, and (b) update `docs/PRODUCT.md` Out_Of_Scope wording now that a wins/losses stat exists.
Level: L1

Context:
- Working_On: `lib/client/presidentAnimationLock.ts`, `components/PresidentTable.tsx`
- Relevant_Files: `lib/client/useBotRunner.ts`, `lib/client/useLocalPresidentGame.ts`, `lib/client/useP2PPresidentHost.ts`, `lib/client/cardGameDriver.ts`
- Do_Not_Touch: `run.bat` (local Windows launcher, left untracked)
- Relevant_Decisions: 0065 (2s pile hold), 0047 (burn), 0048 (double / completed rank)

Next:
- Ask the user to confirm deletion of the 4 superseded router/flat-doc files (see Focus).
- Ask the user to confirm the `docs/PRODUCT.md` Out_Of_Scope wording edit (see Focus).
- Sanity-check Président in-game: close a square and win a pile by passes, all three modes.

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
- 2026-09-24 Président: next play waits until the current animation fully ends, every player, every mode.
- 2026-09-24 Président: in-game back returns to the `/president` splash. Splash stamp `v0.3`.
- 2026-09-24 Président: closing a square or winning the pile by passes plays enter then flies toward the seat.
