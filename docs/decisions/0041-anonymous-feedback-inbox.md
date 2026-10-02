# 0041 — Anonymous in-app feedback inbox

Date: 2026-10-02
Status: Accepted
Decision: Players report bugs and ideas from a shared dialog (hub, `/profile`, every game options panel); reports go to a new `muchogames_feedback` table through a public, anonymous, rate-limited `POST /api/feedback`, and are triaged on `/admin` (new / in progress / resolved).
Context: Bugs were collected in an external Google Doc the agent polled every 10 minutes and could not write to. Roadmap phase 2 (`docs/tasks/platform-admin-profile-roadmap.md`).
Rationale: Owner chose "anyone, even signed out, with an anti-abuse limit". Storing nothing identifying keeps the hub's "no visitor identifiers" stance (`docs/PRODUCT.md` Out_Of_Scope) intact. The entry point lives in `game-header.js` so all six in-repo games and `/profile` get it without per-game markup; `feedback.js` is lazy-loaded there. Admin actions extend `api/admin/index.js` instead of adding a function (10/12 used after `api/feedback.js`).
Consequences: Anyone can add rows; the only guards are 5 reports per 10 min per IP (per warm instance) and the length caps. No reply channel unless the sender types a contact. Wordplayer games, coinchapp and Tranquil have no report button yet. Yatzy's offline cache was bumped to v40 so it serves the new `game-header.js`.
Alternatives_Rejected: Signed-in only (owner wanted zero friction). Storing IP/user agent for abuse control (conflicts with the no-visitor-identifier rule). Keep the Google Doc (no write access, manual polling).
