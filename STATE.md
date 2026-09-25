# STATE

Replace on every update. Max 40 lines. History lives in git and `docs/decisions/`.

Status: Worked a batch of 7 tickets from a "Bug Tracker & Release Backlog" doc: 4 display-name-only rebrands (`hub-config.json` titles + olemains's `<title>`), 1 Bataille Corse layout fix, 3 Yatzy header harmonization tickets, and 1 Bataille Corse bug investigated but not reproduced (see coinchapp's `STATE.md`). Each ticket shipped as its own commit via `scripts/ship.ps1`, per user's confirmed workflow choice (no branches/PRs).
Focus: None open. Yatzy's header change was verified live via the browser tool - had to unregister its service worker mid-session (cache-first `sw.js`) to see the fresh CSS/markup, a pre-existing gotcha for anyone testing that game locally.
Level: L1 per ticket (each change scoped to one game/one file); the rebrand batch touched the shared `hub-config.json` but only its per-game `title` values, not structure.

Context:
- Working_On: none (task complete)
- Relevant_Files: `public/hub-config.json`, `public/games/olemains/index.html`, `public/games/yatsy/{index.html,render.js,styles.css}`, `apps/coinchapp/app/local/page.tsx`
- Do_Not_Touch: internal game `id`s/folders/data files (user chose display-name-only rebrand, not a deep rename)
- Relevant_Decisions: none (L1 batch, no decision file)

Next:
- If BAT-BUG-01 still reproduces, get a concrete repro from the user - see coinchapp's `STATE.md` Next for what was already ruled out.
- Sign in, finish one Yatzy (vs robot), one coinchapp match, and one Tranquil match launched from the hub. Confirm `/profile` counts them.
- Apply `0003_profiles.sql` if it is not on `multigames-db`, and enable Google as an Auth provider.
- Confirm wording edits for `docs/PRODUCT.md`, `docs/ARCHITECTURE.md`, and `docs/SECURITY.md`.

Open_Questions:
- None new.

Blockers:
- End-to-end profile check is blocked until the profiles migration is applied and Google Auth is enabled.

Recent_Changes:
- 2026-09-25 Rebrand batch (display name only): Pictionary -> "Dessiner c'est gagner", Esquisse -> "Téléphone bizarre", Olé Mains -> "Jeu de mains", Pigeon Pigeon -> "Dictionnaire" (`hub-config.json` `title` + olemains's page `<title>`).
- 2026-09-25 Yatsy: in-game header harmonized with the other custom games' back/settings icon SVGs, restart button made icon-only (aria-label carries the "Restart"/"Leave" distinction instead of visible text), and the header's two rows merged into one (YAM-UI-01/02/03).
- 2026-09-25 Yatsy: added "Jouer solo (test)" graphics-experiment button (watercolor dice + wood/parchment board re-skin), gated by a new `state.setup.diceTheme` flag.
- 2026-09-25 Fixed Vercel deploys failing on the Hobby 12-function cap: merged `api/profile/*` (5 files) into one `api/profile/index.js`, action-routed (14 -> 10 functions).
- 2026-09-25 Added a discreet force-refresh button (clears SW cache, reloads) to the hub home page footer.
