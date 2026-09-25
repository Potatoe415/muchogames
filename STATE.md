# STATE

Replace on every update. Max 40 lines. History lives in git and `docs/decisions/`.

Status: Hub home version badge is V0.0.5 (`version.js`), from the bug-tracker ticket "changer la version en 0.0.5" on the games home screen. Placeholder example tickets in that doc were left untouched.
Focus: Recheck the bug-tracker Google Doc about every 10 minutes and take the next real [OPEN] ticket.
Level: L0 (one string, hub badge only)

Context:
- Working_On: bug-tracker doc `1mrgGMVeA2a1bCI3eavf7oPno57xyydzF3Z0yi3neS2U`
- Relevant_Files: `version.js` (badge text). Hub renders it in `hub.js` `renderVersionBadge`.
- Do_Not_Touch: per-game build tags (Yatzy `v0.4` is a different label); `package.json` version is the npm package, not the on-screen badge
- Relevant_Decisions: none

Next:
- Keep polling the bug-tracker doc for new [OPEN] tickets. Drive can read the doc; it cannot edit the body, so status tags in the doc still need a write path.
- Sign in, finish one Yatzy (vs robot), one coinchapp match, and one Tranquil match launched from the hub. Confirm `/profile` counts them.
- Apply `0003_profiles.sql` if it is not on `multigames-db`, and enable Google as an Auth provider.
- Confirm wording edits for `docs/PRODUCT.md`, `docs/ARCHITECTURE.md`, and `docs/SECURITY.md`.

Open_Questions:
- None new.

Blockers:
- End-to-end profile check is blocked until the profiles migration is applied and Google Auth is enabled.
- Bug-tracker status tags cannot be written back: Google Drive update only changes title/parent, and the Docs connector is down.

Recent_Changes:
- 2026-09-25 Hub footer version badge bumped from V0.0.4 to V0.0.5 (`version.js`).
- 2026-09-25 Rebrand batch (display name only): Pictionary -> "Dessiner c'est gagner", Esquisse -> "Téléphone bizarre", Olé Mains -> "Jeu de mains", Pigeon Pigeon -> "Dictionnaire".
- 2026-09-25 Yatsy header harmonized (back/settings icons, icon-only restart, single header row).
