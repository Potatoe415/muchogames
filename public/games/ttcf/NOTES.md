# TTCF

"Tu te crois fort ?": a party quiz for 2 to 8 teams on one device. Teams rate
themselves 1-10 on a card's subject, answer the question of that level, and
move forward by the rating on a right answer. First team to answer the
"Gagner" card on the last space wins.

## Files

| File | Role |
|---|---|
| `ttcf.js` | Page shell and game: language, Game Dashboard (mode, teams, Resume, start), card dialog (eval / question / answer steps), wheel turn, win screen, `MuchogamesMatch.start/resume/finish`, TV focus. |
| `board.js` | Board track (43 spaces), space and token drawing, token art, `walkToken` (space-by-space walk). |
| `wheel.js` | Wheel mode: SVG wheel of 10 segments (the 4 themes twice, Challenge and Superbe once, the board's proportions), `spin()` resolves with the theme under the pointer. |
| `i18n.js` | FR/EN/ES interface copy and theme labels. The cards themselves are French only. |
| `store.js` | `muchogames_ttcf_save`: `{ v: 1, match: { mode, teams: [{ id, name, pos }], cur, card } }` (`mode` `board` / `wheel`; a save without it loads as `board`), `card` = `{ index, theme, step, note, opening, timeLeft, move }` or `null`. Validated against the loaded cards on read; a bad save is dropped. `muchogames_ttcf_mode`: the last mode chosen on the dashboard. |
| `ttcf.css` | Watercolour meadow skin (parchment panels, wooden and leaf buttons, pastel tiles) and layout: board 7x7 (portrait) or 11x4 (landscape), card dialog under the header, short-landscape two-column dashboard and win screen, TV sizes. |
| `assets/` | `meadow.webp` (background), `medallions/<theme>.webp` (card header, start / end spaces, win), `token-<colour>.webp` (acorn team tokens, team order red, blue, yellow, purple, orange, green, pink, brown), cut by `scripts/ttcf_slice.py` from the AI sheets in `tmp-resources/ttcf/` (not tracked). `icons/<theme>.svg`: hand-drawn tile icons, so they stay sharp on a 4K TV. |

## Rules in code

- Saved at match start, after every step (card drawn, rating, answer shown, stepper, turn end), every second of the 30 s timer, on `pagehide` and `visibilitychange`. Cleared only on the win screen.
- Resume comes back on the same card and step; the timer goes on from its saved value.
- Up to 8 teams. Dashboard: past 4 teams the list goes to two columns (1-4, 5-8, so Up / Down follow the team order); a tall narrow phone keeps one column instead. Board: up to 4 tokens on a space share one overlapping row, 5-8 take two rows (`fitTokens`).
- A move walks the token space by space (`walkToken`, about 1.8 s in all, 70-200 ms a space, a small hop per space; backwards too). The arrival is saved before the walk starts, so `page.walk` is display only: leaving mid-walk resumes with the token on its arrival space. During the walk the banner keeps the moving team and the draw button is hidden. No walk with `prefers-reduced-motion`.
- Débuter card (match start): an instruction, not a question, so it shows at once with its answer (italics) and only "Aller au plateau" / "À la roue" (no timer, no "Voir la réponse").
- Wheel mode ("Roue de la fortune", like Trivial Quizz): no board drawn; "Lancer la roue" spins (about 3.6 s), then a card of the landed theme is drawn and played as on the board. Teams still move 1 to 42 (progress bars); a team on 42 gets the Gagner card whatever the wheel shows. A spin is not saved until it lands. No token walk in this mode.
- Options panel: "Catégories" explains the 8 card types (FR/EN/ES, `categoriesBody`), above "Règles".
- A party game on one device: `finish()` without `won` (`docs/PLATFORM_RULES.md` section 4.4).
- Cards: `public/data/ttcf/ttcf_data.json` (`{ cards: [{ theme, subject, questions: [{ level, q, a }] }] }`). Not all card photos were OCR'd; some text still has OCR artefacts.
