# STATE

Replace on every update. Max 40 lines. History lives in git and `docs/decisions/`.

Status: Added a discreet "Actualiser" (force-refresh) button to the hub home page footer. It wasn't visible in prod because every recent deploy had failed on Vercel's Hobby 12-function cap (`api/` had grown to 14). Fixed by merging `api/profile/*` (5 files) into one action-routed function, `api/profile/index.js` (now 10 functions). Pushed; awaiting confirmation the next deploy reaches `READY`.
Focus: Confirm the pushed deploy for the `api/profile` consolidation goes `READY` on Vercel, then confirm the force-refresh button is visible/working in production.
Level: L2 (infra — Serverless Functions count)

Context:
- Working_On: `api/profile/index.js`, `hub.js`, `hub.css`
- Relevant_Files: `public/profile/profile.js`, `public/shared/js/profile-results.js`, `auth.js`
- Do_Not_Touch: game rules
- Relevant_Decisions: `docs/decisions/0039-consolidate-api-profile-into-one-serverless-function.md`

Next:
- Check the latest Vercel deployment for commit after `3304aae` reaches `READY` (not `ERROR`); if still over 12 functions, consolidate `api/yatsy/games/*` next.
- Confirm the force-refresh button is now visible at the bottom-left of the hub home page in production.
- Apply `0003_profiles.sql` if it is not on `multigames-db`, and enable Google as an Auth provider.
- Sign in, finish one Yatzy (vs robot), one coinchapp match, and one Tranquil match launched from the hub. Confirm `/profile` counts them.
- Confirm wording edits for `docs/PRODUCT.md`, `docs/ARCHITECTURE.md`, and `docs/SECURITY.md`.

Open_Questions:
- None new.

Blockers:
- End-to-end profile check is blocked until the profiles migration is applied and Google Auth is enabled.

Recent_Changes:
- 2026-09-25 Fixed Vercel deploys failing on the Hobby 12-function cap: merged `api/profile/*` (5 files) into one `api/profile/index.js`, action-routed (14 → 10 functions).
- 2026-09-25 Added a discreet force-refresh button (clears SW cache, reloads) to the hub home page footer.
- 2026-09-25 Sign-out removes the local avatar (and its thumb). The account photo comes back from the server on the next sign-in.
