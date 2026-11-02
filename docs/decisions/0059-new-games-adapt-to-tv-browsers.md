# 0059 — New games adapt to TV browsers (1080p, 4K, remote)

Date: 2026-11-02
Status: Accepted
Decision: Every game added from 2026-11-02 also plays on a TV browser: it fills the screen at 960×540 to 3840×2160 CSS px without scroll, stays readable from the couch, keeps a 3% overscan margin, and works with the remote alone (arrows with spatial focus, OK, Back), plus fullscreen and a wake lock on match start. TV behaviour turns on from `?tv=1` or a TV user agent; the layout follows the screen size. Written in `docs/PLATFORM_RULES.md` section 6 "TV".
Context: The owner wants every game playable from a TV's web browser, not only on phone and desktop (decision 0053). Millionaire already has a working TV mode (`tv.js`, `tv-nav.js`).
Rationale: Written once in the platform rules, a new game gets it without being asked. Millionaire's TV code is the reference; the second game that needs it moves it to `public/shared/js/` rather than copying it.
Consequences: Existing games are not changed now; the owner brings them to the rule one by one. Nothing is added to `npm run check`: screen fill and remote navigation are not statically checkable, so they rely on a browser check at 960×540, 1920×1080 and 3840×2160 and on a real TV.
Alternatives_Rejected: Applying it to every existing game now (owner's choice to do them one by one); a separate TV-only page per game (two layouts to keep in sync).
