# STATE

Replace on every update. Max 40 lines. History lives in git and `docs/decisions/`.

Status: Président slide-in of your own play comes from your seat. The optimistic pile was keeping the previous leader, so the card often glided in from the left. Splash stamp `v0.5`.
Focus: Get explicit user confirmation to (a) delete the superseded `docs/TECH.md`, `docs/DECISIONS.md`, `CLAUDE.md`, `.cursor/rules/000-router.mdc`, and (b) update `docs/PRODUCT.md` Out_Of_Scope wording now that a wins/losses stat exists.
Level: L1

Context:
- Working_On: `lib/client/usePresidentOptimisticPlay.ts`
- Relevant_Files: `lib/client/usePresidentPileDisplay.ts`, `components/PresidentTable.tsx`
- Do_Not_Touch: `run.bat` (local Windows launcher, left untracked)
- Relevant_Decisions: none (display direction only)

Next:
- Ask the user to confirm deletion of the 4 superseded router/flat-doc files (see Focus).
- Ask the user to confirm the `docs/PRODUCT.md` Out_Of_Scope wording edit (see Focus).
- Sanity-check Président: playing onto someone else's pile slides in from your own seat.

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
- 2026-09-24 Président: your own play slides in from your seat, not from the previous leader.
- 2026-09-24 Président: the pile winner leads next if they still can; a skipped seat no longer takes that lead.
- 2026-09-24 Président: next play waits until the current animation fully ends. Splash stamp `v0.5`.
