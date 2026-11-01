# STATE

Replace on every update. Max 40 lines. History lives in git and `docs/decisions/`.

Status: Sixth game Belote live (decision 0075). Splash and home tile use `public/belote-full.jpg`. Hub tile is the same art, cropped.
Focus: n/a (task complete on this side)
Level: L2 (new game, approved 2026-10-31)

Context:
- Working_On: n/a
- Relevant_Files: `lib/coinche/belote.ts`, `lib/coinche/belote-bot.ts`, `components/BeloteBiddingPanel.tsx`, `components/beloteRules.ts`, `app/belote/page.tsx`, `lib/supabase/types.ts` (`usesCoincheEngine`)
- Do_Not_Touch: `run.bat` (local Windows launcher, left untracked)
- Relevant_Decisions: 0075 (this), 0072 (Solitaire precedent), 0071 (coins per match)

Next:
- Owner: play one Belote match online (no Supabase keys locally, so online was not browser-tested) and one ad-hoc between two phones.
- Owner: confirm the `docs/PRODUCT.md` (six games, Belote rules) and `docs/ARCHITECTURE.md` (`lib/coinche` also runs Belote) edits; not applied yet.
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
- 2026-11-01 Belote splash + home tile: `public/belote-full.jpg` (same art as the hub thumbnail).
- 2026-10-31 Belote (decision 0075). `npm test` 366/366, `tsc --noEmit` clean, lint: only the known `useMatchStats.ts:220` error, `npm run build` clean. Browser at phone size: solo take on the turned suit, pass to the second go-round (turned suit excluded), naming a suit gives the taker the turned card, full deal scored 106 + 56 = 162, next deal re-opens bidding; ad-hoc setup shows only target + bot level; Coinche solo unchanged.
- 2026-10-31 Hub daily coins: `DAILY_COINS` in `lib/server/actions-match.ts` is 20, same as the hub (root decision 0055).
- 2026-10-24 Solitaire: tapping an Ace sends it straight to its foundation (decision 0074).
- 2026-10-23 Solitaire: no auto-move (decision 0073): tap picks up, tap a lit destination to move; drag and drop alongside.
- 2026-10-23 Solitaire: "Terminer" button and Windows-style win cascade.
- 2026-10-23 Solitaire (decision 0072).
