# STATE

Replace on every update. Max 40 lines. History lives in git and `docs/decisions/`.

Status: Fifth game Solitaire (Klondike) live in code (decision 0072): solo, offline only, draw 1 or 3, tap-to-move, wins only. Home tile + `/solitaire` splash + hub tile. Reuses `TableShell`/`MatchGate`, `HomeTopBar`, `GameInfoButton`, `RulesModal`, `PlayingCard`.
Focus: n/a (task complete on this side)
Level: L2 (new game, approved 2026-10-23)

Context:
- Working_On: n/a
- Relevant_Files: `lib/solitaire/`, `lib/client/useLocalSolitaireGame.ts`, `components/SolitaireTable.tsx`, `components/SolitairePiles.tsx`, `app/solitaire/page.tsx`, `lib/profileGames.ts`
- Do_Not_Touch: `run.bat` (local Windows launcher, left untracked)
- Relevant_Decisions: 0072 (this), 0071 (coins per match), 0070 (per-game results)

Next:
- Owner: confirm the `docs/PRODUCT.md` (five games) and `docs/ARCHITECTURE.md` (`lib/solitaire` row) edits; not applied yet.
- Owner: play Solitaire on a real phone (draw 1 and 3) and confirm card size and tap-to-move.
- Owner: set `ADMIN_USER_IDS` on the `coinchapp` Vercel project (Production + Preview), same value as the hub, then redeploy.
- Move to `cartes.muchogames.win` once the owner approves adding the domain (root BACKLOG).

Open_Questions:
- La Bataille Corse's slap resolution trusts each client's self-reported `reactionMs` — accepted trade-off, no fix planned.
- Trusted-runner: host can see opponent-bot hands in mixed games — accepted trade-off, no fix planned.
- Should a permanently-bot-converted seat ever be reclaimable by its original human?
- A player who taps the screen every few seconds without ever playing can indefinitely dodge auto-play and bot conversion — accepted trade-off.
- Is a full endgame minimax solver for Bouilla worth building later?
- Duel mode never records match stats (no single "you" to attribute a win/loss to) — accepted trade-off.

Blockers: none.

Recent_Changes:
- 2026-10-23 Solitaire (decision 0072). `npm test` 338/338, `tsc --noEmit` clean, changed files lint clean (full lint: only the known `useMatchStats.ts:220` error), `npm run build` clean, root `npm run check` OK. Verified in the browser at phone size: draw 3, single-destination auto-move, multi-destination pick-and-drop, resume after reload, win overlay records one `solitaire` win and frees the coin, "Quitter la partie ?" on back.
- 2026-10-03 Per-match hub coins + platform chrome `data-id`s (decision 0071).
- 2026-10-02 `HomeTopBar` settings panel: "Signaler un problème" link (`home-settings-feedback-link`).
- 2026-10-02 Per-game hub profile sync (decision 0070).
