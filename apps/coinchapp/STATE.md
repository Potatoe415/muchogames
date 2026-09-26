# STATE

Replace on every update. Max 40 lines. History lives in git and `docs/decisions/`.

Status: La Bataille Corse has a new debug mode: a checkbox on its splash screen (`app/bataillecorse/page.tsx`) persists to `localStorage`, and every table this game renders into (solo vs bot, face-to-face duel, online, ad-hoc/P2P) then shows a left-side, semi-transparent, read-only overlay with the game/match type and a live, one-line-per-move log.
Focus: n/a (task complete)
Level: L1 (one game, additive/reversible, gated behind an off-by-default checkbox)

Context:
    10|- Working_On: n/a (task complete)
- Relevant_Files: `app/bataillecorse/page.tsx`, `lib/client/bataillecorseDebugMode.ts`, `lib/client/useBataillecorseDebugLog.ts`, `components/BataillecorseDebugOverlay.tsx`, `components/BataillecorseTable.tsx`, `components/BataillecorseDuelTable.tsx`, `components/BataillecorseLocalGame.tsx`, `components/GameRoom.tsx`, `components/p2p/P2PBataillecorseHostGame.tsx`, `components/p2p/P2PClientGame.tsx`
- Do_Not_Touch: `run.bat` (local Windows launcher, left untracked)
- Relevant_Decisions: none for this fix (L1, additive/game-scoped)

Next:
- If BAT-BUG-01 still reproduces live, get a concrete repro (exact card sequence + what the UI showed) - already investigated once, no mismatch found in `pattern.ts`/`engine.ts`.
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
- 2026-09-26 La Bataille Corse: new debug mode (splash-screen checkbox, `localStorage`-persisted) showing a left-side transparent overlay with game/match type + a live move-by-move log on every mode's table (solo/duel/online/ad-hoc). Purely diagnostic, off by default, no server/network involvement.
- 2026-09-25 La Bataille Corse: moved the local setup screen's start CTA below `GameSettingsPanel` (BAT-UI-01), game-scoped only.
- 2026-09-25 Fixed a cross-game stats bug: every local/ad-hoc match used a hardcoded `gameId`, silently blocking `useRecordMatchResult`'s dedup guard after the first match per tab. `gameId` is now derived from the match's own seed.
- 2026-09-25 Président: removed the hand sort-order toggle button; hand always sorts by rank.
- 2026-09-25 Back controls return to the games hub. They no longer open this app's root.
