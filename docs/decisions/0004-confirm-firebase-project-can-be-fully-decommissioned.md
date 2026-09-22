# 0004 — Confirm Firebase project can be fully decommissioned

Date: 2026-08-16
Status: Accepted
Decision: Confirmed to the user that their Firebase project (Hosting + Realtime Database) can be deleted entirely; no game in this repo depends on it anymore.
Context: User asked for an explicit go/no-go before deleting Firebase, after the Yatzy migration to Supabase.
Rationale: Repo-wide search (SDK imports, `initializeApp`, `firebaseConfig`, `firebasejs` CDN URLs) found zero remaining references outside historical docs/comments; Firebase was only ever used by Yatzy per the original `docs/PRODUCT.md` constraint, and that constraint's implementation is now Supabase.
Consequences: `docs/PRODUCT.md`/`docs/BACKLOG.md` updated to drop the last Firebase mentions; a stale comment in `public/games/olemains/gameState.js` was fixed. Deleting the Firebase project is the user's own action, not performed by an agent.
Alternatives_Rejected: None ? this was a verification, not a design choice.
