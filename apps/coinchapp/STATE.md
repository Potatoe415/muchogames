# STATE

Replace on every update. Max 40 lines. History lives in git and `docs/decisions/`.

Status: Six card games (Coinche, Belote, Bouilla, Président, Bataille Corse, Solitaire). They now scale up on big screens such as a 4K TV browser (decision 0076).
Focus: n/a (task complete on this side)
Level: L2 (big-screen scaling, approved 2026-11-01)

Context:
- Working_On: n/a
- Relevant_Files: `app/globals.css` (root font size), `components/SolitaireTable.tsx`, `components/SolitairePiles.tsx` (`cardTops`), `components/useSolitaireFanRoom.ts`
- Do_Not_Touch: `run.bat` (local Windows launcher, left untracked)
- Relevant_Decisions: 0076 (this), 0075 (Belote), 0072 (Solitaire)

Next:
- Owner: open Solitaire and one trick game on the 4K TV browser; check the board fills the screen and long columns stay on screen.
- Owner: play one Belote match online and one ad-hoc between two phones.
- Owner: provide splash art + hub thumbnail for Belote (`public/belote-full.jpg`, root `public/games/coinchapp/assets/thumbnail-belote.jpg`), or ask for them to be generated.
- Owner: confirm the `docs/PRODUCT.md` (six games, Belote rules) and `docs/ARCHITECTURE.md` (`lib/coinche` also runs Belote; root font size scales `TableShell` metrics) edits; not applied yet.
- Owner: set `ADMIN_USER_IDS` on the `coinchapp` Vercel project (Production + Preview), same value as the hub, then redeploy.
- Move to `cartes.muchogames.win` once the owner approves adding the domain (root BACKLOG).

Open_Questions:
- La Bataille Corse's slap resolution trusts each client's self-reported `reactionMs` - accepted trade-off, no fix planned.
- Trusted-runner: host can see opponent-bot hands in mixed games - accepted trade-off, no fix planned.
- Should a permanently-bot-converted seat ever be reclaimable by its original human?
- A player who taps the screen every few seconds without ever playing can indefinitely dodge auto-play and bot conversion - accepted trade-off.
- Is a full endgame minimax solver for Bouilla worth building later?
- Duel mode never records match stats (no single "you" to attribute a win/loss to) - accepted trade-off.

Blockers: none.

Recent_Changes:
- 2026-11-01 Big screens (decision 0076): root font `clamp(16px, 100svmin / 56, 48px)`; Solitaire cards sized for a 4-width fan, long columns tighten (face-down first). Browser at 3840x2160: Solitaire cards 261 px (was 104 max), a 19-card column ends inside the screen, Président and Coinche fill the screen; at 390x844 unchanged (16 px, 50 px cards). `npm test` 366/366, `tsc` clean, `npm run build` clean, lint: only the known `useMatchStats.ts:220` error.
- 2026-10-31 Belote (decision 0075).
- 2026-10-31 Hub daily coins: `DAILY_COINS` in `lib/server/actions-match.ts` is 20, same as the hub (root decision 0055).
- 2026-10-24 Solitaire: tapping an Ace sends it straight to its foundation (decision 0074).
- 2026-10-23 Solitaire: no auto-move (decision 0073): tap picks up, tap a lit destination to move; drag and drop alongside.
