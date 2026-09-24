# STATE

Replace on every update. Max 40 lines. History lives in git and `docs/decisions/`.

Status: Signed-in wins/losses from Yatzy, coinchapp (all 4 games), and Tranquil write `muchogames_profiles` and show on `/profile`.
Focus: User must apply `supabase/migrations/0003_profiles.sql` and enable Google Auth on `multigames-db`, then confirm one finished match from each app moves `/profile`.
Level: L2

Context:
- Working_On: `public/shared/js/profile-results.js`, `api/profile/add-results.js`, `hub.js`, `apps/coinchapp/lib/server/profileLink.ts`, `apps/tranquil/api/profile-link.ts`
- Relevant_Files: `docs/tasks/unified-profile-accounts.md`, `supabase/migrations/0003_profiles.sql`
- Do_Not_Touch: game rules
- Relevant_Decisions: none logged yet — task still needs the live check

Next:
- Apply `0003_profiles.sql` if it is not on `multigames-db`, and enable Google as an Auth provider.
- Sign in, finish one Yatzy (vs robot), one coinchapp match, and one Tranquil match launched from the hub. Confirm `/profile` counts them.
- Confirm wording edits for `docs/PRODUCT.md`, `docs/ARCHITECTURE.md`, and `docs/SECURITY.md`.

Open_Questions:
- None new.

Blockers:
- End-to-end check is blocked until the profiles migration is applied and Google Auth is enabled.

Recent_Changes:
- 2026-09-24 Hub `/profile` now receives wins/losses from Yatzy, coinchapp, and Tranquil for a signed-in player. Local counters stay for anonymous play.
- 2026-09-24 Unified profile API (`api/profile/*`) drafted; browser never talks to Supabase directly.
