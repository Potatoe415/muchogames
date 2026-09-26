# STATE

Replace on every update. Max 40 lines. History lives in git and `docs/decisions/`.

Status: BAT-BUG-01 root-caused: never an engine bug. `PileStack` (`BataillecorseTable.tsx`) only ever rendered the top ~3 pile cards (`HISTORY_OFFSETS` had 2 entries); a chained tribute (up to a King/Ace's 3-4 attempts) routinely buries the figure/ace pair that legitimately triggers a `pattern.ts` double/sandwich slap, so a correct win looked unexplainable. Fixed: new `PILE_HISTORY_DEPTH` raised 2→5 (5 `HISTORY_OFFSETS` entries) so that pairing stays on screen, at every stage including the win fly-away. Also finished the debug overlay's pile-win line (was mid-simplified to a bare "P1 get cards"): now `P{seat} wins {n} cards ({reason}): {every swept card}`, so a buried pattern is independently verifiable in the log too. La Bataille Corse's debug mode overall: checkbox in `HomeTopBar`'s paramètres panel (gated to `game === "bataillecorse"`), `localStorage`-persisted, chronological (oldest-first, auto-scrolled to newest) overlay on every table (solo/duel/online/ad-hoc). All debug copy hardcoded English. Splash version v0.13.
Focus: n/a (task complete)
Level: L1 (one game, visual/diagnostic fix)

Context:
    10|- Working_On: n/a (task complete)
- Relevant_Files: `components/HomeTopBar.tsx` (debug checkbox now lives here), `app/bataillecorse/page.tsx`, `lib/client/bataillecorseDebugMode.ts`, `lib/client/useBataillecorseDebugLog.ts`, `components/BataillecorseDebugOverlay.tsx`, `components/BataillecorseTable.tsx`, `components/BataillecorseDuelTable.tsx`, `components/BataillecorseLocalGame.tsx`, `components/GameRoom.tsx`, `components/p2p/P2PBataillecorseHostGame.tsx`, `components/p2p/P2PClientGame.tsx`
- Do_Not_Touch: `run.bat` (local Windows launcher, left untracked)
- Relevant_Decisions: none for this fix (L1, additive/game-scoped)

Next:
- Play one finished match launched from the hub and confirm `/profile` moves, now that the `gameId` fix is live.
- Confirm `docs/PRODUCT.md` / `docs/ARCHITECTURE.md` / `docs/SECURITY.md` wording before editing them.

    20|Open_Questions:
- La Bataille Corse's slap resolution trusts each client's self-reported `reactionMs` — accepted trade-off, no fix planned.
- Trusted-runner: host can see opponent-bot hands in mixed games — accepted trade-off, no fix planned.
- Should a permanently-bot-converted seat ever be reclaimable by its original human?
- A player who taps the screen every few seconds without ever playing can indefinitely dodge auto-play and bot conversion — accepted trade-off.
- Is a full endgame minimax solver for Bouilla worth building later?
- Duel mode never records match stats (no single "you" to attribute a win/loss to) — accepted trade-off.

Blockers: none currently known — user confirmed (2026-09-25) `0003_profiles.sql` is applied and Google Auth is enabled on `multigames-db`.

    30|Recent_Changes:
- 2026-09-26 BAT-BUG-01 fixed: `PileStack`'s visible pile depth was hardcoded to ~3 cards (2 `HISTORY_OFFSETS` entries) - any tribute chain deeper than that hid the exact figure/ace pair a legitimate `pattern.ts` slap fired from, making correct slaps look like bugs. New `PILE_HISTORY_DEPTH = 5` (5 offsets) fixes it for every table (solo/duel/online, `PileStack` is shared). Debug overlay's pile-win line now names the reason and lists every swept card (`P{seat} wins {n} cards ({reason}): {cards}`) instead of a bare "P{seat} get cards", so a buried pattern is verifiable in the log independent of the on-screen fix.
- 2026-09-26 La Bataille Corse debug log: fixed display order to chronological (was newest-first), folded a figure/ace flip and the fresh tribute it opens into one line ("P0 flips K♠ - P1 owes 3", since `resolveTributeEffect` sets both atomically), auto-scrolls to the newest entry.
- 2026-09-26 La Bataille Corse debug overlay: text is now selectable (dropped `pointer-events-none`, added `select-text`) - a deliberate exception to the "never block a tap" rule since this panel only ever exists when the opt-in debug checkbox is on.
- 2026-09-26 La Bataille Corse debug mode: made all its copy hardcoded English (no longer via `useI18n`, per its nature as a dev-only tool) and each flip line now shows the actual card (e.g. "P0 flips K♠"), derived from the pile's new top card or, for a same-tick failed-tribute sweep, `lastPileWin.cards`.
- 2026-09-26 La Bataille Corse: moved the debug-mode checkbox into `HomeTopBar`'s shared paramètres panel (game-gated, next to "Rules") instead of a standalone splash row; bumped the splash's own version counter to v0.13.
- 2026-09-26 La Bataille Corse: new debug mode (checkbox, `localStorage`-persisted) showing a left-side transparent overlay with game/match type + a live move-by-move log on every mode's table (solo/duel/online/ad-hoc). Purely diagnostic, off by default, no server/network involvement.
- 2026-09-25 La Bataille Corse: moved the local setup screen's start CTA below `GameSettingsPanel` (BAT-UI-01), game-scoped only.
- 2026-09-25 Fixed a cross-game stats bug: every local/ad-hoc match used a hardcoded `gameId`, silently blocking `useRecordMatchResult`'s dedup guard after the first match per tab. `gameId` is now derived from the match's own seed.
- 2026-09-25 Président: removed the hand sort-order toggle button; hand always sorts by rank.
- 2026-09-25 Back controls return to the games hub. They no longer open this app's root.
