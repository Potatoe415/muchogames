# Task: hub-home-library

Level: L2
Status: In progress
Goal: Replace the hub's category tabs + big-tile grid with a Home view (horizontal rows of small square tiles) and an "All games" library (filter pills, instant search, compact list), state in the URL.
Scope: `index.html`, `hub.js`, new `hub-taxonomy.js` / `hub-route.js` / `hub-tiles.js` / `hub-home.js` / `hub-library.js` + CSS, `hub-shelf.js`, `hub-catalog.css`, `hub.css`, `public/hub-config.json` (catalog fields only), `scripts/check-games.mjs`, `eslint.config.mjs`, docs.
Do_Not_Touch: game folders, `apps/**`, admin catalog editor, coins, auth.
Assumptions:
- Owner approved (2026-11-02): steps 1-4, square tiles by CSS crop of the existing thumbnails, no "offline" badge (no game is offline today), taxonomy Duration / Type / Players.
- `category` is read only by `hub.js`; it is replaced by `tags`.
- `players` / `duration` values for games without them are estimates; the owner adjusts them in `hub-config.json`.
Plan:
1. `tags`, `duration`, `players` on every catalog entry, `category` removed; `check-games.mjs` validates them → verify: `npm run check:games`.
2. Home: Recent, Favorites, Featured (pinned), Quick, one row per type; "See all" opens the library filtered → verify: browser 390x760 + desktop.
3. Library: sticky pills (one value per axis, axes combine), search on title/id/tag labels (accent-insensitive), list rows with star, sort kept → verify: browser.
4. URL state `?view=all&type=&time=&players=&fav=1&q=`, Back button via history → verify: reload, Back.
Acceptance_Criteria:
- [ ] Every game reachable from Home rows or the library; launching still spends coins / records recents as before.
- [ ] Filters and search survive a reload and the Back button.
- [ ] `npm run check` passes.
Related_Decisions: 0058
