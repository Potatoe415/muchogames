# STATE

Replace on every update. Max 40 lines. History lives in git and `docs/decisions/`.

Status: Bridge and the six Coinchapp card games let the player pick a card back on their home screen (decision 0056). Chip's Challenge remembers the last level. SkiFree arrow-up jumps. Millionaire has a TV mode. Daily play coins are 20 per Paris day (decision 0055).
Focus: Owner play-test of the card backs on a phone; SkiFree, Millionaire, Fruit Slash, and Échecs.
Level: L2 (cross-game card back)

Context:
- Working_On: none
- Relevant_Files: `public/shared/card-backs/*.webp`; Bridge `store.js` (`back`), `cards.css` (`--br-back`), start screen in `index.html`; coinchapp see its `STATE.md`
- Do_Not_Touch: Easy Frog, GameBoy Web; Space Cadet engine (`"resumable": false`).
- Relevant_Decisions: 0056, 0055, 0054, 0053

Next:
- Owner: on a phone, pick a back in Bridge and in each Coinchapp game, start a match, check the hidden hands and the Solitaire stock show it.
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
- Fruit Slash thumbnail is still a hand-made SVG; swap for an illustrated image if wanted.
- Git stash `wip-memory-aside` (another session, 2026-10-29) is still there; owner to keep or drop.
- SkiFree, Chip's Challenge and Space Cadet assets are copyrighted; Memory's Miraculous, Ghibli and Pat' Patrouille themes are AI art of licensed characters. The "Sorciers" back is AI art in the style of Harry Potter.

Blockers:
- Tranquil step: production still runs the old Vercel project.

Recent_Changes:
- 2026-11-01 Millionaire TV: answer B looked pre-selected (sticky hover from the TV pointer). On TV only the remote focus highlights an answer; A/B ties under the question go to A.
- 2026-11-01 Card back choice (0056): Bridge start screen + six Coinchapp home screens; per game, per device. Browser: Bridge Étoiles on hidden hands; Coinche Casino on opponents; Solitaire Sorciers on stock. `npm run check` clean.
- 2026-11-01 Belote and Bridge hub tiles use the illustrated jpgs (top-cropped). Belote splash is the same art.
- 2026-11-01 Card backs: sheet sliced into hogwarts, casino, stars, garden (`public/shared/card-backs/`).