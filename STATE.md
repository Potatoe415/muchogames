# STATE

Replace on every update. Max 40 lines. History lives in git and `docs/decisions/`.

Status: Yams in-game header now says "Yams" (FR/EN/ES) and the settings gear sits to the right of the score pills. Hub badge stays V0.0.5. Two bug-tracker tickets about hiding `*.vercel.app` behind `muchogames.win/<jeu>` are not started: Coinche, Tranquil, and GameBoy are other deployments, so that needs a rewrite/proxy decision.
Focus: Recheck the bug-tracker Google Doc about every 10 minutes.
Level: L1 (yatsy header only). URL tickets are L2 and waiting.

Context:
- Working_On: bug-tracker doc `1mrgGMVeA2a1bCI3eavf7oPno57xyydzF3Z0yi3neS2U`
- Relevant_Files: `public/games/yatsy/index.html`, `render.js`, `i18n.js` (`header.gameTitle`)
- Do_Not_Touch: splash title still "Yatzy"; category label "Yatzy" unchanged; hub launch URLs in `public/hub-config.json`
- Relevant_Decisions: none yet for the domain rewrite

Next:
- Decide how `muchogames.win/coinche` (and the other external apps) should proxy to their own Vercel projects before changing launch URLs.
- Keep polling the bug-tracker. Drive can read it; writing status tags in the doc still fails from here.
- Sign in, finish one Yatzy, one coinchapp match, and one Tranquil match from the hub. Confirm `/profile` counts them.

Open_Questions:
- Should GameBoy and Easy Frog also live under `muchogames.win/<jeu>`, or only the games in this repo?

Blockers:
- Domain masking is blocked on a hosting choice (rewrites vs custom domains on each app).
- Bug-tracker body cannot be edited through the Drive connector.

Recent_Changes:
- 2026-09-25 Yams: in-game title "Yams"; settings gear moved to the right of the scores.
- 2026-09-25 Hub footer version badge bumped from V0.0.4 to V0.0.5 (`version.js`).
