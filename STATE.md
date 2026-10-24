# STATE

Replace on every update. Max 40 lines. History lives in git and `docs/decisions/`.

Status: New solo game `pipedream` (Pipe Dream remake, Canvas 2D + Web Audio, no dependency) is live in the hub, first of 4 Entertainment Pack remakes (Pipe Dream, JezzBall, SkiFree, Chip's Challenge). Platform common rules (decision 0047) still live everywhere except Tranquil.
Focus: Owner play-test of Pipe Dream (mobile portrait/landscape, desktop). JezzBall only after the owner's go.
Level: L1 (pipedream); platform rules task stays L2 (approved 2026-10-03).

Context:
- Working_On: Pipe Dream delivered; waiting for owner feedback.
- Relevant_Files: `public/games/pipedream/` (read its `NOTES.md` first), `public/hub-config.json` entry `pipedream`.
- Do_Not_Touch: other games' folders; Easy Frog and GameBoy Web.
- Relevant_Decisions: 0047, 0007, 0038, 0042

Next:
- Pipe Dream: apply owner feedback (difficulty curve lives in `levels.js`).
- JezzBall (`public/games/jezzball/`) on owner go, same module split as Pipe Dream.
- Platform rules leftovers: owner runs `0007_coins.sql` then `0008_match_coins.sql`; `ADMIN_USER_IDS` on the `coinchapp` Vercel project; Tranquil `start_muchogames_match` + `data-id`s after its Vercel repoint; `cartes.`/`tranquil.muchogames.win` domains then launch URLs + `PROFILE_HOSTS`.
- Live checks after deploy: a match in each game drops the hub badge; Yatzy online with two devices; coinchapp online rematch charges both.

Open_Questions:
- `.prettierignore`'s `!public/games/yatsy/**` never re-included yatsy (a parent-dir exclusion needs `!public/games/yatsy/` too); `pipedream` uses the working form. Fixing yatsy would reformat it — owner call.

Blockers:
- Tranquil step: its production still runs the old Vercel project.

Recent_Changes:
- 2026-10-24 New hub game `pipedream` (`public/games/pipedream/`, category `autres`, solo): 10x7 grid (7x10 portrait), 7 pieces, 5-piece FIFO, overwrite −50 with 0.6 s lock, cross bonus, quota, unused-pipe sweep, rocks from level 3, fast-forward, best score in `localStorage`. `GAMES_MAP.md` row + `NOTES.md`. `npm run check` OK.
- 2026-10-23 New hub game `solitaire` (Klondike, solo) served by `apps/coinchapp` (its decision 0072).
- 2026-10-03 `/profile` split into two tabs: Infos and Statistiques; `profile-tabs.js`.
- 2026-10-03 PRODUCT/ARCHITECTURE/SECURITY updated for coins per match (owner OK); decision 0047.
