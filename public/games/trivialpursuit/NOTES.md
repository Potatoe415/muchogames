# Trivial Quizz — notes for agents

Wedge-collecting trivia board game for 1 to 6 players on one device (pass and play). Vanilla ES modules, SVG board, no dependency. Interface and questions in FR/EN/ES. Read this before opening the sources.

## Files

| File | Role |
|---|---|
| `main.js` | Page shell: i18n, options panel (language, "Quitter la partie" with `data-match-quit`, rules), players setup (count 1–6, names; player 1 defaults to the profile name), resume button, end overlay, `MuchogamesMatch.start/resume/finish`. Loads the deck at boot; start stays disabled until it is loaded. |
| `play.js` | `createPlay({ els, state, deck, t, save, onWin })` → `{ relabel, save, destroy }`. Die roll (animated), move targets, pawn animation, question card, saves after every step. In wheel mode the board element holds the wheel instead (no die, no pawns) and the roll button spins it. |
| `model.js` | Plain-JSON match state + transitions: `newMatch(names, mode)` (`MODES` = `classic` / `quick` / `wheel`), `roll`, `targets`, `land` (→ `question` / `again` / `free` / `final`), `ask`, `spin` (wheel: ask, final if the player has all 6), `reveal`, `answer` (→ `right` / `wedge` / `wrong` / `won`), `cancel` (drop the question, back to `roll`, same player). |
| `wheel-view.js` | Wheel mode: 12-segment SVG wheel (6 colours twice) in a rotated div, pointer at 12 o'clock. Finger drag rotates it; letting go at ≥ 0.2 °/ms spins it (`onFling`) at the finger's speed (capped 3 °/ms) with constant deceleration: time `1500 + 2000 × speed` ms ±10 %, distance `speed × time / 2` (slow swipe ≈ 2 s / 200°, fast ≈ 5 s / 4,000°). The button spins at 1–2 °/ms. A tap (< 8 px of movement) on a colour turns that segment under the pointer (`onPick` → `turnTo`) and picks it; the centre circle ignores taps. `spin` / `turnTo` resolve with the category under the pointer; never lands on a border. |
| `board.js` | Board graph and geometry. Ring 0–41 (headquarters at 0, 7, 14, 21, 28, 35 = category 0–5), spoke k cell j at `41 + 5k + j`, hub 72. Segment pattern `[3, ROLL, 1, 4, ROLL, 2]` (offsets from the segment's HQ category); spoke k cell j has category `(k + j) % 6`. Each category: 1 HQ, 4 ring + 5 spoke cells; 12 roll-again cells. `reachable(from, steps)` = exact count, no cell twice. |
| `board-view.js` | Static SVG drawing, HTML pawns (little pie of the wedges) and HTML target buttons (`trivialpursuit-target-<node>`, arrows move focus between them). `CAT_COLORS`, `PAWN_COLORS`. |
| `question-view.js` | Question card (question → "Voir la réponse" → right / wrong, "Autre question") and the hub category picker. Three pots (FR/EN/ES) sit left of "Autre question" and use the same language switch as the options panel. The × cancels the question (`cancel` + the drawn index leaves the seen list): wheel can spin again, board can roll again, same player. |
| `deck.js` | Loads `/data/trivialpursuit/questions_<lang>.json` (`{ version, categories: [6 × [[question, answer, info?]]] }`), validates it, draws without repeat. `release(cat, index)` puts a cancelled question back. `setLang(lang)` swaps the language on the same indexes (same question); every language file must have the same size per category. Asked questions are remembered across matches in `trivialpursuit-seen` (per category, cleared when a category is used up). |
| `store.js` | localStorage: `trivialpursuit-current` (match in progress, validated on read), `trivialpursuit-names` (last names), `trivialpursuit-mode` (last mode). A save without `mode` loads as classic. |
| `i18n.js`, `rules.js` | FR/EN/ES copy; rules HTML. |
| `styles.css`, `stage.css`, `overlay.css`, `wheel.css` | Theme + start/end cards; board + panel (landscape `min-aspect-ratio: 5/4` puts the panel beside the board); question / category / end overlays; the wheel. |

## Rules in code

- Categories by slot: 0 Géographie (blue), 1 Divertissement (pink), 2 Histoire (yellow), 3 Arts et littérature (purple), 4 Sciences et nature (green), 5 Sports et loisirs (orange) — the order printed on the cards.
- Answers are self-judged: the player answers out loud, reveals, then taps right or wrong. Right = play again; wrong = next player.
- Classic: right answer on the HQ of that category = wedge. Quick: any right answer (not the final one) = wedge of the question's category. `q.hq` means "wedge at stake" in both modes (it drives the "Question camembert" tag). Hub without 6 wedges = player picks the category; with 6 wedges (exact count) = final question, category picked by the opponents (solo: by the player). Right final answer = win.
- Wheel ("Roue de la fortune"): no board, pawns stay on the hub node (saves keep the same shape, `die` stays 0). The wheel's colour = the question's category (spun, or tapped to pick it, the final question included); wedges as in quick. With 6 wedges the next spin is the final question (the wheel picks the category, not the opponents). A spin is not saved until it lands: a reload mid-spin spins again.
- `finish({ won: true })` only in solo; with 2+ players on one device `finish({})` (no individual result, `docs/PLATFORM_RULES.md` section 4).
- Saved at match start, after every step (roll, landing, reveal, answer, category pick), on `visibilitychange` and `pagehide`. The landing is saved before the pawn animation, so a reload mid-move lands on the target. Cleared only on win.

## Question bank

Built once from the owner's phone photos of the cards (`tmp-resources/`, not committed): Tesseract OCR per colour slot, question side paired with answer side by photo position, then every card proofread (OCR fixes; picture questions, broken text and dated answers dropped). 2,321 questions kept (FR). `questions_en.json` and `questions_es.json` are translations of that bank, same order and indexes, made by AI and not yet proof-read by a native speaker. The banks are in `.prettierignore` (content, not code).
