# STATE

Replace on every update. Max 40 lines. History lives in git and `docs/decisions/`.

Status: Six card games. Each home screen has a card-back picker (Classique, Sorciers, Casino, Étoiles, Jardin), stored per game (0079). French faces print V, D, R. Big screens use the remote (0078).
Focus: Owner phone check of splash offsets (`dvh`) on the home screen and each game splash.
Level: L1 (viewport units)

Context:
- Working_On: n/a
- Relevant_Files: home and splash pages (`pt-[18dvh]` / `pt-[25dvh]` / `pt-[32dvh]`), overlay `max-h-[*dvh]`
- Do_Not_Touch: `run.bat` (local Windows launcher, left untracked). Table action bars stay on `TableShell`'s safe-area spacer.
- Relevant_Decisions: 0079, 0078, root 0060

Next:
- Owner: on a phone, pick a back on each home screen, start a match, check the opponents' hands, Bataille corse piles and Solitaire stock.
- Owner: on the 4K TV browser, play Solitaire and one trick game with the remote: arrows reach every card (and the back picker), OK plays, Back closes the settings panel (or leaves to the hub on Android TV: match saved). Is 400 ms right for a double OK / double tap?
- Owner: play one Belote match online and one ad-hoc between two phones.
- Owner: confirm the `docs/PRODUCT.md` (six games, Belote rules, card-back picker) and `docs/ARCHITECTURE.md` (`lib/coinche` also runs Belote; root font size scales `TableShell` metrics; `RemoteNav` and `CardBackProvider` in the shared base) edits; not applied yet.
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
- 2026-11-03 Splash and overlay heights use `dvh` (`pt-[18dvh]`, `pt-[25dvh]`, `pt-[32dvh]`, `max-h-[60dvh]` / `70` / `85` / `90`). Action bars were not given a second safe-area pad.
- 2026-11-01 Solitaire home: the floating language control sat on the paramètres button. It now stays hidden there, same as the other home screens. Language stays inside Paramètres. Phone and desktop home checked in the browser.
- 2026-11-01 Card back per game (0079). Browser: Solitaire Sorciers on stock; Coinche Casino on the 24 opponent backs, Coinche kept its own choice. `npm test` 377/377, `tsc` clean, `npm run build` clean, lint: only the known `useMatchStats.ts:220` error.
- 2026-11-01 French faces: valet V, dame D, roi R. English stays J, Q, K.
- 2026-11-01 Remote + arrows (decision 0078).
- 2026-11-01 Solitaire double tap (decision 0077).
