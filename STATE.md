# STATE

Replace on every update. Max 40 lines. History lives in git and `docs/decisions/`.

Status: Signing out clears the local profile avatar. It is restored from `muchogames_profiles` on the next Google sign-in.
Focus: Confirm « Se déconnecter » removes the photo on the hub button and on `/profile` until the next sign-in.
Level: L1

Context:
- Working_On: `auth.js`
- Relevant_Files: `public/profile/profile.js`, `public/shared/js/player-profile.js`
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
- 2026-09-25 Sign-out removes the local avatar (and its thumb). The account photo comes back from the server on the next sign-in.
- 2026-09-24 Hub `/profile` now receives wins/losses from Yatzy, coinchapp, and Tranquil for a signed-in player. Local counters stay for anonymous play.
