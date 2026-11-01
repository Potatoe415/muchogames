# STATE

Replace on every update. Max 40 lines. History lives in git and `docs/decisions/`.

Status: Four playing-card backs are cut and not wired into the games yet. SkiFree arrow-up jumps. Millionaire has a TV mode. Daily play coins are 20 per Paris day (decision 0055).
Focus: Wire `public/shared/card-backs/` into Bridge and the Coinchapp card games. Owner play-test of SkiFree, Millionaire, Fruit Slash, and Échecs.
Level: L1

Context:
- Working_On: none
- Relevant_Files: `public/shared/card-backs/{hogwarts,casino,stars,garden}.webp`
- Do_Not_Touch: `apps/**`; Easy Frog, GameBoy Web; Space Cadet engine (`"resumable": false`).
- Relevant_Decisions: 0055, 0054, 0053, 0050

Next:
- Wire hogwarts, casino, stars, and garden as a back choice in Bridge and every Coinchapp card game. Memory keeps its square backs.
- Owner: on the TV browser open `https://www.muchogames.win/games/millionaire/index.html?tv=1` once (then remembered; Options → "Mode TV" toggles it). Check: whole screen, remote arrows/OK/Back, fullscreen on "Commencer", no screen saver mid-match.
- Owner: play Fruit Slash with a kid on a phone and a tablet, both orientations: item size/speed in Petit ninja, star thresholds (`MODES.*.stars` in `public/games/fruitslash/rules.js`).
- Owner: play Échecs on iPhone and Android, the 4 levels, castling, promotion, clock + Pause, "Reprendre".
- Owner: play Memory solo, judge the points weights (`public/games/memory/points.js`).
- Owner phone check of resume in every game, then Memory and Yatzy online on two phones — see `docs/BACKLOG.md` Now.
- Owner to play Bridge and judge robot bidding.
- Platform leftovers: `0007_coins.sql` then `0008_match_coins.sql`; `ADMIN_USER_IDS` on coinchapp; Tranquil match start after its Vercel repoint (must pass `p_daily` 20).
- Proposed: `docs/ARCHITECTURE.md` still says 7 Hobby functions and omits `GET /api/popular`; `docs/SECURITY.md` does not list that public read.

Open_Questions:
- TV Back key: Android TV browsers may navigate back instead of sending a key to the page; then Back leaves to the hub (the match stays saved).
- Fruit Slash and Bridge thumbnails are hand-made SVGs; swap for illustrated images if wanted.
- Git stash `wip-memory-aside` (another session, 2026-10-29) is still there; owner to keep or drop.
- SkiFree, Chip's Challenge and Space Cadet assets are copyrighted; Memory's Miraculous, Ghibli and Pat' Patrouille themes are AI art of licensed characters.

Blockers:
- Tranquil step: production still runs the old Vercel project.

Recent_Changes:
- 2026-11-01 Card backs: sheet sliced into hogwarts, casino, stars, garden (`public/shared/card-backs/`).
- 2026-11-01 SkiFree: arrow up jumps (keyboard and TV remote, even if a button has focus). Z/W and numpad 8 still climb.
- 2026-10-31 Millionaire TV mode: 1920x1080 canvas zoomed to the TV, ladder always shown, show-style lozenges, remote spatial navigation, fullscreen + wake lock. `app.js` untouched.
- 2026-10-31 Memory online: opponent's cards stay face up at least 1 s on the other device (`REVEAL_MS`).
- 2026-10-31 Yatzy online: game ended by the opponent's move no longer crashes (sw v45).
