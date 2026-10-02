# STATE

Replace on every update. Max 40 lines. History lives in git and `docs/decisions/`.

Status: Finished matches now sync to the hub profile per game (`coinche`, `bouilla`, `president`, `bataillecorse`, decision 0070). The combined counter in `HomeTopBar` is unchanged. Until the hub's `0005_game_stats.sql` runs, the server falls back to the totals-only RPC.
Focus: n/a (task complete)
Level: L2 (cross-app, part of the root roadmap `docs/tasks/platform-admin-profile-roadmap.md`)

Context:
- Working_On: n/a (task complete)
- Relevant_Files: `lib/client/matchResultStats.ts` (`planSharedSync`), `lib/client/profileSync.ts`, `lib/server/profileLink.ts`, `lib/profileGames.ts`
- Do_Not_Touch: `run.bat` (local Windows launcher, left untracked)
- Relevant_Decisions: 0070 (this), 0055 (combined counter), 0069 (Bataille Corse tribute chain)

Next:
- After the owner runs the hub's `0005_game_stats.sql`: finish one match per game launched from the hub, confirm the per-game rows on `/profile`.
- Confirm `docs/PRODUCT.md` / `docs/SECURITY.md` wording before editing them.

Open_Questions:
- La Bataille Corse's slap resolution trusts each client's self-reported `reactionMs` — accepted trade-off, no fix planned.
- Trusted-runner: host can see opponent-bot hands in mixed games — accepted trade-off, no fix planned.
- Should a permanently-bot-converted seat ever be reclaimable by its original human?
- A player who taps the screen every few seconds without ever playing can indefinitely dodge auto-play and bot conversion — accepted trade-off.
- Is a full endgame minimax solver for Bouilla worth building later?
- Duel mode never records match stats (no single "you" to attribute a win/loss to) — accepted trade-off.

Blockers: none.

Recent_Changes:
- 2026-10-02 Per-game hub profile sync (decision 0070): new `localStorage` keys `coinchapp-match-results-by-game` / `coinchapp-profile-synced-by-game`; `syncSharedMatchResults` takes a `game`. `npm test` 321/321, `tsc --noEmit` clean, `npm run build` clean. `npm run lint` still fails only on the pre-existing `useMatchStats.ts` error.
- 2026-09-27 La Bataille Corse (decision 0069): online tribute flips no longer wait on the server between cards.
- 2026-09-26 La Bataille Corse debug overlay revealed by the in-game "Info partie" button; splash build counter v0.14.
- 2026-09-26 La Bataille Corse (decision 0068): a tribute failure that coincides with a double/sandwich opens a real slap window.
