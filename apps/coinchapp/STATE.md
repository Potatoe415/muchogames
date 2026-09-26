# STATE

Replace on every update. Max 40 lines. History lives in git and `docs/decisions/`.

Status: La Bataille Corse (decision 0068): a tribute failure no longer instantly sweeps the pile if the failing card also completes a double/sandwich (e.g. matches the card already on top) - it opens a real `SLAP_GRACE_MS` slap window first (`GameState.pendingTributeWinner` remembers the fallback winner). Either seat can genuinely slap it and win as `"slap"`; unclaimed, it falls back to the original `"tribute"` award. Builds on 0067 (figure/ace tribute-filler slap exception removed entirely - `detectSlapPattern` is a plain unfiltered double/sandwich test) and BAT-BUG-01's rendering fix (`PILE_HISTORY_DEPTH` 2→5).
Focus: n/a (task complete)
Level: L1 (one game; engine change, logged as decision 0068)

Context:
- Working_On: n/a (task complete)
- Relevant_Files: `lib/bataillecorse/engine.ts` (`pendingTributeWinner`), `lib/bataillecorse/types.ts`, `lib/bataillecorse/test-utils.ts`, `lib/bataillecorse/engine.test.ts`, `lib/bataillecorse/pattern.ts`
- Do_Not_Touch: `run.bat` (local Windows launcher, left untracked)
- Relevant_Decisions: 0068 (this fix), 0067 (supersedes 0056/0066's filler exception)

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
- 2026-09-26 Verified working tree fully committed/pushed (only untracked `run.bat`, as expected); bumped La Bataille Corse's own splash build counter to v0.14 (`BATAILLECORSE_VERSION` in `app/bataillecorse/page.tsx`). `npm test` 308/308, `tsc --noEmit` clean, `npm run build` clean. `npm run lint` still fails on a pre-existing unrelated error in `lib/client/useMatchStats.ts` (react-hooks/set-state-in-effect) plus 3 pre-existing warnings elsewhere - not touched, out of scope for this task.
- 2026-09-26 La Bataille Corse debug overlay is no longer always floating: it's now revealed by the in-game "Info partie" button (`panelOpen`, `BataillecorseTable`/`BataillecorseDuelTable`) instead of showing the instant debug mode is on. The log itself (`useBataillecorseDebugLog`) keeps tracking the whole match regardless of whether the panel is open, so no move is lost.
- 2026-09-26 La Bataille Corse (decision 0068): a tribute failure that coincides with a double/sandwich now opens a real slap window instead of an instant sweep; unclaimed, it still falls back to the tribute award. `engine.ts`/`types.ts`/`test-utils.ts`/`engine.test.ts` updated. `npm test` 308/308.
- 2026-09-26 La Bataille Corse (decision 0067): figure/ace tribute-filler slap exception removed entirely - `pattern.ts` collapsed to a plain unfiltered double/sandwich test; answering a tribute with a challenge card always opens a fresh one, never a slap against the card it just paid off. `RulesModal.tsx` FR+EN updated.
- 2026-09-26 La Bataille Corse (decision 0066, superseded by 0067): figure/ace sandwich stopped ignoring tribute filler first, before the double half was removed too.
- 2026-09-26 BAT-BUG-01 (rendering half): `PileStack`'s visible pile depth was hardcoded to ~3 cards - raised to `PILE_HISTORY_DEPTH = 5` (shared by every table).
- 2026-09-26 La Bataille Corse debug log: fixed display order to chronological (was newest-first), auto-scrolls to newest; hardcoded English copy; checkbox moved into `HomeTopBar`'s paramètres panel; splash v0.13.
- 2026-09-25 La Bataille Corse: moved the local setup screen's start CTA below `GameSettingsPanel` (BAT-UI-01), game-scoped only.
- 2026-09-25 Fixed a cross-game stats bug: hardcoded `gameId` blocked `useRecordMatchResult`'s dedup guard; now derived from the match's own seed.
