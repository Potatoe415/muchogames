# Black Stories — notes

Endless riddle game (`"endless": true` in `hub-config.json`): no end screen,
`MuchogamesMatch.finish()` is never called.

## Files

- `blackstories.js` — loading the 3 story files, rendering, navigation,
  session start/resume.
- `blackstories-save.js` — session save (localStorage) + "Reprendre" label.
- `blackstories-i18n.js` — FR/EN/ES page copy (`data-i18n` / `data-i18n-aria`
  keys in `index.html`); the language is written to `bergamots-lang` too.
- `black_stories_{fr,en,es}.json` — stories. Ids are shared across languages
  (same id = same story); ES lacks a few.

## Session save

- Key `blackstories-current`:
  `{ lang, history: [storyId, ...], pos, revealed }`.
- History is stored as story ids, not list indexes, so editing a JSON file
  does not scramble it; ids missing on load are skipped.
- Written on session start/resume, every next/previous, every reveal toggle,
  every language change in session, and on `pagehide` /
  `visibilitychange` hidden. Nothing is written while on the splash.
- Invalid or unrestorable saves are dropped on load.
- Splash shows "Reprendre" (`blackstories-resume-button`) only when a valid
  save exists; it restores the session and calls `MuchogamesMatch.resume()`.
- The save is never deleted: it is replaced when the player clicks
  "Commencer" (after `MuchogamesMatch.start` resolves `true`).
- Language change keeps the history (re-mapped by id); if no story of the
  history exists in the new language, a new random story starts.
- `blackstories_lang` is still stored separately (last chosen language).

## Screens, TV, input

- Dashboard (`blackstories-dashboard-screen`): title, Resume, Start. Play
  screen (`blackstories-play-screen`): the header back arrow is replaced by
  a ✖ (`blackstories-quit-button`, `data-match-quit`): after the shared
  "Leave match?" dialog it saves and returns to the dashboard (Resume shown).
- Layout: one `100dvh` column, no page scroll; the story card scrolls inside
  itself; Previous / Next stay on screen (beside the card on landscape
  phones). Standard 40px bottom / 24px side margins.
- TV (`tv-remote.js`, `?tv=1`): focus lands on Resume / Start, then the
  reveal card; arrows move between reveal, Previous, Next; Back = ✖.
  The ← / → keyboard shortcut is off while TV mode is on (the arrows belong
  to the remote's focus navigation) and outside a session.
