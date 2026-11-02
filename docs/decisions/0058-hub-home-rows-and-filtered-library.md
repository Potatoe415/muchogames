# 0058 — Hub: Home rows + filtered library, flat tags instead of categories

Date: 2026-11-02
Status: Accepted
Decision: The hub has two views — Home (horizontal rows of small square tiles: Recent, Favorites, Featured, Quick, one row per type) and "All games" (sticky pills, instant search, compact list) — driven by flat tags on three axes (type `tags`, time from `duration`, players from `players`), with the view and filters in the URL. `category` and its tabs are gone.
Context: 33 games no longer fit four tabs of large 4:5 tiles; the owner proposed a Home/Library split with orthogonal tags and approved: no bottom sheet yet, CSS square crop of the existing thumbnails, no "offline" badge (no game plays offline today).
Rationale: Rows give discovery with little vertical space; the list scans 20 games at a glance. One value per axis, axes combined, keeps the pill bar a single row with no tree. URL state makes a filtered list shareable and the phone's Back button natural. `hub-taxonomy.js` has no DOM so `scripts/check-games.mjs` validates the same rules.
Consequences: Every catalog entry must carry `tags`, `players`, `duration` (`npm run check` fails otherwise). A new type is a product decision. Swipe between tabs is removed (it fought the sideways rows). The hub tiles no longer show a favorite star; it lives in the list.
Alternatives_Rejected: Nested categories (too many taps back on a phone); generated WebP icons (new `sharp` dependency, deferred); bottom-sheet filters (not needed at 33 games, deferred to the backlog).
