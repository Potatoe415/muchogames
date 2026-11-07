# TTCF

"Tu te crois fort ?": a party quiz for 2 to 8 teams (2 to 16 players) on one device. Teams rate
themselves 1-10 on a card's subject, answer the question of that level, and
move forward by the rating on a right answer. First team to answer the
"Gagner" card on the last space wins.

## Files

| File | Role |
|---|---|
| `ttcf.js` | Page shell and game: language, Game Dashboard (mode, teams, Resume, start), card dialog (eval / question / answer steps), wheel turn, win screen, `MuchogamesMatch.start/resume/finish`, TV focus. |
| `board.js` | Board track (43 spaces), space and token drawing, token art, `walkToken` (space-by-space walk). |
| `wheel.js` | Wheel mode: SVG wheel of 10 segments (the 4 themes twice, Challenge and Superbe once, the board's proportions), `spin()` (button) and a swipe on the wheel (pointer events, `touch-action: none`: the wheel follows the finger; let go faster than 0.25 °/ms and it spins for `1.5 + 1.5 × speed` s, speed capped at 3 °/ms; slower, it just stays there) both resolve with the theme under the pointer. No swipe while it turns. |
| `i18n.js` | FR/EN/ES interface copy and theme labels. The cards themselves are French only. |
| `store.js` | `muchogames_ttcf_save`: `{ v: 1, match: { mode, teams: [{ id, name, pos }], cur, card } }` (`mode` `board` / `wheel`; a save without it loads as `board`), `card` = `{ index, theme, step, note, opening, timeLeft, move, bonus? }` (`step` `bonus` / `eval` / `question` / `answer`; `bonus` = index of the Superbe card it is played under) or `null`. Validated against the loaded cards on read; a bad save is dropped. `muchogames_ttcf_mode`: the last mode chosen on the dashboard. |
| `ttcf.css` | Watercolour meadow skin (parchment panels, wooden and leaf buttons, pastel tiles) and layout: board 7x7 (portrait) or 11x4 (landscape), card dialog under the header, short-landscape two-column dashboard and win screen, TV sizes. |
| `assets/` | `meadow.webp` (background), `medallions/<theme>.webp` (card header, start / end spaces, win), `token-<colour>.webp` (acorn team tokens, team order red, blue, yellow, purple, orange, green, pink, brown), cut by `scripts/ttcf_slice.py` from the AI sheets in `tmp-resources/ttcf/` (not tracked). `icons/<theme>.svg`: hand-drawn tile icons, so they stay sharp on a 4K TV. |

## Rules in code

- Saved at match start, after every step (card drawn, rating, answer shown, stepper, turn end), every second of the 30 s timer (question and answer sides), on `pagehide` and `visibilitychange`. Cleared only on the win screen.
- Resume comes back on the same card and step; the timer goes on from its saved value.
- First open of the page: Resume is decided from the save before the 1.3 MB deck loads (`hasMatch`, the card index unchecked), shown disabled until the deck is in; the acorn row on the dashboard is `hidden` in the HTML until then, so the 8 acorns never flash before Resume pushes them out. A new match draws its board (all teams on D) before the Débuter card shows, never the last match's tokens.
- Board tiles with a token lighten and fade their icon; each acorn has a white outline and a shadow; the playing team's tile has a gold ring and its acorn a gold glow.
- Up to 8 teams. Dashboard: past 4 teams the list goes to two columns (1-4, 5-8, so Up / Down follow the team order); a tall narrow phone keeps one column instead. Board: up to 4 tokens on a space share one overlapping row, 5-8 take two rows (`fitTokens`).
- A move walks the token space by space (`walkToken`, about 1.8 s in all, 70-200 ms a space, a small hop per space; backwards too). The arrival is saved before the walk starts, so `page.walk` is display only: leaving mid-walk resumes with the token on its arrival space. During the walk the banner keeps the moving team and the draw button is hidden. No walk with `prefers-reduced-motion`.
- Every team starts on D (space 0); a move back stops on D. A team still on D draws one of the 4 categories at random (D has no theme). Rules checked against the publisher's video rules (owner, 2026-11-06).
- Débuter card (match start): an instruction, not a question, so it shows at once with its answer (italics) and only "Aller au plateau" / "À la roue" (no timer, no "Voir la réponse").
- Wheel mode ("Roue de la fortune", like Trivial Quizz): no board drawn; "Lancer la roue" spins (about 3.6 s), then a card of the landed theme is drawn and played as on the board. Teams still move 1 to 42 (progress bars); a team on 42 gets the Gagner card whatever the wheel shows. A spin is not saved until it lands. No token walk in this mode.
- Card dialog, until the answer shows (not on Débuter): ✕ top right (`ttcf-card-close`, also TV Back) cancels the card, the same team draws or spins again; "Passer la question" (`ttcf-skip-btn`) draws another card of the same theme (never the same one twice in a row), same team, no move.
- Superbe card (step `bonus`): the card is a rule, not a question. It shows its subject, its theme (`Thème X imposé` -> one button "Jouer une carte X"; `Choix du Thème libre` -> one button per category, read by `bonusThemes` from the card's `q`) and its rule (`a`); the button draws a card of that theme with `card.bonus` = the Superbe card's index, played as usual (rating, 30 s timer) with the rule kept in a pink box above it. Its answer side uses + / − (starting at the rating) since each rule moves its own way. ✕ / Passer work on both cards; Passer under a rule keeps the rule.
- The 30 s timer bar sits under the card (outside `.modal-content`), so it does not turn with the card; it stays in sight and keeps running from the question through the answer (and any turn of the card) until the turn ends (`timed`).
- Each new side of the card (rating, question, answer, question again) starts scrolled to its top (`page.face`): a long question (Challenge clue ladders, lists) is scrolled down to reach Voir la réponse, and the answer used to keep that scroll, so on a small or landscape phone the answer and its first lines were above the visible part of the card.
- Voir la réponse turns the card over (`turnCard`: Web Animations, 2 × 200 ms `rotateY`, the answer drawn edge-on; no turn with `prefers-reduced-motion`). On the answer side (not on Débuter) ↺ top left (`ttcf-card-flip`) turns it back to the question and again to the answer, as often as wanted; `page.peek` is display only (not saved, reset on every new card and Resume), and the 30 s timer goes on.
- Options panel: "Catégories" explains the 8 card types (FR/EN/ES, `categoriesBody`), above "Règles".
- A party game on one device: `finish()` without `won` (`docs/PLATFORM_RULES.md` section 4.4).
- Cards: `public/data/ttcf/ttcf_data_fr.json` (`{ cards: [{ theme, subject, questions: [{ level, q, a }] }] }`). Not all card photos were OCR'd; some text still has OCR artefacts. 28 cards (2026-11-06) came from an older hand-made batch (git stash `aside-ttmc`, 3 Nov) that never reached the deck; 3 of its cards were only rewordings of deck cards and stay in that stash.
