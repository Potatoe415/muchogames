# STATE

Replace on every update. Max 40 lines. History lives in git and `docs/decisions/`.

Status: La Bataille Corse online tribute chain (decision 0069): while you owe several cards, each tap paints the real face, stock, and attempts immediately. `flipCard` still runs afterwards, one call at a time. `PlayerView.myNextCards` is your own upcoming cards, capped at the attempts you owe.
Focus: n/a (task complete)
Level: L1 (one game; view field + optimistic flip queue)

Context:
- Working_On: n/a (task complete)
- Relevant_Files: `lib/client/useOptimisticFlip.ts`, `lib/client/optimisticFlipQueue.ts`, `lib/bataillecorse/redact.ts`, `components/BataillecorseTable.tsx`
- Do_Not_Touch: `run.bat` (local Windows launcher, left untracked)
- Relevant_Decisions: 0069 (this), 0059 (single flip paints on the same frame), 0068 (tribute failure opens a slap first)

Next:
- Play one finished match launched from the hub and confirm `/profile` moves, now that the `gameId` fix is live.
- Confirm `docs/PRODUCT.md` / `docs/SECURITY.md` wording before editing them. `docs/ARCHITECTURE.md` and `docs/DATA_MODEL.md` already describe `myNextCards`.

Open_Questions:
- La Bataille Corse's slap resolution trusts each client's self-reported `reactionMs` — accepted trade-off, no fix planned.
- Trusted-runner: host can see opponent-bot hands in mixed games — accepted trade-off, no fix planned.
- Should a permanently-bot-converted seat ever be reclaimable by its original human?
- A player who taps the screen every few seconds without ever playing can indefinitely dodge auto-play and bot conversion — accepted trade-off.
- Is a full endgame minimax solver for Bouilla worth building later?
- Duel mode never records match stats (no single "you" to attribute a win/loss to) — accepted trade-off.

Blockers: none currently known — user confirmed (2026-09-25) `0003_profiles.sql` is applied and Google Auth is enabled on `multigames-db`.

Recent_Changes:
- 2026-09-27 La Bataille Corse (decision 0069): online tribute flips no longer wait on the server between cards. The view now includes `myNextCards` (own stock only, capped at attempts owed) and `useOptimisticFlip` queues taps, then submits `flipCard` in order. `npm test` 315/315, `tsc --noEmit` clean, `npm run build` clean. `npm run lint` still fails only on the pre-existing `useMatchStats.ts` set-state-in-effect error.
- 2026-09-26 Verified working tree fully committed/pushed (only untracked `run.bat`, as expected); bumped La Bataille Corse's own splash build counter to v0.14 (`BATAILLECORSE_VERSION` in `app/bataillecorse/page.tsx`). `npm test` 308/308, `tsc --noEmit` clean, `npm run build` clean. `npm run lint` still fails on a pre-existing unrelated error in `lib/client/useMatchStats.ts` (react-hooks/set-state-in-effect) plus 3 pre-existing warnings elsewhere - not touched, out of scope for this task.
- 2026-09-26 La Bataille Corse debug overlay is no longer always floating: it's now revealed by the in-game "Info partie" button (`panelOpen`, `BataillecorseTable`/`BataillecorseDuelTable`) instead of showing the instant debug mode is on. The log itself (`useBataillecorseDebugLog`) keeps tracking the whole match regardless of whether the panel is open, so no move is lost.
- 2026-09-26 La Bataille Corse (decision 0068): a tribute failure that coincides with a double/sandwich now opens a real slap window instead of an instant sweep; unclaimed, it still falls back to the tribute award.
