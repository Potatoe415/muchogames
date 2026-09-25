# STATE

Replace on every update. Max 40 lines. History lives in git and `docs/decisions/`.

Status: Added a "Jouer solo (test)" button to Yatzy's splash screen — a graphics experiment, identical robot-mode rules, only the visuals differ: hand-painted watercolor die faces (`assets/dice-test/die-1..6.jpg`, cropped from a user-supplied reference image) and a wood-table game background (`assets/dice-test/game-bg-test.jpg`) behind the scorecard. Gated by `state.setup.diceTheme` ("default"/"watercolor"), orthogonal to `mode` — zero changes to robot.js/session.js/scoring.js. `npm run check` passes; verified live in-browser (splash button, dice faces, background) via the Cursor browser tool.
Focus: None — task complete. Optional follow-up: gather feedback on the watercolor look, then either promote it to the real "Partie solo" button or drop the experiment.
Level: L1 (one game, additive/reversible, no shared contract or data model touched)

Context:
    10|- Working_On: none (task complete)
- Relevant_Files: `public/games/yatsy/index.html`, `app.js`, `render.js`, `styles.css`, `assets/dice-test/`
- Do_Not_Touch: other games; yatsy's `mode`-gated game logic (robot.js, session.js, scoring.js) — untouched by design
- Relevant_Decisions: none (L1, no decision file)

Next:
- If the watercolor look is approved, consider replacing the pip-grid `.face-die` default with it repo-wide, or removing the test button/assets if not.
- Sign in, finish one Yatzy (vs robot), one coinchapp match, and one Tranquil match launched from the hub. Confirm `/profile` counts them.
- Apply `0003_profiles.sql` if it is not on `multigames-db`, and enable Google as an Auth provider.
   20|- Confirm wording edits for `docs/PRODUCT.md`, `docs/ARCHITECTURE.md`, and `docs/SECURITY.md`.

Open_Questions:
- None new.

Blockers:
- End-to-end profile check is blocked until the profiles migration is applied and Google Auth is enabled.

Recent_Changes:
- 2026-09-25 Yatsy: added "Jouer solo (test)" graphics-experiment button (watercolor dice + wood-table background), gated by a new `state.setup.diceTheme` flag.
   30|- 2026-09-25 Fixed Vercel deploys failing on the Hobby 12-function cap: merged `api/profile/*` (5 files) into one `api/profile/index.js`, action-routed (14 → 10 functions).
- 2026-09-25 Added a discreet force-refresh button (clears SW cache, reloads) to the hub home page footer.
