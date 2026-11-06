# TTMC

"Tu te mets combien ?": a party quiz for 2 to 8 teams on one device. Teams rate
themselves 1-10 on a card's subject, answer the question of that level, and
move forward by the rating on a right answer. First team to answer the
"Gagner" card on the last space wins.

## Files

| File | Role |
|---|---|
| `ttmc.js` | Page shell and game: language, Game Dashboard (teams, Resume, start), board, card dialog (eval / question / answer steps), win screen, `MuchogamesMatch.start/resume/finish`, TV focus. |
| `i18n.js` | FR/EN/ES interface copy and theme labels. The cards themselves are French only. |
| `store.js` | `muchogames_ttmc_save`: `{ v: 1, match: { teams: [{ id, name, pos }], cur, card } }`, `card` = `{ index, theme, step, note, opening, timeLeft, move }` or `null`. Validated against the loaded cards on read; a bad save is dropped. |
| `ttmc.css` | Watercolour meadow skin (parchment panels, wooden and leaf buttons, pastel tiles) and layout: board 7x7 (portrait) or 11x4 (landscape), card dialog under the header, short-landscape two-column dashboard and win screen, TV sizes. |
| `assets/` | `meadow.webp` (background), `medallions/<theme>.webp` (card header, start / end spaces, win), `token-<colour>.webp` (acorn team tokens, team order red, blue, yellow, purple, orange, green, pink, brown), cut by `scripts/ttmc_slice.py` from the AI sheets in `tmp-resources/ttmc/` (not tracked). `icons/<theme>.svg`: hand-drawn tile icons, so they stay sharp on a 4K TV. |

## Rules in code

- Saved at match start, after every step (card drawn, rating, answer shown, stepper, turn end), every second of the 30 s timer, on `pagehide` and `visibilitychange`. Cleared only on the win screen.
- Resume comes back on the same card and step; the timer goes on from its saved value.
- Up to 8 teams. Dashboard: past 4 teams the list goes to two columns (1-4, 5-8, so Up / Down follow the team order); a tall narrow phone keeps one column instead. Board: up to 4 tokens on a space share one overlapping row, 5-8 take two rows (`fitTokens`).
- A move walks the token space by space (`walkToken`, about 1.8 s in all, 70-200 ms a space, a small hop per space; backwards too). The arrival is saved before the walk starts, so `page.walk` is display only: leaving mid-walk resumes with the token on its arrival space. During the walk the banner keeps the moving team and the draw button is hidden. No walk with `prefers-reduced-motion`.
- A party game on one device: `finish()` without `won` (`docs/PLATFORM_RULES.md` section 4.4).
- Cards: `public/data/ttmc/ttmc_data.json` (`{ cards: [{ theme, subject, questions: [{ level, q, a }] }] }`). Not all card photos were OCR'd; some text still has OCR artefacts.
