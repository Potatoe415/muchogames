# STATE

Replace on every update. Max 40 lines. History lives in git and `docs/decisions/`.

Status: Fruit Slash (`/games/fruitslash/`) added: kids' slicing arcade, 60 s, 6 themes (fruits, légumes, bonbons, jouets, espace, mélange), Petit ninja (no bombs) / Grand ninja (bombs), combos, bonus star, save/resume.
Focus: Owner play-test of Fruit Slash and Échecs on phones; owner phone checks of resume (local + online) and of the Memory solo score.
Level: L1

Context:
- Working_On: none
- Relevant_Files: `public/games/fruitslash/NOTES.md`; `docs/PLATFORM_RULES.md` sections 1, 6–8; `scripts/check-games.baseline.json` (only Tranquil and URL gaps left)
- Do_Not_Touch: `apps/**`; Easy Frog, GameBoy Web; Space Cadet engine (`"resumable": false`).
- Relevant_Decisions: 0054, 0053, 0051

Next:
- Owner: play Fruit Slash with a kid on a phone and a tablet, both orientations: item size/speed in Petit ninja, star thresholds (`MODES.*.stars` in `public/games/fruitslash/rules.js`), emoji look on Android.
- Owner: play Échecs on iPhone and Android (painted pieces readable on small squares?), the 4 levels, castling, promotion, "Reprendre".
- Owner: play Memory solo, judge the points weights (`public/games/memory/points.js`).
- Owner phone check of resume in every game, then Memory and Yatzy online on two phones (away banner, "Reprendre en ligne") — see `docs/BACKLOG.md` Now.
- Owner: options sheet bottom clears the phone navigation bar.
- Owner to play Bridge (bid box, explanations, hint, undo, last trick, claim, open hands, 4-colour, full Chicago) and judge robot bidding.
- Platform leftovers: `0007_coins.sql` then `0008_match_coins.sql`; `ADMIN_USER_IDS` on coinchapp; Tranquil match start after its Vercel repoint.
- Proposed: `docs/ARCHITECTURE.md` still says 7 Hobby functions and omits `GET /api/popular`; `docs/SECURITY.md` does not list that public read.

Open_Questions:
- Fruit Slash and Bridge thumbnails are hand-made SVGs; swap for illustrated images if wanted.
- Yatzy online end-of-game crash (pre-existing, one-line fix in `docs/BACKLOG.md`): fix now?
- Git stash `wip-memory-aside` (another session, 2026-10-29) is still there; owner to keep or drop.
- `.prettierignore` yatsy re-include would reformat it — owner call.
- SkiFree, Chip's Challenge and Space Cadet assets are copyrighted; Memory's Miraculous, Ghibli and Pat' Patrouille themes are AI art of licensed characters.

Blockers:
- Tranquil step: production still runs the old Vercel project.

Recent_Changes:
- 2026-10-31 Fruit Slash: new game, emoji sprites with baked glow, rainbow blade, touch/mouse/arrow keys, live-checked phone portrait/landscape.
- 2026-10-31 Échecs: painted AI pieces + tile (`scripts/chess_slice.py`) replace the Unicode glyphs.
- 2026-10-31 Échecs: new game, rules verified by perft on 5 reference positions, AI in a worker (expert = 1.5 s iterative deepening).
- 2026-10-31 Memory solo: clock (starts on first flip, pauses when hidden) and points, forgotten-twin penalty.
