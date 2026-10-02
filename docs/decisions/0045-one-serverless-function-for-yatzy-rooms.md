# 0045 — One Serverless Function for Yatzy rooms

Date: 2026-10-02
Status: Accepted
Decision: Merge the five Yatzy room functions (`api/yatsy/games/index.js`, `[code].js`, `[code]/join.js`, `[code]/resume.js`, `[code]/state.js`) into one `api/yatsy/games/index.js`, with `vercel.json` rewrites turning `/api/yatsy/games/:code[/:op]` into `?code=…&op=…`.
Context: After the 2026-10-02 roadmap the deployment used 11 of the 12 functions Vercel Hobby allows, which would block the next server feature.
Rationale: Same pattern as `api/profile` (0039) and `api/admin` (0040), but the routes keep their URLs so `public/games/yatsy/matchmaking.js` and every cached Yatzy client keep working untouched. Handlers moved verbatim into underscore files (not deployed as functions); only the code validation moved up into the dispatcher.
Consequences: 7 of 12 functions. The room routes now depend on `vercel.json` rewrites: removing them breaks Yatzy online play. `vercel dev` honours them; `npm run dev` never served `/api` anyway.
Alternatives_Rejected: Change the client to POST `{ action }` like `api/profile` (forces a Yatzy cache bump and breaks clients still on the old service worker). Upgrade to a paid Vercel plan (free tier is a product constraint).
