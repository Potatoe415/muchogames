# STATE

Replace on every update. Max 40 lines. History lives in git and `docs/decisions/`.

Status: La Bataille Corse stock taps are ignored for the whole pile-win sweep (`pileFlying`), same as slaps already were — spam-clicking the deck during that animation can no longer queue flips that all land at once when the sweep ends. Splash shows `v0.3`. Deployed on Vercel (project `coinchapp`, team `remiinsf-3156s-projects`).
Focus: Get explicit user confirmation to (a) delete the superseded `docs/TECH.md`, `docs/DECISIONS.md`, `CLAUDE.md`, `.cursor/rules/000-router.mdc`, and (b) update `docs/PRODUCT.md` Out_Of_Scope wording now that a wins/losses stat exists.
Level: L1

Context:
- Working_On: `lib/client/useOptimisticFlip.ts`, `components/BataillecorseTable.tsx`, `components/BataillecorseDuelTable.tsx`
- Relevant_Files: `lib/client/useOptimisticFlip.test.ts`
- Do_Not_Touch: `run.bat` (local Windows launcher, left untracked)
- Relevant_Decisions: `docs/decisions/INDEX.md` 0061 (face-to-face home button)

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
- 2026-09-23 la Bataille Corse: stock flips are blocked while `useDisplayPile`'s pile-win sweep is in flight (`canFlip(..., blocked)`), vs-bot and duel. Splash version bumped to `v0.3`.
- 2026-09-23 la Bataille Corse splash: `v0.2` plus "Forcer le refresh" (`forceUpdate`).
- 2026-09-22 la Bataille Corse: very-fast reflex 400ms; duel player 2 stock under header; pile-flying slap guard.
- 2026-09-22 Bootstrap v10.1 alignment (docs/context-architecture only).
