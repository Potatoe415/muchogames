# STATE

Replace on every update. Max 40 lines. History lives in git and `docs/decisions/`.

Status: Six card games. Every human seat shows the player's mascot (hub `?mascot=`, else random; 0081). Desktop Coinche keeps the trick and seats near the centre, bot avatars x3 on desktop. Bots play for points (dix de der). Card-back picker per game (0079). Big screens use the remote (0078).
Focus: Owner play-test: mascots on seats (local, online, ad-hoc), desktop Coinche layout, bots keeping their master trump for the last trick.
Level: L2 (cross-app identity: hub mascot travels to every card game)

Context:
- Working_On: n/a
- Relevant_Files: `lib/mascots.ts`, `lib/client/hubName.ts` (`readMyMascot`), `components/gameTableHelpers.ts` (`seatAvatar`/`seatMascot`), `lib/client/botSim.ts` (`POINTS_TIEBREAK_WEIGHT`), `lib/coinche/bot.ts` (`keepMasterTrumpForLast`), `components/TrickStage.tsx`, `components/GameTableScene.tsx`
- Do_Not_Touch: `run.bat` (local Windows launcher, left untracked). Table action bars stay on `TableShell`'s safe-area spacer.
- Relevant_Decisions: 0081, 0080, 0079, 0078, root 0067

Next:
- Owner: on desktop, a Coinche deal vs bots: trick grouped in the centre, big bot avatars, your mascot above your hand; late in a deal, bots keep a master trump for the last trick. Then an online and an ad-hoc game on two devices: each player sees the other's mascot. Mascots ride in `games.settings.playerMascots` because the coinchapp Supabase project was not reachable here; a `game_players.mascot` column is cleaner if wanted.
- Owner: play the whole tutorial on a phone (6 parts, ~10 min). Is the length right, and is the copy clear for a beginner? The scoring chapter teaches the local defaults (contract value only, defense 0 when made).
- Owner: local Coinche, pick a different profile per bot, check the dropdown, avatars on badges, and that bots coinche. Same in an online lobby (host picks after "fill with bots").
- `npm run build` fails here before any change too ("couldn't find next/package.json", `next` only in root `node_modules`): fix the local install, then re-run the build.
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
- 2026-11-21 Desktop Coinche centred + bot avatars x3 (lg); bot search scores card points as a tiebreak, engine bot keeps the master trump (tests show the old search played it); mascots on every seat (0081). `npm test` 406/406, `tsc` clean, lint: only pre-existing findings, `next build --webpack` OK (turbopack build still hits the local env error). Local Coinche checked in the browser (desktop + phone).
- 2026-11-20 Coinche "Apprendre à jouer" button on the home screen: 6 chapters (bases, cartes, plis, annonces, points, 3 guided deals vs bots) with tooltips, quizzes and the real trick animations. `npm test` 398/398, `tsc` clean, lint clean on new files, `check:games` OK. Build still blocked by the local env error. The whole tour was clicked through in headless Edge (webpack dev): no console errors.
