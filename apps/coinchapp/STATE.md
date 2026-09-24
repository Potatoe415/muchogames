# STATE

Replace on every update. Max 40 lines. History lives in git and `docs/decisions/`.

Status: Président: pile play-enter + collect-fly now run for a closed square/burn and for a pass-won pile, in every mode. 287 tests green, `tsc`/build clean; full `lint` still fails on pre-existing `useMatchStats.ts:220` (out of scope).
Focus: Get explicit user confirmation to (a) delete the superseded `docs/TECH.md`, `docs/DECISIONS.md`, `CLAUDE.md`, `.cursor/rules/000-router.mdc`, and (b) update `docs/PRODUCT.md` Out_Of_Scope wording now that a wins/losses stat exists.
Level: L1

Context:
- Working_On: `lib/client/usePresidentPileDisplay.ts`, `components/PresidentTable.tsx`
- Relevant_Files: `lib/client/usePresidentPileHold.ts`, `lib/client/presidentEngineAdapter.ts`
- Do_Not_Touch: `run.bat` (local Windows launcher, left untracked)
- Relevant_Decisions: `docs/decisions/INDEX.md` 0065 (2s pile hold), 0047 (2 burns the pile), 0048 (double rule / completed rank burns)

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
- 2026-09-24 Président: closing a square / burning, and winning the pile by passes, now play-enter then fly toward the seat (every mode).
- 2026-09-23 Président: pile holds a quad/hand-emptying play on screen for at least 2s (decision 0065).
- 2026-09-23 Président: finishing your hand on a losing 2 forces Trou du Cul at round-end scoring (decision 0064).
