# 0053 — Platform rules for screens, system bars, input, resume and collapsed rules

Date: 2026-10-29
Status: Accepted
Decision: Every game is mobile first, plays on phone/tablet/desktop in portrait and landscape without horizontal scroll, respects the system bars (`100dvh`, `env(safe-area-inset-*)`, `viewport-fit=cover`), works with touch, mouse and keyboard, resumes a match after a reload, and shows its rules as a closed `<details>` in the options panel. `npm run check` enforces the viewport meta, the collapsed rules and the `dvh` use.
Context: The owner kept repeating these requirements for each new game, and kept hitting games whose bottom controls sat under the phone's navigation bar or browser toolbar.
Rationale: Written once in `docs/PLATFORM_RULES.md` (sections 1 and 6–8) and checked where a static check is reliable, a new game gets them without being asked. The shared header and options sheet now pad with the safe areas, and `game-header.css` styles the `<details>` rules section, so a game writes no CSS for either.
Consequences: Existing gaps (39 lines: rules not collapsed in every game, plus viewport meta and bare `vh` in older games and the wordpack shell) go into `scripts/check-games.baseline.json`; a new game never does. Orientation, horizontal scroll, input and resume are not statically checkable and rely on the live check on a real phone.
Alternatives_Rejected: Making `game-header.js` collapse the rules section at runtime (would silently change every existing game's panel and fight games that hide or rebuild that section); checking only new games by id (the baseline already does that, and it keeps the gap list visible).
