# TTMC

"Tu te mets combien ?": a party quiz for 2 to 4 teams on one device. Teams rate
themselves 1-10 on a card's subject, answer the question of that level, and
move forward by the rating on a right answer. First team to answer the
"Gagner" card on the last space wins.

## Files

| File | Role |
|---|---|
| `ttmc.js` | Page shell and game: language, Game Dashboard (teams, Resume, start), board, card dialog (eval / question / answer steps), win screen, `MuchogamesMatch.start/resume/finish`, TV focus. |
| `i18n.js` | FR/EN/ES interface copy and theme labels. The cards themselves are French only. |
| `store.js` | `muchogames_ttmc_save`: `{ v: 1, match: { teams: [{ id, name, pos }], cur, card } }`, `card` = `{ index, theme, step, note, opening, timeLeft, move }` or `null`. Validated against the loaded cards on read; a bad save is dropped. |
| `ttmc.css` | Layout: board 7x7 (portrait) or 11x4 (landscape), card dialog under the header, short-landscape two-column dashboard, TV sizes. |

## Rules in code

- Saved at match start, after every step (card drawn, rating, answer shown, stepper, turn end), every second of the 30 s timer, on `pagehide` and `visibilitychange`. Cleared only on the win screen.
- Resume comes back on the same card and step; the timer goes on from its saved value.
- A party game on one device: `finish()` without `won` (`docs/PLATFORM_RULES.md` section 4.4).
- Cards: `public/data/ttmc/ttmc_data.json` (`{ cards: [{ theme, subject, questions: [{ level, q, a }] }] }`). Not all card photos were OCR'd; some text still has OCR artefacts.
