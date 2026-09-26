# STATE

Replace on every update. Max 40 lines. History lives in git and `docs/decisions/`.

Status: The figure/ace tribute-filler slap exception (decision 0056) is now fully removed (decisions 0066 then 0067). `detectSlapPattern` (`lib/bataillecorse/pattern.ts`) is back to a plain, unfiltered double/sandwich test on the real pile - no figure/ace-only special case at all. A challenge-rank card answering a tribute always opens a brand new one (full attempt count); it never counts as a slap against the card that opened the tribute it just paid off, even same-rank. Separately, BAT-BUG-01's rendering half stays fixed: `PILE_HISTORY_DEPTH` 2→5 so `PileStack` shows more of a deep pile. Debug overlay's pile-win line names the reason + lists every swept card. La Bataille Corse debug mode (checkbox in `HomeTopBar` paramètres, `localStorage`-persisted) shows a chronological overlay on every table. Splash v0.13.
Focus: n/a (task complete)
Level: L1 (one game; pattern.ts change is a rules-engine correction, logged as decision 0067)

Context:
- Working_On: n/a (task complete)
- Relevant_Files: `lib/bataillecorse/pattern.ts` (now a single ~10-line function), `lib/bataillecorse/engine.test.ts`, `components/BataillecorseTable.tsx` (`PILE_HISTORY_DEPTH`), `lib/client/useBataillecorseDebugLog.ts`, `components/RulesModal.tsx`
- Do_Not_Touch: `run.bat` (local Windows launcher, left untracked)
- Relevant_Decisions: 0067 (filler exception removed entirely, supersedes the rest of 0056/0066)

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
- 2026-09-26 La Bataille Corse (decision 0067): figure/ace tribute-filler slap exception removed entirely - `pattern.ts` collapsed back to a plain unfiltered double/sandwich test; answering a tribute with a challenge card always opens a fresh one, never a slap against the card it just paid off. `pattern.test.ts`/`engine.test.ts`/`RulesModal.tsx` FR+EN updated. `npm test` 305/305.
- 2026-09-26 La Bataille Corse (decision 0066, now superseded by 0067): figure/ace sandwich stopped ignoring tribute filler first, before the double half was removed too.
- 2026-09-26 BAT-BUG-01 (rendering half): `PileStack`'s visible pile depth was hardcoded to ~3 cards - raised to `PILE_HISTORY_DEPTH = 5` (shared by every table). Debug overlay's pile-win line now names the reason + lists every swept card instead of a bare "P{seat} get cards".
- 2026-09-26 La Bataille Corse debug log: fixed display order to chronological (was newest-first), auto-scrolls to newest.
- 2026-09-26 La Bataille Corse debug mode: hardcoded English copy, moved the checkbox into `HomeTopBar`'s paramètres panel; splash v0.13. Left-side overlay, move-by-move log, every mode's table, off by default.
- 2026-09-25 La Bataille Corse: moved the local setup screen's start CTA below `GameSettingsPanel` (BAT-UI-01), game-scoped only.
- 2026-09-25 Fixed a cross-game stats bug: hardcoded `gameId` blocked `useRecordMatchResult`'s dedup guard; now derived from the match's own seed.
- 2026-09-25 Président: removed the hand sort-order toggle button; hand always sorts by rank.
- 2026-09-25 Back controls return to the games hub, not this app's root.
