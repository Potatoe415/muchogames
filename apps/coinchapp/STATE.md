# STATE

Replace on every update. Max 40 lines. History lives in git and `docs/decisions/`.

Status: BAT-BUG-01 fully resolved, two causes. (1) Rendering: `PileStack` only ever showed the top ~3 pile cards; a chained tribute (3-4 attempts) routinely buried the figure/ace pair a legitimate `pattern.ts` slap fired from, so correct wins looked unexplainable - fixed via `PILE_HISTORY_DEPTH` 2→5. (2) Rule: the figure/ace filtered check (decision 0056) had wrongly extended to *sandwich* too - a live repro (`Q,K,8,7,Q`) showed a "sandwich" firing with 2 real cards between the outer Qs, not 1 - fixed (decision 0066): filtered check is double-only now; sandwich always needs exactly one real card, unfiltered. Debug overlay's pile-win line now names the reason + lists every swept card. La Bataille Corse debug mode (checkbox in `HomeTopBar` paramètres, `game === "bataillecorse"`, `localStorage`-persisted) shows a chronological overlay on every table. Splash v0.13.
Focus: n/a (task complete)
Level: L1 (one game; pattern.ts change is a rules-engine correction, logged as decision 0066)

Context:
- Working_On: n/a (task complete)
- Relevant_Files: `lib/bataillecorse/pattern.ts`, `components/BataillecorseTable.tsx` (`PILE_HISTORY_DEPTH`), `lib/client/useBataillecorseDebugLog.ts`, `components/BataillecorseDebugOverlay.tsx`, `components/RulesModal.tsx`
- Do_Not_Touch: `run.bat` (local Windows launcher, left untracked)
- Relevant_Decisions: 0066 (sandwich no longer figure-filtered), see also 0056 (double filtering it partially supersedes)

Next:
- Play one finished match launched from the hub and confirm `/profile` moves, now that the `gameId` fix is live.
- Confirm `docs/PRODUCT.md` / `docs/ARCHITECTURE.md` / `docs/SECURITY.md` wording before editing them.

Open_Questions:
- La Bataille Corse's slap resolution trusts each client's self-reported `reactionMs` — accepted trade-off, no fix planned.
- Trusted-runner: host can see opponent-bot hands in mixed games — accepted trade-off, no fix planned.
- Should a permanently-bot-converted seat ever be reclaimable by its original human?
- A player who taps the screen every few seconds without ever playing can indefinitely dodge auto-play and bot conversion — accepted trade-off.
- Is a full endgame minimax solver for Bouilla worth building later?
- Duel mode never records match stats (no single "you" to attribute a win/loss to) — accepted trade-off.

Blockers: none currently known — user confirmed (2026-09-25) `0003_profiles.sql` is applied and Google Auth is enabled on `multigames-db`.

Recent_Changes:
- 2026-09-26 La Bataille Corse (decision 0066): figure/ace sandwich no longer ignores tribute filler - only the double check still filters it out; sandwich always requires exactly one real card between the two matching cards. `pattern.ts`/`pattern.test.ts`/`RulesModal.tsx` FR+EN updated. `npm test` 305/305.
- 2026-09-26 BAT-BUG-01 (rendering half): `PileStack`'s visible pile depth was hardcoded to ~3 cards - raised to `PILE_HISTORY_DEPTH = 5` (shared by every table). Debug overlay's pile-win line now names the reason + lists every swept card instead of a bare "P{seat} get cards".
- 2026-09-26 La Bataille Corse debug log: fixed display order to chronological (was newest-first), folded a figure/ace flip and the fresh tribute it opens into one line, auto-scrolls to newest.
- 2026-09-26 La Bataille Corse debug overlay: text selectable (dropped `pointer-events-none`) - deliberate exception, only exists behind the opt-in checkbox.
- 2026-09-26 La Bataille Corse debug mode: hardcoded English copy, flip lines show the actual card; moved the checkbox into `HomeTopBar`'s paramètres panel; splash v0.13. New debug mode overall: left-side overlay, move-by-move log, every mode's table, off by default.
- 2026-09-25 La Bataille Corse: moved the local setup screen's start CTA below `GameSettingsPanel` (BAT-UI-01), game-scoped only.
- 2026-09-25 Fixed a cross-game stats bug: hardcoded `gameId` blocked `useRecordMatchResult`'s dedup guard; now derived from the match's own seed.
- 2026-09-25 Président: removed the hand sort-order toggle button; hand always sorts by rank.
- 2026-09-25 Back controls return to the games hub, not this app's root.
