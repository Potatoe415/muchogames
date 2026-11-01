# STATE

Replace on every update. Max 40 lines. History lives in git and `docs/decisions/`.

Status: Six card games (Coinche, Belote, Bouilla, Président, Bataille Corse, Solitaire). Big screens: they fill a 4K TV (0076) and play with arrow keys / the TV remote (0078). Solitaire: double tap sends a card to its foundation (0077).
Focus: n/a (task complete on this side)
Level: L2 (remote + arrow navigation, approved 2026-11-01)

Context:
- Working_On: n/a
- Relevant_Files: `components/RemoteNav.tsx` (mounted in `app/layout.tsx`), `app/globals.css` (root font size, pink focus ring), `components/SolitairePiles.tsx` (`cardTops`), `lib/client/useLocalSolitaireGame.ts` (`DOUBLE_TAP_MS`)
- Do_Not_Touch: `run.bat` (local Windows launcher, left untracked)
- Relevant_Decisions: 0078, 0077, 0076, 0073 (no auto-move)

Next:
- Owner: on the 4K TV browser, play Solitaire and one trick game with the remote: arrows reach every card, OK plays, Back closes the settings panel (or leaves to the hub on Android TV: match saved). Is 400 ms right for a double OK / double tap?
- Owner: play one Belote match online and one ad-hoc between two phones.
- Owner: provide splash art + hub thumbnail for Belote (`public/belote-full.jpg`, root `public/games/coinchapp/assets/thumbnail-belote.jpg`), or ask for them to be generated.
- Owner: confirm the `docs/PRODUCT.md` (six games, Belote rules) and `docs/ARCHITECTURE.md` (`lib/coinche` also runs Belote; root font size scales `TableShell` metrics; `RemoteNav` in the shared base) edits; not applied yet.
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
- 2026-11-01 Remote + arrows (decision 0078). Keyboard only in the browser: Solitaire waste 3♥ picked up with OK, Right to its foundation, OK moved it; Down walks a fanned column card by card; settings panel opened with OK, arrows stayed inside it, Escape closed it; Président hand reached with arrows, card played with OK. `npm test` 373/373, `tsc` clean, `npm run build` clean.
- 2026-11-01 Solitaire double tap (decision 0077).
- 2026-11-01 Big screens (decision 0076): root font `clamp(16px, 100svmin / 56, 48px)`; Solitaire long columns tighten (face-down first). 4K: Solitaire cards 261 px (was 104 max); phone unchanged.
- 2026-10-31 Belote (decision 0075).
- 2026-10-23 Solitaire: no auto-move (decision 0073): tap picks up, tap a lit destination to move; drag and drop alongside.
