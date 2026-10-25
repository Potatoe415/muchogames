# STATE

Replace on every update. Max 40 lines. History lives in git and `docs/decisions/`.

Status: The 4 Entertainment Pack remakes are live in the hub: `pipedream`, `jezzball`, `skifree`, `chipschallenge`, plus `minesweeper` (Démineur, classic Windows). Platform common rules (decision 0047) still live everywhere except Tranquil.
Focus: Temporary hub test hook — seven fast taps on the version badge refill daily coins to 10.
Level: L1

Context:
- Working_On: version-badge coin refill (TEMP), in production for owner play-tests.
- Relevant_Files: `hub.js`, `hub.css`, `hub-coins.js`, `api/match.js`.
- Do_Not_Touch: other games' folders; Easy Frog and GameBoy Web.
- Relevant_Decisions: 0047

Next:
- Remove the version-badge refill (`POST /api/match` action `refill`) when play-testing no longer needs it.
- Chip's Challenge / SkiFree / Démineur / JezzBall / Pipe Dream: apply owner feedback.
- `loop.js` + `storage.js` are verbatim copies in 4 games: extract to `public/shared/` if one copy has to change.
- Platform rules leftovers: owner runs `0007_coins.sql` then `0008_match_coins.sql`; `ADMIN_USER_IDS` on the `coinchapp` Vercel project; Tranquil `start_muchogames_match` + `data-id`s after its Vercel repoint; `cartes.`/`tranquil.muchogames.win` domains then launch URLs + `PROFILE_HOSTS`.
- Live checks after deploy: a match in each game drops the hub badge; Yatzy online with two devices; coinchapp online rematch charges both.

Open_Questions:
- `.prettierignore`'s `!public/games/yatsy/**` never re-included yatsy (a parent-dir exclusion needs `!public/games/yatsy/` too); the Entertainment Pack games and `minesweeper` use the working form. Fixing yatsy would reformat it — owner call.
- SkiFree bitmaps (Chris Pirih / Microsoft), Chip's Challenge tiles and the original `CHIPS.DAT` level file (Microsoft / Epyx) are copyrighted: fine for a fan remake per the owner's request, flag if the site ever goes commercial.
- Chip's Challenge runs Atari Lynx rules (Lexy's Labyrinth engine, decision 0048), not CHIPS.EXE's exact MS rules: 147/149 levels proven winnable (85 TELENET fails the public replay). Owner to confirm the feel is close enough.

Blockers:
- Tranquil step: its production still runs the old Vercel project.

Recent_Changes:
- 2026-10-25 TEMP: seven fast taps on the hub version badge refill today's coins to 10/10. Silent. Own player only (Google profile, else this browser). `npm run check` OK. Browser: six taps do nothing, a slow gap resets, the seventh updates the badge with no dialog.
- 2026-10-25 Chip's Challenge rules now come from the vendored Lexy's Labyrinth engine (MIT, `vendor/lexy/`, Lynx ruleset, decision 0048); the in-house engine is removed. Replay of the public Tile World solutions: 147/149 levels won.
